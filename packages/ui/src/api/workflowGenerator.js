import client from './client'

const generateWorkflow = (data) => client.post('/workflow-generator', data)

const validateWorkflow = (data) => client.post('/workflow-generator/validate', data)

const getSuggestions = (description) => client.get(`/workflow-generator/suggestions?description=${encodeURIComponent(description)}`)

export default {
    generateWorkflow,
    validateWorkflow,
    getSuggestions
}
