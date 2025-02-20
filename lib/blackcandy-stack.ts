import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import 'dotenv/config';

export class BlackcandyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'BlackcandyVPC', {
      maxAzs: 1,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC
        }
      ]
    });

    const securityGroup = new ec2.SecurityGroup(
      this,
      'BlackcandySG',
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
      ec2.Port.tcp(3000),
      'Allow HTTP traffic from anywhere',
    )

    const keyPair = ec2.KeyPair.fromKeyPairName(
      this,
      'KeyPair',
      'blackcandy-key-pair'
    );

    const ec2Instance = new ec2.Instance(this, 'blackcandy', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MEDIUM,
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      }),
      keyPair,
    });

    ec2Instance.addUserData(`
      #!/bin/bash
      yum install -y docker
      systemctl start docker
      
      echo "Download and un-zip latest blackcandy version"
      wget -O /blackcandy.tar.gz ${process.env.BLACKCANDY_LATEST_RELEASE_URL}
      tar -xzvf /blackcandy.tar.gz

      echo "Replace default email and password"
      DIR=$(find / -maxdepth 1 -type d -name "*blackcandy*")
      echo 'User.create(email: "${process.env.BLACKCANDY_EMAIL}", password: "${process.env.BLACKCANDY_PASSWORD}", is_admin: true)' > $DIR/db/seeds.rb

      echo "Make a directory to copy music using scp"
      mkdir /home/ec2-user/media_data/music
      
      echo "Build and run docker image"
      docker build -t blackcandy-built $DIR
      docker run -d --name blackcandy \
        -v /home/ec2-user/media_data/music:/media_data \
        -e MEDIA_PATH=/media_data \
        -p 3000:3000 \
        blackcandy-built
        
      echo "Cleanup"
      rm /blackcandy.tar.gz
      rm -rf $DIR
      `
    )
  }
}
