# Bitácora de uso de Inteligencia Artificial

Proyecto: **Population Challenge** — juego web sobre población de países
Repositorio: https://github.com/Vladislavgen/Population-Challenge
Materia: Plataformas de Desarrollo — Examen Parcial
Modalidad: trabajo individual práctico

Este archivo documenta de forma transparente el uso de asistentes de IA durante el
desarrollo del proyecto, tal como lo exige la consigna del examen. Se actualiza al
final de cada etapa de desarrollo, por lo que refleja únicamente consultas que
realmente ocurrieron.

---

## 1. Modelo / agente utilizado

- **Agente:** Cursor (modo Agent y modo Plan) en el editor.
- **Modelo:** Claude Opus 5 (Anthropic).
- **Uso complementario:** el mismo agente ejecutó peticiones `curl` reales contra la
  API para verificar la estructura de los datos antes de escribir código.
- **Rol asignado a la IA:** tutor técnico y verificador. La IA no generó el proyecto
  completo de una sola vez: el desarrollo se dividió en etapas pequeñas, cada una con
  su propio commit, para poder revisar y comprender cada parte del código.

---

## 2. Prompts más relevantes

### Prompt 1 — Definición del proyecto y método de trabajo por etapas

> "Actúa como tutor técnico. Necesito desarrollar un proyecto Frontend para el examen
> parcial: un juego llamado Population Challenge donde se muestran dos países al azar y el
> jugador debe adivinar cuál tiene mayor población. Debe usar HTML5, CSS3 y JavaScript
> Vanilla (sin React, Vue, Angular, jQuery ni Axios), consumir la API REST Countries,
> incluir filtro por región, búsqueda de países y los estados de carga, error y sin
> resultados. **No generes todo el proyecto de una sola vez**: dividí el trabajo en
> etapas pequeñas, cada una con un commit propio. Empezá solamente por la Etapa 0
> (planificación): arquitectura, modelo de datos, estados de la aplicación, estructura
> de archivos y roadmap."

**Resultado:** plan de 12 commits, arquitectura de módulos ES6 (`config.js`, `api.js`,
`countries.js`, `game.js`, `ui.js`, `app.js`) y un único objeto `state` como fuente de
verdad.

---

### Prompt 2 — Verificación obligatoria de la API antes de programar

> "Antes de implementar cualquier función que dependa de la API, verificá la estructura
> actual de REST Countries. No asumas que un campo existe."

**Resultado (hallazgo crítico):** las versiones `v1` a `v4` de REST Countries fueron
dadas de baja. La petición

```bash
curl "https://restcountries.com/v3.1/all?fields=name,population"
```

ya no devuelve países, sino:

```json
{
  "success": false,
  "data": null,
  "errors": [{ "message": "This API version has been deprecated..." }]
}
```

Esto invalidó por completo el esquema de campos que se había planificado en un
principio (`name.common`, `cca2`, `cca3`, `coatOfArms`, `languages` como objeto
`{ "spa": "Spanish" }`, `currencies` como objeto con clave de moneda). Sin esta
verificación previa, el proyecto se habría escrito contra una estructura de datos
inexistente.

---

### Prompt 3 — Migración a la versión v5 con clave de acceso

> "Me registré una cuenta y obtuve la clave: `curl "https://api.restcountries.com/countries/v5?q=canada&pretty=1" -H "Authorization: Bearer rc_live_***"`"

**Resultado:** se analizó la respuesta real de `v5` y se documentó el mapeo de campos
nuevos, que es diferente al de `v3.1`:

| Dato            | v3.1 (dada de baja) | v5 (actual)                             |
| --------------- | ------------------- | --------------------------------------- |
| Nombre común    | `name.common`       | `names.common`                          |
| Código ISO      | `cca2` / `cca3`     | `codes.alpha_2` / `codes.alpha_3`       |
| Capital         | `capital[0]`        | `capitals[0].name`                      |
| Área            | `area`              | `area.kilometers`                       |
| Idiomas         | objeto `languages`  | array `languages[].name`                |
| Monedas         | objeto `currencies` | array `currencies[]` con `code`/`symbol`|
| Bandera         | `flags.png`         | `flag.url_png` / `flag.url_svg`         |
| Escudo          | `coatOfArms`        | no existe                               |

También se detectaron los límites del plan gratuito: `limit` máximo de 100 objetos por
petición (el catálogo completo son 254 países, por lo que se necesitan 3 peticiones
paginadas con `offset=0/100/200`) y un tope de 20 peticiones cada 10 segundos.

