// Punto de entrada: carga el catálogo y coordina cada ronda del duelo.

import { descargarPaises } from "./api.js";
import { normalizarPaises } from "./countries.js";
import {
  aplicarPuntaje,
  elegirPar,
  paisesJugables,
  resolverRespuesta,
} from "./game.js";
import {
  actualizarContadorPool,
  actualizarMarcador,
  alElegir,
  alReintentar,
  alSiguiente,
  mostrarEstado,
  mostrarFase,
  renderizarDuelo,
  renderizarResultado,
} from "./ui.js";

function marcadorVacio() {
  return { puntaje: 0, racha: 0, rondas: 0 };
}

// Única fuente de verdad. Las Etapas 7 y 8 van a agregar el conjunto
// filtrado, pero el duelo siempre lee de acá.
export const state = {
  paises: [],
  estado: "cargando",
  error: null,
  fase: "pregunta", // "pregunta" | "resultado" | "insuficiente"
  ronda: null, // { paisA, paisB } o null
  marcador: marcadorVacio(),
};

function iniciarRonda() {
  const par = elegirPar(state.paises);

  if (!par) {
    state.ronda = null;
    state.fase = "insuficiente";
    mostrarFase("insuficiente");
    return;
  }

  state.ronda = par;
  state.fase = "pregunta";
  renderizarDuelo(par.paisA, par.paisB);
  mostrarFase("pregunta");
}

function responder(lado) {
  if (state.fase !== "pregunta" || !state.ronda) {
    return;
  }

  const { paisA, paisB } = state.ronda;
  const elegido = lado === "a" ? paisA : paisB;
  const veredicto = resolverRespuesta(paisA, paisB, elegido);

  state.marcador = aplicarPuntaje(state.marcador, veredicto.acierto);
  state.fase = "resultado";

  actualizarMarcador(state.marcador);
  renderizarDuelo(paisA, paisB, veredicto.ganador);
  renderizarResultado({
    ...veredicto,
    paisA,
    paisB,
    racha: state.marcador.racha,
  });
  mostrarFase("resultado");
}

async function cargarCatalogo() {
  state.estado = "cargando";
  state.ronda = null;
  state.marcador = marcadorVacio();
  actualizarMarcador(state.marcador);
  mostrarEstado("cargando");

  try {
    state.paises = normalizarPaises(await descargarPaises());
    state.error = null;
    state.estado = "listo";

    actualizarContadorPool(paisesJugables(state.paises).length);
    mostrarEstado("listo");
    iniciarRonda();
  } catch (error) {
    state.paises = [];
    state.error = error.message;
    state.estado = "error";

    mostrarEstado("error", error.message);
  }
}

alReintentar(cargarCatalogo);
alElegir(responder);
alSiguiente(iniciarRonda);
cargarCatalogo();
