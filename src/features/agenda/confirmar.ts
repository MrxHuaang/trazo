import { Alert, Platform } from 'react-native';

type Opciones = {
  titulo: string;
  mensaje: string;
  aceptar: string;
  cancelar?: string;
  destructiva?: boolean;
};

/** Alert.alert no muestra nada en web, por eso ahí se usa window.confirm. */
export function confirmar({ titulo, mensaje, aceptar, cancelar = 'Volver', destructiva }: Opciones): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(`${titulo}\n\n${mensaje}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      titulo,
      mensaje,
      [
        { text: cancelar, style: 'cancel', onPress: () => resolve(false) },
        { text: aceptar, style: destructiva ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
