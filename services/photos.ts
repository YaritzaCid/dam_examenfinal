import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

export async function persistSightingPhoto(temporaryUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return temporaryUri;
  }

  try {
    const sightingsDirectory = new Directory(Paths.document, 'sightings');
    sightingsDirectory.create({ idempotent: true, intermediates: true });

    const source = new File(temporaryUri);
    const destination = new File(
      sightingsDirectory,
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}${source.extension || '.jpg'}`
    );

    await source.copy(destination);
    return destination.uri;
  } catch {
    throw new Error(
      'No se pudo guardar la fotografía de forma permanente. Intenta guardar nuevamente.'
    );
  }
}