---

### Prompt 4 — Depuración: ¿por qué la API funciona en la terminal y fallaría en el navegador?

> "Verificá si la clave funciona desde el navegador, no solo desde `curl`."

**Resultado:** se reprodujo el problema enviando la cabecera `Origin` en la petición.
El `preflight` (`OPTIONS`) responde correctamente `access-control-allow-origin: *`,
pero el `GET` real devuelve **403**:

```json
{
  "errors": [
    {
      "message": "Origin is not allowed for this API key...",
      "code": "originNotAllowed"
    }
  ]
}
```

Conclusión documentada para el `README.md`: hay que registrar los orígenes permitidos
en el panel de la cuenta — `localhost` y `127.0.0.1` para el desarrollo, y
`vladislavgen.github.io` para la versión publicada en GitHub Pages
(https://vladislavgen.github.io/Population-Challenge). Además, el proyecto debe
abrirse con un servidor local y nunca con `file://` (en ese caso el navegador envía
`Origin: null` y la API responde 403).

Como GitHub Pages publica el sitio en un subdirectorio (`/Population-Challenge/`),
todas las rutas de los archivos deben ser relativas (`css/styles.css`,
`js/app.js`) y no absolutas (`/css/styles.css`), porque estas últimas apuntarían a
la raíz del dominio y devolverían 404 al publicar.

---

### Prompt 5 — Datos faltantes y casos límite reales

> "¿Qué países tienen campos ausentes? La aplicación no debe romperse si falta un dato."

**Resultado:** se recorrieron los 254 países descargados para detectar los huecos
reales, en lugar de suponerlos:

- Sin capital: Antarctica, Bouvet Island, Heard Island and McDonald Islands, Macau,
  United States Minor Outlying Islands.
- Sin monedas: Antarctica, Bouvet Island, Heard Island and McDonald Islands.
- Sin idiomas: Antarctica.
- Sin países vecinos: 86 países (islas y estados sin fronteras terrestres).
- Sin subregión: 5 territorios.
- **Con `population` igual a 0**: Bouvet Island y Heard Island and McDonald Islands.

El último punto es el más importante para la lógica del juego: dos países con población
0 harían una comparación sin respuesta correcta posible, por lo que el conjunto de
países jugables exige `poblacion > 0`. Los demás casos se resuelven mostrando
`"No disponible"` en la ficha del país.

---

## 3. Bitácora por etapa

A partir de la Etapa 1 cada tramo se pidió con una instrucción corta ("hacé la
Etapa N") apoyada en el plan acordado en la Etapa 0. Lo que sigue no son los
prompts literales, sino las decisiones y los hallazgos que produjo cada etapa.

### Etapa 1 — Maquetado semántico

- Los datos de ejemplo de la maqueta (Argentina 46.466.688 y Japan 122.680.000)
  se pidieron a la API real en vez de inventarlos, para que la estructura del
  HTML coincidiera desde el principio con la forma de los datos definitivos.
- Se eligió a propósito un país sin vecinos (Japan, con `borders` vacío) para
  que el texto `No disponible` quedara a la vista ya en la maqueta.
- El marcado se pasó por el validador del W3C, que corrigió dos cosas: un
  `<script type="module">` no puede llevar `defer` (los módulos ya se difieren
  solos), y los bloques de estado no debían ser `<section>` porque no tienen
  encabezado propio, así que pasaron a ser `<div>`.

### Etapa 2 — Diseño responsive

- El resultado se verificó con capturas a 390, 820 y 1280 píxeles. La primera
  parecía mostrar la página cortada por la derecha, pero un script que compara
  `scrollWidth` con el ancho de la ventana demostró que no había desbordamiento:
  el navegador sin interfaz gráfica fuerza un viewport mínimo de 500 píxeles y
  recortaba la imagen. La comprobación evitó "arreglar" un problema inexistente.
- Las banderas se muestran con `object-fit: contain` dentro de un marco fijo de
  3:2 en lugar de `cover`. Las proporciones reales varían mucho (la de Nepal ni
  siquiera es rectangular) y recortarlas escondería parte del diseño.

### Etapa 3 — Conexión con la API

- La paginación no se escribió a mano con tres peticiones fijas: el bucle corta
  cuando `data.meta.more` es falso. Si el catálogo cambia de tamaño, el código
  sigue funcionando sin tocarlo.
- Se pidió `response_fields` con la lista exacta de campos que usa el juego, en
  lugar del `response_fields_omit` previsto en la Etapa 0: es más corto de
  mantener y deja explícito qué datos consume la aplicación.
- **Hallazgo nuevo:** cuatro territorios de reconocimiento parcial (Abkhazia,
  Northern Cyprus, Somaliland y South Ossetia) tienen `codes.alpha_3` vacío, por
  lo que ese código no sirve como identificador único. Los nombres comunes, en
  cambio, no se repiten en ninguno de los 254 países.
- La descarga se probó con Node sobre una copia temporal de los módulos fuera
  del repositorio, para no dejar la clave real en el historial de Git. Resultado:
  254 países en tres peticiones, unos 4,5 segundos.
- Como la clave todavía no tiene orígenes autorizados, el navegador recibe 403.
  El estado de error quedó verificado con ese fallo real, y la ruta exitosa se
  comprobó aparte con un proxy local de prueba que no forma parte del proyecto.

### Etapa 4 — Normalización y ficha dinámica

- La normalización se probó sobre los 254 países, no sobre dos o tres de
  muestra. El recuento de huecos reales quedó así: 5 sin capital, 5 sin
  subregión, 3 sin monedas, 1 sin idiomas (Antarctica), 16 sin tipo de gobierno
  y 86 sin países vecinos.
- **Hallazgo nuevo:** los mismos cuatro territorios que no tienen `alpha_3`
  tampoco tienen ninguna imagen de bandera, ni siquiera el emoji. La ficha
  oculta el `<img>` en lugar de dejarle un `src` vacío, porque un `src=""` hace
  que el navegador vuelva a pedir la propia página.
- **Falsa alarma verificada:** al traducir los códigos de frontera apareció un
  vecino llamado `DRC`, que parecía un código sin resolver. Resultó ser el
  nombre real del país en el catálogo (Democratic Republic of the Congo,
  `alpha_3` = `COD`). Comprobado el catálogo completo, ningún código de
  frontera queda huérfano.
- Los nombres de los vecinos se resuelven en una segunda pasada, con un `Map` de
  `alpha_3` a nombre, porque para traducirlos hace falta el catálogo entero ya
  normalizado.

### Etapa 5 — Duelo de población

- El pozo jugable exige `poblacion > 0`. Sin ese recorte, Bouvet Island contra
  Heard Island dejaría una ronda sin ganador.
- El par se elige por `nombre`, no por `alpha_3`: ese código está vacío en
  cuatro territorios y no sirve para distinguir dos países.
- Si el pozo tiene menos de dos países, el juego no intenta armar la ronda: se
  muestra `No hay suficientes países para un duelo`. El caso se cubre ahora
  para que las Etapas 7 y 8 (filtro y búsqueda) no tengan que inventar esa
  protección después.
- La ficha detallada del ganador se deja oculta a propósito: pertenece a la
  Etapa 6. Mostrarla acá mezclaría dos commits.

---

## 4. Sugerencias aceptadas

| Sugerencia                                                             | Motivo por el que se aceptó                                                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Migrar a la API `v5` con clave gratuita                                | Es la única versión activa; la consigna permite APIs con API Key de nivel gratuito.                                 |
| Descargar el catálogo completo una sola vez y filtrar en memoria        | La consigna pide filtrado de arreglos en memoria; además evita gastar cuota y respeta el límite de 20 pet. / 10 s.  |
| Paginar con 3 peticiones (`offset=0/100/200`)                          | El plan gratuito limita `limit` a 100 y el dataset tiene 254 países.                                                 |
| Recortar la respuesta con `response_fields_omit`                        | Sin recortar, la respuesta incluye traducciones y paletas de colores que no se usan; así baja a unos 490 KB.        |
| Crear una función `normalizarPais()` intermedia                         | Aísla la estructura anidada de la API del resto del código: si la API cambia otra vez, solo se toca una función.    |
| Verificar los campos ausentes recorriendo los datos reales             | Permite escribir los `fallback` sobre casos comprobados y no sobre suposiciones.                                     |
| Desarrollo por etapas con un commit por funcionalidad                   | El historial de Git muestra el proceso real de construcción y permite explicar cada parte al docente.               |
| Cortar la paginación con `data.meta.more` en vez de fijar tres peticiones | Es la propia API la que avisa si quedan resultados; el código no depende de que el catálogo siga teniendo 254 países. |
| Pasar el HTML y el CSS por los validadores del W3C en cada etapa        | Detectó errores reales que a simple vista no se ven, como el `defer` inválido en un `<script type="module">`.        |
| Mostrar las banderas con `object-fit: contain` sobre un marco fijo      | Ninguna bandera queda recortada y la tarjeta no cambia de alto al pasar de un país a otro.                            |
| Guardar los datos ausentes como `null` en el modelo y decidir el texto en la interfaz | El modelo dice la verdad sobre lo que la API entregó, y `No disponible` se escribe en un solo lugar en vez de repetirlo campo por campo. |

## 5. Sugerencias descartadas

| Sugerencia descartada                                                                                  | Motivo del rechazo                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Usar el dataset `mledoze/countries` desde GitHub o jsDelivr como reemplazo de la API                    | Es un archivo JSON estático servido por un CDN, no una API REST, y además **no incluye el campo `population`**, que es justamente el eje del juego.                          |
| Mantener la URL `restcountries.com/v3.1` porque aparece en la consigna                                  | Está dada de baja: devuelve un error de deprecación en todas sus rutas. Se documenta el cambio en el `README.md` para justificar la diferencia con el enunciado.             |
| Mostrar el escudo nacional (`coatOfArms`)                                                               | El campo no existe en `v5`; el campo `assets[]` está vacío en los 254 países. Se reemplaza por bandera PNG/SVG, emoji de bandera y tipo de gobierno.                          |
| Pedir la API Key al usuario mediante un campo de texto y guardarla en `localStorage`                    | Obligaría a quien corrige el trabajo a crear su propia cuenta para poder ver la aplicación funcionando. Se optó por `config.js` con una clave gratuita restringida por origen. |
| Abrir `index.html` directamente con doble clic (`file://`)                                              | El navegador envía `Origin: null` y la API responde 403. Se documenta el uso de un servidor local en las instrucciones de ejecución.                                          |
| Usar un framework o una librería de peticiones para simplificar el código                              | Prohibido explícitamente por la consigna: el proyecto es HTML5, CSS3 y JavaScript puro.                                                                                     |
| Agregar una capa de estado tipo `store` con suscripciones y eventos personalizados                      | Sobreingeniería para un trabajo académico: un único objeto `state` y funciones de render son suficientes y más fáciles de explicar.                                          |
| Corregir el supuesto desbordamiento horizontal que mostraba la primera captura de la Etapa 2           | La medición demostró que la página no desbordaba: el recorte lo producía la herramienta de captura. Tocar el CSS habría roto un diseño que funcionaba.                        |
| Usar `codes.alpha_3` como identificador único de cada país                                             | Está vacío en Abkhazia, Northern Cyprus, Somaliland y South Ossetia. El nombre común sí es único en el catálogo completo.                                                    |
| Agregar una traducción especial para el vecino `DRC`, que parecía un código sin resolver               | No hacía falta: `DRC` es el nombre con el que el catálogo llama a la República Democrática del Congo. La comprobación evitó agregar una excepción inútil al código.           |

---

## 6. Reflexión

El aporte más valioso de la IA en esta etapa no fue escribir código, sino **verificar
supuestos**. La consigna y la planificación inicial partían de una versión de la API
que ya no existe, y de una lista de campos (`cca2`, `coatOfArms`, `languages` como
objeto) que hoy es incorrecta. Comprobar la API con peticiones reales antes de
programar evitó construir toda la aplicación sobre una estructura de datos equivocada,
y detectó a tiempo dos problemas que no aparecen en ninguna documentación de ejemplo:
la restricción de orígenes CORS de la clave y los países con población 0.

En cambio, varias sugerencias fueron rechazadas por comodidad técnica: reemplazar la
API por un archivo JSON alojado en un CDN habría hecho el proyecto más simple, pero
habría incumplido el requisito central del examen (consumo de una API REST remota).

Las etapas siguientes confirmaron el mismo patrón en las dos direcciones. Medir en
lugar de suponer descubrió el `alpha_3` vacío de cuatro territorios, un detalle que
habría roto la elección de países más adelante. Pero también funcionó al revés: en la
Etapa 2 una captura de pantalla sugería un desbordamiento que no existía, y medirlo
evitó modificar un CSS que ya era correcto. La conclusión práctica es que ni las
suposiciones ni las herramientas de verificación se pueden dar por buenas solas.

*Última actualización: Etapa 5 — duelo de población.*
