// Punto de entrada: carga el catálogo y coordina cada ronda del duelo.

import { descargarPaises } from "./api.js";
import { filtrarPaises, normalizarPaises } from "./countries.js";
import { aplicarPuntaje, elegirPar, resolverRespuesta } from "./game.js";
import {
  actualizarContadorPool,
  actualizarMarcador,
  alBuscar,
  alCambiarRegion,
  alElegir,
  alReintentar,
  alSiguiente,
  mostrarEstado,
  mostrarFase,
  renderizarDuelo,
  renderizarFicha,
  renderizarResultado,
} from "./ui.js";

function marcadorVacio() {
  return { puntaje: 0, racha: 0, rondas: 0 };
}

export const state = {
  paises: [],
  paisesFiltrados: [],
  busqueda: "",
  region: "all",
  estado: "cargando",
  error: null,
  fase: "pregunta", // "pregunta" | "resultado" | "insuficiente"
  ronda: null,
  marcador: marcadorVacio(),
};

function aplicarFiltros() {
  state.paisesFiltrados = filtrarPaises(state.paises, state.region, state.busqueda);
  actualizarContadorPool(state.paisesFiltrados.length);

  if (state.paisesFiltrados.length === 0) {
    state.ronda = null;
    state.fase = "pregunta";
    mostrarEstado("sin-resultados");
    return;
  }

  mostrarEstado("listo");
  iniciarRonda();
}

function iniciarRonda() {
  const par = elegirPar(state.paisesFiltrados);

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
  renderizarFicha(veredicto.ganador);
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
    aplicarFiltros();
  } catch (error) {
    state.paises = [];
    state.paisesFiltrados = [];
    state.error = error.message;
    state.estado = "error";

    mostrarEstado("error", error.message);
  }
}

alReintentar(cargarCatalogo);
alElegir(responder);
alSiguiente(iniciarRonda);
alBuscar((texto) => {
  state.busqueda = texto;
  aplicarFiltros();
});
alCambiarRegion((region) => {
  state.region = region;
  aplicarFiltros();
});
cargarCatalogo();
