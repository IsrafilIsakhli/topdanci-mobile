import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Card, Loading, Notice, Row } from './ui';

export function ResourceList<T extends { id?: string }>({ path, title, render, onSelect }: {
  path: string; title: string; render: (item: T) => { title: string; subtitle?: string };
  onSelect?: (item: T) => void;
}) {
  const query = useQuery({ queryKey: ['resource', path], queryFn: () => api.get<T[]>(path) });
  if (query.isPending) return <Loading />;
  if (query.error) return <Notice message={query.error.message} />;
  if (!query.data?.data.length) return <Notice message={title + ' tapılmadı.'} />;
  return <Card>{query.data.data.map((item, i) => {
    const content = render(item);
    return <Row key={item.id ?? i} title={content.title} subtitle={content.subtitle} onPress={onSelect ? () => onSelect(item) : undefined} />;
  })}</Card>;
}
