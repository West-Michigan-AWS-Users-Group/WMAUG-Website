import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_cloudfront } from "aws-cdk-lib";

interface WebsiteStackProps extends cdk.StackProps {
    domainName?: string;
}

export class WebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.WebsiteStackProps) {
    super(scope, id, props);

    const domainName = props?.domainName || 'wmaug.org';

    const bucket = new cdk.aws_s3.Bucket(this, 'bucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false
        });

    const certificate = new cdk.aws_certificatemanager.Certificate(this, 'certificate', {
        domainName: domainName,
        validation: cdk.aws_certificatemanager.CertificateValidation.fromDns(),
        subjectAlternativeNames: [`www.${domainName}`],
        });

    const distribution = new cdk.aws_cloudfront.Distribution(this, 'SiteDistribution', {
      certificate: certificate,
      comment: `${domainName}`,
      defaultBehavior: {
          origin: new cdk.aws_cloudfront_origins.S3Origin(bucket),
          functionAssociations: [
              {
                  function: redirectFunction,
                  eventType: aws_cloudfront.FunctionEventType.VIEWER_REQUEST,
              },
          ],
      },
    additionalBehaviors: {
        '/index.html': {
            origin: s3origin,
            responseHeadersPolicy: myResponseHeadersPolicyWebsite,
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
            functionAssociations: [
                {
                    function: redirectFunction,
                    eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                },
            ],
        },
    });

      // Deploy site contents to S3 bucket
      new s3_deploy.BucketDeployment(this, `DeploySiteBucket`, {
          sources: [s3_deploy.Source.asset('./site-contents')],
          contentType: 'text/html',
          contentLanguage: 'en',
          destinationBucket: props.siteBucket,
          retainOnDelete: true,
          logRetention: logs.RetentionDays.ONE_WEEK,
          distribution,
          distributionPaths: ['/*'],
      });


    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: domainName });

    const redirectFunction = new cloudfront.Function(this, 'RedirectFunction', {
      functionName: 'RedirectWWWToNonWWW', // Optional: if not specified, CDK will generate a unique name
      code: cloudfront.FunctionCode.fromInline(`
        function handler(event) {
          var request = event.request;
          var headers = request.headers;
          var uri = request.uri;
    
          if (headers.host.value === 'www.${domainName}.com') {
            var redirectLocation = 'https//:${domainName}' + uri;
            var response = {
              statusCode: 301,
              statusDescription: 'Moved Permanently',
              headers: {'location': {value: redirectLocation}}
            };
            return response;
          }
          return request;
        }
      `),
    });

      const myResponseHeadersPolicyWebsite = new cloudfront.ResponseHeadersPolicy(
          this, 'ResponseHeadersPolicyWebsite',
          {
              responseHeadersPolicyName: 'HostingPolicy',
              comment: 'Response Headers Policy',
              securityHeadersBehavior: {
                  contentTypeOptions: { override: true },
                  frameOptions: {
                      frameOption: cloudfront.HeadersFrameOption.DENY,
                      override: true,
                  },
                  referrerPolicy: {
                      referrerPolicy: cloudfront.HeadersReferrerPolicy.ORIGIN,
                      override: true,
                  },
                  strictTransportSecurity: {
                      accessControlMaxAge: Duration.seconds(31536000), // 12 months
                      includeSubdomains: true,
                      override: true,
                  },
                  xssProtection: { protection: true, modeBlock: true, override: true },
              },
          },
      );

    }
}
