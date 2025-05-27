import React, { useEffect } from 'react';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { ContentLayout, Header } from '@cloudscape-design/components';
import Layout from "../layout";
import * as Util from "../common/utility";
import Chat from "./component/chat";
import Greeting from "../common/greeting";
import { components, formFields } from "../common/authenticatorComponents";

const Playground = () => {
    const portalTitle = "Amazon Q for Business";
    const { user, signOut } = useAuthenticator((context) => [context.user, context.signOut]);
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
            header={
                <div>
                    <Header variant="h1">{portalTitle}</Header>
                    <Greeting userInfo={userInfo} />
                </div>
            }>
            <Chat userinfo={userInfo} signOut={signOut}/>
        </ContentLayout></Layout>
    )
}

export default withAuthenticator(Playground, { components, formFields });