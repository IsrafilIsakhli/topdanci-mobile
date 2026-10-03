import type { SessionUser } from '../../api/types';

// These credentials are for the local development preview, never server authentication.
export const demoAccounts = [
  { id: 'preview-seller', role: 'SELLER', email: 'magaza@demo.az', password: 'Magaza123!', title: 'Mağaza admini' },
  { id: 'preview-super', role: 'SUPER_ADMIN', email: 'superadmin@demo.az', password: 'Super123!', title: 'Superadmin' },
] as const;

export function demoUser(id: string): SessionUser | null {
  const account = demoAccounts.find((item) => item.id === id);
  return account ? { id: account.id, role: account.role, email: account.email, status: 'ACTIVE' } : null;
}
export function authenticateDemo(identifier: string, password: string): SessionUser {
  const account = demoAccounts.find((item) => item.email === identifier.trim().toLowerCase() && item.password === password);
  if (!account) throw new Error('Test hesabının e-poçtu və ya şifrəsi yanlışdır.');
  return demoUser(account.id)!;
}
export function isDemoUser(user: SessionUser | null): boolean {
  return !!user && demoUser(user.id)?.role === user.role;
}
