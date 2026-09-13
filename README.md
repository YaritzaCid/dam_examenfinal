# AvistAves / birdtacora

Aplicación móvil en Expo para registrar avistamientos de aves con evidencia fotográfica, coordenadas GPS, clima y persistencia local.

## Estado del proyecto

- Framework: Expo SDK 57.
- React Native: 0.86.3.
- React: 19.2.3.
- Navegación: Expo Router.
- Package manager: Bun.
- Persistencia local: `@react-native-async-storage/async-storage`.
- Fotografías persistentes: `expo-file-system` con `Paths.document`.
- Cámara: `expo-camera`.
- Ubicación: `expo-location`.
- Clima: Open-Meteo.

## Requisitos

- Bun instalado.
- Node compatible con Expo SDK 57.
- Expo Go compatible con SDK 57 instalado en el celular.
- Dispositivo real recomendado para probar cámara y GPS.

No uses `npm install`, `yarn install` ni `pnpm install` en este proyecto. Mantén `bun.lock` como único lockfile.

## Instalación

```sh
bun install
```

## Ejecutar en desarrollo

```sh
bunx expo start
```

Opciones comunes:

```sh
bunx expo start --android
bunx expo start --ios
bunx expo start --web
```

Para probar en Expo Go:

1. Ejecuta `bunx expo start`.
2. Escanea el QR con Expo Go.
3. Abre la app en un celular real.
4. Acepta permisos de cámara y ubicación cuando corresponda.

## Scripts útiles

```sh
bunx expo lint
bunx tsc --noEmit
bunx expo-doctor@latest
bunx expo install --fix
```

`package.json` también incluye:

```sh
bun run start
bun run android
bun run ios
bun run web
bun run lint
```

## Funcionalidades implementadas

### RF-01: Registro de avistamiento

Pantalla `Registrar`.

Datos manejados:

- Fotografía obligatoria tomada desde cámara del dispositivo.
- Latitud y longitud obligatorias obtenidas por GPS.
- Nombre del ave obligatorio; permite valores como `no identificada`.
- Fecha y hora asignadas automáticamente al crear el registro, editables por el usuario.
- Cantidad de ejemplares obligatoria, numérica y mínimo 1.
- Notas opcionales.

Validaciones antes de guardar:

- No permite guardar sin fotografía.
- No permite guardar sin ubicación.
- No permite guardar sin nombre del ave.
- No permite guardar sin fecha/hora.
- No permite guardar cantidad inválida.

Después de un guardado exitoso:

- Se muestra una confirmación clara.
- Al aceptar la confirmación, la app vuelve automáticamente al listado de `Avistamientos`.

No se permite:

- Selección desde galería.
- Coordenadas manuales.

### Permisos de cámara y ubicación

La app maneja permisos denegados y bloqueados en Android:

- Si Android aún permite solicitar el permiso, se muestra el diálogo normal del sistema.
- Si el usuario rechaza, se muestra un mensaje claro en el formulario.
- Si Android ya no permite volver a solicitar el permiso (`canAskAgain === false`), se muestra un `Alert` con:
  - `Cancelar`
  - `Abrir configuración`
- `Abrir configuración` usa `Linking.openSettings()` para llevar al usuario a los ajustes de la app.
- Al volver desde Configuración, la app revalida permisos con `AppState`.

### RF-02: Clima

Al obtener GPS, la app consulta Open-Meteo.

Muestra:

- Temperatura en °C.
- Humedad relativa.
- Condición representada desde `weather_code` mediante texto en español e icono meteorológico.

El clima es opcional para guardar:

- Si Open-Meteo falla o tarda demasiado, el avistamiento sigue siendo guardable.

### RF-03: Listado de avistamientos

Pantalla `Avistamientos`.

Muestra registros guardados con:

- Miniatura de fotografía.
- Nombre del ave.
- Fecha.
- Temperatura o `Sin clima`.

Incluye:

- Estado de carga.
- Estado vacío.
- Manejo de errores de lectura.
- Orden por más recientes.
- Orden por nombre A-Z.
- Botón `Nuevo` hacia formulario.

### RF-04: Detalle de avistamiento

Ruta dinámica:

```txt
app/sighting/[id].tsx
```

Muestra:

- Foto grande.
- Nombre del ave.
- Fecha/hora.
- Cantidad.
- Notas.
- Coordenadas.
- Clima legible con texto e icono meteorológico si existe.
- Dirección aproximada mediante reverse geocoding si el permiso de ubicación está disponible.

Maneja:

- Carga.
- Registro no encontrado.
- Error de lectura.
- Permiso de ubicación denegado para dirección.

### RF-05: Persistencia local

Servicios:

```txt
services/storage.ts
services/photos.ts
```

Usa AsyncStorage para:

- Guardar los datos de los avistamientos.
- Leer todos los avistamientos.
- Leer un avistamiento por `id`.

Antes de guardar el avistamiento, `services/photos.ts` copia la fotografía temporal a la carpeta `sightings` dentro de `Paths.document` mediante `expo-file-system`. La URI permanente resultante se guarda en `BirdSighting.photoUri`.

En web se conserva la URI entregada por la cámara y no se intenta usar almacenamiento nativo. Si la copia permanente falla en móvil, el avistamiento no se guarda y el formulario queda disponible para reintentar.

El parseo de datos guardados es seguro y evita `any`.

### RF-06: Navegación

