# Premios — Códigos Secretos 2026

Catálogo de premios de la campaña tal como lo implementa el frontend.

**Fuente:** `recursos/premios/Calendario de Premios 2026.xlsx`
**Implementación:** `src/mocks/prizes.ts`
**Imágenes:** `recursos/premios/*.png` → `src/assets/prizes/*.webp`

| | |
| --- | --- |
| Tipos de premio | **19** |
| Unidades planificadas | **89** |
| Ventana de campaña | **01/09/2026 → 27/11/2026** |

---

## 1. Los 19 premios

`quantity` son las unidades planificadas para toda la campaña. **No es stock**:
el frontend no descuenta ni decide nada con ese número (ver sección 5).

| # | Nombre visible | Art. | Cant. | ID | Imagen | Origen |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PlayStation 5 | un | 4 | `playstation-5` | `playstation-5.webp` | asset del Figma ⚠️ |
| 2 | Nintendo Switch OLED | una | 4 | `nintendo-switch-oled` | `nintendo-switch-oled.webp` | `Copia de NINTENDO S.png` |
| 3 | Kit volante + pedales | un | 2 | `kit-volante-pedales` | `kit-volante-pedales.webp` | `Copia de VOLANTE.png` |
| 4 | Columpio de jardín | un | 3 | `columpio-jardin` | `columpio-jardin.webp` | `Copia de PARQUE.png` |
| 5 | Cama elástica | una | 5 | `cama-elastica` | `cama-elastica.webp` | `Copia de CAMA ELASTICA.png` |
| 6 | Silla gamer | una | 3 | `silla-gamer` | `silla-gamer.webp` | `Copia de SILLA.png` |
| 7 | Tablet Acer | una | 5 | `tablet-acer` | `tablet-acer.webp` | `Copia de TABLET.png` |
| 8 | Aro de basketball | un | 5 | `aro-basketball` | `aro-basketball.webp` | `Copia de BASKET.png` |
| 9 | Piscina Bestway | una | 5 | `piscina-bestway` | `piscina-bestway.webp` | `Copia de PISCINA.png` |
| 10 | Monopatín Globber | un | 5 | `monopatin-globber` | `monopatin-globber.webp` | `Copia de PATIN.png` |
| 11 | Bicicleta Milano aro 24 | una | 3 | `bicicleta-aro-24` | `bicicleta-aro-24.webp` | `Copia de BICI 1 ARO 24.png` |
| 12 | Speaker JBL Flip 7 | un | 3 | `jbl-flip-7` | `jbl-flip-7.webp` | `Copia de JBL.png` |
| 13 | Bicicleta Milano aro 20 | una | 3 | `bicicleta-aro-20` | `bicicleta-aro-20.webp` | `Copia de BICI 3 ARO 20.png` |
| 14 | Mini Globo Loco Bestway | un | 6 | `mini-globo-loco` | `mini-globo-loco.webp` | `Copia de GLOBO LOCO.png` |
| 15 | Bicicleta Milano aro 16 | una | 3 | `bicicleta-aro-16` | `bicicleta-aro-16.webp` | `Copia de BICI 2.png` |
| 16 | Consola Smartfy Game Boy | una | 6 | `smartfy-game-boy` | `smartfy-game-boy.webp` | `Copia de CONSOLA.png` |
| 17 | Rollers Ferrari | unos | 8 | `rollers-ferrari` | `rollers-ferrari.webp` | `Copia de ROLLERS.png` |
| 18 | Auriculares JBL Tune 520BT | unos | 8 | `auriculares-jbl-520bt` | `auriculares-jbl-520bt.webp` | `Copia de auris.png` |
| 19 | Skate mediano | un | 8 | `skate-mediano` | `skate-mediano.webp` | `Copia de SKATE.png` |
| | | | **89** | | | |

Cada premio tiene además una miniatura en `src/assets/prizes/thumbs/`, con el
mismo nombre, para la tira de navegación de mobile.

### Referencia de producto (hoja PREMIOS)

Es lo que va en el campo `detail`. No se muestra en pantalla: sirve para
identificar el producto exacto en depósito y para QA.

