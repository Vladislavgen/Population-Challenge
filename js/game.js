// Reglas del duelo. Este módulo no toca el DOM: recibe países y devuelve
// resultados que la interfaz se encarga de mostrar.

export const PUNTOS_ACIERTO = 100;

// Bouvet Island y Heard Island tienen población 0: compararlos no produce
// un ganador claro, así que no entran al pozo de la partida.
export function paisesJugables(paises) {
  return paises.filter((pais) => pais.poblacion > 0);
}

function indiceAlAzar(largo) {
  return Math.floor(Math.random() * largo);
}

// Elige dos países distintos. Prefiere poblaciones distintas para que la
// pregunta tenga una sola respuesta correcta. Si el pozo tiene menos de dos
// países, devuelve null: la interfaz muestra "No hay suficientes países".
export function elegirPar(paises) {
  const pozo = paisesJugables(paises);

  if (pozo.length < 2) {
    return null;
  }

  const primero = pozo[indiceAlAzar(pozo.length)];
  const distintos = pozo.filter((pais) => pais.nombre !== primero.nombre);
  const conOtraPoblacion = distintos.filter(
    (pais) => pais.poblacion !== primero.poblacion,
  );
  const candidatos = conOtraPoblacion.length > 0 ? conOtraPoblacion : distintos;
  const segundo = candidatos[indiceAlAzar(candidatos.length)];

  // El más poblado no tiene que caer siempre a la izquierda.
  return Math.random() < 0.5
    ? { paisA: primero, paisB: segundo }
    : { paisA: segundo, paisB: primero };
}

export function resolverRespuesta(paisA, paisB, elegido) {
  const poblacionMaxima = Math.max(paisA.poblacion, paisB.poblacion);
  const ganador = paisA.poblacion >= paisB.poblacion ? paisA : paisB;
  const acierto = elegido.poblacion === poblacionMaxima;

  return {
    ganador,
    acierto,
    puntos: acierto ? PUNTOS_ACIERTO : 0,
  };
}

export function aplicarPuntaje(marcador, acierto) {
  return {
    puntaje: marcador.puntaje + (acierto ? PUNTOS_ACIERTO : 0),
    racha: acierto ? marcador.racha + 1 : 0,
    rondas: marcador.rondas + 1,
  };
}
