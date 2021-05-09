import * as core from '@aws-cdk/core';
import * as iam from "@aws-cdk/aws-iam";
import * as apigateway from "@aws-cdk/aws-apigateway";
import { httpMethod } from "./aws-cdk-api-stack.service";
import { OpenApiDocument } from './aws-cdk-api.types';
import { AwsCdkApiLambda } from "./aws-cdk-api-lambda";

export class AwsCdkApiStack extends core.Stack {
  
  constructor(scope: core.Construct, id: string, openapi: OpenApiDocument, props?: core.StackProps) {
    super(scope, id, props);
    const { paths } = openapi;
    const lambdas: AwsCdkApiLambda[] = [];
    
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
        lambdas.push(new AwsCdkApiLambda(this, id, path, operation));
      }
    }
    
    //console.log('transformedApi', JSON.stringify(openapi));
    const restApi = new apigateway.SpecRestApi(this, "cdk-api-apigateway", {
      restApiName: `${id}-api`,
      apiDefinition: apigateway.ApiDefinition.fromInline(openapi),
      deploy: true,
      cloudWatchRole: false,
      deployOptions: {
        tracingEnabled: true,
        stageName: 'api'
      }
    });
    for(const lambda of lambdas) {
      lambda.lambdaFn.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'))
    }
    // The code that defines your stack goes here
  }
}
