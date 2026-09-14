// Todo el acceso al DOM vive en este módulo. Así la lógica del juego no toca
// nunca document ni depende de cómo esté armado el HTML.

const TEXTO_FALTANTE = "No disponible";

// Separador de miles en español: 46.466.688 en lugar de 46,466,688.
const numero = new Intl.NumberFormat("es-AR");

const elementos = {
  cargando: document.getElementById("status-loading"),
  error: document.getElementById("status-error"),
  detalleError: document.getElementById("error-detail"),
  sinResultados: document.getElementById("status-empty"),
  insuficiente: document.getElementById("status-short"),
  botonReintentar: document.getElementById("retry-button"),
  duelo: document.getElementById("battle"),
  resultado: document.getElementById("result"),
  ficha: document.getElementById("facts"),
  contadorPool: document.getElementById("pool-counter"),
  puntaje: document.getElementById("score-value"),
  racha: document.getElementById("streak-value"),
  rondas: document.getElementById("rounds-value"),
  veredicto: document.getElementById("result-title"),
  paisCorrecto: document.getElementById("result-country"),
  poblacionA: document.getElementById("result-population-a"),
  poblacionB: document.getElementById("result-population-b"),
  puntos: document.getElementById("result-points"),
  rachaResultado: document.getElementById("result-streak"),
  botonSiguiente: document.getElementById("next-button"),
};

const lados = {
  a: {
    tarjeta: document.getElementById("country-card-a"),
    bandera: document.getElementById("country-flag-a"),
    nombre: document.getElementById("country-name-a"),
    poblacion: document.getElementById("country-population-a"),
    boton: document.getElementById("answer-button-a"),
  },
  b: {
    tarjeta: document.getElementById("country-card-b"),
    bandera: document.getElementById("country-flag-b"),
    nombre: document.getElementById("country-name-b"),
    poblacion: document.getElementById("country-population-b"),
    boton: document.getElementById("answer-button-b"),
  },
};

// Campos de la ficha del país, agrupados aparte porque se completan juntos.
const campos = {
  bandera: document.getElementById("facts-flag"),
  emoji: document.getElementById("facts-emoji"),
  nombre: document.getElementById("facts-name"),
  oficial: document.getElementById("facts-official"),
  codigos: document.getElementById("facts-codes"),
  poblacion: document.getElementById("facts-population"),
  capital: document.getElementById("facts-capital"),
  region: document.getElementById("facts-region"),
  subregion: document.getElementById("facts-subregion"),
  continente: document.getElementById("facts-continent"),
  area: document.getElementById("facts-area"),
  moneda: document.getElementById("facts-currency"),
  idiomas: document.getElementById("facts-languages"),
  husosHorarios: document.getElementById("facts-timezones"),
  vecinos: document.getElementById("facts-borders"),
  gobierno: document.getElementById("facts-government"),
};

function alternar(elemento, visible) {
  if (!elemento) {
    return;
  }

  elemento.hidden = !visible;
}

function pintarBandera(imagen, pais) {
  // Abkhazia, Northern Cyprus, Somaliland y South Ossetia no tienen imagen.
  // Un src vacío haría que el navegador vuelva a pedir la propia página.
  const hayBandera = Boolean(pais.bandera.png);
  alternar(imagen, hayBandera);

  if (hayBandera) {
    imagen.src = pais.bandera.png;
    imagen.alt = `Bandera de ${pais.nombre}`;
  }
}

// Un solo lugar decide qué se ve en pantalla, según el estado de la aplicación:
// "cargando", "error", "sin-resultados" o "listo".
export function mostrarEstado(estado, detalle = "") {
  alternar(elementos.cargando, estado === "cargando");
  alternar(elementos.error, estado === "error");
  alternar(elementos.sinResultados, estado === "sin-resultados");

  const hayDatos = estado === "listo";

  if (!hayDatos) {
    alternar(elementos.duelo, false);
    alternar(elementos.resultado, false);
    alternar(elementos.ficha, false);
    alternar(elementos.insuficiente, false);
  }

  if (estado === "error") {
    elementos.detalleError.textContent =
      detalle || "Revisá tu conexión y volvé a intentarlo.";
  }
}

// "pregunta" | "resultado" | "insuficiente"
// La ficha solo aparece después de responder: si se mostrara antes, el
// jugador vería la población del ganador y la ronda perdería sentido.
export function mostrarFase(fase) {
  alternar(elementos.insuficiente, fase === "insuficiente");
  alternar(elementos.duelo, fase !== "insuficiente");
  alternar(elementos.resultado, fase === "resultado");
  alternar(elementos.ficha, fase === "resultado");
}

export function actualizarContadorPool(cantidad) {
  const sustantivo = cantidad === 1 ? "país disponible" : "países disponibles";
  elementos.contadorPool.textContent = `${cantidad} ${sustantivo}`;
}

