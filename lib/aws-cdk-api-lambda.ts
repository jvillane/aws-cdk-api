import * as core from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";
import { camelize, requestTemplate } from "./aws-cdk-api-stack.service";
import { OpenApiOperation } from "./aws-cdk-api.types";

export class AwsCdkApiLambda extends core.Construct {
  
  public readonly alias: lambda.Alias;
  
  constructor(scope: core.Construct, id: string, path: string, operation: OpenApiOperation) {
    super(scope, id);
    if (operation['x-aws-cdk-api'] === undefined)
      return;
    
    const { handler } = operation['x-aws-cdk-api'];
    const functionName = `${id}-${handler.toLowerCase().replace('.', '-')}`;
    const logicalId = camelize(functionName);
    const role = new iam.Role(this, `${functionName}-role`, {
      roleName: `${functionName}-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      path: '/'
    });
    const lambdaFn = new lambda.Function(
      this,
      functionName,
      {
        functionName,
        runtime: lambda.Runtime.NODEJS_12_X,
        code: lambda.Code.fromAsset('src'),
        timeout: core.Duration.seconds(5),
        handler,
        role
      }
    );
    const forceLambdaFn = lambdaFn.node.defaultChild as lambda.CfnFunction;
    forceLambdaFn.overrideLogicalId(logicalId);
    
    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [ 'arn:aws:logs:*:*:log-group:/aws/lambda/*:*:*' ],
    }));
  
    this.alias = new lambda.Alias(this, `FunctionAlias`, {
      aliasName: 'stable',
      version: lambdaFn.currentVersion
    });
    
    delete operation['x-aws-cdk-api'];
    operation['x-amazon-apigateway-integration'] = {
      uri: {
        'Fn::Sub': 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${:functionName.Arn}/invocations'.replace(':functionName', logicalId)
      },
      httpMethod: 'POST',
      type: 'aws',
      requestTemplates: {
        'application/json': requestTemplate(path)
      },
      responses: {
        default: {
          statusCode: 200
        },
        '.*ERROR_404.*': {
          statusCode: 404
        },
        '.*ERROR.*': {
          statusCode: 500
        }
      }
    }
    console.log('operation', operation);
  }
}
