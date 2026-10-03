import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronRight, LayoutGrid, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Category } from '../../api/types';
import { useColors } from '../../theme/colors';
import { categoryIcon, categoryShortName } from './cards';
import { categoryTone } from './category-tiles';
import { categoryChildren, categoryRoots } from './category-tree';
import { MAX_LEVEL, categoryDescendants, categoryGroupsOf, categoryHits, categoryMeta, categoryRoot,
  defaultExpandedNodes, groupsToOpen } from './category-browser';

/**
 * Kateqoriya seçimi: solda sabit "sahə" zolağı, sağda seçilmiş sahənin bütün alt ağacı.
 * Əvvəlki versiya hər səviyyəni ayrı ekranda açırdı — məhsul növünə çatmaq üçün 3 toxunuş
 * və 2 geri addım lazım idi. İndi istənilən məhsul növü 1 toxunuş uzaqlıqdadır.
 */

const RAIL_ITEM_HEIGHT = 72;
const RAIL_GAP = 4;
const SHEET_MAX_WIDTH = 600;

type RailEntry = { id?: string; label: string; category?: Category };

function PaneLabel({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  const c = useColors();
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
    <Text style={{ flex: 1, color: c.muted, fontSize: 10, lineHeight: 15, fontWeight: '700', letterSpacing: 1 }}>{text}</Text>
    {action ? <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onAction}
      style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}>
      <Text style={{ color: c.brand, fontSize: 11, fontWeight: '700' }}>{action}</Text>
    </Pressable> : null}
  </View>;
}

function StateCard({ title, text, action, onAction }: {
  title: string; text: string; action?: string; onAction?: () => void;
}) {
  const c = useColors();
  return <View style={{ paddingVertical: 30, alignItems: 'center', gap: 9 }}>
    <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: c.background,
      alignItems: 'center', justifyContent: 'center' }}>
      <Search size={24} color={c.muted} />
    </View>
    <Text style={{ color: c.ink, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
    <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 18 }}>{text}</Text>
    {action ? <Pressable accessibilityRole="button" onPress={onAction}
      style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}>
      <Text style={{ color: c.brand, fontWeight: '700', fontSize: 13 }}>{action}</Text>
    </Pressable> : null}
  </View>;
}

/** Sahə zolağındakı düymə — aktiv sahə ağ fon və brend zolağı ilə seçilir. */
function RailButton({ entry, selected, height, onPress }: { entry: RailEntry; selected: boolean; height: number; onPress: () => void }) {
  const c = useColors(); const { fontScale } = useWindowDimensions();
  const ink = entry.category ? categoryTone(entry.category).ink : c.brand;
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }}
    accessibilityLabel={entry.id ? `${entry.label} sahəsi` : 'Bütün kateqoriyalar'}
    onPress={onPress} style={({ pressed }) => ({ height, marginBottom: RAIL_GAP, borderRadius: 14,
      paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', gap: 5,
      backgroundColor: selected || pressed ? c.surface : 'transparent',
      borderWidth: 1, borderColor: selected ? c.line : 'transparent' })}>
    {selected ? <View style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3,
      borderRadius: 2, backgroundColor: c.brand }} /> : null}
    {entry.category ? categoryIcon(entry.category, selected ? ink : c.muted, 18)
      : <LayoutGrid size={18} color={selected ? c.brand : c.muted} />}
    <Text numberOfLines={2} style={{ fontSize: fontScale >= 1.4 ? 10 : 11, lineHeight: 15, textAlign: 'center',
      fontWeight: selected ? '800' : '600', color: selected ? c.brand : c.muted }}>{entry.label}</Text>
  </Pressable>;
}

