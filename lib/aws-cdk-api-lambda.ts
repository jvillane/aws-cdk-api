import * as core from '@aws-cdk/core';
import * as logs from "@aws-cdk/aws-logs";
import * as lambda from "@aws-cdk/aws-lambda";
import { camelize, requestTemplate } from "./aws-cdk-api-stack.service";
import { OpenApiOperation } from "./aws-cdk-api.types";

export class AwsCdkApiLambda extends core.Construct {
  
  public readonly lambdaFn: lambda.Function;
  
  constructor(scope: core.Construct, id: string, path: string, operation: OpenApiOperation) {
    super(scope, id);
    if (operation['x-aws-cdk-api'] === undefined)
      return;
    
    const { handler } = operation['x-aws-cdk-api'];
    const functionName = `${id}-${handler.toLowerCase().replace('.', '-')}`;
    const logicalId = camelize(functionName);
  
    const logGroup = new logs.LogGroup(this, `FunctionLogGroup`, {
      logGroupName: `/aws/lambda/${functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: core.RemovalPolicy.DESTROY
    });
    this.lambdaFn = new lambda.Function(
      this,
      functionName,
      {
        functionName,
        runtime: lambda.Runtime.NODEJS_12_X,
        code: lambda.Code.fromAsset('src'),
        timeout: core.Duration.seconds(5),
        handler
      }
    );
    const forceLambdaFn = this.lambdaFn.node.defaultChild as lambda.CfnFunction;
    forceLambdaFn.overrideLogicalId(logicalId);
    logGroup.grantWrite(this.lambdaFn);
    
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
  }
}
