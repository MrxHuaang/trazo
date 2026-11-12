import { TabList, TabSlot, TabTrigger, Tabs, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import type { Icon } from 'phosphor-react-native';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { HandHeartIcon } from 'phosphor-react-native/src/icons/HandHeart';
import { SunIcon } from 'phosphor-react-native/src/icons/Sun';
import { UsersThreeIcon } from 'phosphor-react-native/src/icons/UsersThree';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { color, radius, space, tile } from '@/theme';
import { Text } from '@/ui';

/** Versión web (página de reservas y vista previa): barra inferior propia con el estilo de la app. */
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <TabBar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton label="Hoy" icon={SunIcon} />
          </TabTrigger>
          <TabTrigger name="agenda" href="/agenda" asChild>
            <TabButton label="Agenda" icon={CalendarBlankIcon} />
          </TabTrigger>
          <TabTrigger name="pacientes" href="/pacientes" asChild>
            <TabButton label="Pacientes" icon={UsersThreeIcon} />
          </TabTrigger>
          <TabTrigger name="solidario" href="/solidario" asChild>
            <TabButton label="Solidario" icon={HandHeartIcon} />
          </TabTrigger>
        </TabBar>
      </TabList>
    </Tabs>
  );
}

function TabBar(props: TabListProps) {
  return <View {...props} style={styles.bar} />;
}

type TabButtonProps = TabTriggerSlotProps & { label: string; icon: Icon };

function TabButton({ label, icon: IconComponent, isFocused, ...props }: TabButtonProps) {
  const tint = isFocused ? color.accent : color.inkSoft;
  // TabTrigger (asChild) entrega props de Pressable; su `ref` está tipado para otro elemento.
  return (
    <Pressable {...(props as PressableProps)} style={styles.button}>
      <View style={styles.inner}>
        <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
          <IconComponent size={22} color={tint} weight={isFocused ? 'fill' : 'regular'} />
        </View>
        <Text variant="caption" tone={tint}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingTop: space.sm,
    paddingBottom: space.md,
    backgroundColor: color.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
  },
  button: { flex: 1 },
  inner: { alignItems: 'center', gap: 2 },
  iconWrap: { paddingHorizontal: space.lg, paddingVertical: 4, borderRadius: radius.pill },
  iconWrapActive: { backgroundColor: tile.consulta.bg },
});
