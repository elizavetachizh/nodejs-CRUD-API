import { randomUUID } from "node:crypto";
import { FastifyPluginAsync } from "fastify";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
};

type CreateProductBody = {
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
};

const products: Product[] = [];

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

export const productRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", async () => {
    return products;
  });

  fastify.post<{ Body: CreateProductBody }>(
    "/",
    { schema: { body: createProductBodySchema } },
    async (request, reply) => {
    const newProduct: Product = {
      id: randomUUID(),
      name: request.body.name,
      description: request.body.description,
      price: request.body.price,
      category: request.body.category,
      inStock: request.body.inStock,
    };

    products.push(newProduct);
    return reply.code(201).send(newProduct);
    },
  );

  fastify.get("/:productId", async (request, reply) => {
      const { productId } = request.params as { productId: string };
      const product = products.find((p) => p.id === productId);
      if (!product) {
        return reply.code(404).send({ message: "Product not found" });
      }
      return product;
    },
  );
  fastify.put<{ Body: CreateProductBody }>("/:productId", { schema: { body: createProductBodySchema } }, async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return reply.code(404).send({ message: "Product not found" });
      }

    product.name = request.body.name;
    product.description = request.body.description;
    product.price = request.body.price;
    product.category = request.body.category;
    product.inStock = request.body.inStock;

    return reply.code(200).send(product);
  });
  fastify.delete("/:productId", async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const product = products.find((p) => p.id === productId);
    if (!product) {
      return reply.code(404).send({ message: "Product not found" });
    }
    products.splice(products.indexOf(product), 1);
    return reply.code(204).send();
  });
};
