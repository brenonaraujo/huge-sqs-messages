class FormRepository {
    constructor(Dynamoose) {
        this.Dynamoose = Dynamoose;
        this.FormSchema = setupSchema();
        this.FormModel = new this.Dynamoose.model("FormsTable", FormSchema);
    }

    setupSchema() {
        return new this.Dynamoose.Schema({
            "FormId": String,
            "CreatedDate": Date
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