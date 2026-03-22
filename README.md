# Product Catalog CRUD API

Simple CRUD API for a Product Catalog built with Fastify and TypeScript.
The project uses an in-memory database in single mode and shared in-memory state via Cluster IPC in multi mode.

## Tech Stack

- Node.js `24.10.0` or newer
- TypeScript
- Fastify
- Node.js Cluster API (horizontal scaling)
- Node.js built-in test runner (`node:test`)

## Requirements

- Node.js `24.10.0+`
- npm

## Installation

```bash
npm install
```

## Environment Variables

Create a local `.env` file:

```env
PORT=3000
```

You can copy from `.env.example`:

```bash
cp .env.example .env
```

## Available Scripts

- `npm run start:dev` - development mode (nodemon + TypeScript entrypoint)
- `npm run start:prod` - production mode (build + run compiled app)
- `npm run start:multi` - clustered mode with load balancer and shared DB state
- `npm run build` - compile TypeScript to `dist/`
- `npm run test` - run API tests

## Run Application

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run start:prod
```

Server starts on:

- `http://127.0.0.1:${PORT}`

## API

Base path:

- `/api/products`

Product model:

```json
{
  "id": "uuid-generated-on-server",
  "name": "string",
  "description": "string",
  "price": 100,
  "category": "electronics",
  "inStock": true
}
```

### `GET /api/products`

Returns all products.

- `200 OK`

Example:

```bash
curl -X GET http://127.0.0.1:3000/api/products
```

### `GET /api/products/:productId`

Returns product by id.

- `200 OK` if found
- `400 Bad Request` if `productId` is not UUID
- `404 Not Found` if product does not exist

Example:

```bash
curl -X GET http://127.0.0.1:3000/api/products/550e8400-e29b-41d4-a716-446655440000
```

### `POST /api/products`

Creates product.

- `201 Created` with created product
- `400 Bad Request` for invalid body (missing fields, wrong types, `price <= 0`)

Example:

```bash
curl -X POST http://127.0.0.1:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Keyboard",
    "description": "Mechanical keyboard",
    "price": 99.99,
    "category": "electronics",
    "inStock": true
  }'
```

### `PUT /api/products/:productId`

Updates existing product.

- `200 OK` with updated product
- `400 Bad Request` for invalid `productId` or invalid body
- `404 Not Found` if product does not exist

Example:

```bash
curl -X PUT http://127.0.0.1:3000/api/products/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Keyboard Pro",
    "description": "Mechanical keyboard v2",
    "price": 129.99,
    "category": "electronics",
    "inStock": false
  }'
```

### `DELETE /api/products/:productId`

Deletes product by id.

- `204 No Content` if deleted
- `400 Bad Request` if `productId` is invalid UUID
- `404 Not Found` if product does not exist

Example:

```bash
curl -X DELETE http://127.0.0.1:3000/api/products/550e8400-e29b-41d4-a716-446655440000
```

## Error Handling

- Unknown routes return `404` with a human-friendly message
- Server/internal errors return `500` with message `Internal Server Error`
- Validation errors return `400` with details from Fastify validation

## Tests

Run all tests:

```bash
npm run test
```

Tests cover CRUD flow and validation scenarios (more than 3 scenarios).

## Horizontal Scaling (`start:multi`)

Run:

```bash
npm run start:multi
```

Behavior:

- Primary process starts load balancer on `localhost:PORT`
- Worker processes start on `localhost:PORT+1 ... PORT+n`
- Number of workers = `availableParallelism() - 1`
- Requests are distributed using round-robin
- Database state is consistent across workers via IPC (primary process handles in-memory DB operations)

Example for `PORT=3000`:

- Load balancer: `http://127.0.0.1:3000`
- Workers: `http://127.0.0.1:4001`, `:4002`, `:4003`, ...

Consistency scenario:

1. `POST` to one worker creates a product
2. `GET` from another worker returns the same product
3. `DELETE` from a third worker removes it
4. `GET` again returns `404`