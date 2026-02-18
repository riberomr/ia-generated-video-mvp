import { AiScriptRepository } from "./IAiScriptRepository";
import { PrismaAiScriptRepository } from "./prisma/PrismaAiScriptRepository";
import { DynamoAiScriptRepository } from "./dynamo/DynamoAiScriptRepository";

let prismaRepo: AiScriptRepository | null = null;
let dynamoRepo: AiScriptRepository | null = null;

export function getRepository(): AiScriptRepository {
    console.log("getRepository: DB_PROVIDER =", process.env.DB_PROVIDER);
    // Check for explicit "dynamodb" provider
    if (process.env.DB_PROVIDER === "dynamodb") {
        if (!dynamoRepo) {
            console.log("Initializing DynamoAiScriptRepository");
            dynamoRepo = new DynamoAiScriptRepository();
        }
        return dynamoRepo;
    }
    
    // Default to Prisma (Postgres)
    if (!prismaRepo) {
        prismaRepo = new PrismaAiScriptRepository();
    }
    return prismaRepo;
}