| ID | Producto | Código interno |
| --- | --- | --- |
| `playstation-5` | PlayStation Sony PS5 CFI-2015A con disco, Slim 1TB, Gran Turismo 7 + Astro Bot | — |
| `nintendo-switch-oled` | Consola Nintendo Switch OLED 64 GB | — |
| `kit-volante-pedales` | Kit volante + pedales Logitech G29 Driving Force Racing PS4/PS5 | 941-000111 |
| `columpio-jardin` | Columpio de jardín de tres módulos Intex 144121 | MKP055195 |
| `cama-elastica` | Cama elástica Zensei Level LVF 6FT, 1,83 m | — |
| `silla-gamer` | Silla gamer Empoli EM-G01 roja con reposapiés | MKP050970 |
| `tablet-acer` | Tablet Acer A10-11-K4U7 4 GB / 64 GB / 10" HD, Android 11 | MKP065068 |
| `aro-basketball` | Aro de basketball Level, altura regulable 1,79–2,13 m | — |
| `piscina-bestway` | Piscina Bestway Steel Pro Max 6.473 L, estructura metálica | 56416 |
| `monopatin-globber` | Monopatín Globber Primo azul con luces | MKP054916 |
| `bicicleta-aro-24` | Bicicleta Milano aro 24" 18 vel., azul, MTB Action caballero | — |
| `jbl-flip-7` | Speaker JBL Flip 7 waterproof, negro | 97846-0 |
| `bicicleta-aro-20` | Bicicleta Milano aro 20" BMX Campione, azul | — |
| `mini-globo-loco` | Mini Globo Loco Bestway Ballon | MKP003781 |
| `bicicleta-aro-16` | Bicicleta Milano aro 16" BMX Bambino, roja | 4101208MR |
| `smartfy-game-boy` | Consola Smartfy Game Boy Switch GP01T, blanca | MKP13555 |
| `rollers-ferrari` | Rollers Flashing Wheels Ferrari Movelmax | MKP035990 |
| `auriculares-jbl-520bt` | Auricular JBL Bluetooth Tune 520BT | 47560-0 |
| `skate-mediano` | Skate mediano PT1705 FAS | MKP029323 |

---

## 2. Cómo se leyó el Excel

Las cuatro hojas no son cuatro fuentes equivalentes. La prioridad usada:

| Hoja | Para qué se usó |
| --- | --- |
| `CALENDARIO` | Fecha, hora, orden y cantidad efectiva de eventos. 89 filas. |
| `NOMBRE WEB` | Nombre visible y cantidad por tipo. 19 filas. |
| `PREMIOS` | Descripción completa, modelo, identificación de la imagen. 89 filas. |
| `CANTIDADES` | Auditoría de totales. 19 filas. |

**Las cuatro cierran en 89 unidades y 19 tipos, con las mismas cantidades por
tipo.** El cruce automático está en la sección 6.

### Normalización de nombres

El Excel trae caracteres griegos mezclados con latinos, restos de una
conversión de codificación. Se interpretaron así y **no se reproducen en la
interfaz**:

| En el Excel | Se lee |
| --- | --- |
| `ΜΟΝΟΡΑΤΙN` | MONOPATIN |
| `ΜΙΝI` | MINI |
| `ΒΟΥ` | BOY |
| `ΕΚΚ` | EKK |
| `ΜΚΡ` | MKP |

Los códigos internos (`MKP054916`, `47560-0`, `PT1705`) quedan como metadata:
nunca forman parte del nombre visible.

---

## 3. Inconsistencias detectadas en el Excel

Tres son sólo de nomenclatura. **Las dos primeras pueden ser productos
realmente distintos y hay que confirmarlas con el cliente.**

### 3.1 PlayStation — ⚠️ a confirmar

| Hoja | Dice |
| --- | --- |
| `PREMIOS` / `CALENDARIO` / `NOMBRE WEB` | PS5 **con disco**, Slim 1TB, **Gran Turismo 7 + Astro Bot** |
| `CANTIDADES` | PS5 CFI-2015 1TB Slim **DIGITAL**, **NBA 2K26**, 136006-6 |

No es una diferencia de redacción: una es la edición con lectora de discos y la
otra la digital, y los juegos incluidos son distintos. Se implementó la versión
de `PREMIOS`/`CALENDARIO` (con disco, GT7 + Astro Bot), que es la que coincide
en tres de las cuatro hojas.

### 3.2 Nintendo Switch OLED — ⚠️ a confirmar

| Hoja | Dice |
| --- | --- |
| `PREMIOS` | OLED 64 KB **JP blanco/negro** |
| `CANTIDADES` | OLED 64 GB HEG S KABAA HKG **azul/rojo**, 38344-8 |
| Imagen entregada | Consola **azul/rojo** |

El color no coincide entre hojas, y la foto que entregó el cliente es la
azul/rojo. Se usó la foto entregada. Además, «64 KB» es un error de tipeo en
`PREMIOS` y `NOMBRE WEB`: la consola es de 64 GB, como dice `CANTIDADES`. El
nombre visible evita el dato («Nintendo Switch OLED») para no publicar el error.

### 3.3 Diferencias sólo de nomenclatura

| Producto | `PREMIOS` | `CANTIDADES` |
| --- | --- | --- |
| Skate | `SKU PT1705-- FAS` | `SKU PT-1705-FAS` |
| Tablet | `AND 11` | `AND 1160434` |
| Columpio, silla, monopatín, globo | MKP con letras latinas | MKP con letras griegas |

Ninguna cambia el producto.

---

## 4. Imágenes

18 de los 19 premios tienen foto original en `recursos/premios`. Todas son PNG
con fondo transparente y un halo cian ya incorporado, coherente con el resto de
los assets del Figma; el producto ocupa alrededor del 70 % de un lienzo
cuadrado en todas, así que los 19 pesan visualmente parecido en el carrusel.

Proceso aplicado: sin recortes ni reencuadres, sólo reducción a 900 px de lado
(webp, calidad 82) más una miniatura de 200 px. **Los originales no se tocaron.**

