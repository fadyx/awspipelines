import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as pipelines from "aws-cdk-lib/aws-codepipeline";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as pipelineActions from "aws-cdk-lib/aws-codepipeline-actions";

export class AWSpipelinesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new pipelines.Pipeline(this, "MyPipeline", {
      pipelineName: "MyPipeline",
      crossAccountKeys: false,
    });

    const sourceOutput = new pipelines.Artifact("SourceOutput");

    pipeline.addStage({
      stageName: "Source",
      actions: [
        new pipelineActions.GitHubSourceAction({
          owner: "fadyx",
          repo: "awspipelines",
          output: sourceOutput,
          branch: "main",
          actionName: "PipelineSource",
          oauthToken: cdk.SecretValue.secretsManager("github-token"),
        }),
      ],
    });

    const cdkBuildOutput = new pipelines.Artifact("CdkBuildOutput");

    pipeline.addStage({
      stageName: "Build",
      actions: [
        new pipelineActions.CodeBuildAction({
          input: sourceOutput,
          actionName: "CdkBuildAction",
          outputs: [cdkBuildOutput],
          project: new codebuild.PipelineProject(this, "CdkBuildProject", {
            environment: { buildImage: codebuild.LinuxBuildImage.STANDARD_7_0 },
            buildSpec: codebuild.BuildSpec.fromSourceFilename(
              "build-specs/buildspec.yml"
            ),
          }),
        }),
      ],
    });

    pipeline.addStage({
      stageName: "PipelineUpdate",
      actions: [
        new pipelineActions.CloudFormationCreateUpdateStackAction({
          actionName: "PipelineUpdate",
          stackName: "AWSpipelinesStack",
          templatePath: cdkBuildOutput.atPath(
            "AWSpipelinesStack.template.json"
          ),
          adminPermissions: true,
        }),
      ],
    });
  }
}
