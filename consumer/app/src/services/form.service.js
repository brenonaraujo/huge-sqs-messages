class FormService {
    constructor(FormRepository) {
        this.FormRepository = FormRepository;
    }
    /**
     * @param {*} form 
     * @returns persistableForm
     */
    getPersistableForm(rawForm) {
        try {
            rawForm.FormId = rawForm.guid;
            console.log(`[INFO](${rawForm.FormId}) - Building persistable form...`);
            rawForm.CreatedDate = new Date().toISOString();
            const formModel = rawForm;
            console.log(`[INFO](${rawForm.FormId}) - FormModel to persist builded!`);
            return formModel;
        } catch (error) {
            console.error(`[ERROR] - Error to create the persistable form model!`)
            return error;
        }
    }
    /**
     * @param {*} forms 
     * @returns {Promise} result
     */
    async batchFormPersist(forms) {
        try {
            console.log(`[INFO] - Persisting forms`);
            let result = await this.FormRepository.FormModel.batchPut(forms);
            console.log(`[INFO] - All forms persisted!`);
            return Promise.resolve(result);
        } catch (error) {
            console.error(`[ERROR] - Error to persist forms in batch operation,`, error);
            return Promise.reject(error);
        }
    }
}

module.exports = FormService;