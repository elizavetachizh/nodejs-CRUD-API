import "dotenv/config";
import { buildApp } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";

const app = buildApp();

const start = async (): Promise<void> => {
  try {
    await app.listen({ port, host });
    console.log(`Server is running at http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
