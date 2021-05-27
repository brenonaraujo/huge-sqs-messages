console.log(`Form Consumer Lambda Starting...`);
const { SqsConsumer } = require('sns-sqs-big-payload');
const Dynamoose = require('dynamoose');
const FormService = require('./src/services/form.service');
console.log(`Libraries loaded...`);

const formService = new FormService(Dynamoose);
const sqsConsumer = SqsConsumer.create({
    region: 'us-east-1',
    getPayloadFromS3: true,
    s3Bucket: 'sqs-huge-messages',
    transformMessageBody: (body) => {
        const snsMessage = JSON.parse(body);
        return snsMessage.Message;
    },
    parsePayload: (raw) => JSON.parse(raw),
    handleMessage: async ({ payload }) => {
        console.log(payload);
        return await formService.formPersist(payload);
    },
});
console.log(`Consumer service created...`);

exports.handler = async (event, context) => {
    console.log(`Event: ${JSON.stringify(event)}`);
    console.log(`Message/s received.`);
    await Promise.all(
        event.Records.map(async (record) => {
            try {
                console.log(`Starting to process message.`)
                return await sqsConsumer.processMessage(record, { deleteAfterProcessing: false });
            } catch (error) {
                console.error(error);
                return error;
            }
        })
    );
    return {}
}
