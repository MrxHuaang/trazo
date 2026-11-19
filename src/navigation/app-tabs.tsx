import { NativeTabs } from 'expo-router/native-tabs';

import { color, tile } from '@/theme';

// Pestañas nativas: SF Symbols en iOS (Liquid Glass desde iOS 26) y Material Symbols en Android.
export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={color.surface}
      tintColor={color.accent}
      labelVisibilityMode="labeled"
      indicatorColor={tile.consulta.bg}
      iconColor={{ default: color.inkSoft, selected: color.accent }}
      labelStyle={{ default: { color: color.inkSoft }, selected: { color: color.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Hoy</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} md="today" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="agenda">
        <NativeTabs.Trigger.Label>Agenda</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pacientes">
        <NativeTabs.Trigger.Label>Pacientes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="solidario">
        <NativeTabs.Trigger.Label>Solidario</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'heart', selected: 'heart.fill' }} md="volunteer_activism" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
