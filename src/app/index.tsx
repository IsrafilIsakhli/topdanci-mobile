import { Redirect } from 'expo-router';
import { Loading } from '../components/ui';
import { useSession } from '../features/auth/use-session';
export default function Index() {
  const { user, loading } = useSession();
  if (loading) return <Loading />;
  if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') return <Redirect href="/admin" />;
  if (user?.role === 'SELLER') return <Redirect href="/seller" />;
  return <Redirect href="/home" />;
}