### Faltantes

- **PlayStation 5 — no hay foto en `recursos/premios`.** Se usa el asset del
  Figma (`playstation.webp`, 325 px), que es el producto correcto —PS5 con
  lectora y DualSense— pero de menor resolución que el resto: en la pantalla
  GANASTE se muestra a ~445 px y se nota algo blando. **Conviene pedir el
  original en alta.**
- **Aro de basketball**: la foto entregada es de 493 px, menor que las demás
  (4167 px). Se ve correcta, pero es la segunda más baja del set.

### Duplicadas

Ninguna. Los 19 premios usan 19 imágenes distintas. La única repetición
deliberada es `playstation-5.webp`, que además aparece en la decoración del Home
(el cúmulo de premios del Figma), pero es el mismo producto en dos roles.

### Ambigüedad resuelta por inspección visual

Los archivos de bicicleta no dicen todos su aro:

| Archivo | Contenido | Premio |
| --- | --- | --- |
| `Copia de BICI 1 ARO 24.png` | MTB azul de adulto | Bicicleta Milano aro 24 |
| `Copia de BICI 3 ARO 20.png` | BMX azul con rueditas | Bicicleta Milano aro 20 |
| `Copia de BICI 2.png` | BMX **roja** con rueditas, más chica | Bicicleta Milano aro 16 |

`BICI 2` se asignó por color y tamaño: `PREMIOS` describe el aro 16 como
«BMX P/VARON BAMBINO **ROJO**» y es la única roja de las tres.

---

## 5. Qué le toca al backend

El frontend **muestra** premios; no los asigna.

```
Usuario carga código → Frontend → Backend
                                   ├─ consulta la base de códigos
                                   ├─ consulta el calendario de adjudicación
                                   ├─ consulta disponibilidad real
                                   └─ devuelve WIN / LOSE (+ prizeId si gana)
Frontend recibe el resultado y sólo renderiza.
```

### El calendario no vive en el frontend, a propósito

El Excel trae fecha y hora exactas de las 89 entregas. **Ese calendario no está
en el código del sitio y no debe estarlo.** Todo lo que se publica en el bundle
es visible desde las herramientas de desarrollo del navegador: subirlo
permitiría saber de antemano a qué hora conviene cargar un código. La
adjudicación por fecha/hora es responsabilidad exclusiva del backend.

Por el mismo motivo el sitio publicado no lee el `.xlsx`: el Excel es material
de trabajo del proyecto, no una base de datos productiva.

### `quantity` no es stock

El catálogo lleva las unidades planificadas sólo como dato informativo. El
frontend **no** hace `remaining--` ni oculta premios agotados. Si la campaña
necesita mostrar disponibilidad, el dato tiene que venir del backend.

### Respuesta esperada al ganar

```json
{
  "status": "WIN",
  "code": "PSJBL6D9LP3",
  "codeCount": 4,
  "prize": {
    "id": "jbl-flip-7",
    "name": "Speaker JBL Flip 7",
    "article": "un",
    "image": "https://.../jbl-flip-7.webp"
  }
}
```

Los `id` de la sección 1 son el contrato: el backend puede devolver sólo el
`prizeId` y dejar que el frontend resuelva nombre e imagen del catálogo, o
mandar el objeto completo. Lo que **no** puede hacer es devolver `WIN` sin
premio: la pantalla ya no inventa uno —muestra «te ganaste un premio!» sin
nombrarlo—, pero el usuario se queda sin saber qué ganó.

---

## 6. Auditoría

`npm run audit:premios` vuelve a leer el Excel y lo cruza contra el catálogo
implementado. Verifica tipos, unidades, cantidad por premio, IDs únicos y que
cada imagen exista en disco.

Resultado al cierre de esta implementación:

```
CALENDARIO      89 eventos · 19 tipos · 01/09/2026 → 27/11/2026   OK
NOMBRE WEB      19 tipos · 89 unidades                            OK
PREMIOS         89 filas · 19 tipos                               OK
CANTIDADES      19 tipos · 89 unidades                            OK
Catálogo        19 premios · 19 IDs únicos · 19 imágenes          OK
Cantidades      19/19 coinciden con NOMBRE WEB                    OK
Archivos        38 imágenes en disco (19 + 19 miniaturas)         OK
```

---

## 7. Probar los 19 sin backend

- **Pantalla de premios:** `/#/premios` recorre los 19 con las flechas, el
  teclado o swipe. La navegación es circular.
- **Pantalla de ganador, uno por uno:** panel de escenarios (abajo a la
  derecha, sólo en `npm run dev`) → escenario **Ganaste** → desplegable
  **Premio**. También por URL: `?scenario=WIN&prize=skate-mediano`.
- **Por código:** con el escenario `BASE` cada premio tiene su código de prueba
  en `src/mocks/codes.ts`, y el resultado depende del código tipeado, igual que
  hará contra la tabla real.

Todo esto es material de desarrollo y QA. Nada de eso sobrevive a la conexión
con el backend: ahí el premio siempre lo decide el servidor.
