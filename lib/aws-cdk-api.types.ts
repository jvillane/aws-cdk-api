import { OpenAPIV3 } from "openapi-types";

export interface CustomProperties {
  'x-aws-cdk-api'?: {
    handler: string
  },
  'x-amazon-apigateway-integration'?: {
    uri: {
      'Fn::Sub': string
    }
    httpMethod: 'POST'
    type: 'aws'
    requestTemplates: {
      'application/json': string
    }
    responses: {
      [key: string]: {
        statusCode: number
      }
    }
  }
}

export type OpenApiDocument = OpenAPIV3.Document<CustomProperties>;
export type OpenApiMethod = OpenAPIV3.HttpMethods;
export type OpenApiOperation = OpenAPIV3.OperationObject<CustomProperties>;
