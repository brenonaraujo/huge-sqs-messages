console.log(`Form Consumer Lambda Starting...`);
const { SqsConsumer } = require('sns-sqs-big-payload');
const Dynamoose = require('dynamoose');
// var AWSXRay = require('aws-xray-sdk');
// Dynamoose.AWS = AWSXRay.captureAWS(require('aws-sdk'));
const FormService = require('./src/services/form.service');
console.log(`Libraries loaded...`);

const formService = new FormService(Dynamoose);
const sqsConsumer = SqsConsumer.create({
    region: 'us-east-1',
    getPayloadFromS3: true,
    s3Bucket: 'sqs-huge-messages',
    parsePayload: (raw) => JSON.parse(raw),
    handleBatch: async (records) => {
        let messages = records.map(record => {
            return formService.getPersistableForm(record.payload);
        });
        return await formService.batchFormPersist(messages);
    },
    handleMessage: async ({ payload }) => {
        return await formService.getPersistableForm(payload);
    },
});
console.log(`Consumer service created...`);

exports.handler = async (event, context) => {
    try {
        console.log(`Message/s received.`);
        const rawMessages = event.Records.map((record) => {
            record.Body = record.body;
            record.MessageAttributes = record.messageAttributes;
            return record;
        })
        console.log(`Starting to process messages.`)
        const result = await sqsConsumer.processBatch(rawMessages);
        console.log(result);
        return {};
    } catch (error) {
        console.error(error);
        return error;
    }
}
