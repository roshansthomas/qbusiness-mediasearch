import React, { useEffect } from 'react';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react';
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
export default withAuthenticator(Playground);