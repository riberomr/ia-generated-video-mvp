# Estrategia de Migración a DynamoDB

Este documento detalla cómo migrar la capa de datos de PostgreSQL (Prisma) a **Amazon DynamoDB** (NoSQL), respetando la funcionalidad actual de `AiScripts` y `Videos`.

## 1. Diseño de Datos (Single Table Design)

En lugar de múltiples tablas relacionadas, usaremos una **Única Tabla (`CourseBuilderTable`)** con patrones de acceso optimizados.

### Estructura de la Tabla

*   **Partition Key (PK):** `PK` (String)
*   **Sort Key (SK):** `SK` (String)
*   **GSI1 (Índice Global):**
    *   **GSI1PK:** `Type` (String) - Para listar elementos por tipo.
    *   **GSI1SK:** `CreatedAt` (String) - Para ordenar por fecha.

### Patrones de Entidades

#### A. AiScript (El Script Generado)
Representa el documento principal.

*   **PK:** `SCRIPT#<ScriptId>`
*   **SK:** `METADATA`
*   **Type (GSI1PK):** `SCRIPT`
*   **CreatedAt (GSI1SK):** `2023-10-27T10:00:00Z`
*   **Atributos:** `title`, `courseName`, `templateData` (JSON), `sourceContent`, etc.

#### B. VideoRender (El Video Generado)
Representa un video asociado a un script.

*   **PK:** `SCRIPT#<ScriptId>`  *(Mismo PK que el script para agruparlos)*
*   **SK:** `VIDEO#<VideoId>`
*   **Type (GSI1PK):** `VIDEO`
*   **Atributos:** `externalId` (Synthesia ID), `status`, `downloadUrl`.

---

## 2. Cambios en Infraestructura (`template.yaml`)

Debes agregar el recurso de la tabla y dar permisos a las Lambdas.

### A. Definir la Tabla
Añade esto en `Resources`:

```yaml
  CourseBuilderTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: CourseBuilderTable
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
        - AttributeName: Type
          AttributeType: S
        - AttributeName: CreatedAt
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: GSI1
          KeySchema:
            - AttributeName: Type
              KeyType: HASH
            - AttributeName: CreatedAt
              KeyType: RANGE
          Projection:
            ProjectionType: ALL

### C. Decisión de Diseño: ¿Por qué `SK = "METADATA"`?
Es posible que te preguntes si "METADATA" es el nombre correcto si vas a cambiar los datos.

1.  **SK es una Etiqueta Inmutable:** El Sort Key (`METADATA`) actúa como el ID de la fila dentro de la partición del Script. No cambia aunque cambies el `title` o el `templateData`.
2.  **Mutabilidad:** Los atributos (columnas) son totalmente mutables. Puedes editar el JSON, el título o el estado tantas veces quieras sin tocar el SK.
3.  **Extensibilidad (Versioning):**
    *   Si en el futuro quieres guardar **versiones históricas** de un script, podrías agregar items nuevos con `SK = "V#1"`, `SK = "V#2"`, manteniendo `METADATA` como la versión "actual"/"live".
    *   Este diseño deja la puerta abierta a esa funcionalidad sin romper nada.
```

### B. Actualizar Permisos de Lambdas
En cada función (`AiScriptsFunction`, `VideosFunction`, etc.), reemplaza las `Policies` o añade:

```yaml
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref CourseBuilderTable
      Environment:
        Variables:
          TABLE_NAME: !Ref CourseBuilderTable
```

---

## 3. Cambios en el Código (`apps/apiv2`)

La migración implica dejar de usar `PrismaClient` y usar `DynamoDBDocumentClient`.

### A. Nuevas Dependencias
Elimina `@prisma/client` y `prisma`. Instala:
```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb uuid
npm install -D @types/uuid
```

### B. Crear cliente DynamoDB (`src/lib/dynamodb.ts`)

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
export const docClient = DynamoDBDocumentClient.from(client);
export const TABLE_NAME = process.env.TABLE_NAME || "CourseBuilderTable";
```

### C. Refactorizar Handlers (Ejemplo: `ai-scripts.ts`)

#### 1. `handleCreate` (Guardar Script)
```typescript
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

