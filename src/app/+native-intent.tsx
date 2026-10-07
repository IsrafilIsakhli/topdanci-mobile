import { catalogLinkRoute } from '../features/catalog/share-links';
export function redirectSystemPath({path}:{path:string;initial:boolean}) {
 if (/^https?:\/\//.test(path)) return catalogLinkRoute(path);
 return path;
}