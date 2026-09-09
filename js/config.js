// Configuración de la API REST Countries.
//
// La versión v3.1 que menciona la consigna fue dada de baja: hoy cualquier ruta
// responde con un error de deprecación. v5 es la única activa y pide una clave
// gratuita, así que el proyecto se escribió contra esa versión.

export const API_URL = "https://api.restcountries.com/countries/v5";

// Reemplazar por la clave gratuita obtenida en https://restcountries.com/api-keys
export const API_KEY = "rc_live_2949f91dd2c74e6b9ff5e0ead6837aff";

// La clave está restringida por origen: hay que registrar en el panel de la
// cuenta los hosts desde los que se abre el juego, si no la API devuelve 403.
//   - http://localhost:8000 y http://127.0.0.1:8000 durante el desarrollo
//   - https://vladislavgen.github.io para la versión publicada
// Abrir index.html con doble clic (file://) nunca funciona: en ese caso el
// navegador manda "Origin: null" y la API lo rechaza.

// El plan gratuito no permite pedir más de 100 objetos por petición y el
// catálogo completo son 254 países, así que la descarga va paginada.
export const TAMANIO_PAGINA = 100;

// Tope de seguridad: si la API devolviera "more" siempre en verdadero, esto
// evita un bucle infinito de peticiones (el límite es 20 cada 10 segundos).
export const MAXIMO_PAGINAS = 5;

// Solo se piden los campos que el juego usa. Sin este recorte cada país llega
// con traducciones a 25 idiomas y la paleta de colores de la bandera, datos que
// no se muestran en ningún lado y que multiplican el peso de la respuesta.
export const CAMPOS = [
  "names.common",
  "names.official",
  "codes.alpha_2",
  "codes.alpha_3",
  "population",
  "region",
  "subregion",
  "continents",
  "capitals",
  "area",
  "currencies",
  "languages",
  "timezones",
  "borders",
  "flag.emoji",
  "flag.url_png",
  "flag.url_svg",
  "government_type",
].join(",");
