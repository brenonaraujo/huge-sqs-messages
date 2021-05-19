const FormRepository = require('../repository/form.repository');

class FormService {
    constructor(Dynamoose) {
        this.FormRepository = new FormRepository(Dynamoose);
    }

    formPersist(form) {
        try {
            const formModel = new this.FormRepository.FormModel({
                ...form
            });
            console.log(`[INFO](${this.name}) - FormModel to persist created!`);
            formModel.save();
            console.log(`[INFO](${this.name}) - Form persisted!`);
            return Promise.resolve();
        } catch (error) {
            console.error(`[ERROR](${this.name}) - Error to persist!`)
            return Promise.reject(error);
        }
    }
}

module.exports = FormService;