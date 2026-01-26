import * as dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });
  await app.listen(3000);
}
bootstrap();
