export const CAMPOS_IMPORTACAO = [
  {
    chave: "tipo_diligencia",
    rotulo: "TIPO DA DILIGÊNCIA",
    obrigatorio: true,
  },
  {
    chave: "modalidade",
    rotulo: "MODALIDADE",
    obrigatorio: true,
  },
  {
    chave: "numero_processo",
    rotulo: "NÚMERO DO PROCESSO",
    obrigatorio: true,
  },
  {
    chave: "parte_autora",
    rotulo: "PARTE AUTORA",
    obrigatorio: true,
  },
  {
    chave: "parte_re",
    rotulo: "PARTE RÉ",
    obrigatorio: true,
  },
  {
    chave: "data_diligencia",
    rotulo: "DATA",
    obrigatorio: true,
  },
  {
    chave: "horario",
    rotulo: "HORÁRIO",
    obrigatorio: true,
  },
  {
    chave: "vara",
    rotulo: "VARA / UNIDADE",
    obrigatorio: true,
  },
  {
    chave: "comarca",
    rotulo: "COMARCA / CIDADE",
    obrigatorio: true,
  },
  {
    chave: "uf",
    rotulo: "UF",
    obrigatorio: true,
  },
  {
    chave: "local",
    rotulo: "LOCAL",
    obrigatorio: false,
  },
  {
    chave: "observacoes",
    rotulo: "OBSERVAÇÕES",
    obrigatorio: false,
  },
] as const;

export type ChaveCampoImportacao =
  (typeof CAMPOS_IMPORTACAO)[number]["chave"];

export type ValoresLinhaImportacao =
  Record<ChaveCampoImportacao, string>;

export const TEXTO_LINHA_EXEMPLO =
  "LINHA DE EXEMPLO — EXCLUA ESTA LINHA ANTES DE IMPORTAR";

export const LINHA_EXEMPLO: ValoresLinhaImportacao = {
  tipo_diligencia: "AUDIÊNCIA INICIAL",
  modalidade: "VIRTUAL",
  numero_processo: "0001234-56.2026.5.06.0001",
  parte_autora: "JOÃO DA SILVA",
  parte_re: "EMPRESA EXEMPLO LTDA",
  data_diligencia: "15/10/2026",
  horario: "09:30",
  vara: "1ª VARA DO TRABALHO DO RECIFE",
  comarca: "RECIFE",
  uf: "PE",
  local: "LINK A INFORMAR",
  observacoes: TEXTO_LINHA_EXEMPLO,
};

const UFS_POR_ENTRADA: Record<string, string> = {
  AC: "AC",
  ACRE: "AC",

  AL: "AL",
  ALAGOAS: "AL",

  AP: "AP",
  AMAPA: "AP",

  AM: "AM",
  AMAZONAS: "AM",

  BA: "BA",
  BAHIA: "BA",

  CE: "CE",
  CEARA: "CE",

  DF: "DF",
  "DISTRITO FEDERAL": "DF",

  ES: "ES",
  "ESPIRITO SANTO": "ES",

  GO: "GO",
  GOIAS: "GO",

  MA: "MA",
  MARANHAO: "MA",

  MT: "MT",
  "MATO GROSSO": "MT",

  MS: "MS",
  "MATO GROSSO DO SUL": "MS",

  MG: "MG",
  "MINAS GERAIS": "MG",

  PA: "PA",
  PARA: "PA",

  PB: "PB",
  PARAIBA: "PB",

  PR: "PR",
  PARANA: "PR",

  PE: "PE",
  PERNAMBUCO: "PE",

  PI: "PI",
  PIAUI: "PI",

  RJ: "RJ",
  "RIO DE JANEIRO": "RJ",

  RN: "RN",
  "RIO GRANDE DO NORTE": "RN",

  RS: "RS",
  "RIO GRANDE DO SUL": "RS",

  RO: "RO",
  RONDONIA: "RO",

  RR: "RR",
  RORAIMA: "RR",

  SC: "SC",
  "SANTA CATARINA": "SC",

  SP: "SP",
  "SAO PAULO": "SP",

  SE: "SE",
  SERGIPE: "SE",

  TO: "TO",
  TOCANTINS: "TO",
};

function normalizarTextoComparacao(
  valor: unknown
) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizarCabecalho(
  valor: unknown
) {
  return normalizarTextoComparacao(valor);
}

