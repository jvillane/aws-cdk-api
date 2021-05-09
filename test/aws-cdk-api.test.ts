import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as AwsCdkApi from '../lib/aws-cdk-api-stack';
import SwaggerParser from "@apidevtools/swagger-parser";
import { OpenApiDocument } from "../lib/aws-cdk-api.types";

describe('aws-cdk-api', () => {
  
  it('One endpoint', async () => {
    const api = await SwaggerParser.parse("./test/openapi-test.yaml") as OpenApiDocument;
    console.log('api', JSON.stringify(api));
    const app = new cdk.App();
    const stackName = 'cdk-stackname'
    const stack = new AwsCdkApi.AwsCdkApiStack(app, stackName, api);
    expectCDK(stack).to(haveResource('AWS::ApiGateway::RestApi', {
      Name: `${stackName}-api`
    }));
    expectCDK(stack).to(haveResource('AWS::Lambda::Function', {
      Handler: 'lambda.handler'
    }));
  });
})
