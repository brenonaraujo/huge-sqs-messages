import { SqsConsumer } from 'sns-sqs-big-payload';

exports.handler =  async (event, context) => {
    return {
        statusCode: 200,
        body: `Response to event: ${event}`,
        isBase64Encoded: false
    }
}