La app usa Expo Router para:

- Navegar entre el listado y el formulario mediante los tabs `Avistamientos` y `Registrar`.
- Abrir el formulario desde los botones `Nuevo` y `Registrar avistamiento`.
- Abrir el detalle de cada avistamiento mediante la ruta dinámica `app/sighting/[id].tsx`.
- Volver desde la pantalla de detalle a la pantalla anterior mediante la navegación de Expo Router, de modo que el usuario siempre dispone de una forma de regresar.
- Volver automáticamente al listado después de aceptar la confirmación de guardado.

### Optimización de API Open-Meteo

El servicio `services/weather.ts` incluye:

- Timeout con `AbortController`.
- Caché en memoria por ubicación redondeada durante 10 minutos.

## Estructura relevante

```txt
app/
  _layout.tsx              Layout raíz Expo Router
  (tabs)/
    _layout.tsx            Navegación por tabs
    index.tsx              Listado de avistamientos
    register.tsx           Formulario de registro
  sighting/
    [id].tsx               Detalle de avistamiento
components/
  sighting-card.tsx        Tarjeta del listado
  haptic-tab.tsx           Botón de tab con haptic feedback
  weather-icon.tsx         Icono según código meteorológico
services/
  photos.ts                Persistencia de fotografías
  storage.ts               Persistencia AsyncStorage
  weather.ts               Consulta y caché Open-Meteo
types/
  sighting.ts              Tipos TypeScript del dominio
```

## Configuración Expo

Archivo principal:

```txt
app.json
```

Configuración importante:

- `orientation`: `portrait`.
- `scheme`: `birdtacora`.
- Plugins:
  - `expo-router`
  - `expo-camera`
  - `expo-location`
  - `expo-splash-screen`
  - `expo-font`
  - `expo-image`
  - `expo-status-bar`
  - `expo-web-browser`
- Experimentos:
  - `typedRoutes`
  - `reactCompiler`

Permisos configurados:

- Cámara: “Permite tomar fotografías para documentar avistamientos de aves.”
- Ubicación: “Permite guardar coordenadas del avistamiento mientras usas la app.”

## Cómo probar RF-01 a RF-06 en Expo Go

1. Ejecuta:

   ```sh
   bunx expo start
   ```

2. Abre en Expo Go.
3. Entra en tab `Registrar`.
4. Toca `Fotografía`.
5. Acepta cámara.
6. Toma foto.
7. Acepta ubicación.
8. Pulsa `Actualizar GPS` si no aparece coordenada automática.
9. Completa nombre del ave, fecha/hora, cantidad y notas.
10. Verifica sección `Clima`.
11. Pulsa `Guardar`.
12. Confirma el mensaje de guardado y toca `Aceptar`.
13. Verifica que la app vuelve automáticamente al listado `Avistamientos`.
14. Confirma que aparece la tarjeta.
15. Prueba orden `Más recientes` y `Nombre A-Z`.
16. Toca la tarjeta.
17. Confirma detalle con foto, datos, coordenadas, clima con texto e icono y dirección si está disponible.
18. Cierra y abre la app.
19. Confirma que el registro y su fotografía persisten.

## Cómo probar permisos bloqueados en Android

### Cámara rechazada una vez

1. Borra permiso de cámara desde ajustes de Android o reinstala la app.
2. En `Registrar`, toca `Fotografía`.
3. Deniega permiso.
4. Debe aparecer mensaje en formulario indicando que la cámara es necesaria.
5. Si Android aún permite preguntar, tocar otra vez debe abrir diálogo del sistema.

### Cámara bloqueada permanentemente

1. Deniega cámara hasta que Android ya no muestre el diálogo.
2. Toca `Fotografía`.
3. Debe aparecer un `Alert` con `Cancelar` y `Abrir configuración`.
4. Toca `Abrir configuración`.
5. Habilita cámara.
6. Vuelve a la app.
7. Toca `Fotografía`; debe abrir cámara.

### Ubicación rechazada una vez

1. Borra permiso de ubicación desde ajustes de Android o reinstala la app.
2. En `Registrar`, deniega ubicación cuando se solicite.
3. Debe aparecer mensaje indicando que GPS es necesario.
4. Si Android aún permite preguntar, `Actualizar GPS` debe abrir diálogo del sistema.

### Ubicación bloqueada permanentemente

1. Deniega ubicación hasta que Android ya no muestre el diálogo.
2. Toca `Actualizar GPS`.
3. Debe aparecer un `Alert` con `Cancelar` y `Abrir configuración`.
4. Toca `Abrir configuración`.
5. Habilita ubicación.
6. Vuelve a la app.
7. Toca `Actualizar GPS`; debe obtener coordenadas.

## Validación antes de entregar cambios

Ejecuta:

```sh
bunx expo install --fix
bunx expo-doctor@latest
bunx expo lint
bunx tsc --noEmit
```

Para validar empaquetado web:

```sh
bunx expo export --platform web
rm -rf dist
```

## Notas de mantenimiento

- Mantener dependencias alineadas con Expo SDK 57 usando `bunx expo install --fix`.
- No agregar dependencias si Expo o React Native ya cubren el caso.
- No cambiar RF-01 a RF-06 sin actualizar esta documentación.
- Mantener `types/sighting.ts` como fuente de tipos del dominio.
- Evitar `any`; validar datos externos y persistidos.
