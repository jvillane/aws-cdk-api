#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsCdkApiStack } from '../lib/aws-cdk-api-stack';
import SwaggerParser from "@apidevtools/swagger-parser";
import { OpenApiDocument } from "../lib/aws-cdk-api.types";

async function main() {
  const api = await SwaggerParser.parse("./openapi.yaml") as OpenApiDocument;
  console.log(JSON.stringify(api));
  const app = new cdk.App();
  const stackName = 'jv-cdk-test';
  new AwsCdkApiStack(app, stackName, api, { stackName });
}

main();
