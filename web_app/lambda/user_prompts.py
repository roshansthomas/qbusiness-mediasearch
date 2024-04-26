import json
import os
import uuid
import boto3
import datetime 

AMAZONQ_APP_ID = os.environ["AMAZONQ_APP_ID"]
AMAZONQ_REGION = os.environ["AMAZONQ_REGION"]
AMAZONQ_ENDPOINT_URL = f'https://qbusiness.{AMAZONQ_REGION}.api.aws'  
print("AMAZONQ_ENDPOINT_URL:", AMAZONQ_ENDPOINT_URL)

# Define a custom function to serialize datetime objects 
def serialize_datetime(obj): 
    if isinstance(obj, datetime.datetime): 
        return obj.isoformat() 
    raise TypeError("Type not serializable") 

qbusiness_client = boto3.client(
    service_name="qbusiness", 
    region_name=AMAZONQ_REGION,
    endpoint_url=AMAZONQ_ENDPOINT_URL
)

def get_amazonq_response(prompt, context, amazonq_userid, attachments):
    print(f"get_amazonq_response: prompt={prompt}, app_id={AMAZONQ_APP_ID}, context={context}")
    input = {
        "applicationId": AMAZONQ_APP_ID,
        "userId": amazonq_userid,
        "userMessage": prompt,
    }

    if context:
        if context["conversationId"]:
            input["conversationId"] = context["conversationId"]
        if context["parentMessageId"]:
            input["parentMessageId"] = context["parentMessageId"]
    else:
        input["clientToken"] = str(uuid.uuid4())
    
    if attachments:
        input["attachments"] = attachments

    print("Amazon Q Input: ", input)
    try:
        resp = qbusiness_client.chat_sync(**input)
    except Exception as e:
        print("Amazon Q Exception: ", e)
        resp = {
            "systemMessage": "Amazon Q Error: " + str(e)
        }
    print("Amazon Q Response: ", json.dumps(resp))
    return resp

def get_conversations(amazonq_userid, conversation_id, nextToken):
    input = {
        "applicationId": AMAZONQ_APP_ID,
        "userId": amazonq_userid,
        "conversationId": conversation_id
    }

    if nextToken:
        input["nextToken"] = nextToken

    print("Amazon Q Input: ", input)
    try:
        resp = qbusiness_client.list_messages(**input)
    except Exception as e:
        print("Amazon Q Exception: ", e)
        resp = {
            "systemMessage": "Amazon Q Error: " + str(e)
        }
    print("Amazon Q Response: ", json.dumps(resp, default=serialize_datetime))
    return resp

def handler(event, context):
    request_body = json.loads(event["body"])
    print(request_body)
    if request_body['action'] == 'history':
        amazonq_response = get_conversations(request_body['user_id'], request_body['conversationId'], request_body['nextToken'])
        print(amazonq_response)

    if request_body['action'] == 'query':
        amazonq_response = get_amazonq_response(request_body['query'],request_body['context'] , request_body['user_id'], '')
        print(amazonq_response)
    
    response = {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Content-Type':'application/json'
        },
        'body': json.dumps(amazonq_response, default=serialize_datetime)
    }
    return response