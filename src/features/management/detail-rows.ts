import { fieldLabel, valueLabel } from '../../lib/labels';
import { dateLabel } from './format';
const hidden = /password|secret|token|hash|storageKey|variants|cdnUrl|logoKey|bannerKey|^id$|Id$|^children$|^images$/i;
export function detailRows(record: Record<string, unknown>, prefix = '', depth = 0): { label: string; value: string }[] {
  return Object.entries(record).flatMap(([key, value]) => {
    if (hidden.test(key) || value == null || value === '') return [];
    const label = [prefix, fieldLabel(key)].filter(Boolean).join(' · ');
    if (Array.isArray(value)) return value.slice(0, 8).flatMap((item, i) => typeof item === 'object' && item !== null
      ? detailRows(item, label + ' ' + (i + 1), depth + 1) : [{ label, value: valueLabel(item) }]);
    if (typeof value === 'object') {
      if (depth >= 2) return [];
      return detailRows(value as Record<string, unknown>, label, depth + 1);
    }
    return [{ label, value: /At$|timestamp/.test(key) ? dateLabel(value) : valueLabel(value) }];
  });
}
