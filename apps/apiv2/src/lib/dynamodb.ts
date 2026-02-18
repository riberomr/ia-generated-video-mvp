import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const endpoint = process.env.DYNAMO_ENDPOINT || 
    (process.env.AWS_SAM_LOCAL === 'true' ? "http://host.docker.internal:8000" : undefined);

export const client = new DynamoDBClient({ 
    region: process.env.AWS_REGION || "us-east-1",
    ...(endpoint && { endpoint })
});

export const docClient = DynamoDBDocumentClient.from(client);
export const TABLE_NAME = process.env.TABLE_NAME || "CourseBuilderTable";
