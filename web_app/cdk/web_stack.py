#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
#  SPDX-License-Identifier: MIT-0

import os
import typing

import aws_cdk
from aws_cdk import (
    aws_s3 as s3,
    Stack,
    aws_s3_deployment as s3_deployment,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as cloudfront_origins,
    aws_cognito as cognito,
    aws_cognito_identitypool_alpha as id_pool,
    CfnOutput,
    aws_apigatewayv2_authorizers_alpha as gtwy_auth,
    aws_apigateway as api_gtwy,
    aws_ssm as ssm,
    aws_lambda as _lambda,
    aws_iam as iam,
    aws_dynamodb as dynamodb,
    Duration,
    aws_logs as logs,
    BundlingOptions,
    CfnParameter
)
from aws_cdk.aws_cognito_identitypool_alpha import (
    IdentityPoolAuthenticationProviders,
    UserPoolAuthenticationProvider,
)
from constructs import Construct

import cfg

# Defining all constants
TAG_NAME_MODULE = "Module"
MODULE_NAME = "Web Stack"

UI_BUILD_PATH = "./build"

CDN_OAI_NAME = cfg.NAME_PREFIX + "_webapp_oai"
CDN_NAME = cfg.NAME_PREFIX + "_webapp_cdn"
CDN_S3_BUCKET_NAME = cfg.NAME_PREFIX + "_webapp_code"

COGNITO_USER_POOL_NAME = cfg.NAME_PREFIX + "_webapp_user_pool"

API_GATEWAY_NAME = cfg.NAME_PREFIX + "_webapp_api"
API_GATEWAY_DESCRIPTION = "API Gateway for the all endpoints to support Amazon Q for Business"

LAMBDA_USER_PROMPT_QUERY = "user-prompt-query"
LAMBDA_USER_CONVERSATION = "user-conversation"

CFN_OUTPUT_KEY_DISTRIBUTION = cfg.NAME_PREFIX + "_distribution_domain"
CFN_OUTPUT_KEY_USERPOOL_CLIENT_ID = cfg.NAME_PREFIX + "_user_pool_client_id"
CFN_OUTPUT_KEY_USERPOOL_ID = cfg.NAME_PREFIX + "_user_pool_id"
CFN_OUTPUT_KEY_IDENTITY_POOL_ID = cfg.NAME_PREFIX + "_identity_pool_id"
CFN_OUTPUT_KEY_S3_RESUMEBUCKET = cfg.NAME_PREFIX + "_s3_resumebucket"
CFN_OUTPUT_KEY_APIGATEWAY = cfg.NAME_PREFIX + "_api_gateway"

CFN_OUTPUT_DISTRIBUTION_DOMAIN = cfg.NAME_PREFIX + "-distribution-domain"
CFN_OUTPUT_USERPOOL_CLIENT_ID = cfg.NAME_PREFIX + "-user-pool-client-id"
CFN_OUTPUT_USERPOOL_ID = cfg.NAME_PREFIX + "-user-pool-id"
CFN_OUTPUT_IDENTITY_POOL_ID = cfg.NAME_PREFIX + "-identity-pool-id"
CFN_OUTPUT_S3_RESUMEBUCKET = cfg.NAME_PREFIX + "-s3-resumebucket"
CFN_OUTPUT_APIGATEWAY = cfg.NAME_PREFIX + "-api-gateway"

class WebAppStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        amazonq_app_id = CfnParameter(self, "AMAZONQ_APP_ID", type="String",
            description="The QBusiness Application Id")
        
        # Setting tags to all resources within the scope
        aws_cdk.Tags.of(scope).add(TAG_NAME_MODULE, MODULE_NAME)

        # setup s3 bucket to host application using cloudfront
        webapp_bucket = s3.Bucket(
            self, id=cfg.S3_WEB_BUCKET, access_control=s3.BucketAccessControl.PRIVATE
        )

        origin_access_identity = cloudfront.OriginAccessIdentity(
            self, CDN_OAI_NAME)
        webapp_bucket.grant_read(origin_access_identity)

        distribution = cloudfront.Distribution(
            self, CDN_NAME, default_root_object="index.html",
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404, response_page_path="/index.html"
                )
            ],
            default_behavior=cloudfront.BehaviorOptions(
                origin=cloudfront_origins.S3Origin(
                    webapp_bucket, origin_access_identity=origin_access_identity
                )
            ),
        )

        web_deployment = s3_deployment.BucketDeployment(
            self, CDN_S3_BUCKET_NAME,
            sources=[
                s3_deployment.Source.asset(os.path.join(UI_BUILD_PATH)),
            ],
            distribution=distribution,
            destination_bucket=webapp_bucket,
        )

        # Setup Cognito with user group for authentication
        user_pool = cognito.UserPool(
            self,
            COGNITO_USER_POOL_NAME,
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(mutable=True, required=True)
            ))

        cognito_app_client = cognito.UserPoolClient(
            self, "qbusiness_webapp_user_pool_client", user_pool=user_pool, generate_secret=False
        )

        user_pool_auth_provider = UserPoolAuthenticationProvider(
            user_pool=user_pool, user_pool_client=cognito_app_client
        )
        identity_pool_auth_providers = IdentityPoolAuthenticationProviders(
            user_pools=[user_pool_auth_provider]
        )
        cognito_idp = id_pool.IdentityPool(
            self,
            "identity_provider",
            identity_pool_name="qbusiness_webapp_identity_pool",
            allow_unauthenticated_identities=False,
            authentication_providers=identity_pool_auth_providers,
        )

        # Create an API Gateway with CORS enabled
        rest_api = api_gtwy.RestApi(
            self,
            API_GATEWAY_NAME,
            rest_api_name=API_GATEWAY_NAME,
            description=API_GATEWAY_DESCRIPTION,
            default_cors_preflight_options=api_gtwy.CorsOptions(
                allow_headers=["Content-Type", "X-Amz-Date",
                               "Authorization", "X-Api-Key", "x-amz-security-token"],
                allow_methods=api_gtwy.Cors.ALL_METHODS,
                allow_origins=api_gtwy.Cors.ALL_ORIGINS,
                allow_credentials=True,
                max_age=Duration.seconds(300)
            )
        )

        # Add query route to API Gateway
        query_route = rest_api.root.add_resource("query")

        # Lambda to handle user prompts
        userprompts_fn = _lambda.Function(
            self,
            LAMBDA_USER_PROMPT_QUERY,
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="user_prompts.handler",
            code=_lambda.Code.from_asset("lambda"),
            timeout=Duration.minutes(15),
            environment={
                "AMAZONQ_APP_ID": amazonq_app_id,
                "AMAZONQ_REGION": cfg.REGION
            }
        )

        lambda_integration = api_gtwy.LambdaIntegration(userprompts_fn)
        
        query_route.add_method("POST", 
            integration=lambda_integration,
            authorization_type=api_gtwy.AuthorizationType(api_gtwy.AuthorizationType.IAM),
        ).grant_execute(cognito_idp.authenticated_role)


        # Add list route to API Gateway
        list_route = rest_api.root.add_resource("list")

        # lambda to handle list route
        list_fn = _lambda.Function(
            self,
            LAMBDA_USER_CONVERSATION,
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="user_conversation.handler",
            code=_lambda.Code.from_asset("lambda"),
            timeout=Duration.minutes(15),
            environment={
                "AMAZONQ_APP_ID": amazonq_app_id,
                "AMAZONQ_REGION": cfg.REGION
            }
        )

        list_lambda_integration = api_gtwy.LambdaIntegration(list_fn)
        list_route.add_method("POST", 
            integration=list_lambda_integration,
            authorization_type=api_gtwy.AuthorizationType(api_gtwy.AuthorizationType.IAM),
        ).grant_execute(cognito_idp.authenticated_role)

        client_metric = rest_api.metric_count()

        # Writing Config file in S3 bucket with Cognito Details
        web_deployment.add_source(s3_deployment.Source.data(
            "aws-config.js",
            """
window.aws_config = {
    aws_project_region: '"""+aws_cdk.Stack.of(self).region+"""',
    aws_cognito_region: '"""+aws_cdk.Stack.of(self).region+"""',
    aws_cognito_identity_pool_id:'"""+cognito_idp.identity_pool_id+"""',
    aws_user_pools_id:'"""+user_pool.user_pool_id+"""',
    aws_user_pools_web_client_id: '"""+cognito_app_client.user_pool_client_id+"""',
    aws_cognito_username_attributes: ['EMAIL'],
    aws_cognito_mfa_configuration: 'OFF',
    aws_cognito_password_protection_settings: {
        passwordPolicyMinLength: 8,
        passwordPolicyCharacters: ['REQUIRES_LOWERCASE', 'REQUIRES_UPPERCASE', 'REQUIRES_NUMBERS', 'REQUIRES_SYMBOLS'],
    },
    aws_cognito_verification_mechanisms: ['EMAIL'],
    aws_cloud_logic_custom: [
        {
        name: '"""+API_GATEWAY_NAME+"""',
        endpoint: '"""+rest_api.url[:-1]+"""',
        region: '"""+aws_cdk.Stack.of(self).region+"""'
        }
    ]
};
            """
        ))

        # Provide CloudFormation Outputs
        CfnOutput(
            self, CFN_OUTPUT_KEY_DISTRIBUTION,
            value=distribution.domain_name,
            export_name=CFN_OUTPUT_DISTRIBUTION_DOMAIN,
        )

        CfnOutput(
            self,
            CFN_OUTPUT_KEY_USERPOOL_CLIENT_ID,
            value=cognito_app_client.user_pool_client_id,
            export_name=CFN_OUTPUT_USERPOOL_CLIENT_ID,
        )

        CfnOutput(
            self,
            CFN_OUTPUT_KEY_USERPOOL_ID,
            value=user_pool.user_pool_id,
            export_name=CFN_OUTPUT_USERPOOL_ID,
        )

        CfnOutput(
            self,
            CFN_OUTPUT_KEY_IDENTITY_POOL_ID,
            value=cognito_idp.identity_pool_id,
            export_name=CFN_OUTPUT_IDENTITY_POOL_ID,
        )

        CfnOutput(
            self,
            CFN_OUTPUT_KEY_APIGATEWAY,
            value=rest_api.url,
            export_name=CFN_OUTPUT_APIGATEWAY
        )
