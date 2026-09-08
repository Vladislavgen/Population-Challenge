// Único módulo que habla con la red. El resto de la aplicación recibe un array
// de países y no sabe nada de URLs, claves ni paginación.

import {
  API_KEY,
  API_URL,
  CAMPOS,
  MAXIMO_PAGINAS,
  TAMANIO_PAGINA,
} from "./config.js";

function armarUrl(offset) {
  const parametros = new URLSearchParams({
    limit: TAMANIO_PAGINA,
    offset,
    response_fields: CAMPOS,
  });

  return `${API_URL}?${parametros}`;
}

// Los códigos de error de la API se traducen a mensajes que el jugador pueda
// entender; el estado de error los muestra tal cual.
function mensajeSegunEstado(estado) {
  if (estado === 401) {
    return "La clave de la API falta o no es válida.";
  }
  if (estado === 403) {
    return "La clave no acepta pedidos desde este origen. Hay que registrarlo en el panel de REST Countries.";
  }
  if (estado === 429) {
    return "Se superó el límite de peticiones. Esperá unos segundos y probá de nuevo.";
  }
  return `La API respondió con el código ${estado}.`;
}

async function pedirPagina(offset) {
  const respuesta = await fetch(armarUrl(offset), {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  if (!respuesta.ok) {
    throw new Error(mensajeSegunEstado(respuesta.status));
  }

  const cuerpo = await respuesta.json();

  // No se da por sentada la forma de la respuesta: si la API vuelve a cambiar,
  // el problema se detecta acá y no más adelante con un error indescifrable.
  if (!Array.isArray(cuerpo?.data?.objects)) {
    throw new Error("La respuesta de la API no tiene el formato esperado.");
  }

  return cuerpo.data;
}

// Descarga el catálogo completo. Se llama una sola vez al iniciar el juego:
// después todo el filtrado y la elección de países se hace en memoria.
export async function descargarPaises() {
  if (!API_KEY || API_KEY === "TU_API_KEY_AQUI") {
    throw new Error("Falta cargar la clave de la API en js/config.js.");
  }

  const paises = [];
  let offset = 0;

  for (let pagina = 0; pagina < MAXIMO_PAGINAS; pagina += 1) {
    const { objects, meta } = await pedirPagina(offset);
    paises.push(...objects);

    // La propia API avisa si quedan más resultados, así que no hace falta
    // codificar a mano cuántas páginas son.
    if (!meta?.more) {
      break;
    }

    offset += TAMANIO_PAGINA;
  }

  if (paises.length === 0) {
    throw new Error("La API no devolvió ningún país.");
  }

  return paises;
}
