import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.ts";

test("GET / returns API running message", async () => {
  const app = buildApp();

  const res = await app.inject({
    method: "GET",
    url: "/",
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { message: "API is running" });

  await app.close();
});

test("POST /api/products creates product with uuid", async () => {
  const app = buildApp();

  const payload = {
    name: "Book",
    description: "TS guide",
    price: 10,
    category: "books",
    inStock: true,
  };

  const res = await app.inject({
    method: "POST",
    url: "/api/products",
    payload,
  });

  assert.equal(res.statusCode, 201);
  const body = res.json();
  assert.equal(typeof body.id, "string");
  assert.equal(body.name, payload.name);
  assert.equal(body.description, payload.description);
  assert.equal(body.price, payload.price);
  assert.equal(body.category, payload.category);
  assert.equal(body.inStock, payload.inStock);

  await app.close();
});

test("POST /api/products validates request body and returns 400", async () => {
  const app = buildApp();

  const res = await app.inject({
    method: "POST",
    url: "/api/products",
    payload: {
      name: "Bad Product",
      description: "Invalid price",
      price: 0,
      category: "books",
      inStock: true,
    },
  });

  assert.equal(res.statusCode, 400);

  await app.close();
});

test("GET /api/products/:productId returns 404 for unknown id", async () => {
  const app = buildApp();

  const res = await app.inject({
    method: "GET",
    url: "/api/products/550e8400-e29b-41d4-a716-446655440000",
  });

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.json(), { message: "Product not found" });

  await app.close();
});

test("PUT /api/products/:productId updates product", async () => {
  const app = buildApp();

  const createRes = await app.inject({
    method: "POST",
    url: "/api/products",
    payload: {
      name: "Keyboard",
      description: "Mechanical keyboard",
      price: 100,
      category: "electronics",
      inStock: true,
    },
  });

  const created = createRes.json();

  const updatePayload = {
    name: "Keyboard Pro",
    description: "Mechanical keyboard v2",
    price: 120,
    category: "electronics",
    inStock: false,
  };

  const updateRes = await app.inject({
    method: "PUT",
    url: `/api/products/${created.id}`,
    payload: updatePayload,
  });

  assert.equal(updateRes.statusCode, 200);
  const updated = updateRes.json();
  assert.equal(updated.id, created.id);
  assert.equal(updated.name, updatePayload.name);
  assert.equal(updated.description, updatePayload.description);
  assert.equal(updated.price, updatePayload.price);
  assert.equal(updated.category, updatePayload.category);
  assert.equal(updated.inStock, updatePayload.inStock);

  await app.close();
});

test("PUT /api/products/:productId returns 400 for invalid body", async () => {
  const app = buildApp();

  const createRes = await app.inject({
    method: "POST",
    url: "/api/products",
    payload: {
      name: "Mouse",
      description: "Wireless mouse",
      price: 50,
      category: "electronics",
      inStock: true,
    },
  });

  const created = createRes.json();

  const updateRes = await app.inject({
    method: "PUT",
    url: `/api/products/${created.id}`,
    payload: {
      name: "Mouse v2",
      description: "Wireless mouse",
      price: 0,
      category: "electronics",
      inStock: true,
    },
  });

  assert.equal(updateRes.statusCode, 400);

  await app.close();
});

test("DELETE /api/products/:productId removes product", async () => {
  const app = buildApp();

  const createRes = await app.inject({
    method: "POST",
    url: "/api/products",
    payload: {
      name: "Headphones",
      description: "Noise cancelling",
      price: 200,
      category: "electronics",
      inStock: true,
    },
  });

  const created = createRes.json();

  const deleteRes = await app.inject({
    method: "DELETE",
    url: `/api/products/${created.id}`,
  });

  assert.equal(deleteRes.statusCode, 204);

  const getRes = await app.inject({
    method: "GET",
    url: `/api/products/${created.id}`,
  });

  assert.equal(getRes.statusCode, 404);
  assert.deepEqual(getRes.json(), { message: "Product not found" });

  await app.close();
});

test("DELETE /api/products/:productId returns 404 for unknown id", async () => {
  const app = buildApp();

  const deleteRes = await app.inject({
    method: "DELETE",
    url: "/api/products/550e8400-e29b-41d4-a716-446655440000",
  });

  assert.equal(deleteRes.statusCode, 404);
  assert.deepEqual(deleteRes.json(), { message: "Product not found" });

  await app.close();
});