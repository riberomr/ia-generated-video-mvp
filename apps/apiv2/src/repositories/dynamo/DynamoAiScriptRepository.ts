import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { docClient, TABLE_NAME } from "../../lib/dynamodb";
import { AiScript, AiScriptRepository, VideoRender } from "../IAiScriptRepository";

export class DynamoAiScriptRepository implements AiScriptRepository {
    async create(data: any): Promise<AiScript> {
        const id = uuidv4();
        const timestamp = new Date().toISOString();
        const item = {
            PK: `SCRIPT#${id}`,
            SK: "METADATA",
            Type: "SCRIPT",
            CreatedAt: timestamp,
            id,
            ...data,
            createdAt: timestamp,
            updatedAt: timestamp,
            isDeleted: false,
            // Ensure status defaults if not present (though handler usually sets it)
            status: data.status || "PENDING"
        };

        try {
            await docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: item
            }));
            return item as unknown as AiScript;
        } catch (error) {
            console.error("DynamoDB Create Error", error);
            throw error;
        }
    }

    async findById(id: string): Promise<AiScript | null> {
        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `SCRIPT#${id}`,
                SK: "METADATA"
            }
        }));
        
        let script = (result.Item as unknown as AiScript) || null;
        
        if (script) {
            // Fetch videos for this script
            // Since we don't have a direct index on ScriptId for Videos yet, we might need to query GSI1 by Type=VIDEO and filter
            // OR we can assume valid design later. For now, fetch all videos involves querying GSI1.
            // Use Query on GSI1 for Type=VIDEO
             const videoResult = await docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: "GSI1",
                KeyConditionExpression: "#type = :type",
                ExpressionAttributeNames: { "#type": "Type" },
                ExpressionAttributeValues: { ":type": "VIDEO" }
            }));
            
            const allVideos = (videoResult.Items as unknown as VideoRender[]) || [];
            script.videos = allVideos.filter(v => v.scriptId === id && !v.isDeleted);
        }

        return script;
    }

    async findAll(): Promise<AiScript[]> {
        // Parallel Query: Get Scripts and Get Videos
        const [scriptsResult, videosResult] = await Promise.all([
            docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: "GSI1",
                KeyConditionExpression: "#type = :type",
                ExpressionAttributeNames: { "#type": "Type" },
                ExpressionAttributeValues: { ":type": "SCRIPT" },
                ScanIndexForward: false
            })),
            docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: "GSI1",
                KeyConditionExpression: "#type = :type",
                ExpressionAttributeNames: { "#type": "Type" },
                ExpressionAttributeValues: { ":type": "VIDEO" },
                ScanIndexForward: false
            }))
        ]);

        const scripts = (scriptsResult.Items as unknown as AiScript[]) || [];
        const videos = (videosResult.Items as unknown as VideoRender[]) || [];

        // Join in memory
        return scripts
            .filter(s => !s.isDeleted)
            .map(script => ({
                ...script,
                videos: videos.filter(v => v.scriptId === script.id && !v.isDeleted)
            }));
    }

    async updateStatus(id: string, status: string): Promise<void> {
        await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: `SCRIPT#${id}`, SK: "METADATA" },
            UpdateExpression: "set #status = :s, updatedAt = :u",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: {
                ":s": status,
                ":u": new Date().toISOString()
            }
        }));
    }

    async update(id: string, data: any): Promise<AiScript> {
        // Construct Dynamic Update Expression
        let updateExp = "set #updatedAt = :u";
        const expAttrValues: any = { ":u": new Date().toISOString() };
        const expAttrNames: any = { "#updatedAt": "updatedAt" };

        Object.keys(data).forEach((key, index) => {
            if (key === "id" || key === "createdAt") return; // Skip immutable keys
            const attrKey = `#param${index}`;
            const valKey = `:val${index}`;
            updateExp += `, ${attrKey} = ${valKey}`; 
            expAttrNames[attrKey] = key;
            expAttrValues[valKey] = data[key];
        });

        const result = await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: `SCRIPT#${id}`, SK: "METADATA" },
            UpdateExpression: updateExp,
            ExpressionAttributeNames: expAttrNames,
            ExpressionAttributeValues: expAttrValues,
            ReturnValues: "ALL_NEW"
        }));

        return result.Attributes as unknown as AiScript;
    }

    // Video Render Implementation (DynamoDB)
    async createVideoRender(data: any): Promise<VideoRender> {
        const id = uuidv4();
        const timestamp = new Date().toISOString();
        const item = {
            PK: `VIDEO#${id}`,
            SK: "METADATA",
            Type: "VIDEO",
            CreatedAt: timestamp,
            id,
            ...data,
            createdAt: timestamp,
            updatedAt: timestamp,
            isDeleted: false
        };

        try {
            await docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: item
            }));
            return item as unknown as VideoRender;
        } catch (error) {
            console.error("DynamoDB Create Video Error", error);
            throw error;
        }
    }

    async findVideoRenderById(id: string): Promise<VideoRender | null> {
         const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `VIDEO#${id}`,
                SK: "METADATA"
            }
        }));
        return (result.Item as unknown as VideoRender) || null;
    }

    async updateVideoRender(id: string, data: any): Promise<VideoRender> {
        console.log("DynamoDB updateVideoRender (PUT strategy) called with:", { id, data });

        // 1. Fetch existing item
        const existing = await this.findVideoRenderById(id);
        if (!existing) throw new Error(`Video with ID ${id} not found`);

        // 2. Merge updates
        const updatedItem = {
            ...existing,
            ...data,
            updatedAt: new Date().toISOString()
        };

        // 3. Put (overwrite) item
        try {
            console.log("DynamoDB Put Item:", JSON.stringify(updatedItem, null, 2));
            await docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: updatedItem
            }));
            return updatedItem;
        } catch (error) {
            console.error("DynamoDB Put (Update) Error", error);
            throw error;
        }
    }
}
