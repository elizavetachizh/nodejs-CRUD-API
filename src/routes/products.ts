import type { FastifyPluginAsync } from "fastify";
import {
  createInMemoryProductsStore,
  type CreateProductBody,
  type ProductsStore,
} from "../stores/products.js";

const createProductBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "description", "price", "category", "inStock"],
  properties: {
    name: { type: "string", minLength: 1 },
    description: { type: "string", minLength: 1 },
    price: { type: "number", exclusiveMinimum: 0 },
    category: { type: "string", minLength: 1 },
    inStock: { type: "boolean" },
  },
} as const;

const productIdParamSchema = {
  type: "object",
  additionalProperties: false,
  required: ["productId"],
  properties: {
    productId: { type: "string", format: "uuid" },
  },
} as const;

const productsStore = createInMemoryProductsStore();

type ProductRoutesOptions = {
  store?: ProductsStore;
};

export const productRoutes: FastifyPluginAsync<ProductRoutesOptions> = async (
  fastify,
  opts,
) => {
  const store = opts.store ?? productsStore;

  fastify.get("/", async () => {
    return store.getAllProducts();
  });

  fastify.post<{ Body: CreateProductBody }>(
    "/",
    { schema: { body: createProductBodySchema } },
    async (request, reply) => {
      const createdProduct = await store.createProduct(request.body);
      return reply.code(201).send(createdProduct);
    },
  );

  fastify.get<{ Params: { productId: string } }>(
    "/:productId",
    { schema: { params: productIdParamSchema } },
    async (request, reply) => {
      const product = await store.getProductById(request.params.productId);
      if (!product) {
        return reply.code(404).send({ message: "Product not found" });
      }
      return reply.code(200).send(product);
    },
  );

  fastify.put<{ Params: { productId: string }; Body: CreateProductBody }>(
    "/:productId",
    { schema: { params: productIdParamSchema, body: createProductBodySchema } },
    async (request, reply) => {
      const updatedProduct = await store.updateProduct(
        request.params.productId,
        request.body,
      );
      if (!updatedProduct) {
        return reply.code(404).send({ message: "Product not found" });
      }
      return reply.code(200).send(updatedProduct);
    },
  );

  fastify.delete<{ Params: { productId: string } }>(
    "/:productId",
    { schema: { params: productIdParamSchema } },
    async (request, reply) => {
      const deleted = await store.deleteProduct(request.params.productId);
      if (!deleted) {
        return reply.code(404).send({ message: "Product not found" });
      }
      return reply.code(204).send();
    },
  );
};
