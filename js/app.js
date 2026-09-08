// Punto de entrada de la aplicación: coordina la descarga de datos y los
// estados de la interfaz.

import { descargarPaises } from "./api.js";
import { actualizarContadorPool, alReintentar, mostrarEstado } from "./ui.js";

// Única fuente de verdad. Las etapas siguientes le van a agregar el país
// filtrado, la ronda actual y el puntaje, pero siempre sobre este mismo objeto.
export const state = {
  paises: [], // catálogo completo tal como llega de la API
  estado: "cargando", // "cargando" | "error" | "listo"
  error: null,
};

// async/await deja la secuencia "pedir datos, guardarlos, dibujar" en orden de
// lectura, y el try/catch atrapa tanto los fallos de red como los de la API.
async function cargarCatalogo() {
  state.estado = "cargando";
  mostrarEstado("cargando");

  try {
    state.paises = await descargarPaises();
    state.error = null;
    state.estado = "listo";

    actualizarContadorPool(state.paises.length);
    mostrarEstado("listo");
  } catch (error) {
    state.paises = [];
    state.error = error.message;
    state.estado = "error";

    mostrarEstado("error", error.message);
  }
}

alReintentar(cargarCatalogo);
cargarCatalogo();
