import { SqsConsumer, SqsConsumerEvents } from 'sns-sqs-big-payload';

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
        // ...
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
