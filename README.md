# Huge sqs messages study case 

That project will support all resources needed to implement the huge sqs messages study case article. I have been working in that project since I had read an article about S3 backed approach, but the article dot not dive deep in the full implementation and do not show the metrics that support a decision maker to figure out the trade-offs. Because of that I decided to start write this study case and to keep the focus on the implementation patterns and good practices I 'll implement everything on top of the (artcile link) and dive deep to the full implementation with AWS best practices.

## The sample app

The app that we 'll create are just a simple form producer and a form consumer that 'll persist at noSql document, I mean, the producer will send a message containing an object that's represents a form with too many coluns and arrays, that's will be highest than the message size limit in SQS (256 Kib).

### Solution Desing:

![Solution Design]()