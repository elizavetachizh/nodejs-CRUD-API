import { randomUUID } from "node:crypto";
import type { CreateProductBody, Product } from "../stores/products.js";

const products: Product[] = [];

export function dbGetAll(): Product[] {
  return products;
}

export function dbGetById(productId: string): Product | null {
  return products.find((p) => p.id === productId) ?? null;
}

export function dbCreate(input: CreateProductBody): Product {
  const created: Product = { id: randomUUID(), ...input };
  products.push(created);
  return created;
}

export function dbUpdate(productId: string, input: CreateProductBody): Product | null {
  const existing = products.find((p) => p.id === productId);
  if (!existing) return null;

  existing.name = input.name;
  existing.description = input.description;
  existing.price = input.price;
  existing.category = input.category;
  existing.inStock = input.inStock;
  return existing;
}

export function dbDelete(productId: string): boolean {
  const index = products.findIndex((p) => p.id === productId);
  if (index === -1) return false;
  products.splice(index, 1);
  return true;
}