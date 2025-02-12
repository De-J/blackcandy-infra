#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BlackcandyStack } from '../lib/blackcandy-stack';

const app = new cdk.App();
new BlackcandyStack(app, 'BlackcandyStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    }
});
