export async function productRoutes(fastify, options) {
  // GET all products: http://localhost:3000/products
  fastify.get('/', async (request, reply) => {
    // In a real app, this would fetch data from a database
    const products = [
      { id: 1, name: 'Laptop', price: 999.99 },
      { id: 2, name: 'Mouse', price: 25.50 }
    ];
    return { products };
  });
}