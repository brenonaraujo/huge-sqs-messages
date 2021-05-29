# Form Consumer

Consumer app

# Debug from VS Code

To run from local in debug mode the AWS SAM Cli is required and as dependency for AWS SAM Cli the docker runtime have to be pree instaled too, your can check the [official aws documentation]([https://link](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)) for more details and how to properly install.

With all required tools installed you can execute the function `formConsumer:affordable-sqs` from debug by press `F5` or click at the `Run and Debug` button:

# Thanks for the help

- The library that abstract the transfer between SQS and S3 https://www.npmjs.com/package/sns-sqs-big-payload
- Files are generated with that free tool https://www.json-generator.com
