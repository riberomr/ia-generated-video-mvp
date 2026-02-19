import { CreateTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-2",
  endpoint: "http://localhost:8000",
  credentials: {
    accessKeyId: "local",
    secretAccessKey: "local"
  }
});

const createTable = async () => {
  try {
    const command = new CreateTableCommand({
      TableName: "CourseBuilderTable",
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
        { AttributeName: "Type", AttributeType: "S" },
        { AttributeName: "CreatedAt", AttributeType: "S" }
      ],
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "GSI1",
          KeySchema: [
            { AttributeName: "Type", KeyType: "HASH" },
            { AttributeName: "CreatedAt", KeyType: "RANGE" }
          ],
          Projection: {
            ProjectionType: "ALL"
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    });

    const response = await client.send(command);
    console.log("Table Created Successfully:", response.TableDescription?.TableName);
  } catch (error: any) {
    if (error.name === "ResourceInUseException") {
      console.log("Table already exists.");
    } else {
      console.error("Error creating table:", error);
    }
  }
};

createTable();
