const { PerformanceObserver, performance } = require('perf_hooks');
const uuid = require('uuid');
const messagePayload = require('./resources/normal.mock.json');
const { SqsProducer } = require('sns-sqs-big-payload');

const formConsumerQueue = SqsProducer.create({
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/736735782839/form-consumer-queue',
    region: 'us-east-1',
    // to enable sending large payloads (>256KiB) though S3
    largePayloadThoughS3: true,
    s3Bucket: 'sqs-huge-messages',
});
// arrange
const numberOfMessagesToSend = process.env.MSGS || 1;
const sendType = process.env.TYPE || 'Async';

const buildMessage = (messagePayload) => formConsumerQueue.sendJSON(messagePayload);
const buildSyncMessage = async (messagePayload) => await formConsumerQueue.sendJSON(messagePayload);


async function messageProducerApp() {
    console.log(`Start to produce messages`);
    const messagesToSend = [];
    for (let index = 0; index < numberOfMessagesToSend; index++) {
        try {
            performance.mark(`setupIndex[${index}]`);
            messagePayload._id = uuid.v4();
            performance.measure(`setupIndex[${index}] to now`, `setupIndex[${index}]`);
            if (sendType === 'Sync') {
                performance.mark(`buildingSyncMessage[${index}]`);
                await buildSyncMessage(messagePayload)
                console.log(`Message with index: ${index} sended to the queue!`);
                performance.measure(`buildingSyncMessage[${index}] to send`, `buildingSyncMessage[${index}]`);
            } else {
                performance.mark(`buildingMessage[${index}]`);
                messagesToSend.push(buildMessage(messagePayload));
                performance.measure(`buildingMessage[${index}] to send`, `buildingMessage[${index}]`);
            }
        } catch (error) {
            console.error(error);
            break;
        }
    }
    if (messagesToSend.length > 0) {
        performance.mark(`sendAllMessages`);
        Promise.all(messagesToSend)
            .then(() => {
                console.log(`All messages sended!`);
                performance.measure(`sendAllMessages to finish`, `sendAllMessages`);
            }).catch(error => {
                console.error(error);
            })
    }

}

// Measurements section 
const obs = new PerformanceObserver((items) => {
    items.getEntries().forEach(item => {
        const sendAllElapsed = item.duration.toFixed(2);
        console.log(`(${item.name}) - Time elapsed: ${sendAllElapsed} ms`);
        if (item.name === 'sendAllMessages to finish') {
            console.log(` 
            Benchmark result for async:
                Messages sent: ${numberOfMessagesToSend},
                Messages sent per sec: ${((numberOfMessagesToSend / sendAllElapsed) * 1000).toFixed(2)} Msg/s`
            ); // toDo: Add more info as: payload size
        }
    })
});
obs.observe({ type: 'measure' });

messageProducerApp();