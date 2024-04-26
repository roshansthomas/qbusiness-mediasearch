#!/usr/bin/env python3

import aws_cdk as cdk
from constructs import Construct

from cdk.web_stack import WebAppStack

# Defining all constants
APP_NAME = "qbusiness"
WEB_STACK_NAME = "q-webui"

TAG_NAME_APPLICATION = "App"

class QBusinessStack(Construct):
    def __init__(self, scope: Construct, id: str, *, prod=False):
        super().__init__(scope, id)

        # UI Stack
        web_stack = WebAppStack(app, WEB_STACK_NAME)

        cdk.Tags.of(scope).add(TAG_NAME_APPLICATION, APP_NAME)

app = cdk.App()
QBusinessStack(app, "prod", prod=True)
app.synth()