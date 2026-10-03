import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { ArrowRight, CheckCircle2, ChevronRight, Eye, EyeOff, Info } from 'lucide-react-native';
import { useColors } from '../theme/colors';

export function FormSection({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const c = useColors();
  return <View style={{ borderRadius: 20, padding: 16, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, gap: 16 }}>
    <View style={{ gap: 4 }}><Text style={{ color: c.ink, fontSize: 16, fontWeight: '800' }}>{title}</Text>
      {subtitle && <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{subtitle}</Text>}</View>
    {children}
  </View>;
}
export function FormInput({ label, error, hint, optional, secureTextEntry, multiline, ...props }: TextInputProps & {
  label: string; error?: string; hint?: string; optional?: boolean;
}) {
  const c = useColors(); const [show, setShow] = useState(false); const [focused, setFocused] = useState(false);
  return <View style={{ gap: 6 }}>
    <Text style={{ color: c.ink, fontSize: 12, fontWeight: '700' }}>{label}
      {optional && <Text style={{ color: c.muted, fontWeight: '400' }}> · İstəyə bağlı</Text>}</Text>
    <View style={{ minHeight: multiline ? 124 : 50, borderRadius: 13, backgroundColor: c.background, borderWidth: 1,
      borderColor: error ? c.danger : focused ? c.brand : c.line, flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center' }}>
      <TextInput {...props} accessibilityLabel={label} placeholderTextColor={c.muted}
        autoCapitalize={props.autoCapitalize ?? 'none'} autoCorrect={props.autoCorrect ?? false}
        secureTextEntry={secureTextEntry && !show} multiline={multiline}
        onFocus={(event) => { setFocused(true); props.onFocus?.(event); }} onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
        style={{ flex: 1, minHeight: multiline ? 122 : 48, color: c.ink, fontSize: 14, paddingHorizontal: 12,
          paddingVertical: 12, textAlignVertical: multiline ? 'top' : 'center' }} />
      {secureTextEntry && <Pressable accessibilityRole="button" accessibilityLabel={show ? label + ': şifrəni gizlət' : label + ': şifrəni göstər'}
        accessibilityState={{ selected: show, disabled: props.editable === false }} disabled={props.editable === false} onPress={() => setShow(!show)}
        style={{ minWidth: 46, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
        {show ? <EyeOff size={19} color={c.muted} /> : <Eye size={19} color={c.muted} />}
      </Pressable>}
    </View>
    {(error || hint) && <Text accessibilityRole={error ? 'alert' : undefined} style={{ color: error ? c.danger : c.muted, fontSize: 11, lineHeight: 16 }}>{error ?? hint}</Text>}
  </View>;
}
export function FormButton({ title, onPress, busy = false, disabled = false, secondary = false }: {
  title: string; onPress: () => void; busy?: boolean; disabled?: boolean; secondary?: boolean;
}) {
  const c = useColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: busy || disabled, busy }} disabled={busy || disabled} onPress={onPress}
    style={({ pressed }) => ({ minHeight: 50, padding: 13, borderRadius: 14, backgroundColor: secondary ? c.brandSoft : c.brand,
      opacity: busy || disabled ? .55 : pressed ? .8 : 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 })}>
    {busy ? <ActivityIndicator color={secondary ? c.brand : c.surface} /> : <ArrowRight size={17} color={secondary ? c.brand : c.surface} />}
    <Text style={{ color: secondary ? c.brand : c.surface, fontSize: 14, fontWeight: '800' }}>{title}</Text>
  </Pressable>;
}
export function FormNote({ children, success = false, error = false }: { children: ReactNode; success?: boolean; error?: boolean }) {
  const c = useColors(); const color = error ? c.danger : c.brand;
  return <View style={{ padding: 13, borderRadius: 14, backgroundColor: error ? '#fff0ef' : c.brandSoft, flexDirection: 'row', alignItems: 'flex-start', gap: 9 }}>
    {success ? <CheckCircle2 size={18} color={color} /> : <Info size={18} color={color} />}
    <Text accessibilityRole={error ? 'alert' : undefined} style={{ color, fontSize: 12, lineHeight: 19, flex: 1 }}>{children}</Text>
  </View>;
}
export function MenuItem({ icon, title, text, onPress }: { icon: ReactNode; title: string; text: string; onPress: () => void }) {
  const c = useColors();
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint={text} onPress={onPress} style={({ pressed }) => ({ minHeight: 76, padding: 14,
    borderWidth: 1, borderColor: c.line, borderRadius: 18, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? .7 : 1 })}>
    <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.brandSoft }}>{icon}</View>
    <View style={{ flex: 1, gap: 4 }}><Text style={{ color: c.ink, fontSize: 14, fontWeight: '700' }}>{title}</Text>
      <Text style={{ color: c.muted, fontSize: 11, lineHeight: 16 }}>{text}</Text></View><ChevronRight size={18} color={c.muted} />
  </Pressable>;
}
