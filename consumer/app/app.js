console.log(`Form Consumer Lambda Starting...`);
const { SqsConsumer } = require('sns-sqs-big-payload');
const Dynamoose = require('dynamoose');
var AWSXRay = require('aws-xray-sdk-core');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));
console.log(`Libraries loaded...`);

const FormRepository = require('./src/repository/form.repository');
const FormService = require('./src/services/form.service');

Dynamoose.AWS = AWS;
const formService = new FormService(new FormRepository(Dynamoose));
const sqsConsumer = SqsConsumer.create({
    region: 'us-east-1',
    getPayloadFromS3: true,
    s3Bucket: 'sqs-huge-messages',
    parsePayload: (raw) => JSON.parse(raw),
    handleBatch: async (records) => {
        let messages;
        AWSXRay.captureFunc('map:persistableForm', (subsegment) => {
            messages = records.map(record => formService.getPersistableForm(record.payload));
            subsegment.close();
        })
        return await AWSXRay.captureAsyncFunc('batchFormPersist',
            async function (subsegment) {
                const result = await formService.batchFormPersist(messages);
                subsegment.close();
                return result;
        });
    }
});
console.log(`Consumer service created...`);

exports.handler = async (event, context) => {
    try {
        console.log(`Message/s received.`);
        let rawMessages;
        // TODO: The library that we are using sns-sqs-huge-payload need the body in upper case -.-
        AWSXRay.captureFunc('map:recordMapper', (subsegment) => {
            rawMessages = event.Records.map((record) => {
                record.Body = record.body;
                record.MessageAttributes = record.messageAttributes;
                return record;
            });
            subsegment.close();
        });
        console.log(`Starting to process messages.`)
        const result = await sqsConsumer.processBatch(rawMessages);
        console.log(result);
        return {};
    } catch (error) {
        console.error(error);
        return error;
    }
}
