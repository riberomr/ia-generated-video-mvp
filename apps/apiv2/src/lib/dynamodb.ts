import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const endpoint = process.env.DYNAMO_ENDPOINT || 
    (process.env.AWS_SAM_LOCAL === 'true' ? "http://host.docker.internal:8005" : undefined);

export const client = new DynamoDBClient({ 
    region: process.env.AWS_REGION || "us-east-2",
    ...(endpoint && { 
        endpoint,
        credentials: {
            accessKeyId: "local",
            secretAccessKey: "local"
        }
    })
});

export const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true
    }
});
export const TABLE_NAME = process.env.TABLE_NAME || "CourseBuilderTable";
