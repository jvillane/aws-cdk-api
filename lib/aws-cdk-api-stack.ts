import * as core from '@aws-cdk/core';
import * as iam from "@aws-cdk/aws-iam";
import * as apigateway from "@aws-cdk/aws-apigateway";
import { camelize, httpMethod } from "./aws-cdk-api-stack.service";
import { OpenApiDocument } from './aws-cdk-api.types';
import { AwsCdkApiLambda } from "./aws-cdk-api-lambda";

export class AwsCdkApiStack extends core.Stack {
  
  public readonly restApiId: core.CfnOutput;
  
  constructor(scope: core.Construct, id: string, openapi: OpenApiDocument, props?: core.StackProps) {
    super(scope, id, props);
    const { paths } = openapi;
  
    const restApiName = `${id}-api`;
    const logicalId = camelize(restApiName);
    const restApi = new apigateway.SpecRestApi(this, restApiName, {
      restApiName,
      apiDefinition: apigateway.ApiDefinition.fromInline(openapi),
      deploy: true,
      cloudWatchRole: false,
      deployOptions: {
        tracingEnabled: true,
        stageName: 'api'
      }
    });
    const forceRestApi = restApi.node.defaultChild as apigateway.CfnRestApi;
    forceRestApi.overrideLogicalId(logicalId);
  
    const principal = new iam.ServicePrincipal('apigateway.amazonaws.com');
    for (const path in paths) {
      const pathData = paths[path];
      if (pathData === undefined)
        continue;
      for (const key in pathData) {
        const method = httpMethod(key);
        if (method === undefined)
          continue;
        const operation = pathData[method];
        if (operation === undefined || operation['x-aws-cdk-api'] === undefined)
          continue;
        //console.log(pathKey, method, JSON.stringify(methodData, null, 2));
        const lambda = new AwsCdkApiLambda(this, id, method, path, operation);
        lambda.lambdaFn.grantInvoke(principal);
        //lambda.alias.addPermission(`${lambda.name}-permission`, {
        //  principal,
        //  action: 'lambda:InvokeFunction',
        //  sourceArn: restApi.deploymentStage.restApi.arnForExecuteApi()
        //});
      }
    }
  
    this.restApiId = new core.CfnOutput(this, 'restApiUrl', {
      value: restApi.deploymentStage.urlForPath()
    });
  }
}
