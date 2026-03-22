import { randomUUID } from "node:crypto";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
};

export type CreateProductBody = {
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
};

export interface ProductsStore {
  getAllProducts(): Promise<Product[]>;
  getProductById(productId: string): Promise<Product | null>;
  createProduct(product: CreateProductBody): Promise<Product>;
  updateProduct(
    productId: string,
    product: CreateProductBody,
  ): Promise<Product | null>;
  deleteProduct(productId: string): Promise<boolean>;
}

export function createInMemoryProductsStore(
  initial: Product[] = [],
): ProductsStore {
  const products: Product[] = [...initial];
  return {
    async getAllProducts(): Promise<Product[]> {
      return products;
    },
    async getProductById(productId: string): Promise<Product | null> {
      const product = products.find((p) => p.id === productId);
      return product ?? null;
    },
    async createProduct(product: CreateProductBody): Promise<Product> {
      const newProduct: Product = {
        id: randomUUID(),
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        inStock: product.inStock,
      };
      products.push(newProduct);
      return newProduct;
    },
    async updateProduct(
      productId: string,
      product: CreateProductBody,
    ): Promise<Product | null> {
      const existingProduct = products.find((p) => p.id === productId);
      if (!existingProduct) {
        return null;
      }
      existingProduct.name = product.name;
      existingProduct.description = product.description;
      existingProduct.price = product.price;
      existingProduct.category = product.category;
      existingProduct.inStock = product.inStock;
      return existingProduct;
    },
    async deleteProduct(productId: string): Promise<boolean> {
      const index = products.findIndex((p) => p.id === productId);
      if (index === -1) {
        return false;
      }
      products.splice(index, 1);
      return true;
    },
  };
}
