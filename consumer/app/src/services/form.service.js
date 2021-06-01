const FormRepository = require('../repository/form.repository');

class FormService {
    constructor(Dynamoose) {
        this.FormRepository = new FormRepository(Dynamoose);
    }

    async formPersist(form) {
        try {
            form.FormId = form.guid;
            form.CreatedDate = new Date().toISOString();
            const formModel = new this.FormRepository.FormModel({
                ...form
            });
            console.log(`[INFO](${form.FormId}) - FormModel to persist created!`);
            await formModel.save();
            console.log(`[INFO](${form.FormId}) - Form persisted!`);
            return Promise.resolve();
        } catch (error) {
            console.error(`[ERROR] - Error to persist!`)
            return Promise.reject(error);
        }
    }
}

module.exports = FormService;