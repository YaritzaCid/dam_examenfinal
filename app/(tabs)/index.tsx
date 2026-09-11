import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useMemo, useState } from 'react';
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

const WEATHER_OPTIONS = ['Soleado', 'Nublado', 'Lluvia', 'Viento', 'Niebla'] as const;

type Weather = (typeof WEATHER_OPTIONS)[number];

type PreparedSighting = {
  birdName: string;
  count: number;
  observedAt: string;
  weather: Weather | '';
  location: string;
  notes: string;
  hasPhoto: boolean;
};

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
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationText, setLocationText] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [weather, setWeather] = useState<Weather | ''>('');
  const [birdName, setBirdName] = useState('');
  const [observedAt, setObservedAt] = useState(() => observedAtFormatter.format(new Date()));
  const [count, setCount] = useState('1');
  const [notes, setNotes] = useState('');
  const [preparedSighting, setPreparedSighting] = useState<PreparedSighting | null>(null);
  const [formError, setFormError] = useState('');

  const countNumber = Number.parseInt(count, 10);
  const canPrepare = birdName.trim().length > 0 && Number.isFinite(countNumber) && countNumber > 0;

  const fieldCompleteness = useMemo(() => {
    const fields = [photoUri, locationText, weather, birdName, observedAt, count, notes];
    const completed = fields.filter((value) => String(value).trim().length > 0).length;

    return `${completed}/${fields.length}`;
  }, [birdName, count, locationText, notes, observedAt, photoUri, weather]);

  const pickPhoto = async () => {
    setFormError('');

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setFormError('Activa permiso de fotos para añadir evidencia.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const fillCurrentLocation = async () => {
    setLocationError('');
    setFormError('');
    setIsLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocationError('Permiso de ubicación denegado.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocationText(
        `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`
      );
    } catch {
      setLocationError('No se pudo leer la ubicación. Puedes escribirla manualmente.');
    } finally {
      setIsLocating(false);
    }
  };

  const prepareSighting = () => {
    if (!canPrepare) {
      setPreparedSighting(null);
      setFormError('Nombre de ave y cantidad válida son obligatorios.');
      return;
    }

    setFormError('');
    setPreparedSighting({
      birdName: birdName.trim(),
      count: countNumber,
      observedAt: observedAt.trim(),
      weather,
      location: locationText.trim(),
      notes: notes.trim(),
      hasPhoto: Boolean(photoUri),
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Seleccionar fotografía del avistamiento"
                onPress={pickPhoto}
                style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoGlyph}>◒</Text>
                    <Text style={styles.photoTitle}>Fotografía</Text>
                    <Text style={styles.photoHint}>Toca para añadir imagen</Text>
                  </View>
                )}
              </Pressable>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre de ave</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={setBirdName}
                placeholder="Ej. Garza real"
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
              <Text style={styles.label}>Ubicación</Text>
              <View style={styles.locationStack}>
                <TextInput
                  multiline
                  onChangeText={setLocationText}
                  placeholder="Coordenadas o punto de referencia"
                  placeholderTextColor={palette.placeholder}
                  style={[styles.input, styles.locationInput]}
                  value={locationText}
                />
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
                    <Text style={styles.smallButtonText}>GPS</Text>
                  )}
                </Pressable>
              </View>
              {locationError ? <Text style={styles.helperError}>{locationError}</Text> : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Clima</Text>
              <View style={styles.weatherGrid}>
                {WEATHER_OPTIONS.map((option) => {
                  const selected = weather === option;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={option}
                      onPress={() => setWeather(option)}
                      style={({ pressed }) => [
                        styles.weatherChip,
                        selected && styles.weatherChipSelected,
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        style={[
                          styles.weatherChipText,
                          selected && styles.weatherChipTextSelected,
                        ]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
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
              onPress={prepareSighting}
              style={({ pressed }) => [
                styles.primaryButton,
                !canPrepare && styles.primaryButtonDisabled,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.primaryButtonText}>Preparar registro</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.summaryCard, !preparedSighting && styles.summaryCardQuiet]}>
          <Text style={[styles.summaryKicker, !preparedSighting && styles.summaryKickerQuiet]}>
            {preparedSighting ? 'Registro listo' : 'Previsualización'}
          </Text>
          <Text style={[styles.summaryTitle, !preparedSighting && styles.summaryTitleQuiet]}>
            {preparedSighting?.birdName || 'Completa el avistamiento'}
          </Text>
          <Text style={[styles.summaryText, !preparedSighting && styles.summaryTextQuiet]}>
            {preparedSighting
              ? `${preparedSighting.count} ejemplar(es) · ${preparedSighting.observedAt}`
              : 'Este espacio permanece fijo para que la vista no salte al preparar el registro.'}
          </Text>
          <Text style={[styles.summaryText, !preparedSighting && styles.summaryTextQuiet]}>
            {preparedSighting
              ? `${preparedSighting.weather || 'Clima sin indicar'} · ${
                  preparedSighting.location || 'Ubicación sin indicar'
                } · ${preparedSighting.hasPhoto ? 'Con fotografía' : 'Sin fotografía'}`
              : 'Sin desplazamiento automático. Sin rebote.'}
          </Text>
          {preparedSighting?.notes ? (
            <Text style={styles.summaryNotes}>{preparedSighting.notes}</Text>
          ) : null}
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
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weatherChip: {
    backgroundColor: '#F4F1E4',
    borderColor: palette.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  weatherChipSelected: {
    backgroundColor: palette.mist,
    borderColor: palette.kingfisher,
  },
  weatherChipText: {
    color: palette.reed,
    fontFamily: typefaces.utility,
    fontSize: 13,
    fontWeight: '700',
  },
  weatherChipTextSelected: {
    color: palette.ink,
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
