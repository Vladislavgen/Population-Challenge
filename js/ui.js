// Todo el acceso al DOM vive en este módulo. Así la lógica del juego no toca
// nunca document ni depende de cómo esté armado el HTML.

const elementos = {
  cargando: document.getElementById("status-loading"),
  error: document.getElementById("status-error"),
  detalleError: document.getElementById("error-detail"),
  sinResultados: document.getElementById("status-empty"),
  botonReintentar: document.getElementById("retry-button"),
  duelo: document.getElementById("battle"),
  resultado: document.getElementById("result"),
  ficha: document.getElementById("facts"),
  contadorPool: document.getElementById("pool-counter"),
};

function alternar(elemento, visible) {
  elemento.hidden = !visible;
}

// Un solo lugar decide qué se ve en pantalla, según el estado de la aplicación:
// "cargando", "error", "sin-resultados" o "listo".
export function mostrarEstado(estado, detalle = "") {
  alternar(elementos.cargando, estado === "cargando");
  alternar(elementos.error, estado === "error");
  alternar(elementos.sinResultados, estado === "sin-resultados");

  // El juego solo aparece cuando hay datos cargados.
  const hayDatos = estado === "listo";
  alternar(elementos.duelo, hayDatos);
  alternar(elementos.resultado, hayDatos);
  alternar(elementos.ficha, hayDatos);

  if (estado === "error") {
    elementos.detalleError.textContent =
      detalle || "Revisá tu conexión y volvé a intentarlo.";
  }
}

export function actualizarContadorPool(cantidad) {
  const sustantivo = cantidad === 1 ? "país disponible" : "países disponibles";
  elementos.contadorPool.textContent = `${cantidad} ${sustantivo}`;
}

export function alReintentar(accion) {
  elementos.botonReintentar.addEventListener("click", accion);
}
