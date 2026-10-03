import { Text, View } from 'react-native';
import { PanelCard } from '../management/ui';
import { useColors } from '../../theme/colors';
import { detailRows } from '../management/detail-rows';
export function DetailFields({ value }: { value: Record<string, unknown> }) {
  const c = useColors();
  return <PanelCard title="Ətraflı məlumat">
    {detailRows(value).map((row, index) =>
      <View key={index} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.line, gap: 5 }}>
        <Text style={{ color: c.muted, fontSize: 11, lineHeight: 16 }}>{row.label}</Text>
        <Text selectable style={{ color: c.ink, fontSize: 13, lineHeight: 20 }}>{row.value}</Text>
      </View>)}
  </PanelCard>;
}