// ...
const id = uuidv4();
const timestamp = new Date().toISOString();

await docClient.send(new PutCommand({
  TableName: TABLE_NAME,
  Item: {
    PK: `SCRIPT#${id}`,
    SK: "METADATA",
    Type: "SCRIPT",
    CreatedAt: timestamp,
    id,
    title: body.title,
    // ... resto de campos
  }
}));
```

#### 2. `handleFindAll` (Listar Scripts)
Usamos el GSI para obtener todos los scripts ordenados por fecha.

```typescript
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

// ...
const response = await docClient.send(new QueryCommand({
  TableName: TABLE_NAME,
  IndexName: "GSI1",
  KeyConditionExpression: "#type = :type",
  ExpressionAttributeNames: { "#type": "Type" },
  ExpressionAttributeValues: { ":type": "SCRIPT" },
  ScanIndexForward: false // Orden descendente (más nuevo primero)
}));
return ok(response.Items);
```

#### 3. `handleFindOne` (Obtener Script + Videos)
Con DynamoDB, podemos traer el Script y sus Videos en **una sola query** gracias al diseño de PK compartida.

```typescript
const response = await docClient.send(new QueryCommand({
  TableName: TABLE_NAME,
  KeyConditionExpression: "PK = :pk",
  ExpressionAttributeValues: { ":pk": `SCRIPT#${id}` }
}));

// response.Items contendrá 1 elemento METADATA (el script) y N elementos VIDEO#...
const script = response.Items.find(item => item.SK === "METADATA");
const videos = response.Items.filter(item => item.SK.startsWith("VIDEO#"));

if(script) {
    script.videos = videos;
    return ok(script);
}
```

---

#### 4. `handleUpdate` (Editar Script)
En DynamoDB, usamos `UpdateCommand` para modificar solo los campos necesarios. **Importante:** Debemos actualizar manualmente `updatedAt`.

```typescript
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

// ...
const timestamp = new Date().toISOString();

await docClient.send(new UpdateCommand({
  TableName: TABLE_NAME,
  Key: {
    PK: `SCRIPT#${id}`,
    SK: "METADATA"
  },
  UpdateExpression: "set title = :t, templateData = :td, updatedAt = :u",
  ExpressionAttributeValues: {
    ":t": body.title,
    ":td": body.templateData,
    ":u": timestamp
  },
  ReturnValues: "ALL_NEW"
}));
```

#### 5. `handleRemove` (Soft Delete)
Para "eliminar" lógicamente (respetando tu `isDeleted`), hacemos un Update.

```typescript
// ...
await docClient.send(new UpdateCommand({
  TableName: TABLE_NAME,
  Key: {
    PK: `SCRIPT#${id}`,
    SK: "METADATA"
  },
  UpdateExpression: "set isDeleted = :d, updatedAt = :u",
  ExpressionAttributeValues: {
    ":d": true,
    ":u": new Date().toISOString()
  }
}));
```

### Consideración sobre `updatedAt`
A diferencia de Prisma (`@updatedAt`), DynamoDB no actualiza fechas automáticamente.
*   **Creación:** Guardar `createdAt` y `updatedAt` con la fecha actual.
*   **Edición/Borrado:** Siempre incluir `updatedAt` en el `UpdateExpression`.

---

## 4. Plan de Ejecución

1.  **Crear nueva rama:** `feature/dynamodb-migration`.
2.  **Actualizar `template.yaml`:** Agregar la tabla y actualizar env vars.
3.  **Instalar SDKs:** `npm install @aws-sdk/...` y borrar Prisma.
4.  **Refactorizar:** Ir archivo por archivo (`ai-scripts.ts`, `videos.ts`) cambiando las llamadas de `prisma.*` a `docClient.send(...)`.
5.  **Probar localmente:**
    *   SAM Local soporta DynamoDB Local, o puedes apuntar a una tabla real en AWS (dev) para facilitar las cosas.
    *   Para local puro: `docker run -p 8000:8000 amazon/dynamodb-local`.
