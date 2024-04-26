import { post } from 'aws-amplify/api';

const API_NAME = "qbusiness_webapp_api"
const PortalBackend = {
    query: async (data) => {
        let apipath = "/query";
        let obj = {
            apiName: `${API_NAME}`,
            path: `${apipath}`,
            options: {
                body: data 
            }
        }
        const restOperation = post(obj)
        const { body } = await restOperation.response;
        const response = await body.json();
        return response;
    },
    list: async (data) => {
        let apipath = "/list";
        let obj = {
            apiName: `${API_NAME}`,
            path: `${apipath}`,
            options: {
                body: data 
            }
        }
        const restOperation = post(obj)
        const { body } = await restOperation.response;
        const response = await body.json();
        return response;
    }
}

export default PortalBackend;