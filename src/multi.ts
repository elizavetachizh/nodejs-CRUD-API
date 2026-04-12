import "dotenv/config";
import cluster from "cluster";
import http from "http";
import { availableParallelism } from "os";
import { handleDbRequest, requestDb } from "./multi/ipc.js";
import { buildApp } from "./app.js";
import type {
  CreateProductBody,
  Product,
  ProductsStore,
} from "./stores/products.js";

const basePort = Number(process.env.PORT ?? 3000);
const workersCount = Math.max(1, availableParallelism() - 1);
const workerPorts = Array.from(
  { length: workersCount },
  (_, i) => basePort + i + 1,
);
let rrIndex = 0;

if (cluster.isPrimary) {
  const workerPortById = new Map<number, number>();

  // Fork workers for each CPU core
  for (let i = 0; i < workersCount; i++) {
    const worker = cluster.fork({ PORT: workerPorts[i] });
    workerPortById.set(worker.id, workerPorts[i]);

    worker.on("message", (message) => {
      if (!message || message.type !== "db:request") return;
      const response = handleDbRequest(message);
      worker.send(response);
    });
  }

  // Handle worker exits and replace crashed workers
  cluster.on("exit", (worker) => {
    const deadPort = workerPortById.get(worker.id);
    if (!deadPort) return;
    const newWorker = cluster.fork({ PORT: deadPort });
    workerPortById.delete(worker.id);
    workerPortById.set(newWorker.id, deadPort);

    newWorker.on("message", (message) => {
      if (!message || message.type !== "db:request") return;
      const response = handleDbRequest(message);
      newWorker.send(response);
    });
  });

  http
    .createServer((req, res) => {
      const targetPort = workerPorts[rrIndex];
      rrIndex = (rrIndex + 1) % workerPorts.length;

      const proxyReq = http.request(
        {
          hostname: "127.0.0.1",
          port: targetPort,
          method: req.method,
          path: req.url,
          headers: req.headers,
        },
        (proxyRes) => {
          // Копируем статус и заголовки от worker -> клиенту
          res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
          // Прокидываем тело ответа
          proxyRes.pipe(res);
        },
      );
      proxyReq.on("error", () => {
        res.writeHead(502, { "content-type": "application/json" });
        res.end(JSON.stringify({ message: "Bad Gateway" }));
      });
      // Прокидываем тело входящего запроса клиент -> worker
      req.pipe(proxyReq);
    })
    .listen(basePort, "127.0.0.1");
} else {
  const workerPort = Number(process.env.PORT);
  const ipcStore: ProductsStore = {
    async getAllProducts() {
      return (await requestDb("getAllProducts")) as Product[];
    },
    async getProductById(productId: string) {
      return (await requestDb("getProductById", {
        productId,
      })) as Product | null;
    },
    async createProduct(product: CreateProductBody) {
      return (await requestDb("createProduct", { product })) as Product;
    },
    async updateProduct(productId: string, product: CreateProductBody) {
      return (await requestDb("updateProduct", {
        productId,
        product,
      })) as Product | null;
    },
    async deleteProduct(productId: string) {
      return Boolean(await requestDb("deleteProduct", { productId }));
    },
  };

  const app = buildApp({ store: ipcStore });

  app.listen({ port: workerPort, host: "127.0.0.1" }).catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
}
