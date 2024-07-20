import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_iam,
  aws_route53,
  aws_route53_targets,
  aws_s3_deployment,
} from "aws-cdk-lib";

interface WmaugOrgWebsiteProps extends cdk.StackProps {
  domainName?: string;
}

export class WmaugOrgWebsite extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: WmaugOrgWebsiteProps) {
    super(scope, id, props);

    const domainName = props?.domainName || "wmaug.org";
    const zone = aws_route53.HostedZone.fromLookup(this, "Zone", {
      domainName: domainName,
    });

    const cloudfrontOai = new aws_cloudfront.OriginAccessIdentity(
      this,
      "cloudfrontOai",
      {
        comment: `OAI for ${id}`,
      },
    );

    const bucket = new cdk.aws_s3.Bucket(this, "bucket", {
      bucketName: domainName,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Grant access to cloudfront
    bucket.grantRead(cloudfrontOai);
    bucket.addToResourcePolicy(
      new aws_iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [bucket.arnForObjects("*")],
        principals: [
          new aws_iam.CanonicalUserPrincipal(
            cloudfrontOai.cloudFrontOriginAccessIdentityS3CanonicalUserId,
          ),
        ],
      }),
    );

    const certificate = new cdk.aws_certificatemanager.Certificate(
      this,
      "certificate",
      {
        domainName: domainName,
        validation: cdk.aws_certificatemanager.CertificateValidation.fromDns(),
        subjectAlternativeNames: [`www.${domainName}`],
      },
    );

    const redirectFunction = new aws_cloudfront.Function(
      this,
      "redirectFunction",
      {
        functionName: "RedirectWWWToNonWWW",
        code: aws_cloudfront.FunctionCode.fromInline(`
        function handler(event) {
          var request = event.request;
          var headers = request.headers;
          var uri = request.uri;
    
          if (headers.host.value === 'www.${domainName}') {
            var redirectLocation = 'https://${domainName}' + uri;
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
      },
    );

    const myResponseHeadersPolicyWebsite =
      new aws_cloudfront.ResponseHeadersPolicy(
        this,
        "myResponseHeadersPolicyWebsite",
        {
          responseHeadersPolicyName: "HostingPolicy",
          comment: "Response Headers Policy",
          securityHeadersBehavior: {
            contentTypeOptions: { override: true },
            frameOptions: {
              frameOption: aws_cloudfront.HeadersFrameOption.DENY,
              override: true,
            },
            referrerPolicy: {
              referrerPolicy: aws_cloudfront.HeadersReferrerPolicy.ORIGIN,
              override: true,
            },
            strictTransportSecurity: {
              accessControlMaxAge: cdk.Duration.seconds(31536000), // 12 months
              includeSubdomains: true,
              override: true,
            },
            xssProtection: {
              protection: true,
              modeBlock: true,
              override: true,
            },
          },
        },
      );

    const s3origin = new aws_cloudfront_origins.S3Origin(bucket, {
      originAccessIdentity: cloudfrontOai,
    });

    const distribution = new cdk.aws_cloudfront.Distribution(
      this,
      "distribution",
      {
        certificate: certificate,
        defaultRootObject: "index.html",
        domainNames: [domainName],
        minimumProtocolVersion:
          aws_cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 403,
            responsePagePath: "/error.html",
            ttl: cdk.Duration.minutes(30),
          },
        ],
        defaultBehavior: {
          origin: s3origin,
          compress: true,
          functionAssociations: [
            {
              function: redirectFunction,
              eventType: aws_cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
        },
        additionalBehaviors: {
          "/index.html": {
            origin: s3origin,
            responseHeadersPolicy: myResponseHeadersPolicyWebsite,
            viewerProtocolPolicy:
              aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD,
            functionAssociations: [
              {
                function: redirectFunction,
                eventType: aws_cloudfront.FunctionEventType.VIEWER_REQUEST,
              },
            ],
          },
        },
      },
    );

    new aws_route53.ARecord(this, "SiteAliasRecord", {
      recordName: domainName,
      target: aws_route53.RecordTarget.fromAlias(
        new aws_route53_targets.CloudFrontTarget(distribution),
      ),
      zone,
    });

    new aws_route53.ARecord(this, "SiteAliasRecordWWW", {
      recordName: `www.${domainName}`,
      target: aws_route53.RecordTarget.fromAlias(
        new aws_route53_targets.CloudFrontTarget(distribution),
      ),
      zone,
    });

    // Deploy site contents to S3 bucket
    new aws_s3_deployment.BucketDeployment(this, `deploySiteBucket`, {
      sources: [cdk.aws_s3_deployment.Source.asset("./app")],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "websiteUrl", { value: "https://" + domainName });
  }
}
