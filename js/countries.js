// Traduce la respuesta de la API a la estructura que usa el juego.
//
// Toda la forma anidada de REST Countries v5 (names.common, capitals[0].name,
// area.kilometers, currencies[], ...) queda encerrada acá. Si la API vuelve a
// cambiar, como pasó con la v3.1, solo hay que tocar este módulo.

// Devuelve el texto limpio o null. La API usa cadenas vacías para los datos que
// no tiene, y null es más fácil de detectar después con ?? y con if.
function textoONulo(valor) {
  if (typeof valor !== "string") {
    return null;
  }

  const limpio = valor.trim();
  return limpio === "" ? null : limpio;
}

function numeroONulo(valor) {
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

export function normalizarPais(datos) {
  return {
    nombre: textoONulo(datos?.names?.common) ?? "País sin nombre",
    nombreOficial: textoONulo(datos?.names?.official),

    // Cuatro territorios de reconocimiento parcial (Abkhazia, Northern Cyprus,
    // Somaliland y South Ossetia) traen estos códigos vacíos.
    alpha2: textoONulo(datos?.codes?.alpha_2),
    alpha3: textoONulo(datos?.codes?.alpha_3),

    // Bouvet Island y Heard Island declaran población 0; se guarda tal cual y
    // es el juego el que decide excluirlos de las rondas.
    poblacion: Number(datos?.population) || 0,

    region: textoONulo(datos?.region),
    subregion: textoONulo(datos?.subregion),
    continente: textoONulo(datos?.continents?.[0]),

    // La capital dejó de ser una cadena: ahora es un array de objetos.
    capital: textoONulo(datos?.capitals?.[0]?.name),
    areaKm2: numeroONulo(datos?.area?.kilometers),

    monedas: (datos?.currencies ?? []).map((moneda) => ({
      codigo: textoONulo(moneda?.code),
      nombre: textoONulo(moneda?.name) ?? "Moneda sin nombre",
      simbolo: textoONulo(moneda?.symbol),
    })),

    // De cada idioma solo interesa el nombre; el resto son códigos ISO.
    idiomas: (datos?.languages ?? [])
      .map((idioma) => textoONulo(idioma?.name))
      .filter(Boolean),

    husosHorarios: (datos?.timezones ?? []).map(textoONulo).filter(Boolean),

    // La API entrega los vecinos como códigos alpha-3; los nombres se resuelven
    // más abajo, cuando ya está el catálogo completo.
    codigosVecinos: (datos?.borders ?? []).map(textoONulo).filter(Boolean),
    vecinos: [],

    bandera: {
      emoji: textoONulo(datos?.flag?.emoji),
      png: textoONulo(datos?.flag?.url_png),
      svg: textoONulo(datos?.flag?.url_svg),
    },

    tipoGobierno: textoONulo(datos?.government_type),
  };
}

// Normaliza el catálogo entero y recién ahí traduce los códigos de los vecinos
// a nombres, porque para eso hace falta tener todos los países cargados.
export function normalizarPaises(datos) {
  const paises = datos.map(normalizarPais);

  const nombrePorCodigo = new Map(
    paises.filter((pais) => pais.alpha3).map((pais) => [pais.alpha3, pais.nombre]),
  );

  for (const pais of paises) {
    // Si un código no está en el catálogo, se muestra el código en crudo en
    // lugar de perder el dato.
    pais.vecinos = pais.codigosVecinos.map(
      (codigo) => nombrePorCodigo.get(codigo) ?? codigo,
    );
  }

  return paises;
}

function incluyeTexto(valor, consulta) {
  return Boolean(valor) && valor.toLowerCase().includes(consulta);
}

// Recorta el catálogo en memoria: no vuelve a pedir la API. La búsqueda mira
// el nombre común y el oficial; la región se compara tal como la entrega v5.
export function filtrarPaises(paises, region, busqueda) {
  const consulta = busqueda.trim().toLowerCase();

  return paises.filter((pais) => {
    if (pais.poblacion <= 0) {
      return false;
    }

    if (region !== "all" && pais.region !== region) {
      return false;
    }

    if (!consulta) {
      return true;
    }

    return incluyeTexto(pais.nombre, consulta) || incluyeTexto(pais.nombreOficial, consulta);
  });
}
