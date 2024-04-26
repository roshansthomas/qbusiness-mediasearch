# Application Configuration
# Note: changing the APP_NAME will result in a new stack being provisioned
APP_NAME = "MediaSearchQBusiness"
APP_VERSION = "v0.1"
CFN_STACK_DESCRIPTION = "MediaSearch QBusiness on AWS (" + APP_VERSION + ")"
CFN_JDBC_CHANNEL_STACK_DESCRIPTION = (
    "This stack is used to build MediaSearch QBusiness powered by Amazon Q Business"
)

REGION = "us-east-1"
NAME_PREFIX = "qbusiness"
S3_WEB_BUCKET = NAME_PREFIX + "-webapp-bucket"
S3_RESUME_BUCKET = NAME_PREFIX + "-resume-bucket"

AMAZONQ_APP_ID= "81f55977-3771-4c89-9504-ccd1a373a171"