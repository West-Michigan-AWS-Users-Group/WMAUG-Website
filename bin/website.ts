#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { WmaugOrgWebsite } from "../lib/website-stack";

const app = new cdk.App();
new WmaugOrgWebsite(app, "WmaugOrgWebsite", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