export function validarCabecalhosModelo(
  cabecalhos: unknown[]
) {
  const divergencias: string[] = [];

  CAMPOS_IMPORTACAO.forEach(
    (campo, indice) => {
      const recebido =
        normalizarCabecalho(
          cabecalhos[indice]
        );

      const esperado =
        normalizarCabecalho(
          campo.rotulo
        );

      if (recebido !== esperado) {
        divergencias.push(
          campo.rotulo
        );
      }
    }
  );

  return {
    valido: divergencias.length === 0,
    divergencias,
  };
}

export function normalizarNumeroProcesso(
  valor: string
) {
  return valor.replace(/\D/g, "");
}

export function processoTemFormatoValido(
  valor: string
) {
  return (
    normalizarNumeroProcesso(valor).length ===
    20
  );
}

export function normalizarModalidadeImportacao(
  valor: string
) {
  return valor
    .trim()
    .toUpperCase();
}

export function modalidadeEhValida(
  valor: string
) {
  const modalidade =
    normalizarModalidadeImportacao(
      valor
    );

  return (
    modalidade === "PRESENCIAL" ||
    modalidade === "VIRTUAL"
  );
}

export function normalizarUfImportacao(
  valor: string
): string | null {
  const entrada =
    normalizarTextoComparacao(
      valor
    );

  if (!entrada) {
    return null;
  }

  return (
    UFS_POR_ENTRADA[
      entrada
    ] ?? null
  );
}

export function ufEhValida(
  valor: string
) {
  return (
    normalizarUfImportacao(
      valor
    ) !== null
  );
}

export function normalizarDataImportacao(
  valor: string
): string | null {
  const texto =
    valor.trim();

  let dia: number;
  let mes: number;
  let ano: number;

  let correspondencia =
    texto.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
    );

  if (correspondencia) {
    dia = Number(
      correspondencia[1]
    );

    mes = Number(
      correspondencia[2]
    );

    ano = Number(
      correspondencia[3]
    );
  } else {
    correspondencia =
      texto.match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/
      );

    if (!correspondencia) {
      return null;
    }

    ano = Number(
      correspondencia[1]
    );

    mes = Number(
      correspondencia[2]
    );

    dia = Number(
      correspondencia[3]
    );
  }

  if (
    ano < 1900 ||
    ano > 2200 ||
    mes < 1 ||
    mes > 12 ||
    dia < 1
  ) {
    return null;
  }

  const ultimoDiaMes =
    new Date(
      ano,
      mes,
      0
    ).getDate();

  if (
    dia >
    ultimoDiaMes
  ) {
    return null;
  }

  return `${String(
    dia
  ).padStart(
    2,
    "0"
  )}/${String(
    mes
  ).padStart(
    2,
    "0"
  )}/${ano}`;
}

export function dataEhValida(
  valor: string
) {
  return (
    normalizarDataImportacao(
      valor
    ) !== null
  );
}

export function normalizarHorarioImportacao(
  valor: string
): string | null {
  const texto =
    valor.trim();

  const correspondencia =
    texto.match(
      /^(\d{1,2}):(\d{2})(?::\d{2})?$/
    );

  if (!correspondencia) {
    return null;
  }

  const horas =
    Number(
      correspondencia[1]
    );

  const minutos =
    Number(
      correspondencia[2]
    );

  if (
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  ) {
    return null;
  }

  return `${String(
    horas
  ).padStart(
    2,
    "0"
  )}:${String(
    minutos
  ).padStart(
    2,
    "0"
  )}`;
}

export function horarioEhValido(
  valor: string
) {
  return (
    normalizarHorarioImportacao(
      valor
    ) !== null
  );
}

export function ehLinhaExemplo(
  valores:
    ValoresLinhaImportacao
) {
  const processo =
    normalizarNumeroProcesso(
      valores.numero_processo
    );

  const processoExemplo =
    normalizarNumeroProcesso(
      LINHA_EXEMPLO
        .numero_processo
    );

  const observacoes =
    normalizarTextoComparacao(
      valores.observacoes
    );

  return (
    processo ===
      processoExemplo &&
    observacoes.includes(
      "LINHA DE EXEMPLO"
    )
  );
}