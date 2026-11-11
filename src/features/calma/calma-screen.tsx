import { useKeepAwake } from 'expo-keep-awake';
import { router, useIsFocused } from 'expo-router';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { color } from '@/theme';
import { Aparecer, Presionable, Segmented } from '@/ui';

import { Quietud } from './quietud';
import { Respiracion } from './respiracion';

type Ejercicio = 'respirar' | 'quietud';

/**
 * Calma: pantalla completa, sin pestañas ni datos del consultorio, para pasarle el teléfono a un
 * paciente. Dos ejercicios breves: respiración guiada 4-4-6 y quietud con el sismógrafo.
 */
export function CalmaScreen() {
  // Mientras Calma está abierta la pantalla no se apaga (expo-keep-awake viene con Expo).
  useKeepAwake();
  const visible = useIsFocused();
  const [ejercicio, setEjercicio] = useState<Ejercicio>('respirar');

  const cerrar = () => (router.canGoBack() ? router.back() : router.replace('/ajustes'));

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <Aparecer orden={0} className="flex-row items-center justify-between px-3 pt-1">
        <Presionable
          accessibilityRole="button"
          accessibilityLabel="Cerrar Calma"
          onPress={cerrar}
          contentClassName="h-11 w-11 items-center justify-center rounded-full">
          <XIcon size={22} color={color.ink} />
        </Presionable>
        <Segmented
          accessibilityLabel="Ejercicio"
          options={[
            { valor: 'respirar', etiqueta: 'Respirar' },
            { valor: 'quietud', etiqueta: 'Quietud' },
          ]}
          value={ejercicio}
          onChange={setEjercicio}
        />
      </Aparecer>

      {/* Cambiar de ejercicio desmonta el otro (la respiración se detiene, el sensor se suelta) y el nuevo entra en cascada. */}
      <View key={ejercicio} className="flex-1">
        {ejercicio === 'respirar' ? <Respiracion /> : <Quietud visible={visible} />}
      </View>
    </SafeAreaView>
  );
}
