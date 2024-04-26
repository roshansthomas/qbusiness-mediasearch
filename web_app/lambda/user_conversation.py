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

def get_conversations(amazonq_userid , nextToken):
    input = {
        "applicationId": AMAZONQ_APP_ID,
        "userId": amazonq_userid,
    }

    if nextToken:
        input["nextToken"] = nextToken
        
    print("Amazon Q Input: ", input)
    try:
        resp = qbusiness_client.list_conversations(**input)
    except Exception as e:
        print("Amazon Q Exception: ", e)
        resp = {
            "systemMessage": "Amazon Q Error: " + str(e)
        }
    print("Amazon Q Response: ", json.dumps(resp, default=serialize_datetime))
    return resp


def delete_conversation(amazonq_userid, conversation_id):
    input = {
        "applicationId": AMAZONQ_APP_ID,
        "userId": amazonq_userid,
        "conversationId": conversation_id
    }

    print("Amazon Q Input: ", input)
    try:
        resp = qbusiness_client.delete_conversation(**input)
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
    if request_body['action'] == 'list':
        amazonq_response = get_conversations(request_body['user_id'], request_body['nextToken'])
        print(amazonq_response)

    if request_body['action'] == 'delete':
        amazonq_response = delete_conversation(request_body['user_id'], request_body['conversation_id'])
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