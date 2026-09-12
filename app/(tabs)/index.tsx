import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { fetchWeatherForLocation, type WeatherSummary } from '@/services/weather';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type SightingLocation = {
  latitude: number;
  longitude: number;
};

export interface BirdSighting {
  id: string;
  photoUri: string;
  latitude: number;
  longitude: number;
  birdName: string;
  observedAt: string;
  count: number;
  notes: string;
  weather?: WeatherSummary;
  createdAt: string;
}

const observedAtFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const palette = {
  shell: '#EAF1EC',
  card: '#FBF7ED',
  ink: '#26324A',
  reed: '#5E7740',
  kingfisher: '#158C9D',
  mist: '#B8E3E0',
  berry: '#B2456E',
  lichen: '#D9E6CB',
  line: '#BCD0C5',
  muted: '#67746E',
  placeholder: '#7C857E',
  errorBg: '#F3D7D0',
  errorInk: '#8D2D3C',
} as const;

const typefaces = {
  display: Platform.select({
    ios: 'Avenir Next Condensed',
    android: 'sans-serif-condensed',
    default: 'sans-serif-condensed',
    web: "'Avenir Next Condensed', 'Arial Narrow', system-ui, sans-serif",
  }),
  body: Platform.select({
    ios: 'Iowan Old Style',
    android: 'serif',
    default: 'serif',
    web: "Iowan Old Style, Georgia, 'Times New Roman', serif",
  }),
  utility: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
    web: 'SFMono-Regular, Menlo, Consolas, monospace',
  }),
} as const;

