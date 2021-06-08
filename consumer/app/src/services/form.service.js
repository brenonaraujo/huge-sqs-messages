const FormRepository = require('../repository/form.repository');

class FormService {
    constructor(Dynamoose) {
        this.FormRepository = new FormRepository(Dynamoose);
    }
    /**
     * @param {*} form 
     * @returns persistableForm
     */
    async getPersistableForm(form) {
        try {
            form.FormId = form.guid;
            console.log(`[INFO](${form.FormId}) - Building persistable form...`);
            form.CreatedDate = new Date().toISOString();
            const formModel = form;
            console.log(`[INFO](${form.FormId}) - FormModel to persist builded!`);
            return Promise.resolve(formModel);
        } catch (error) {
            console.error(`[ERROR] - Error to create the persistable form model!`)
            return Promise.reject(error);
        }
    }
    /**
     * @param {*} forms 
     * @returns {Promise} result
     */
    async batchFormPersist(forms) {
        try {
            console.log(`[INFO] - Persisting forms`);
            result = await this.FormRepository.FormModel.batchPut(forms);
            console.log(`[INFO] - All forms persisted!`);
            return Promise.resolve(result);
        } catch (error) {
            console.error(`[ERROR] - Error to persist forms in batch operation,`, error);
            return Promise.reject(error);
        }
    }
}

module.exports = FormService;