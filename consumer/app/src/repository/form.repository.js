class FormRepository {
    constructor(dynamoose) {
        this.Dynamoose = dynamoose;
        this.FormSchema = this.setupSchema();
        this.Dynamoose.model.defaults.set({
            "create": false,
            "expires": 900000,
            "waitForActive": {
                "enabled": false
            },
        });
        this.FormModel = this.Dynamoose.model("FormsTable", this.FormSchema);
    }

    setupSchema() {
        return new this.Dynamoose.Schema({
            "FormId": String,
            "CreatedDate": String
        }, {
            "saveUnknown": true,
            "timestamps": false
        });
    }
}

module.exports = FormRepository;