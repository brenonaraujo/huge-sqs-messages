console.log(`Form Consumer Lambda Starting...`);
const { SqsConsumer } = require('sns-sqs-big-payload');
const Dynamoose = require('dynamoose');
var AWSXRay = require('aws-xray-sdk');
Dynamoose.AWS = AWSXRay.captureAWS(require('aws-sdk'));
const FormService = require('./src/services/form.service');
console.log(`Libraries loaded...`);

const formService = new FormService(Dynamoose);
const sqsConsumer = SqsConsumer.create({
    region: 'us-east-1',
    getPayloadFromS3: true,
    s3Bucket: 'sqs-huge-messages',
    parsePayload: (raw) => JSON.parse(raw),
    handleMessage: async ({ payload }) => {
        return await formService.getPersistableForm(payload);
    },
});
console.log(`Consumer service created...`);

exports.handler = async (event, context) => {
    console.log(`Message/s received.`);
    const persistableForms = [];
    await Promise.all(
        event.Records.map(async (record) => {
            record.Body = record.body; 
            record.MessageAttributes = record.messageAttributes;
            try {
                console.log(`Starting to process message.`)
                let persistableForm = await sqsConsumer.processMessage(record, { deleteAfterProcessing: false });
                persistableForms.push(persistableForm);
                return;
            } catch (error) {
                console.error(error);
                return error;
            }
        })
    );
    const result = await formService.batchFormPersist(persistableForms);
    console.log(result);
    return {}
}
