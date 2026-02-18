1. Migración de Base de Datos (PostgreSQL -> Amazon RDS)
Pasar de un contenedor Docker local a Amazon RDS (Relational Database Service) te dará mayor estabilidad, backups automáticos y escalabilidad, pero requiere configuración de red.
Implicaciones y Cambios
*   Código (Prisma):
    *   No requiere cambios en el código. Prisma es agnóstico a dónde corre la base de datos siempre que sea PostgreSQL.
    *   Solo deberás actualizar la variable de entorno DATABASE_URL en tu archivo .env (y en las variables de entorno de tu servicio de despliegue, ej. ECS, App Runner o EC2).
*   Infraestructura (AWS):
    *   Instancia RDS: Debes crear una instancia de base de datos PostgreSQL. Para esta POC/MVP, una instancia db.t3.micro o db.t4g.micro (Free Tier elegible) es suficiente.
    *   Seguridad (VPC & Security Groups):
        *   La base de datos debe estar en una VPC.
        *   Debes configurar los Security Groups para permitir el tráfico entrante al puerto 5432 solo desde tu aplicación (si despliegas en AWS) o desde tu IP pública (si sigues desarrollando localmente).
        *   Importante: Si vas a conectarte desde tu máquina local, la instancia RDS debe tener la opción "Publicly Accessible" activada (con restricción de IP), o usar un túnel VPN/Bastion.
*   Migración de Datos:
    *   Si tienes datos locales que quieres conservar, deberás usar pg_dump para exportarlos y pg_restore (o psql) para importarlos a RDS.
    *   Si no te importan los datos actuales, bastará con ejecutar npx prisma db push apuntando a la nueva URL para crear las tablas.
---
2. Migración de IA (Groq -> AWS Bedrock)
Pasar de Groq a AWS Bedrock implica cambiar la librería de conexión y adaptar la forma en que enviamos los prompts, aunque podemos mantener la lógica de "Prompts" casi intacta.
Implicaciones y Cambios
*   Dependencias:
    *   Eliminar paquete openai.
    *   Instalar @aws-sdk/client-bedrock-runtime.
*   Selección del Modelo en Bedrock:
    *   Groq usa llama-3.3-70b. En AWS Bedrock, puedes usar la familia Meta Llama 3 (70b o 8b).
    *   Acción requerida: Debes ir a la consola de AWS Bedrock -> "Model access" y solicitar acceso a los modelos de Meta (Llama 3). Esto no es automático.
*   Refactorización de Código (GroqService -> BedrockService):
    *   La API de Bedrock no es idéntica a la de OpenAI.
    *   Opción A (Recomendada): Usar la Bedrock Converse API. Esta API unifica el formato de "mensajes" (User/System) de forma muy similar a OpenAI, facilitando la migración.
    *   Opción B (Raw): Invocar el modelo directamente. Requiere formatear el prompt en un string gigante siguiendo el formato específico de Llama 3 (<|begin_of_text|>...), lo cual es más propenso a errores.
    *   JSON Mode: Bedrock/Llama 3 no tiene un flag json_mode nativo idéntico al de la API de OpenAI/Groq que fuerza la salida. Sin embargo, Llama 3 es excelente siguiendo instrucciones. Deberemos reforzar el prompt para asegurar que solo devuelva JSON (ya lo hacemos, pero hay que ser estrictos).
*   Costos y Latencia:
    *   Groq es extremadamente rápido (LPU). Bedrock será un poco más lento en la generación, pero más estándar en infraestructura empresarial.
    *   Bedrock se cobra por tokens (input/output).
---
Plan de Acción Recomendado
Este es el paso a paso para ejecutar estos cambios en modo "Ejecución":
Fase 1: Base de Datos (Infraestructura)
1.  Crear RDS: Provisionar instancia PostgreSQL en AWS.
2.  Configurar Red: Ajustar Security Groups para permitir conexión.
3.  Switch Local: Cambiar DATABASE_URL en tu .env local para apuntar a AWS y verificar conexión.
4.  Despliegue Schema: Ejecutar npx prisma db push para crear la estructura.
Fase 2: Refactorización de IA (Código)
1.  Instalar SDK: npm install @aws-sdk/client-bedrock-runtime.
2.  Crear AwsBedrockService: Implementar un nuevo servicio que reemplace a GroqService.
    *   Configurar cliente Bedrock.
    *   Implementar método checkCompletion usando ConverseCommand de Bedrock.
3.  Actualizar AiScriptsModule: Reemplazar el provider de Groq por el de Bedrock.
4.  Variables de Entorno: Agregar AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (si no usas roles IAM automáticos).
Fase 3: Validación
1.  Probar la generación de un script completo para verificar que Llama 3 en Bedrock respeta el formato JSON de los templates.
¿Quieres que proceda con alguno de estos pasos? Por ejemplo, puedo empezar creando el AwsBedrockService para dejar el código listo, mientras tú gestionas la parte de infraestructura (crear el RDS y habilitar modelos en AWS) por tu cuenta.