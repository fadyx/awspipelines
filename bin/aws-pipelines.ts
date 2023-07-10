#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AWSpipelinesStack } from '../lib/aws-pipelines-stack';

const app = new cdk.App();
new AWSpipelinesStack(app, 'AWSpipelinesStack',{env:{region:'us-east-1'}});
