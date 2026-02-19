import { AiScriptRepository } from "./IAiScriptRepository";
import { DynamoAiScriptRepository } from "./dynamo/DynamoAiScriptRepository";

let dynamoRepo: AiScriptRepository | null = null;

export function getRepository(): AiScriptRepository {
    if (!dynamoRepo) {
        console.log("Initializing DynamoAiScriptRepository");
        dynamoRepo = new DynamoAiScriptRepository();
    }
    return dynamoRepo;
}
