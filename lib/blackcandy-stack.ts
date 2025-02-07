import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import 'dotenv/config';

export class BlackcandyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'defaultVpc', {
      vpcId: process.env.VPC_ID
    });

    const securityGroup = new ec2.SecurityGroup(
      this,
      'blackcandySG',
      {
        vpc,
        allowAllOutbound: true,
      }
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH from anywhere',
    )

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere',
    )

    const keyPair = ec2.KeyPair.fromKeyPairName(
      this,
      'KeyPair',
      process.env.KEY_PAIR ?? ''
    );

    const ec2Instance = new ec2.Instance(this, 'blackcandy', {
      vpc,
      securityGroup,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      }),
      keyPair,
    })

  }
}
