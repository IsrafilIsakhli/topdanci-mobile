export function productSearchPath(query: string): string {
  const text = query.trim();
  return text ? `/products?q=${encodeURIComponent(text)}` : '/products';
}

export function categoryProductsPath(slug: string): string {
  return `/products?category=${encodeURIComponent(slug)}`;
}
