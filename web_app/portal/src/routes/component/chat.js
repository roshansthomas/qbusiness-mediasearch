import React, { useState, useEffect } from 'react';
import { Header, Container, Icon, Flashbar, SpaceBetween, Button, Grid } from "@cloudscape-design/components";
import ChatInteractionPanel from './chatinteractionpanel';
import ChatMessages from './chatmessages';

import PortalBackend from '../../common/api';

const Chat = ({ userinfo , signOut}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [processData, setProcessData] = useState([]);
    const [conversationId, setConversationId] = useState("");
    const [parentMessageId, setParentMessageId] = useState("");
    const [conversationList, setConversationList] = useState([]);
    const [nextListToken, setNextListToken] = useState(null);
    const [flashMessage, setFlashMessage] = useState([]);

    useEffect(() => {
        const init = async () => {
            if (userinfo && userinfo.id !== null) {
                setFlashMessage(flashMessageGenerator("Loading History"))
                setIsLoading(true);
                await getConversationList();
                setIsLoading(false);
                setFlashMessage([]);
            }
        }
        init();

    }, [userinfo]);

    const startNewConversation = () => {
        setProcessData([]);
        setConversationId("");
        setParentMessageId("");
    }

    const getConversationList = async () => {
        let payload = {
            action: "list",
            user_id: userinfo.id,
            nextToken: nextListToken
        }
        const response = await PortalBackend.list(payload);
        if (response.nextToken)
            setNextListToken(response.nextToken);

        if (response.conversations && response.conversations.length > 0) {
            setConversationList(response.conversations);
        } else {
            setConversationList([])
        }
    }
    const flashMessageGenerator = (msg) => {
        return [
            {
                type: "success",
                loading: true,
                dismissible: true,
                content: msg,
                id: 'message_1',
                onDismiss: () => {},
            },
        ]
    }
    const onSendAction = async (data) => {
        setFlashMessage(flashMessageGenerator("Processing your question"))
        let currentData = JSON.parse(JSON.stringify(processData));
        setIsLoading(true);
        let payload = {
            action: 'query',
            query: data,
            user_id: userinfo.id,
            context: {}
        }
        if (conversationId !== "") {
            payload['context']['conversationId'] = conversationId;
        }
        if (parentMessageId !== "") {
            payload['context']['parentMessageId'] = parentMessageId;
        }
        const response = await PortalBackend.query(payload);

        // if new conversation started, refresh conversation list screen
        if (conversationId === "") {
            getConversationList();
        }

        let userMessage = {
            "messageId": response.userMessageId,
            "body": data,
            "type": "USER",
        }
        if (currentData.length > 0)
            currentData.splice(0, 0, userMessage)
        else
            currentData.push(userMessage)

        let systemMessage = {
            "messageId": response.systemMessageId,
            "body": response.systemMessage,
            "type": "SYSTEM",
            "sourceAttribution": response.sourceAttributions || null
        }
        currentData.splice(0, 0, systemMessage)
        setProcessData(currentData);
        setConversationId(response['conversationId'])
        setParentMessageId(response['systemMessageId'])
        setIsLoading(false);
        setFlashMessage([]);
    }
    const onPreviousResults = async (id) => {
        setFlashMessage(flashMessageGenerator("Fetching previous question"))
        setProcessData([]);
        setIsLoading(true);
        let payload = {
            action: 'history',
            user_id: userinfo.id,
            conversationId: id,
            nextToken: null
        }

        const response = await PortalBackend.query(payload);
        setConversationId(id);
        setParentMessageId(response.messages[0].messageId);
        setProcessData(response.messages)
        setIsLoading(false);
        setFlashMessage([]);
    }
    const deleteConversation = async (id) => {
        if (window.confirm("Are you sure to delete")) {
            setProcessData([])
            setFlashMessage(flashMessageGenerator("Deleting conversation"))
            setIsLoading(true);
            let payload = {
                action: "delete",
                user_id: userinfo.id,
                conversation_id: id
            }
            await PortalBackend.list(payload);
            await getConversationList();
            setConversationId("");
            setParentMessageId("");
            setProcessData([])
            setIsLoading(false);
            setFlashMessage([]);
        }
    }
    const renderPreviousResults = () => {
        let component = [];
        let i = 0
        component.push(<Button key="new_conversation_btn" onClick={() => startNewConversation()}>New Conversation <Icon name="contact"/></Button>)
        for (let item of conversationList) {
            component.push(
                <Grid key={`previousresponse_${i++}`} gridDefinition={[{ colspan: 12 }]}>
                <div className='previous_response'>
                    <span onClick={() => onPreviousResults(item.conversationId)}>{item.title}</span>
                    <Button iconName="remove" variant="icon" onClick={() => deleteConversation(item.conversationId)} />
                </div></Grid>)
        }
        return component;
    }
    return (<Container
        fitHeight={true}
        footer={
            <>
                <ChatInteractionPanel callback={onSendAction} loading={isLoading} />
                <Flashbar key="panel_flashbar" items={flashMessage} />
            </>
        }
        header={
            <Header 
            variant="h2" 
            actions={ (userinfo !== null)? <Button variant="primary" onClick={() => signOut() }>Signout</Button>:<></>}
            > Welcome {userinfo && userinfo.email}, </Header>
        }
    >
        <Container fitHeight variant='embedd' disableContentPaddings disableHeaderPaddings>
            <div className='chatPanel' id="chatPanel">
                <div className='chatMessages' id="chatMessages" >
                    <ChatMessages data={processData} />
                </div>
                <div className='chatHistory'>
                    <Container fitHeight
                        key={"previous_conversation_panel"}
                        header={<Header variant="h4">Previous conversations appear here</Header>}>
                        <SpaceBetween key={'previous_conversation_tab'}>
                            {
                                renderPreviousResults()
                            }
                        </SpaceBetween>
                    </Container>
                </div>
            </div>
        </Container>
    </Container>)
}

export default Chat;