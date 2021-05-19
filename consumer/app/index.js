const { SqsConsumer } = require('sns-sqs-big-payload');
const Dynamoose = require('dynamoose');
const FormService = require('./src/services/form.service');

const formService = new FormService(Dynamoose);

const sqsConsumer = SqsConsumer.create({
    region: 'us-east-1',
    getPayloadFromS3: true,
    s3Bucket: '...',

    transformMessageBody: (body) => {
        const snsMessage = JSON.parse(body);
        return snsMessage.Message;
    },
    parsePayload: (raw) => JSON.parse(raw),
    handleMessage: async ({ payload }) => {
      return await formService.formPersist(payload);
    },
});

exports.handler =  async (event, context) => {
    await Promise.all(
        event.Records.map(async (record) => {
            try {
                await sqsConsumer.processMessage(record, { deleteAfterProcessing: false });
            } catch (error) {
                console.error(error);
                return error;
            }
        })
    );
    return {}
}