/** Ən dərin səviyyə: bir toxunuşla məhsullara keçid. */
function LeafRow({ category, selected, onPress }: {
  category: Category; selected: boolean; onPress: () => void;
}) {
  const c = useColors();
  return <Pressable accessibilityRole="button" accessibilityState={selected ? { selected: true } : undefined}
    accessibilityLabel={category.name + ': məhsullara bax'} onPress={onPress}
    style={({ pressed }) => ({ width: '100%', minHeight: 48, borderRadius: 10, paddingHorizontal: 11,
      paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: selected || pressed ? c.brandSoft : '#f6faf8' })}>
    <Text style={{ flex: 1, color: c.ink, fontSize: 12, lineHeight: 17, fontWeight: '600' }}>{category.name}</Text>
    {selected ? <Check size={16} color={c.brand} /> : <ArrowUpRight size={16} color={c.brand} />}
  </Pressable>;
}

/** Ara səviyyə (4-cü səviyyə və daha dərin) — açılıb yerində böyüyür, ekran dəyişmir. */
function BranchRow({ category, meta, open, onToggle, onSelect, children }: {
  category: Category; meta: string; open: boolean; onToggle: () => void; onSelect: () => void; children?: ReactNode;
}) {
  const c = useColors();
  return <View style={{ width: '100%', borderRadius: 15, borderWidth: 1, overflow: 'hidden',
    borderColor: open ? '#a5cabb' : c.line, backgroundColor: open ? c.brandSoft : c.surface }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }}
        accessibilityLabel={`${category.name}: alt bölmələri ${open ? 'yığ' : 'aç'}`} onPress={onToggle}
        style={({ pressed }) => ({ flex: 1, minHeight: 50, paddingLeft: 12, paddingVertical: 8,
          flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? .7 : 1 })}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text numberOfLines={2} style={{ color: c.ink, fontSize: 12, lineHeight: 16, fontWeight: '700' }}>
            {category.name}
          </Text>
          <Text numberOfLines={1} style={{ color: c.muted, fontSize: 10, lineHeight: 13 }}>{meta}</Text>
        </View>
        <ChevronDown size={17} color={c.brand} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${category.name}: bütün məhsullara bax`}
        onPress={onSelect} style={{ width: 48, minHeight: 50, alignItems: 'center', justifyContent: 'center' }}>
        <ArrowUpRight size={16} color={c.brand} />
      </Pressable>
    </View>
    {open ? children : null}
  </View>;
}

/** 2-ci səviyyə qrupu: başlıq alt bölmələri açıb-yığır, ox düyməsi qrupun bütün məhsullarını açır. */
function GroupCard({ group, meta, open, selected, onToggle, onSelect, onLayout, children }: {
  group: { parent: Category; children: Category[] }; meta: string; open: boolean; selected: boolean;
  onToggle: () => void; onSelect: () => void; onLayout: (y: number) => void; children?: ReactNode;
}) {
  const c = useColors();
  const branch = group.children.length > 0;
  return <View onLayout={(event) => onLayout(event.nativeEvent.layout.y)}
    style={{ borderRadius: 17, borderWidth: 1, backgroundColor: c.surface, overflow: 'hidden',
      borderColor: selected ? c.brand : c.line }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: branch ? open : undefined }}
        accessibilityLabel={group.parent.name + (branch ? ': alt bölmələri ' + (open ? 'yığ' : 'aç') : ': məhsullara bax')}
        onPress={branch ? onToggle : onSelect}
        style={({ pressed }) => ({ flex: 1, minHeight: 62, paddingLeft: 12, paddingVertical: 12,
          flexDirection: 'row', alignItems: 'center', gap: 7, opacity: pressed ? .75 : 1 })}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ color: c.ink, fontSize: 13, lineHeight: 18, fontWeight: '800' }}>{group.parent.name}</Text>
          {branch || (group.parent.productCount ?? 0) > 0 ? <Text
            style={{ color: c.muted, fontSize: 11, lineHeight: 15 }}>{meta}</Text> : null}
        </View>
        {branch ? <ChevronDown size={16} color={c.brand}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} /> : null}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={group.parent.name + ': bütün məhsullara bax'}
        onPress={onSelect} style={({ pressed }) => ({ width: 44, minHeight: 54,
          alignItems: 'center', justifyContent: 'center', opacity: pressed ? .6 : 1 })}>
        <Text style={{ color: c.brand, fontSize: 11, fontWeight: '800' }}>Bax</Text>
      </Pressable>
    </View>
    {branch && open ? <View style={{ paddingHorizontal: 8, paddingBottom: 8, gap: 5 }}>{children}</View> : null}
  </View>;
}

/** Sahələr tam adla və bir sütunda göstərilir. */
function RootRow({ category, meta, selected, onPress }: {
  category: Category; meta: string; selected: boolean; onPress: () => void;
}) {
  const c = useColors(); const tone = categoryTone(category);
  return <Pressable accessibilityRole="button" accessibilityLabel={category.name + ': alt bölmələri aç'}
    onPress={onPress} style={({ pressed }) => ({ minHeight: 72, borderRadius: 16, borderWidth: 1,
      padding: 11, gap: 10, flexDirection: 'row', alignItems: 'center',
      borderColor: selected ? c.brand : c.line, backgroundColor: selected || pressed ? c.brandSoft : c.surface })}>
    <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: tone.background,
      alignItems: 'center', justifyContent: 'center' }}>{categoryIcon(category, tone.ink, 20)}</View>
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={{ color: c.ink, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>{category.name}</Text>
      <Text style={{ color: c.muted, fontSize: 11, lineHeight: 15 }}>
        {meta === 'Məhsul yoxdur' ? 'Məhsullara bax' : meta}
      </Text>
    </View>
    <ChevronRight size={16} color={c.brand} />
  </Pressable>;
}

/** Axtarış nəticəsi: ad, yol (breadcrumb) və alt bölmələrə keçid. */
function SearchRow({ hit, active, onSelect, onBrowse }: {
  hit: { category: Category; trail: Category[]; children: number }; active: boolean;
  onSelect: () => void; onBrowse: () => void;
}) {
  const c = useColors();
  const root = hit.trail[0] ?? hit.category; const tone = categoryTone(root);
  const path = hit.trail.slice(0, -1).map((item) => item.name).join(' › ');
  return <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 15, borderWidth: 1,
    borderColor: active ? c.brand : c.line, overflow: 'hidden', backgroundColor: active ? c.brandSoft : c.surface }}>
    <Pressable accessibilityRole="button" accessibilityLabel={hit.category.name + ': məhsullara bax'}
      onPress={onSelect} style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
        minHeight: 70, padding: 10, backgroundColor: pressed ? c.brandSoft : 'transparent' })}>
      <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: tone.background,
        alignItems: 'center', justifyContent: 'center' }}>{categoryIcon(root, tone.ink, 17)}</View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: c.ink, fontSize: 12, lineHeight: 17, fontWeight: '700' }}>{hit.category.name}</Text>
        <Text numberOfLines={2} style={{ color: c.muted, fontSize: 10, lineHeight: 14 }}>{path || 'Əsas sahə'}</Text>
      </View>
      {!hit.children && <ArrowUpRight size={15} color={c.brand} />}
    </Pressable>
    {!!hit.children && <Pressable accessibilityRole="button"
      accessibilityLabel={hit.category.name + ': alt bölmələri göstər'} onPress={onBrowse}
      style={{ width: 44, minHeight: 60, alignItems: 'center', justifyContent: 'center' }}>
      <ChevronRight size={17} color={c.brand} />
    </Pressable>}
  </View>;
}

export function CategoryPicker({ visible, categories, initialCategoryId, loading, error, onRetry, onClose, onSelect, selectionOnly = false }: {
  visible: boolean; categories: Category[]; initialCategoryId?: string; loading?: boolean; error?: boolean;
  onRetry?: () => void; onClose: () => void; onSelect: (slug?: string) => void;
  selectionOnly?: boolean;
}) {
  const c = useColors(); const insets = useSafeAreaInsets(); const { width, fontScale } = useWindowDimensions();
  const roots = useMemo(() => categoryRoots(categories), [categories]);
  const initialRootId = useMemo(() => categoryRoot(categories, initialCategoryId)?.id, [categories, initialCategoryId]);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [rootId, setRootId] = useState(initialRootId);
  const [activeId, setActiveId] = useState<string | undefined>(initialCategoryId);
  const [expanded, setExpanded] = useState<string[]>(
    () => defaultExpandedNodes(categories, initialRootId, initialCategoryId));
  const content = useRef<ScrollView>(null);
  const offsets = useRef(new Map<string, number>());

  const searching = !!query.trim();
  const activeRoot = roots.find((item) => item.id === rootId);
  const tone = categoryTone(activeRoot);
  const groups = useMemo(() => (rootId ? categoryGroupsOf(categories, rootId) : []), [categories, rootId]);
  const hits = useMemo(() => (searching ? categoryHits(categories, query) : []), [categories, query, searching]);
  const subtree = useMemo(() => (rootId ? categoryDescendants(categories, rootId).length : 0), [categories, rootId]);
  const rail = useMemo<RailEntry[]>(() => [{ id: undefined, label: 'Hamısı' },
    ...roots.map((category) => ({ id: category.id, label: categoryShortName(category), category }))], [roots]);
  const railIndex = Math.max(0, rail.findIndex((entry) => entry.id === rootId));

  const railWidth = fontScale >= 1.4 ? 108 : width < 360 ? 82 : 92;
  const railItemHeight = Math.max(RAIL_ITEM_HEIGHT, 36 + Math.ceil(fontScale * 30));

  const select = (slug?: string) => { Keyboard.dismiss(); onSelect(slug); };
  const isOpen = (id: string) => expanded.includes(id);
  const toggle = (id: string) => setExpanded((list) => list.includes(id)
    ? list.filter((key) => key !== id) : [...list, id]);
  const showRoot = (id?: string) => {
    Keyboard.dismiss(); setQuery(''); setRootId(id); setActiveId(undefined);
    setExpanded(defaultExpandedNodes(categories, id));
  };
  /** Axtarışdan və ya dərin qrupdan ağaca keçid: lazımi qruplar açılır. */
  const browse = (category: Category) => {
    Keyboard.dismiss(); setQuery('');
    const root = categoryRoot(categories, category.id);
    setRootId(root?.id); setActiveId(category.id);
    setExpanded([...new Set([...defaultExpandedNodes(categories, root?.id),
      ...groupsToOpen(categories, category.id)])]);
  };
  const goBack = () => { if (searching) { setQuery(''); Keyboard.dismiss(); } else onClose(); };

  useEffect(() => { content.current?.scrollTo({ y: 0, animated: false }); }, [rootId]);
  useEffect(() => {
    if (!activeId || searching) return;
    const y = offsets.current.get(activeId);
    if (y == null) return;
    const timer = setTimeout(() => content.current?.scrollTo({ y: Math.max(0, y - 8), animated: true }), 90);
    return () => clearTimeout(timer);
  }, [activeId, searching, rootId]);

  /** Alt ağacı yerində render edir: budaqlar açılıb-yığılır, yarpaqlar birbaşa seçilir. */
  const renderNodes = (nodes: Category[], level: number, seen: Set<string>): ReactNode =>
    nodes.filter((node) => !seen.has(node.id)).map((node) => {
      const children = level >= MAX_LEVEL ? [] : categoryChildren(categories, node.id);
      if (!children.length) return <LeafRow key={node.id} category={node} selected={node.id === activeId} onPress={() => select(node.slug)} />;
      const open = isOpen(node.id);
      return <BranchRow key={node.id} category={node} meta={categoryMeta(categories, node)} open={open}
        onToggle={() => toggle(node.id)} onSelect={() => select(node.slug)}>
        {open ? <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
          <View style={{ gap: 5 }}>
            {renderNodes(children, level + 1, new Set(seen).add(node.id))}
          </View>
        </View> : null}
      </BranchRow>;
    });

  const subtitle = searching ? `${hits.length} nəticə`
    : activeRoot ? `${subtree} alt bölmə${fontScale >= 1.3 ? '' : ' · məhsul növünü seçin'}`
    : `${roots.length} sahə${fontScale >= 1.3 ? '' : ' · biznesinizə uyğun sahəni seçin'}`;

  return <Modal visible={visible} transparent animationType="slide" onRequestClose={goBack} statusBarTranslucent>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(6,25,22,.48)' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Kateqoriya seçimini bağla" onPress={onClose}
        style={{ position: 'absolute', inset: 0 }} />
      <View accessibilityViewIsModal style={{ width: '100%', maxWidth: SHEET_MAX_WIDTH, alignSelf: 'center',
        backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        height: '90%', paddingTop: 10, paddingBottom: Math.max(insets.bottom, 12) }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.line,
          alignSelf: 'center', marginBottom: 14 }} />

        <View style={{ paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
            backgroundColor: activeRoot ? tone.background : c.brandSoft }}>
            {searching ? <Search size={22} color={c.brand} /> : activeRoot ? categoryIcon(activeRoot, tone.ink, 22) : <LayoutGrid size={22} color={c.brand} />}
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: c.ink, fontWeight: '800', letterSpacing: -.4,
              fontSize: activeRoot ? 17 : 21, lineHeight: activeRoot ? 22 : 27 }}>
              {searching ? 'Kateqoriya axtarışı' : activeRoot ? activeRoot.name : 'Kateqoriyaları kəşf et'}
            </Text>
            <Text accessibilityLiveRegion="polite" numberOfLines={1}
              style={{ color: c.muted, fontSize: 11, lineHeight: 16 }}>{subtitle}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Bağla" onPress={onClose}
            style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 15, alignItems: 'center',
              justifyContent: 'center', backgroundColor: pressed ? c.brandSoft : c.background })}>
            <X size={20} color={c.ink} />
          </Pressable>
        </View>

        <View style={{ marginHorizontal: 18, marginTop: 12, marginBottom: 12, borderWidth: 1, borderRadius: 15,
          backgroundColor: c.background, minHeight: 48, flexDirection: 'row', alignItems: 'center',
          paddingLeft: 13, paddingRight: 5, gap: 9, borderColor: searchFocused ? '#a5cabb' : c.line }}>
          <Search size={18} color={c.muted} strokeWidth={1.8} />
          <TextInput value={query} onChangeText={setQuery} onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)} onSubmitEditing={() => Keyboard.dismiss()}
            placeholder="Bütün kateqoriyalarda axtar" placeholderTextColor={c.muted}
            returnKeyType="search" autoCorrect={false} accessibilityLabel="Kateqoriya axtarışı"
            style={{ flex: 1, color: c.ink, minHeight: 46, fontSize: 13 }} />
          {query ? <Pressable accessibilityRole="button" accessibilityLabel="Axtarışı təmizlə"
            onPress={() => { setQuery(''); Keyboard.dismiss(); }}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <X size={17} color={c.muted} />
          </Pressable> : null}
        </View>

        {loading || error ? <View style={{ flex: 1, justifyContent: 'center' }}>
          {loading ? <ActivityIndicator color={c.brand} style={{ paddingVertical: 40 }} />
            : <StateCard title="Kateqoriyalar yüklənmədi" text="Bağlantını yoxlayın və yenidən cəhd edin."
              action="Yenidən yüklə" onAction={onRetry} />}
        </View> : <View style={{ flex: 1, flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.line }}>
          <View style={{ width: railWidth, backgroundColor: c.background,
            borderRightWidth: 1, borderRightColor: c.line }}>
            <FlatList data={rail} keyExtractor={(entry) => entry.id ?? 'all'}
              initialScrollIndex={railIndex > 2 ? railIndex - 2 : 0}
              getItemLayout={(_, index) => ({ length: railItemHeight + RAIL_GAP,
                offset: (railItemHeight + RAIL_GAP) * index, index })}
              showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 6 }}
              renderItem={({ item }) => <RailButton entry={item} selected={item.id === rootId} height={railItemHeight}
                onPress={() => showRoot(item.id)} />} />
          </View>

          <View style={{ flex: 1 }}>
            {searching ? <FlatList data={hits} keyExtractor={(hit) => hit.category.id}
              keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 12, paddingBottom: 20, gap: 8 }}
              ListHeaderComponent={<PaneLabel text={`AXTARIŞ NƏTİCƏLƏRİ · ${hits.length}`} action="Təmizlə"
                onAction={() => { setQuery(''); Keyboard.dismiss(); }} />}
              renderItem={({ item }) => <SearchRow hit={item} active={item.category.id === activeId}
                onSelect={() => select(item.category.slug)} onBrowse={() => browse(item.category)} />}
              ListEmptyComponent={<StateCard title="Uyğun kateqoriya tapılmadı"
                text="Başqa sözlə axtarın və ya soldakı sahələrə baxın." action="Bütün sahələrə bax"
                onAction={() => { setQuery(''); Keyboard.dismiss(); }} />} />
              : activeRoot ? <ScrollView ref={content} showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
                contentContainerStyle={{ padding: 12, paddingBottom: 20, gap: 10 }}>
                <PaneLabel text={`ALT BÖLMƏLƏR · ${groups.length} QRUP`} />
                {activeRoot.productCount === 0 && <View style={{ padding: 12, borderRadius: 13, backgroundColor: c.background }}>
                  <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>Bu sahədə hələ məhsul yoxdur. Alt bölmələri kəşf edə bilərsiniz.</Text>
                </View>}
                {groups.map((group) => <GroupCard key={group.parent.id} group={group}
                  meta={categoryMeta(categories, group.parent)} open={isOpen(group.parent.id)}
                  selected={group.parent.id === activeId} onToggle={() => toggle(group.parent.id)}
                  onSelect={() => select(group.parent.slug)}
                  onLayout={(y) => offsets.current.set(group.parent.id, y)}>
                  {renderNodes(group.children, 1, new Set([group.parent.id]))}
                </GroupCard>)}
                {!groups.length ? <StateCard title="Alt bölmə yoxdur"
                  text="Aşağıdakı düymədən bu sahənin məhsullarına keçə bilərsiniz." /> : null}
              </ScrollView>
              : <ScrollView ref={content} showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
                contentContainerStyle={{ padding: 12, paddingBottom: 20, gap: 10 }}>
                <PaneLabel text={`BÜTÜN SAHƏLƏR · ${roots.length}`} />
                <View style={{ gap: 8 }}>
                  {roots.map((category) => <RootRow key={category.id} category={category}
                    meta={categoryMeta(categories, category)}
                    selected={category.id === rootId} onPress={() => showRoot(category.id)} />)}
                </View>
              </ScrollView>}
          </View>
        </View>}

        <View style={{ borderTopWidth: 1, borderColor: c.line, paddingHorizontal: 18, paddingTop: 12,
          flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable accessibilityRole="button"
            disabled={selectionOnly && (searching || !activeRoot)}
            accessibilityState={{ disabled: selectionOnly && (searching || !activeRoot) }}
            accessibilityLabel={selectionOnly ? 'Bu kateqoriyanı seç' : !searching && activeRoot ? `${activeRoot.name}: məhsullara bax` : 'Bütün məhsullara bax'}
            onPress={() => select(searching ? undefined : activeRoot?.slug)}
            style={({ pressed }) => ({ flex: 1, minHeight: 50, borderRadius: 15, paddingHorizontal: 14, paddingVertical: 12,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: selectionOnly && (searching || !activeRoot) ? .5 : 1, backgroundColor: pressed ? c.brandStrong : c.brand })}>
            <Text style={{ color: c.surface, fontSize: 14, lineHeight: 20, fontWeight: '800', flexShrink: 1, textAlign: 'center' }}>
              {selectionOnly ? activeRoot && !searching ? 'Bu kateqoriyanı seç' : 'Kateqoriya seçin' : !searching && activeRoot ? categoryShortName(activeRoot) + ' məhsullarına bax' : 'Bütün məhsullara bax'}
            </Text>
            <ArrowRight size={18} color={c.surface} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
