import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

const getUserDetails = async () => {
    let output = await Promise.all([getCurrentUser(), fetchAuthSession()]).then((res) => {
        let merged = { ...res[0], ...res[1] };
        return merged;
    });
    return output;
}

const getUserInfo = async () => {
    let output = await getUserDetails();
    return {
        id:output.identityId,
        email: output.tokens.idToken.payload["email"]
    };
}
export {
    getUserDetails,
    getUserInfo
};