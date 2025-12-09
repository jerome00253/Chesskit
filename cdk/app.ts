import * as cdk from "aws-cdk-lib";
import { AppStack } from "./app-stack";

const app = new cdk.App();

new AppStack(app, "FreechessWebapp", {
  env: { region: "eu-west-3", account: process.env.CDK_DEFAULT_ACCOUNT },
  domainName: "chesskit.org",
  pagePaths: [
      "en/play", "fr/play", 
      "en/database", "fr/database",
      "en/index", "fr/index"
  ],
});
