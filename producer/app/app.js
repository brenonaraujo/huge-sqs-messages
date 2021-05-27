const baseMessage = require('./resources/affordable.mock.json');
const { SqsProducer } = require('sns-sqs-big-payload');

const formConsumerQueue = SqsProducer.create({
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/736735782839/form-consumer-queue',
    region: 'us-east-1',
    // to enable sending large payloads (>256KiB) though S3
    largePayloadThoughS3: true,
    s3Bucket: 'sqs-huge-messages',
});

async function messageProducer() {
    console.log(`Start to produce messages`);
    for (let index = 0; index < process.env.MESSAGES_TO_PRODUCE | 100; index++) {
        baseMessage.index = index;
        try {
            await formConsumerQueue.sendJSON(baseMessage);
            console.log(`Message with index: ${index} sended to the queue!`);
        } catch (error) {
            console.error(error);
            break;
        }

    }
    console.log(`finish!!!`);
}

messageProducer();


