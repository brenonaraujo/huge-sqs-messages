"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws = __importStar(require("aws-sdk"));
const events_1 = require("events");
const util_1 = require("./util");
var SqsConsumerEvents;
(function (SqsConsumerEvents) {
    SqsConsumerEvents["started"] = "started";
    SqsConsumerEvents["messageReceived"] = "message-received";
    SqsConsumerEvents["messageParsed"] = "message-parsed";
    SqsConsumerEvents["messageProcessed"] = "message-processed";
    SqsConsumerEvents["batchProcessed"] = "batch-processed";
    SqsConsumerEvents["stopped"] = "stopped";
    SqsConsumerEvents["pollEnded"] = "poll-ended";
    SqsConsumerEvents["error"] = "error";
    SqsConsumerEvents["s3PayloadError"] = "s3-payload-error";
    SqsConsumerEvents["processingError"] = "processing-error";
    SqsConsumerEvents["connectionError"] = "connection-error";
    SqsConsumerEvents["payloadParseError"] = "payload-parse-error";
})(SqsConsumerEvents = exports.SqsConsumerEvents || (exports.SqsConsumerEvents = {}));
class SqsConsumer {
    constructor(options) {
        this.started = false;
        this.events = new events_1.EventEmitter();
        this.connErrorTimeout = 10000;
        if (options.sqs) {
            this.sqs = options.sqs;
        }
        else {
            this.sqs = new aws.SQS({
                region: options.region,
                endpoint: options.sqsEndpointUrl,
            });
        }
        if (options.getPayloadFromS3) {
            if (options.s3) {
                this.s3 = options.s3;
            }
            else {
                this.s3 = new aws.S3({
                    region: options.region,
                    endpoint: options.s3EndpointUrl,
                });
            }
        }
        this.queueUrl = options.queueUrl;
        this.getPayloadFromS3 = options.getPayloadFromS3;
        this.batchSize = options.batchSize || 10;
        this.waitTimeSeconds = options.waitTimeSeconds || 20;
        this.handleMessage = options.handleMessage;
        this.handleBatch = options.handleBatch;
        this.parsePayload = options.parsePayload;
        this.transformMessageBody = options.transformMessageBody;
        this.extendedLibraryCompatibility = options.extendedLibraryCompatibility;
    }
    static create(options) {
        return new SqsConsumer(options);
    }
    start() {
        if (this.started)
            return;
        this.started = true;
        this.poll();
        this.events.emit(SqsConsumerEvents.started);
    }
    stop() {
        this.started = false;
        this.events.emit(SqsConsumerEvents.stopped);
    }
    on(event, handler) {
        this.events.on(event, handler);
    }
    async processMessage(message, options) {
        await this.processMsg(message, options);
    }
    async poll() {
        while (this.started) {
            try {
                const response = await this.receiveMessages({
                    QueueUrl: this.queueUrl,
                    MaxNumberOfMessages: this.batchSize,
                    WaitTimeSeconds: this.waitTimeSeconds,
                    MessageAttributeNames: [util_1.SQS_LARGE_PAYLOAD_SIZE_ATTRIBUTE],
                });
                if (!this.started)
                    return;
                await this.handleSqsResponse(response);
            }
            catch (err) {
                if (this.isConnError(err)) {
                    this.events.emit(SqsConsumerEvents.connectionError, err);
                    await new Promise((resolve) => setTimeout(resolve, this.connErrorTimeout));
                }
                else {
                    this.events.emit(SqsConsumerEvents.error, err);
                }
            }
            this.events.emit(SqsConsumerEvents.batchProcessed);
        }
        this.events.emit(SqsConsumerEvents.pollEnded);
    }
    isConnError(err) {
        return err.statusCode === 403 || err.code === 'CredentialsError' || err.code === 'UnknownEndpoint';
    }
    async handleSqsResponse(result) {
        if (result && result.Messages) {
            if (this.handleBatch) {
                await this.processBatch(result.Messages);
            }
            else {
                await Promise.all(result.Messages.map((message) => this.processMsg(message)));
            }
        }
    }
    async processBatch(messages) {
        try {
            const messagesWithPayload = await Promise.all(messages.map(async (message) => {
                const { payload, s3PayloadMeta } = await this.preparePayload(message);
                const messageWithPayload = {
                    message,
                    payload,
                    s3PayloadMeta,
                };
                return messageWithPayload;
            }));
            const messagesToDelete = await this.handleBatch(messagesWithPayload);
            if (messagesToDelete && (messagesToDelete === null || messagesToDelete === void 0 ? void 0 : messagesToDelete.length))
                await this.deleteBatch(messagesToDelete);
            else if (messagesToDelete === undefined)
                await this.deleteBatch(messages);
        }
        catch (err) {
            this.events.emit(SqsConsumerEvents.processingError, { err, messages });
        }
    }
    async preparePayload(message) {
        const messageBody = this.transformMessageBody ? this.transformMessageBody(message.body) : message.Body;
        const { rawPayload, s3PayloadMeta } = await this.getMessagePayload(messageBody, message.MessageAttributes);
        const payload = this.parseMessagePayload(rawPayload);
        return {
            payload,
            s3PayloadMeta,
        };
    }
    async processMsg(message, { deleteAfterProcessing = true } = {}) {
        try {
            this.events.emit(SqsConsumerEvents.messageReceived, message);
            const { payload, s3PayloadMeta } = await this.preparePayload(message);
            this.events.emit(SqsConsumerEvents.messageParsed, {
                message,
                payload,
                s3PayloadMeta,
            });
            if (this.handleMessage) {
                await this.handleMessage({ payload, message, s3PayloadMeta });
            }
            if (deleteAfterProcessing) {
                await this.deleteMessage(message);
            }
            this.events.emit(SqsConsumerEvents.messageProcessed, message);
        }
        catch (err) {
            this.events.emit(SqsConsumerEvents.processingError, { err, message });
        }
    }
    async getMessagePayload(messageBody, attributes) {
        if (!this.getPayloadFromS3) {
            return { rawPayload: messageBody };
        }
        let s3PayloadMeta;
        const s3Object = JSON.parse(messageBody);
        if (this.extendedLibraryCompatibility && attributes && attributes[util_1.SQS_LARGE_PAYLOAD_SIZE_ATTRIBUTE]) {
            const msgJson = s3Object;
            s3PayloadMeta = {
                Bucket: msgJson.s3BucketName,
                Key: msgJson.s3Key,
                Id: 'not available in extended compatibility mode',
                Location: 'not available in extended compatibility mode',
            };
        }
        else {
            const msgJson = s3Object;
            s3PayloadMeta = msgJson === null || msgJson === void 0 ? void 0 : msgJson.S3Payload;
        }
        if (s3PayloadMeta) {
            try {
                const s3Response = await this.s3
                    .getObject({ Bucket: s3PayloadMeta.Bucket, Key: s3PayloadMeta.Key })
                    .promise();
                return { rawPayload: s3Response.Body, s3PayloadMeta };
            }
            catch (err) {
                this.events.emit(SqsConsumerEvents.s3PayloadError, {
                    err,
                    message: s3Object,
                });
                throw err;
            }
        }
        return { rawPayload: messageBody };
    }
    parseMessagePayload(rawPayload) {
        if (this.parsePayload) {
            try {
                const payload = this.parsePayload(rawPayload);
                return payload;
            }
            catch (err) {
                this.events.emit(SqsConsumerEvents.payloadParseError, err);
                throw err;
            }
        }
        return rawPayload;
    }
    async receiveMessages(params) {
        return await this.sqs.receiveMessage(params).promise();
    }
    async deleteMessage(message) {
        await this.sqs
            .deleteMessage({
            QueueUrl: this.queueUrl,
            ReceiptHandle: message.ReceiptHandle,
        })
            .promise();
    }
    async deleteBatch(messages) {
        await this.sqs
            .deleteMessageBatch({
            QueueUrl: this.queueUrl,
            Entries: messages.map((message, index) => ({
                Id: index.toString(),
                ReceiptHandle: message.ReceiptHandle,
            })),
        })
            .promise();
    }
}
exports.SqsConsumer = SqsConsumer;
//# sourceMappingURL=sqs-consumer.js.map