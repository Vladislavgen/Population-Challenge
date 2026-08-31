# Bitácora de uso de Inteligencia Artificial

Proyecto: **Country Battle** — juego web sobre población de países
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
> parcial: un juego llamado Country Battle donde se muestran dos países al azar y el
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
(`localhost`, `127.0.0.1` y el dominio de publicación) en el panel de la cuenta, y el
proyecto debe abrirse con un servidor local, nunca con `file://` (en ese caso el
navegador envía `Origin: null` y la API responde 403).

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

## 3. Sugerencias aceptadas

| Sugerencia                                                             | Motivo por el que se aceptó                                                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Migrar a la API `v5` con clave gratuita                                | Es la única versión activa; la consigna permite APIs con API Key de nivel gratuito.                                 |
| Descargar el catálogo completo una sola vez y filtrar en memoria        | La consigna pide filtrado de arreglos en memoria; además evita gastar cuota y respeta el límite de 20 pet. / 10 s.  |
| Paginar con 3 peticiones (`offset=0/100/200`)                          | El plan gratuito limita `limit` a 100 y el dataset tiene 254 países.                                                 |
| Recortar la respuesta con `response_fields_omit`                        | Sin recortar, la respuesta incluye traducciones y paletas de colores que no se usan; así baja a unos 490 KB.        |
| Crear una función `normalizarPais()` intermedia                         | Aísla la estructura anidada de la API del resto del código: si la API cambia otra vez, solo se toca una función.    |
| Verificar los campos ausentes recorriendo los datos reales             | Permite escribir los `fallback` sobre casos comprobados y no sobre suposiciones.                                     |
| Desarrollo por etapas con un commit por funcionalidad                   | El historial de Git muestra el proceso real de construcción y permite explicar cada parte al docente.               |

## 4. Sugerencias descartadas

| Sugerencia descartada                                                                                  | Motivo del rechazo                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Usar el dataset `mledoze/countries` desde GitHub o jsDelivr como reemplazo de la API                    | Es un archivo JSON estático servido por un CDN, no una API REST, y además **no incluye el campo `population`**, que es justamente el eje del juego.                          |
| Mantener la URL `restcountries.com/v3.1` porque aparece en la consigna                                  | Está dada de baja: devuelve un error de deprecación en todas sus rutas. Se documenta el cambio en el `README.md` para justificar la diferencia con el enunciado.             |
| Mostrar el escudo nacional (`coatOfArms`)                                                               | El campo no existe en `v5`; el campo `assets[]` está vacío en los 254 países. Se reemplaza por bandera PNG/SVG, emoji de bandera y tipo de gobierno.                          |
| Pedir la API Key al usuario mediante un campo de texto y guardarla en `localStorage`                    | Obligaría a quien corrige el trabajo a crear su propia cuenta para poder ver la aplicación funcionando. Se optó por `config.js` con una clave gratuita restringida por origen. |
| Abrir `index.html` directamente con doble clic (`file://`)                                              | El navegador envía `Origin: null` y la API responde 403. Se documenta el uso de un servidor local en las instrucciones de ejecución.                                          |
| Usar un framework o una librería de peticiones para simplificar el código                              | Prohibido explícitamente por la consigna: el proyecto es HTML5, CSS3 y JavaScript puro.                                                                                     |
| Agregar una capa de estado tipo `store` con suscripciones y eventos personalizados                      | Sobreingeniería para un trabajo académico: un único objeto `state` y funciones de render son suficientes y más fáciles de explicar.                                          |

---

## 5. Reflexión

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

*Última actualización: Etapa 0 — planificación y verificación de la API.*
