class FormRepository {
    constructor(dynamoose) {
        this.Dynamoose = dynamoose;
        this.FormSchema = this.setupSchema();
        this.FormModel = this.Dynamoose.model("FormsTable", this.FormSchema);
    }

    setupSchema() {
        return new this.Dynamoose.Schema({
            "FormId": String,
            "CreatedDate": String
        }, {
            "saveUnknown": true,
            "timestamps": {
                "createdAt": ["createDate", "creation"],
                "updatedAt": ["updateDate", "updated"]
            }
        });
    }
}

module.exports = FormRepository;