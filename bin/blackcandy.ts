#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BlackcandyStack } from '../lib/blackcandy-stack';

const app = new cdk.App();
new BlackcandyStack(app, 'BlackcandyStack');
