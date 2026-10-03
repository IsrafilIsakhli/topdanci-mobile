import type { QueryClient } from '@tanstack/react-query';
export function invalidateManagement(client: QueryClient) {
  return client.invalidateQueries({ predicate: (query) => /^(seller-|admin-)/.test(String(query.queryKey[0])) });
}
