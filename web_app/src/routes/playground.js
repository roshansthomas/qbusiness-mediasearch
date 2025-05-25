import React, { useEffect } from 'react';
import { withAuthenticator, useAuthenticator, Heading, View, Text } from '@aws-amplify/ui-react';
import { ContentLayout, Header } from '@cloudscape-design/components';
import Layout from "../layout";
import * as Util from "../common/utility";
import Chat from "./component/chat";

const Playground = () => {
    const portalTitle = "Amazon Q for Business";
    const { signOut } = useAuthenticator((context) => [context.signOut]);
    const [userInfo, setUserInfo] = React.useState(null);

    useEffect(() => {
        try {
            const init = async () => {
                try {
                    let data = await Util.getUserInfo();
                    setUserInfo(data);
                } catch (err) {
                    console.log(err);
                }
            }
            init();
        } catch (e) {
            signOut()
        }
    }, []);

    return (
        <Layout key="applicant_component">
            <ContentLayout
            header={<Header 
            variant="h1"
            >{portalTitle}</Header>}>
            <Chat userinfo={userInfo} signOut={signOut}/>
        </ContentLayout></Layout>
    )
}

// Custom login component with warning message
export const LoginHeader = () => {
    return (
        <View textAlign="center" padding="1rem">
            <Heading level={3}>Login</Heading>
            <Text
                variation="warning"
                as="div"
                color="red"
                fontWeight="bold"
                padding="0.5rem"
                marginTop="0.5rem"
                backgroundColor="#fff3cd"
                borderRadius="4px"
                border="1px solid #ffeeba"
            >
                Warning: Login with Caution
            </Text>
        </View>
    );
};

export default withAuthenticator(Playground, {
    components: {
        Header: LoginHeader
    }
});