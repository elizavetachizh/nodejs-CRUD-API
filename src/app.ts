import Fastify, {  type FastifyInstance } from "fastify";
import {productRoutes} from "./routes/products.js";
export function buildApp(): FastifyInstance {
  // Create a Fastify instance
  const app = Fastify({
    // Enable logging
    logger: true,
  });

  // Register product routes as a plugin
  app.register(productRoutes, { prefix: '/api/products' });

  app.get("/", async () => {
    return { message: "API is running" };
  });
// Handle 404 errors
  app.setNotFoundHandler(async (request, reply) => {
    return reply.code(404).send({
      message: `Route ${request.method} ${request.url} not found`,
    });
  });
// Handle errors
  app.setErrorHandler(async (error, _request, reply) => {
    app.log.error(error);
    return reply.code(500).send({ message: "Internal Server Error" });
  });

  return app;
}