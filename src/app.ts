import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import { productRoutes } from "./routes/products.js";
import type { ProductsStore } from "./stores/products.js";

type BuildAppOptions = {
  store?: ProductsStore;
};

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  // Create a Fastify instance
  const app = Fastify({
    // Enable logging
    logger: true,
    ajv: {
      customOptions: {
        removeAdditional: false,
      },
    },
  });

  // Register product routes as a plugin
  app.register(productRoutes, {
    prefix: "/api/products",
    store: options.store,
  });

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
  app.setErrorHandler(async (error: FastifyError, _request, reply) => {
    app.log.error(error);

    if (error.validation) {
      return reply.code(400).send({
        message: error.message,
      });
    }

    return reply.code(500).send({ message: "Internal Server Error" });
  });

  return app;
}