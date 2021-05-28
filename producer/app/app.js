const messagePayload = require('./resources/normal.mock.json');
const { SqsProducer } = require('sns-sqs-big-payload');
const { PerformanceObserver, performance } = require('perf_hooks');
const uuid = require('uuid');

const formConsumerQueue = SqsProducer.create({
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/736735782839/form-consumer-queue',
    region: 'us-east-1',
    // to enable sending large payloads (>256KiB) though S3
    largePayloadThoughS3: true,
    s3Bucket: 'sqs-huge-messages',
});

async function messageProducerApp() {
    console.log(`Start to produce messages`);
    for (let index = 0; index < 100; index++) {
        try {
            performance.mark(`setupIndex[${index}]`);
            messagePayload._id = uuid.v4();
            performance.measure(`setupIndex[${index}] to now`, `setupIndex[${index}]`);
            performance.mark(`sendingMessage[${index}]`);
            await formConsumerQueue.sendJSON(messagePayload); // TEMP
            console.log(`Message with index: ${index} sended to the queue!`);
            performance.measure(`sendingMessage[${index}] to finish`, `sendingMessage[${index}]`);
        } catch (error) {
            console.error(error);
            break;
        }
    }
}

const obs = new PerformanceObserver((items) => {
    items.getEntries().forEach(item => {
        console.log(`(${item.name}) - Time elapsed: ${item.duration.toFixed(3)} ms`);
    })
});
obs.observe({ type: 'measure' });

messageProducerApp();