export function actualizarMarcador({ puntaje, racha, rondas }) {
  elementos.puntaje.textContent = String(puntaje);
  elementos.racha.textContent = `🔥 ${racha}`;
  elementos.rondas.textContent = String(rondas);
}

export function alReintentar(accion) {
  elementos.botonReintentar.addEventListener("click", accion);
}

export function alElegir(accion) {
  lados.a.boton.addEventListener("click", () => accion("a"));
  lados.b.boton.addEventListener("click", () => accion("b"));
}

export function alSiguiente(accion) {
  elementos.botonSiguiente.addEventListener("click", accion);
}

export function alBuscar(accion) {
  document.getElementById("search-input").addEventListener("input", (evento) => {
    accion(evento.target.value);
  });
}

export function alCambiarRegion(accion) {
  document.getElementById("region-select").addEventListener("change", (evento) => {
    accion(evento.target.value);
  });
}

function pintarTarjeta(lado, pais, revelada, ganador) {
  const nodo = lados[lado];

  pintarBandera(nodo.bandera, pais);
  nodo.nombre.textContent = pais.nombre;
  nodo.poblacion.textContent = revelada
    ? `${numero.format(pais.poblacion)} habitantes`
    : "???";
  nodo.boton.textContent = `Elegir ${pais.nombre}`;
  nodo.boton.disabled = revelada;
  nodo.boton.setAttribute("aria-pressed", String(revelada && ganador === pais));

  nodo.tarjeta.classList.toggle("country-card--ganadora", revelada && ganador === pais);
  nodo.tarjeta.classList.toggle("country-card--perdedora", revelada && ganador !== pais);
}

export function renderizarDuelo(paisA, paisB, ganador = null) {
  const revelada = ganador !== null;

  pintarTarjeta("a", paisA, revelada, ganador);
  pintarTarjeta("b", paisB, revelada, ganador);
}

export function renderizarResultado({ acierto, ganador, paisA, paisB, puntos, racha }) {
  elementos.resultado.classList.toggle("result--correcta", acierto);
  elementos.resultado.classList.toggle("result--incorrecta", !acierto);

  elementos.veredicto.textContent = acierto ? "✅ ¡Correcto!" : "❌ Incorrecto";
  elementos.paisCorrecto.textContent = ganador.nombre;
  elementos.poblacionA.textContent = `${paisA.nombre}: ${numero.format(paisA.poblacion)} habitantes`;
  elementos.poblacionB.textContent = `${paisB.nombre}: ${numero.format(paisB.poblacion)} habitantes`;
  elementos.puntos.textContent = acierto ? `+${puntos} puntos` : "+0 puntos";
  elementos.rachaResultado.textContent = `🔥 Racha: ${racha}`;

  elementos.botonSiguiente.focus();
}

// Escribe un texto y, si el dato falta, deja el aviso en su lugar. Centralizar
// esto evita repetir el mismo "No disponible" en cada campo de la ficha.
function escribir(elemento, valor) {
  elemento.textContent = valor || TEXTO_FALTANTE;
}

// Una lista se muestra separada por comas: idiomas, husos horarios y vecinos
// llegan siempre como arrays, incluso cuando están vacíos.
function escribirLista(elemento, lista) {
  escribir(elemento, lista.join(", "));
}

function formatearMonedas(monedas) {
  return monedas
    .map((moneda) => {
      const detalle = [moneda.codigo, moneda.simbolo].filter(Boolean).join(", ");
      return detalle ? `${moneda.nombre} (${detalle})` : moneda.nombre;
    })
    .join(" · ");
}

export function renderizarFicha(pais) {
  pintarBandera(campos.bandera, pais);

  const hayEmoji = Boolean(pais.bandera.emoji);
  campos.emoji.textContent = hayEmoji ? pais.bandera.emoji : "";
  alternar(campos.emoji, hayEmoji);

  campos.nombre.textContent = pais.nombre;
  escribir(campos.oficial, pais.nombreOficial);
  escribir(campos.codigos, [pais.alpha2, pais.alpha3].filter(Boolean).join(" · "));

  escribir(campos.poblacion, `${numero.format(pais.poblacion)} habitantes`);
  escribir(campos.capital, pais.capital);
  escribir(campos.region, pais.region);
  escribir(campos.subregion, pais.subregion);
  escribir(campos.continente, pais.continente);
  escribir(campos.area, pais.areaKm2 && `${numero.format(pais.areaKm2)} km²`);
  escribir(campos.moneda, formatearMonedas(pais.monedas));
  escribirLista(campos.idiomas, pais.idiomas);
  escribirLista(campos.husosHorarios, pais.husosHorarios);
  escribirLista(campos.vecinos, pais.vecinos);
  escribir(campos.gobierno, pais.tipoGobierno);
}
