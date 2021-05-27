const affodableMessage = require('./resources/affordable.mock.json');
const hugeMessage = require('./resources/huge.mock.json');
const { SqsProducer } = require('sns-sqs-big-payload');
const { PerformanceObserver, performance } = require('perf_hooks'); 

const formConsumerQueue = SqsProducer.create({
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/736735782839/form-consumer-queue',
    region: 'us-east-1',
    // to enable sending large payloads (>256KiB) though S3
    largePayloadThoughS3: true,
    s3Bucket: 'sqs-huge-messages',
});

async function messageProducerApp() {
    console.log(`Start to produce messages`);
    for (let index = 0; index < 1; index++) {
        try {
            performance.mark(`setupIndex[${index}]`);
            hugeMessage.index = index;
            performance.measure(`setupIndex[${index}] to now`, `setupIndex[${index}]`);
            performance.mark(`sendingMessage[${index}]`);
            await formConsumerQueue.sendJSON(hugeMessage); // TEMP
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
        console.log(`(${item.name}) - Time elapsed: ${item.duration}`);
    })
  });
obs.observe({ type: 'measure' });

messageProducerApp();




