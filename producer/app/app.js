const { PerformanceObserver, performance } = require('perf_hooks');
const uuid = require('uuid');
const messagePayload = require('./resources/huge.mock.json');
const { SqsProducer } = require('sns-sqs-big-payload');
const EventEmitter = require('events');

const formConsumerQueue = SqsProducer.create({
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/736735782839/form-consumer-queue',
    region: 'us-east-1',
    // to enable sending large payloads (>256KiB) though S3
    largePayloadThoughS3: true,
    s3Bucket: 'sqs-huge-messages',
});

const numberOfMessagesToSend = 1;

async function messageProducerApp() {
    console.log(`Start to produce messages`);
    const messagesToSend = [];
    const buildMessage = (messagePayload) => formConsumerQueue.sendJSON(messagePayload);
    for (let index = 0; index < numberOfMessagesToSend; index++) {
        try {
            performance.mark(`setupIndex[${index}]`);
            messagePayload._id = new uuid.v4();
            performance.measure(`setupIndex[${index}] to now`, `setupIndex[${index}]`);
            performance.mark(`buildingMessage[${index}]`);
            messagesToSend.push(buildMessage(messagePayload));
            console.log(`Message with index: ${index} sended to the queue!`);
            performance.measure(`buildingMessage[${index}] to send`, `buildingMessage[${index}]`);
        } catch (error) {
            console.error(error);
            break;
        }
    }
    performance.mark(`sendAllMessages`);
    Promise.all(messagesToSend)
        .then(() => {
            console.log(`All messages sended!`);
            performance.measure(`sendAllMessages to finish`, `sendAllMessages`);
        })
}

EventEmitter.on('', () => {

});

const obs = new PerformanceObserver((items) => {
    items.getEntries().forEach(item => {
        const sendAllElapsed = item.duration.toFixed(3);
        console.log(`(${item.name}) - Time elapsed: ${sendAllElapsed} ms`);
        if (item.name === 'sendAllMessages to finish') {
            console.log(`
            Messages sent: ${numberOfMessagesToSend},
            Messages sent per sec: ${((numberOfMessagesToSend/sendAllElapsed)*1000)} Msg/s,
            `);
        }
    })
});
obs.observe({ type: 'measure' });

messageProducerApp();