export default function HomeScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [location, setLocation] = useState<SightingLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [birdName, setBirdName] = useState('');
  const [observedAt, setObservedAt] = useState(() => observedAtFormatter.format(new Date()));
  const [count, setCount] = useState('1');
  const [notes, setNotes] = useState('');
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [preparedSighting, setPreparedSighting] = useState<BirdSighting | null>(null);
  const [formError, setFormError] = useState('');

  const countNumber = Number(count);
  const hasValidCount = Number.isInteger(countNumber) && countNumber >= 1;
  const requiredComplete =
    Boolean(photoUri) &&
    Boolean(location) &&
    birdName.trim().length > 0 &&
    observedAt.trim().length > 0 &&
    hasValidCount;

  const fieldCompleteness = useMemo(() => {
    const fields = [photoUri, location, birdName, observedAt, count, notes];
    const completed = fields.filter((value) => String(value ?? '').trim().length > 0).length;

    return `${completed}/${fields.length}`;
  }, [birdName, count, location, notes, observedAt, photoUri]);

  const fillCurrentLocation = useCallback(async () => {
    setLocationError('');
    setFormError('');
    setIsLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocation(null);
        setLocationError('Permiso de ubicación denegado. Actívalo para registrar latitud y longitud.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      setLocationError('No se pudo obtener la ubicación GPS. Intenta de nuevo.');
    } finally {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    void fillCurrentLocation();
  }, [fillCurrentLocation]);
  useEffect(() => {
    let isActive = true;

    if (!location) {
      setWeather(null);
      setWeatherError('');
      setIsWeatherLoading(false);
      return;
    }

    setWeather(null);
    setWeatherError('');
    setIsWeatherLoading(true);

    fetchWeatherForLocation(location.latitude, location.longitude)
      .then((nextWeather) => {
        if (isActive) {
          setWeather(nextWeather);
        }
      })
      .catch(() => {
        if (isActive) {
          setWeatherError('No se pudo obtener el clima. Puedes guardar el avistamiento sin clima.');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsWeatherLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [location]);

  const openCamera = async () => {
    setFormError('');
    setIsCameraReady(false);

    if (cameraPermission?.granted) {
      setIsCameraOpen(true);
      return;
    }

    const permission = await requestCameraPermission();

    if (!permission.granted) {
      setFormError('Permiso de cámara denegado. Actívalo para tomar la fotografía obligatoria.');
      return;
    }

    setIsCameraOpen(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current || !isCameraReady) {
      setFormError('Espera a que la cámara esté lista antes de tomar la fotografía.');
      return;
    }

    setFormError('');
    setIsTakingPhoto(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });

      if (!photo?.uri) {
        setFormError('No se pudo guardar la fotografía tomada. Intenta de nuevo.');
        return;
      }

      setPhotoUri(photo.uri);
      setIsCameraOpen(false);
    } catch {
      setFormError('No se pudo tomar la fotografía. Intenta de nuevo.');
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const validateSighting = () => {
    const errors: string[] = [];

    if (!photoUri) {
      errors.push('Falta la fotografía tomada con la cámara.');
    }

    if (!location) {
      errors.push('Falta la ubicación GPS con latitud y longitud.');
    }

    if (birdName.trim().length === 0) {
      errors.push('Falta el nombre del ave. Puedes escribir "no identificada".');
    }

    if (observedAt.trim().length === 0) {
      errors.push('Falta la fecha y hora del avistamiento.');
    }

    if (!hasValidCount) {
      errors.push('La cantidad de ejemplares debe ser un número entero mínimo 1.');
    }

    return errors;
  };

  const saveSighting = () => {
    const validationErrors = validateSighting();

    if (validationErrors.length > 0) {
      setPreparedSighting(null);
      setFormError(validationErrors.join('\n'));
      return;
    }

    const trimmedBirdName = birdName.trim();
    const trimmedObservedAt = observedAt.trim();

    if (!photoUri || !location || !trimmedBirdName || !trimmedObservedAt || !hasValidCount) {
      return;
    }

    setFormError('');
    setPreparedSighting({
      id: `${Date.now()}`,
      photoUri,
      latitude: location.latitude,
      longitude: location.longitude,
      birdName: trimmedBirdName,
      observedAt: trimmedObservedAt,
      count: countNumber,
      notes: notes.trim(),
      weather: weather ?? undefined,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        alwaysBounceVertical={false}
        automaticallyAdjustContentInsets={false}
        automaticallyAdjustKeyboardInsets={false}
        bounces={false}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.scroller}>
        <View style={styles.hero}>
          <View style={styles.sunDisc} />
          <View style={styles.flightLine}>
            <View style={styles.flightDot} />
            <View style={[styles.flightDot, styles.flightDotMiddle]} />
            <View style={styles.flightDot} />
          </View>
          <View style={styles.logoBadge}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
              contentFit="cover"
            />
          </View>
          <Text style={styles.eyebrow}>birdtacora</Text>
          <Text style={styles.title}>Nuevo avistamiento</Text>
          <Text style={styles.subtitle}>
            Registra evidencia, sitio y condiciones antes de que el ave vuelva al dosel.
          </Text>
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>{fieldCompleteness} campos</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formSpine}>
            <Text style={styles.spineText}>AV-01</Text>
          </View>

          <View style={styles.formBody}>
            <View style={styles.photoSection}>
              {isCameraOpen && cameraPermission?.granted ? (
                <View style={styles.cameraFrame}>
                  <CameraView
                    ref={cameraRef}
                    active={isCameraOpen}
                    facing="back"
                    onCameraReady={() => setIsCameraReady(true)}
                    style={styles.cameraPreview}
                  />
                  <View style={styles.cameraOverlay}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isTakingPhoto}
                      onPress={takePhoto}
                      style={({ pressed }) => [
                        styles.primaryButton,
                        isTakingPhoto && styles.disabledButton,
                        pressed && styles.pressed,
                      ]}>
                      {isTakingPhoto ? (
                        <ActivityIndicator color={palette.card} size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Tomar foto</Text>
                      )}
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isTakingPhoto}
                      onPress={() => setIsCameraOpen(false)}
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        isTakingPhoto && styles.disabledButton,
                        pressed && styles.pressed,
                      ]}>
                      <Text style={styles.secondaryButtonText}>Cerrar cámara</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abrir cámara para tomar fotografía del avistamiento"
                  onPress={openCamera}
                  style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}>
                  {photoUri ? (
                    <View>
                      <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
                      <View style={styles.photoRetakeBadge}>
                        <Text style={styles.photoRetakeText}>Tocar para tomar otra foto</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Text style={styles.photoGlyph}>◒</Text>
                      <Text style={styles.photoTitle}>Fotografía</Text>
                      <Text style={styles.photoHint}>Toca para abrir cámara</Text>
                    </View>
                  )}
                </Pressable>
              )}
              {cameraPermission?.granted === false ? (
                <Text style={styles.helperError}>Permiso de cámara denegado. Puedes volver a tocar para solicitarlo.</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre de ave</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={setBirdName}
                placeholder="Ej. Garza real o no identificada"
                placeholderTextColor={palette.placeholder}
                style={styles.input}
                value={birdName}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.flexField]}>
                <Text style={styles.label}>Fecha y hora</Text>
                <View style={styles.inlineInput}>
                  <TextInput
                    onChangeText={setObservedAt}
                    placeholder="Fecha y hora"
                    placeholderTextColor={palette.placeholder}
                    style={[styles.input, styles.inlineTextInput]}
                    value={observedAt}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setObservedAt(observedAtFormatter.format(new Date()))}
                    style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}>
                    <Text style={styles.smallButtonText}>Ahora</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.countField}>
                <Text style={styles.label}>Ejemplares</Text>
                <TextInput
                  inputMode="numeric"
                  keyboardType="number-pad"
                  onChangeText={setCount}
                  placeholder="1"
                  placeholderTextColor={palette.placeholder}
                  style={[styles.input, styles.countInput]}
                  value={count}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Latitud y longitud</Text>
              <View style={styles.locationStack}>
                <View style={[styles.input, styles.locationInput]}>
                  <Text style={styles.locationValue}>
                    {location
                      ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                      : isLocating
                        ? 'Obteniendo ubicación GPS...'
                        : 'Sin ubicación GPS'}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={isLocating}
                  onPress={fillCurrentLocation}
                  style={({ pressed }) => [
                    styles.smallButton,
                    isLocating && styles.disabledButton,
                    pressed && styles.pressed,
                  ]}>
                  {isLocating ? (
                    <ActivityIndicator color={palette.card} size="small" />
                  ) : (
                    <Text style={styles.smallButtonText}>Actualizar GPS</Text>
                  )}
                </Pressable>
              </View>
              {locationError ? (
                <Text style={styles.helperError}>{locationError}</Text>
              ) : (
                <Text style={styles.helperText}>Se intenta obtener automáticamente al abrir el formulario.</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Clima</Text>
              <View style={styles.weatherCard}>
                {isWeatherLoading ? (
                  <View style={styles.weatherStatusRow}>
                    <ActivityIndicator color={palette.kingfisher} size="small" />
                    <Text style={styles.weatherDetails}>Consultando Open-Meteo...</Text>
                  </View>
                ) : weather ? (
                  <>
                    <Text style={styles.weatherCondition}>{weather.condition}</Text>
                    <Text style={styles.weatherDetails}>
                      {weather.temperatureCelsius.toFixed(1)} °C · Humedad {weather.relativeHumidity}%
                    </Text>
                  </>
                ) : (
                  <Text style={styles.weatherDetails}>
                    {location ? 'Clima no disponible.' : 'Se consultará cuando exista GPS.'}
                  </Text>
                )}
              </View>
              {weatherError ? <Text style={styles.helperError}>{weatherError}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notas</Text>
              <TextInput
                multiline
                onChangeText={setNotes}
                placeholder="Comportamiento, canto, marcas o hábitat observado"
                placeholderTextColor={palette.placeholder}
                style={[styles.input, styles.notesInput]}
                textAlignVertical="top"
                value={notes}
              />
            </View>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <Pressable
              accessibilityRole="button"
              onPress={saveSighting}
              style={({ pressed }) => [
                styles.primaryButton,
                !requiredComplete && styles.primaryButtonDisabled,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.primaryButtonText}>Guardar</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.summaryCard, !preparedSighting && styles.summaryCardQuiet]}>
          <Text style={[styles.summaryKicker, !preparedSighting && styles.summaryKickerQuiet]}>
            {preparedSighting ? 'Registro construido' : 'Previsualización'}
          </Text>
          <Text style={[styles.summaryTitle, !preparedSighting && styles.summaryTitleQuiet]}>
            {preparedSighting?.birdName || 'Completa el avistamiento'}
          </Text>
          <Text style={[styles.summaryText, !preparedSighting && styles.summaryTextQuiet]}>
            {preparedSighting
              ? `${preparedSighting.count} ejemplar(es) · ${preparedSighting.observedAt}`
              : 'Guardar construirá el objeto RF-02 sin AsyncStorage, listado ni detalle.'}
          </Text>
          <Text style={[styles.summaryText, !preparedSighting && styles.summaryTextQuiet]}>
            {preparedSighting
              ? `GPS ${preparedSighting.latitude.toFixed(6)}, ${preparedSighting.longitude.toFixed(
                  6
                )} · Con fotografía`
              : 'La foto debe venir de cámara y la ubicación desde GPS.'}
          </Text>
          <Text style={[styles.summaryText, !preparedSighting && styles.summaryTextQuiet]}>
            {preparedSighting
              ? preparedSighting.weather
                ? `Clima ${preparedSighting.weather.condition} · ${preparedSighting.weather.temperatureCelsius.toFixed(
                    1
                  )} °C · Humedad ${preparedSighting.weather.relativeHumidity}%`
                : 'Clima no disponible; registro guardable igualmente'
              : 'El clima se consulta con Open-Meteo al tener GPS.'}
          </Text>
          {preparedSighting?.notes ? <Text style={styles.summaryNotes}>{preparedSighting.notes}</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.shell,
  },
  scroller: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 18,
    paddingBottom: 230,
  },
  hero: {
    backgroundColor: palette.ink,
    borderRadius: 30,
    overflow: 'hidden',
    padding: 28,
    paddingTop: 34,
    minHeight: 248,
    justifyContent: 'flex-end',
  },
  sunDisc: {
    position: 'absolute',
    right: -28,
    top: -24,
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: palette.mist,
    opacity: 0.82,
  },
  flightLine: {
    position: 'absolute',
    right: 30,
    top: 46,
    flexDirection: 'row',
    gap: 14,
    transform: [{ rotate: '-18deg' }],
  },
  flightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.berry,
    opacity: 0.82,
  },
  flightDotMiddle: {
    marginTop: 18,
  },
  logoBadge: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: 'rgba(184, 227, 224, 0.54)',
    borderRadius: 26,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#0C1623',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    width: 52,
  },
  logo: {
    borderRadius: 20,
    height: 42,
    width: 42,
  },
  eyebrow: {
    color: palette.mist,
    fontFamily: typefaces.utility,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.card,
    fontFamily: typefaces.display,
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 48,
    marginTop: 10,
    maxWidth: 280,
  },
  subtitle: {
    color: '#DCECE7',
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 330,
  },
  progressPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(184, 227, 224, 0.18)',
    borderColor: 'rgba(184, 227, 224, 0.38)',
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  progressText: {
    color: palette.card,
    fontFamily: typefaces.utility,
    fontSize: 12,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 18,
    overflow: 'hidden',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 4,
  },
  formSpine: {
    alignItems: 'center',
    backgroundColor: palette.kingfisher,
    justifyContent: 'center',
    width: 42,
  },
  spineText: {
    color: palette.card,
    fontFamily: typefaces.utility,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    transform: [{ rotate: '-90deg' }],
    width: 72,
  },
  formBody: {
    flex: 1,
    gap: 18,
    padding: 18,
  },
  photoSection: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  photoButton: {
    backgroundColor: palette.lichen,
    borderColor: palette.line,
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 188,
    overflow: 'hidden',
  },
  photoPreview: {
    height: '100%',
    width: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  photoGlyph: {
    color: palette.berry,
    fontSize: 48,
    lineHeight: 54,
  },
  photoTitle: {
    color: palette.ink,
    fontFamily: typefaces.display,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 6,
  },
  photoHint: {
    color: palette.muted,
    fontFamily: typefaces.body,
    fontSize: 13,
    marginTop: 4,
  },
  cameraFrame: {
    backgroundColor: palette.ink,
    borderRadius: 24,
    minHeight: 260,
    overflow: 'hidden',
  },
  cameraPreview: {
    minHeight: 260,
  },
  cameraOverlay: {
    bottom: 14,
    gap: 10,
    left: 14,
    position: 'absolute',
    right: 14,
  },
  photoRetakeBadge: {
    backgroundColor: 'rgba(38, 50, 74, 0.82)',
    borderRadius: 999,
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
  },
  photoRetakeText: {
    color: palette.card,
    fontFamily: typefaces.utility,
    fontSize: 11,
    fontWeight: '800',
  },
  fieldGroup: {
    gap: 8,
  },
  row: {
    gap: 14,
  },
  flexField: {
    flex: 1,
  },
  countField: {
    gap: 8,
  },
  label: {
    color: palette.reed,
    fontFamily: typefaces.utility,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.35,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F4F1E4',
    borderColor: palette.line,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.ink,
    fontFamily: typefaces.body,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  inlineInput: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  inlineTextInput: {
    flex: 1,
  },
  locationStack: {
    gap: 8,
  },
  locationInput: {
    minHeight: 72,
  },
  locationValue: {
    color: palette.ink,
    fontFamily: typefaces.body,
    fontSize: 16,
    lineHeight: 22,
  },
  smallButton: {
    alignItems: 'center',
    backgroundColor: palette.ink,
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 66,
    paddingHorizontal: 14,
  },
  smallButtonText: {
    color: palette.card,
    fontFamily: typefaces.utility,
    fontSize: 13,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.7,
  },
  countInput: {
    textAlign: 'center',
  },
  weatherCard: {
    backgroundColor: '#F4F1E4',
    borderColor: palette.line,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    minHeight: 72,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  weatherStatusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  weatherCondition: {
    color: palette.ink,
    fontFamily: typefaces.display,
    fontSize: 22,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  weatherDetails: {
    color: palette.muted,
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
  },
  notesInput: {
    minHeight: 118,
  },
  helperError: {
    color: palette.errorInk,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
  },
  helperText: {
    color: palette.muted,
    fontFamily: typefaces.body,
    fontSize: 13,
    lineHeight: 18,
  },
  formError: {
    backgroundColor: palette.errorBg,
    borderRadius: 14,
    color: palette.errorInk,
    fontFamily: typefaces.body,
    fontSize: 14,
    fontWeight: '700',
    padding: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: palette.berry,
    borderRadius: 20,
    minHeight: 56,
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: palette.card,
    fontFamily: typefaces.display,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  secondaryButtonText: {
    color: palette.ink,
    fontFamily: typefaces.utility,
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  summaryCard: {
    backgroundColor: palette.ink,
    borderRadius: 26,
    marginTop: 18,
    marginBottom: 56,
    minHeight: 208,
    padding: 22,
  },
  summaryCardQuiet: {
    backgroundColor: palette.lichen,
    borderColor: palette.line,
    borderWidth: 1,
  },
  summaryKicker: {
    color: palette.mist,
    fontFamily: typefaces.utility,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  summaryKickerQuiet: {
    color: palette.reed,
  },
  summaryTitle: {
    color: palette.card,
    fontFamily: typefaces.display,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 8,
  },
  summaryTitleQuiet: {
    color: palette.ink,
  },
  summaryText: {
    color: '#DCECE7',
    fontFamily: typefaces.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  summaryTextQuiet: {
    color: palette.muted,
  },
  summaryNotes: {
    color: palette.card,
    fontFamily: typefaces.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
  },
});
