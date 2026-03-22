import { randomUUID } from "node:crypto";
import {
  dbCreate,
  dbDelete,
  dbGetAll,
  dbGetById,
  dbUpdate,
} from "./db.js";
import type { CreateProductBody } from "../stores/products.js";

export type DbAction =
  | "getAllProducts"
  | "getProductById"
  | "createProduct"
  | "updateProduct"
  | "deleteProduct";

export type DbRequest = {
  type: "db:request";
  requestId: string;
  request: {
    type: DbAction;
    productId?: string;
    product?: CreateProductBody;
  };
};

export type DbResponse = {
  type: "db:response";
  requestId: string;
  ok: boolean;
  data: unknown;
};

export function handleDbRequest(message: DbRequest): DbResponse {
  const response: DbResponse = {
    type: "db:response",
    requestId: message.requestId,
    ok: true,
    data: null,
  };

  switch (message.request.type) {
    case "getAllProducts":
      response.data = dbGetAll();
      break;
    case "getProductById":
      response.data = dbGetById(message.request.productId ?? "");
      break;
    case "createProduct":
      response.data = dbCreate(message.request.product as CreateProductBody);
      break;
    case "updateProduct":
      response.data = dbUpdate(
        message.request.productId ?? "",
        message.request.product as CreateProductBody,
      );
      break;
    case "deleteProduct":
      response.data = dbDelete(message.request.productId ?? "");
      break;
    default:
      response.ok = false;
      response.data = "Unknown request type";
  }

  return response;
}

export function requestDb(
  action: DbAction,
  payload: { productId?: string; product?: CreateProductBody } = {},
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const requestId = randomUUID();

    const onMessage = (msg: unknown) => {
      const m = msg as DbResponse;
      if (!m || m.type !== "db:response" || m.requestId !== requestId) return;

      process.off("message", onMessage);

      if (!m.ok) {
        reject(new Error(String(m.data ?? "IPC error")));
        return;
      }

      resolve(m.data);
    };

    process.on("message", onMessage);

    process.send?.({
      type: "db:request",
      requestId,
      request: {
        type: action,
        ...payload,
      },
    } satisfies DbRequest);
  });
}