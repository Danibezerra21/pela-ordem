"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";

import * as XLSX from "xlsx";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  FileSpreadsheet,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import {
  analisarImportacaoNoBanco,
  importarPauta,
  registrarEventoImportacao,
  type AlertaBancoImportacao,
  type ConfirmacaoBancoImportacao,
  type EventoAuditoriaImportacao,
  type LinhaImportacaoEntrada,
} from "./actions";

import {
  CAMPOS_IMPORTACAO,
  LINHA_EXEMPLO,
  TEXTO_LINHA_EXEMPLO,
  dataEhValida,
  ehLinhaExemplo,
  horarioEhValido,
  modalidadeEhValida,
  normalizarDataImportacao,
  normalizarHorarioImportacao,
  normalizarNumeroProcesso,
  normalizarUfImportacao,
  processoTemFormatoValido,
  ufEhValida,
  validarCabecalhosModelo,
  type ChaveCampoImportacao,
  type ValoresLinhaImportacao,
} from "./configuracao";

type LinhaPlanilha = {
  linhaExcel: number;

  dados:
    ValoresLinhaImportacao;

  exemplo:
    boolean;
};

type SituacaoLinha =
  | "pronta"
  | "alerta"
  | "erro"
  | "descartada";

type LinhaAnalisada =
  LinhaPlanilha & {
    erros: string[];

    alertas: string[];

    situacao:
      SituacaoLinha;
  };

type FiltroTabela =
  | "todas"
  | "pronta"
  | "alerta"
  | "erro"
  | "descartada";

type DecisaoBanco =
  "importar" |
  "descartar";

const TAMANHO_MAXIMO_ARQUIVO =
  20 * 1024 * 1024;

const LINHAS_POR_PAGINA =
  50;

/* =====================================================
   LEITURA DO EXCEL
===================================================== */

function valorParaTexto(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  return String(
    valor
  ).trim();
}

function formatarDataExcel(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "";
  }

  if (
    valor instanceof Date
  ) {
    const dia =
      String(
        valor.getDate()
      ).padStart(
        2,
        "0"
      );

    const mes =
      String(
        valor.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const ano =
      valor.getFullYear();

    return `${dia}/${mes}/${ano}`;
  }

  if (
    typeof valor === "number"
  ) {
    const data =
      XLSX.SSF
        .parse_date_code(
          valor
        );

    if (data) {
      return `${String(
        data.d
      ).padStart(
        2,
        "0"
      )}/${String(
        data.m
      ).padStart(
        2,
        "0"
      )}/${data.y}`;
    }
  }

  return valorParaTexto(
    valor
  );
}

function formatarHorarioExcel(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "";
  }

  if (
    valor instanceof Date
  ) {
    return `${String(
      valor.getHours()
    ).padStart(
      2,
      "0"
    )}:${String(
      valor.getMinutes()
    ).padStart(
      2,
      "0"
    )}`;
  }

  if (
    typeof valor === "number"
  ) {
    const fracao =
      valor -
      Math.floor(
        valor
      );

    const minutosTotais =
      Math.round(
        fracao *
          24 *
          60
      );

    const horas =
      Math.floor(
        minutosTotais /
          60
      ) % 24;

    const minutos =
      minutosTotais %
      60;

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

  return valorParaTexto(
    valor
  );
}

function formatarValorCampo(
  chave:
    ChaveCampoImportacao,
  valor: unknown
) {
  if (
    chave ===
    "data_diligencia"
  ) {
    return formatarDataExcel(
      valor
    );
  }

  if (
    chave ===
    "horario"
  ) {
    return formatarHorarioExcel(
      valor
    );
  }

  if (
    chave ===
    "uf"
  ) {
    const texto =
      valorParaTexto(
        valor
      );

    const uf =
      normalizarUfImportacao(
        texto
      );

    return (
      uf ??
      texto.toUpperCase()
    );
  }

  return valorParaTexto(
    valor
  );
}

function montarValoresLinha(
  valores: unknown[]
): ValoresLinhaImportacao {
  return Object.fromEntries(
    CAMPOS_IMPORTACAO.map(
      (
        campo,
        indice
      ) => [
        campo.chave,

        formatarValorCampo(
          campo.chave,
          valores[
            indice
          ]
        ),
      ]
    )
  ) as ValoresLinhaImportacao;
}

/* =====================================================
   MODELO
===================================================== */

function baixarModeloPauta() {
  const cabecalhos =
    CAMPOS_IMPORTACAO.map(
      (campo) =>
        campo.rotulo
    );

  const linhaExemplo =
    CAMPOS_IMPORTACAO.map(
      (campo) =>
        LINHA_EXEMPLO[
          campo.chave
        ]
    );

  const planilhaPauta =
    XLSX.utils.aoa_to_sheet(
      [
        cabecalhos,
        linhaExemplo,
      ]
    );

  planilhaPauta[
    "!cols"
  ] = [
    { wch: 24 },
    { wch: 16 },
    { wch: 28 },
    { wch: 28 },
    { wch: 32 },
    { wch: 14 },
    { wch: 12 },
    { wch: 36 },
    { wch: 24 },
    { wch: 20 },
    { wch: 34 },
    { wch: 56 },
  ];

  planilhaPauta[
    "!autofilter"
  ] = {
    ref: `A1:${XLSX.utils.encode_col(
      cabecalhos.length -
        1
    )}2`,
  };

  const instrucoes = [
    [
      "MODELO DE IMPORTAÇÃO DE PAUTA — NOTE LITIS",
    ],

    [""],

    [
      "1.",
      "Preencha uma diligência por linha.",
    ],

    [
      "2.",
      "Não altere os nomes ou a ordem das colunas da aba PAUTA.",
    ],

    [
      "3.",
      "A linha preenchida na aba PAUTA é apenas um exemplo e deve ser excluída antes da importação.",
    ],

    [
      "4.",
      "Se a linha de exemplo permanecer exatamente como fornecida, o NOTE LITIS irá desconsiderá-la automaticamente.",
    ],

    [
      "5.",
      "Campos obrigatórios: tipo da diligência, modalidade, número do processo, parte autora, parte ré, data, horário, vara/unidade, comarca/cidade e UF.",
    ],

    [
      "6.",
      "Os campos LOCAL e OBSERVAÇÕES são opcionais.",
    ],

    [
      "7.",
      "No campo MODALIDADE utilize PRESENCIAL ou VIRTUAL.",
    ],

    [
      "8.",
      "No campo UF você pode informar a sigla ou o nome completo do estado.",
    ],

    [
      "9.",
      "O NOTE LITIS padronizará automaticamente o estado para a sigla oficial.",
    ],

    [
      "10.",
      "Não renomeie a aba PAUTA.",
    ],

    [""],

    [
      "IMPORTANTE",
      TEXTO_LINHA_EXEMPLO,
    ],
  ];

  const planilhaInstrucoes =
    XLSX.utils.aoa_to_sheet(
      instrucoes
    );

  planilhaInstrucoes[
    "!cols"
  ] = [
    { wch: 18 },
    { wch: 110 },
  ];

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    planilhaPauta,
    "PAUTA"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    planilhaInstrucoes,
    "INSTRUCOES"
  );

  workbook.Props = {
    Title:
      "Modelo de Importação de Pauta - NOTE LITIS",

    Subject:
      "Importação de diligências",

    Author:
      "NOTE LITIS",

    Company:
      "Encontre Correspondente",
  };

  XLSX.writeFile(
    workbook,
    "modelo-importacao-pauta-note-litis.xlsx",
    {
      compression:
        true,
    }
  );
}

/* =====================================================
   VALIDAÇÃO LOCAL
===================================================== */

function analisarErrosBasicos(
  dados:
    ValoresLinhaImportacao
) {
  const erros:
    string[] = [];

  CAMPOS_IMPORTACAO
    .filter(
      (campo) =>
        campo.obrigatorio
    )
    .forEach(
      (campo) => {
        if (
          !dados[
            campo.chave
          ].trim()
        ) {
          erros.push(
            `${campo.rotulo}: informação obrigatória não preenchida.`
          );
        }
      }
    );

  if (
    dados.numero_processo &&
    !processoTemFormatoValido(
      dados.numero_processo
    )
  ) {
    erros.push(
      "NÚMERO DO PROCESSO: informe um número processual com 20 dígitos."
    );
  }

  if (
    dados.modalidade &&
    !modalidadeEhValida(
      dados.modalidade
    )
  ) {
    erros.push(
      "MODALIDADE: utilize PRESENCIAL ou VIRTUAL."
    );
  }

  if (
    dados.data_diligencia &&
    !dataEhValida(
      dados.data_diligencia
    )
  ) {
    erros.push(
      "DATA: informe uma data válida."
    );
  }

  if (
    dados.horario &&
    !horarioEhValido(
      dados.horario
    )
  ) {
    erros.push(
      "HORÁRIO: informe um horário válido."
    );
  }

  if (
    dados.uf &&
    !ufEhValida(
      dados.uf
    )
  ) {
    erros.push(
      "UF: informe uma sigla ou nome de estado válido."
    );
  }

  return erros;
}

function chaveAto(
  linha:
    LinhaPlanilha
) {
  const processo =
    normalizarNumeroProcesso(
      linha.dados
        .numero_processo
    );

  const data =
    normalizarDataImportacao(
      linha.dados
        .data_diligencia
    );

  const horario =
    normalizarHorarioImportacao(
      linha.dados
        .horario
    );

  if (
    processo.length !==
      20 ||
    !data ||
    !horario
  ) {
    return null;
  }

  return `${processo}|${data}|${horario}`;
}

function formatarProcesso(
  valor: string
) {
  const numero =
    normalizarNumeroProcesso(
      valor
    );

  if (
    numero.length !== 20
  ) {
    return valor;
  }

  return (
    `${numero.slice(0, 7)}-` +
    `${numero.slice(7, 9)}.` +
    `${numero.slice(9, 13)}.` +
    `${numero.slice(13, 14)}.` +
    `${numero.slice(14, 16)}.` +
    `${numero.slice(16, 20)}`
  );
}

function formatarDataBanco(
  valor: string
) {
  const [
    ano,
    mes,
    dia,
  ] =
    valor.split("-");

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return valor;
  }

  return `${dia}/${mes}/${ano}`;
}

/* =====================================================
   COMPONENTE
===================================================== */

export function ImportadorPauta() {
  const inputArquivoRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    nomeArquivo,
    setNomeArquivo,
  ] =
    useState("");

  const [
    linhas,
    setLinhas,
  ] =
    useState<
      LinhaPlanilha[]
    >([]);

  const [
    arquivoValido,
    setArquivoValido,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState<string | null>(
      null
    );

  const [
    descartadas,
    setDescartadas,
  ] =
    useState<
      Set<number>
    >(
      new Set()
    );

  const [
    alertasArquivoConfirmados,
    setAlertasArquivoConfirmados,
  ] =
    useState<
      Set<number>
    >(
      new Set()
    );

  const [
    linhaEmEdicao,
    setLinhaEmEdicao,
  ] =
    useState<number | null>(
      null
    );

  const [
    dadosEdicao,
    setDadosEdicao,
  ] =
    useState<
      ValoresLinhaImportacao | null
    >(
      null
    );

  const [
    filtro,
    setFiltro,
  ] =
    useState<FiltroTabela>(
      "todas"
    );

  const [
    pagina,
    setPagina,
  ] =
    useState(1);

  const [
    verificandoBanco,
    setVerificandoBanco,
  ] =
    useState(false);

  const [
    analiseBancoRealizada,
    setAnaliseBancoRealizada,
  ] =
    useState(false);

  const [
    alertasBanco,
    setAlertasBanco,
  ] =
    useState<
      AlertaBancoImportacao[]
    >([]);

  const [
    decisoesBanco,
    setDecisoesBanco,
  ] =
    useState<
      Record<
        number,
        DecisaoBanco
      >
    >({});

  const [
    mensagemBanco,
    setMensagemBanco,
  ] =
    useState<string | null>(
      null
    );

  const [
    erroServidor,
    setErroServidor,
  ] =
    useState<string | null>(
      null
    );

  const [
    importando,
    setImportando,
  ] =
    useState(false);

  const [
    importacaoConcluida,
    setImportacaoConcluida,
  ] =
    useState(false);

  const [
    quantidadeImportada,
    setQuantidadeImportada,
  ] =
    useState(0);

  /* ===================================================
     RESET DA CONFERÊNCIA DO BANCO
  =================================================== */

  function invalidarAnaliseBanco() {
    setAnaliseBancoRealizada(
      false
    );

    setAlertasBanco(
      []
    );

    setDecisoesBanco(
      {}
    );

    setMensagemBanco(
      null
    );

    setErroServidor(
      null
    );
  }

  async function auditarImportacao(
  evento:
    Omit<
      EventoAuditoriaImportacao,
      "arquivo"
    >
) {
  const resultado =
    await registrarEventoImportacao({
      ...evento,

      arquivo:
        nomeArquivo,
    });


  if (
    resultado.status ===
    "erro"
  ) {
    setErroServidor(
      resultado.mensagem
    );

    return false;
  }


  setErroServidor(
    null
  );

  return true;
}

  function limparArquivo() {
    setNomeArquivo("");
    setLinhas([]);
    setArquivoValido(false);
    setErro(null);

    setDescartadas(
      new Set()
    );

    setAlertasArquivoConfirmados(
      new Set()
    );

    setLinhaEmEdicao(
      null
    );

    setDadosEdicao(
      null
    );

    setFiltro(
      "todas"
    );

    setPagina(1);

    invalidarAnaliseBanco();

    setImportacaoConcluida(
      false
    );

    setQuantidadeImportada(
      0
    );

    if (
      inputArquivoRef.current
    ) {
      inputArquivoRef.current.value =
        "";
    }
  }

  /* ===================================================
     ARQUIVO
  =================================================== */

  async function selecionarArquivo(
    event:
      React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivo =
      event.target
        .files?.[0];

    if (!arquivo) {
      return;
    }

    setErro(null);
    setArquivoValido(false);
    setLinhas([]);

    setDescartadas(
      new Set()
    );

    setAlertasArquivoConfirmados(
      new Set()
    );

    invalidarAnaliseBanco();

    setImportacaoConcluida(
      false
    );

    setQuantidadeImportada(
      0
    );

    const nomeMinusculo =
      arquivo.name
        .toLowerCase();

    if (
      !nomeMinusculo.endsWith(
        ".xlsx"
      ) &&
      !nomeMinusculo.endsWith(
        ".xls"
      )
    ) {
      setErro(
        "Selecione o modelo de pauta do NOTE LITIS em formato .xlsx ou .xls."
      );

      event.target.value =
        "";

      return;
    }

    if (
      arquivo.size >
      TAMANHO_MAXIMO_ARQUIVO
    ) {
      setErro(
        "O arquivo excede o limite de 20 MB."
      );

      event.target.value =
        "";

      return;
    }

    try {
      const buffer =
        await arquivo.arrayBuffer();

      const workbook =
        XLSX.read(
          buffer,
          {
            type: "array",
            cellDates: true,
          }
        );

      const planilha =
        workbook.Sheets[
          "PAUTA"
        ];

      if (!planilha) {
        setNomeArquivo(
          arquivo.name
        );

        setErro(
          "A planilha não corresponde ao modelo do NOTE LITIS. Não encontramos a aba PAUTA."
        );

        return;
      }

      const matriz =
        XLSX.utils.sheet_to_json<
          unknown[]
        >(
          planilha,
          {
            header: 1,
            defval: "",
            raw: true,
          }
        );

      if (
        matriz.length === 0
      ) {
        setNomeArquivo(
          arquivo.name
        );

        setErro(
          "A aba PAUTA está vazia."
        );

        return;
      }

      const cabecalhos =
        matriz[0] ?? [];

      const validacao =
        validarCabecalhosModelo(
          cabecalhos
        );

      if (
        !validacao.valido
      ) {
        setNomeArquivo(
          arquivo.name
        );

        setErro(
          `A planilha não corresponde ao modelo do NOTE LITIS. Revise as colunas: ${validacao.divergencias.join(
            ", "
          )}.`
        );

        return;
      }

      const linhasLidas =
        matriz
          .slice(1)
          .map(
            (
              valores,
              indice
            ) => {
              const dados =
                montarValoresLinha(
                  valores
                );

              return {
                linhaExcel:
                  indice + 2,

                dados,

                exemplo:
                  ehLinhaExemplo(
                    dados
                  ),
              };
            }
          )
          .filter(
            (linha) =>
              Object.values(
                linha.dados
              ).some(
                (valor) =>
                  valor.trim() !==
                  ""
              )
          );

      setNomeArquivo(
        arquivo.name
      );

      setLinhas(
        linhasLidas
      );

      setArquivoValido(
        true
      );

      setPagina(1);
    } catch {
      setNomeArquivo(
        arquivo.name
      );

      setArquivoValido(
        false
      );

      setLinhas([]);

      setErro(
        "Não foi possível ler o arquivo. Verifique se você está utilizando o modelo de pauta do NOTE LITIS."
      );
    }
  }

  /* ===================================================
     LINHAS BASE
  =================================================== */

  const linhasExemplo =
    useMemo(
      () =>
        linhas.filter(
          (linha) =>
            linha.exemplo
        ),
      [linhas]
    );

  const linhasUteis =
    useMemo(
      () =>
        linhas.filter(
          (linha) =>
            !linha.exemplo
        ),
      [linhas]
    );

  const linhasAtivas =
    useMemo(
      () =>
        linhasUteis.filter(
          (linha) =>
            !descartadas.has(
              linha.linhaExcel
            )
        ),
      [
        linhasUteis,
        descartadas,
      ]
    );

  /* ===================================================
     ANÁLISE LOCAL
  =================================================== */

  const linhasAnalisadasAtivas =
    useMemo<
      LinhaAnalisada[]
    >(
      () => {
        const porProcesso =
          new Map<
            string,
            LinhaPlanilha[]
          >();

        const porAto =
          new Map<
            string,
            LinhaPlanilha[]
          >();

        for (
          const linha of
          linhasAtivas
        ) {
          const processo =
            normalizarNumeroProcesso(
              linha.dados
                .numero_processo
            );

          if (
            processo.length ===
            20
          ) {
            const existentes =
              porProcesso.get(
                processo
              ) ?? [];

            existentes.push(
              linha
            );

            porProcesso.set(
              processo,
              existentes
            );
          }

          const ato =
            chaveAto(
              linha
            );

          if (ato) {
            const existentes =
              porAto.get(
                ato
              ) ?? [];

            existentes.push(
              linha
            );

            porAto.set(
              ato,
              existentes
            );
          }
        }

        return linhasAtivas.map(
          (linha) => {
            const erros =
              analisarErrosBasicos(
                linha.dados
              );

            const alertas:
              string[] = [];

            const processo =
              normalizarNumeroProcesso(
                linha.dados
                  .numero_processo
              );

            const ato =
              chaveAto(
                linha
              );

            const repeticoesAto =
              ato
                ? porAto.get(
                    ato
                  ) ?? []
                : [];

            if (
              repeticoesAto
                .length > 1
            ) {
              const outras =
                repeticoesAto
                  .filter(
                    (item) =>
                      item.linhaExcel !==
                      linha.linhaExcel
                  )
                  .map(
                    (item) =>
                      item.linhaExcel
                  );

              alertas.push(
                `Possível duplicidade: mesmo processo, data e horário também aparecem na linha ${outras.join(
                  ", "
                )}.`
              );
            } else if (
              processo.length ===
              20
            ) {
              const repeticoes =
                porProcesso.get(
                  processo
                ) ?? [];

              if (
                repeticoes.length > 1
              ) {
                const outras =
                  repeticoes
                    .filter(
                      (item) =>
                        item.linhaExcel !==
                        linha.linhaExcel
                    )
                    .map(
                      (item) =>
                        item.linhaExcel
                    );

                alertas.push(
                  `Este processo também aparece na linha ${outras.join(
                    ", "
                  )}. Confira se são diligências distintas.`
                );
              }
            }

            const situacao:
              SituacaoLinha =
              erros.length > 0
                ? "erro"
                : alertas.length > 0
                  ? "alerta"
                  : "pronta";

            return {
              ...linha,
              erros,
              alertas,
              situacao,
            };
          }
        );
      },
      [
        linhasAtivas,
      ]
    );

  const mapaAtivas =
    useMemo(
      () =>
        new Map(
          linhasAnalisadasAtivas.map(
            (linha) => [
              linha.linhaExcel,
              linha,
            ]
          )
        ),
      [
        linhasAnalisadasAtivas,
      ]
    );

  const linhasParaTabela =
    useMemo<
      LinhaAnalisada[]
    >(
      () =>
        linhasUteis.map(
          (linha) => {
            if (
              descartadas.has(
                linha.linhaExcel
              )
            ) {
              return {
                ...linha,

                erros: [],

                alertas: [],

                situacao:
                  "descartada",
              };
            }

            return (
              mapaAtivas.get(
                linha.linhaExcel
              ) ?? {
                ...linha,

                erros: [],

                alertas: [],

                situacao:
                  "pronta",
              }
            );
          }
        ),
      [
        linhasUteis,
        descartadas,
        mapaAtivas,
      ]
    );

  const linhasProntas =
    linhasAnalisadasAtivas.filter(
      (linha) =>
        linha.situacao ===
        "pronta"
    );

  const linhasComAlertas =
    linhasAnalisadasAtivas.filter(
      (linha) =>
        linha.situacao ===
        "alerta"
    );

  const linhasComErros =
    linhasAnalisadasAtivas.filter(
      (linha) =>
        linha.situacao ===
        "erro"
    );

  const alertasPendentes =
    linhasComAlertas.filter(
      (linha) =>
        !alertasArquivoConfirmados.has(
          linha.linhaExcel
        )
    );

  /* ===================================================
     FILTRO / PAGINAÇÃO
  =================================================== */

  const linhasFiltradas =
    useMemo(
      () =>
        filtro === "todas"
          ? linhasParaTabela
          : linhasParaTabela.filter(
              (linha) =>
                linha.situacao ===
                filtro
            ),
      [
        linhasParaTabela,
        filtro,
      ]
    );

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        linhasFiltradas.length /
          LINHAS_POR_PAGINA
      )
    );

  const paginaSegura =
    Math.min(
      pagina,
      totalPaginas
    );

  const linhasPagina =
    linhasFiltradas.slice(
      (paginaSegura - 1) *
        LINHAS_POR_PAGINA,

      paginaSegura *
        LINHAS_POR_PAGINA
    );

  /* ===================================================
     EDIÇÃO
  =================================================== */

  function abrirEdicao(
    linha:
      LinhaPlanilha
  ) {
    if (
      importacaoConcluida
    ) {
      return;
    }

    setLinhaEmEdicao(
      linha.linhaExcel
    );

    setDadosEdicao({
      ...linha.dados,
    });
  }

  function fecharEdicao() {
    setLinhaEmEdicao(
      null
    );

    setDadosEdicao(
      null
    );
  }

  function alterarCampoEdicao(
    campo:
      ChaveCampoImportacao,
    valor:
      string
  ) {
    setDadosEdicao(
      (anterior) => {
        if (!anterior) {
          return anterior;
        }

        return {
          ...anterior,
          [campo]: valor,
        };
      }
    );
  }

  async function salvarEdicao() {
  if (
    linhaEmEdicao ===
      null ||
    !dadosEdicao
  ) {
    return;
  }


  const linhaAnterior =
    linhas.find(
      (linha) =>
        linha.linhaExcel ===
        linhaEmEdicao
    );


  if (!linhaAnterior) {
    setErroServidor(
      "Não foi possível identificar a linha que está sendo corrigida."
    );

    return;
  }


  const uf =
    normalizarUfImportacao(
      dadosEdicao.uf
    );


  const novosDados = {
    ...dadosEdicao,

    modalidade:
      dadosEdicao
        .modalidade
        .trim()
        .toUpperCase(),

    uf:
      uf ??
      dadosEdicao
        .uf
        .trim()
        .toUpperCase(),
  };


  const auditada =
    await auditarImportacao({
      acao:
        "IMPORTACAO_LINHA_CORRIGIDA",

      linhaExcel:
        linhaEmEdicao,

      dadosAnteriores:
        {
          ...linhaAnterior
            .dados,
        },

      dadosNovos:
        {
          ...novosDados,
        },

      contexto: {
        decisao:
          "CORRIGIR",

        alerta_arquivo_confirmado_antes:
          alertasArquivoConfirmados.has(
            linhaEmEdicao
          ),
      },
    });


  if (!auditada) {
    return;
  }


  setLinhas(
    (anteriores) =>
      anteriores.map(
        (linha) =>
          linha.linhaExcel ===
          linhaEmEdicao
            ? {
                ...linha,

                dados:
                  novosDados,
              }
            : linha
      )
  );


  setAlertasArquivoConfirmados(
    (anteriores) => {
      const novo =
        new Set(
          anteriores
        );

      novo.delete(
        linhaEmEdicao
      );

      return novo;
    }
  );


  invalidarAnaliseBanco();

  fecharEdicao();

  setPagina(1);
}

  /* ===================================================
     DESCARTE
  =================================================== */

  async function descartarLinha(
  linhaExcel:
    number
) {
  const linha =
    linhasParaTabela.find(
      (item) =>
        item.linhaExcel ===
        linhaExcel
    );


  if (!linha) {
    return;
  }


  const auditada =
    await auditarImportacao({
      acao:
        "IMPORTACAO_LINHA_DESCARTADA",

      linhaExcel,

      dadosAnteriores: {
        ...linha.dados,
      },

      dadosNovos:
        null,

      contexto: {
        decisao:
          "DESCARTAR",

        situacao:
          linha.situacao,

        erros:
          linha.erros,

        alertas:
          linha.alertas,

        alerta_arquivo_confirmado_antes:
          alertasArquivoConfirmados.has(
            linhaExcel
          ),
      },
    });


  if (!auditada) {
    return;
  }


  setDescartadas(
    (anteriores) => {
      const novo =
        new Set(
          anteriores
        );

      novo.add(
        linhaExcel
      );

      return novo;
    }
  );


  setAlertasArquivoConfirmados(
    (anteriores) => {
      const novo =
        new Set(
          anteriores
        );

      novo.delete(
        linhaExcel
      );

      return novo;
    }
  );


  invalidarAnaliseBanco();
}

  async function restaurarLinha(
  linhaExcel:
    number
) {
  const linha =
    linhasParaTabela.find(
      (item) =>
        item.linhaExcel ===
        linhaExcel
    );


  if (!linha) {
    return;
  }


  const auditada =
    await auditarImportacao({
      acao:
        "IMPORTACAO_LINHA_RESTAURADA",

      linhaExcel,

      dadosAnteriores:
        null,

      dadosNovos: {
        ...linha.dados,
      },

      contexto: {
        decisao:
          "RESTAURAR",
      },
    });


  if (!auditada) {
    return;
  }


  setDescartadas(
    (anteriores) => {
      const novo =
        new Set(
          anteriores
        );

      novo.delete(
        linhaExcel
      );

      return novo;
    }
  );


  invalidarAnaliseBanco();
}

  /* ===================================================
     CONFIRMAÇÃO DE ALERTA DO EXCEL
  =================================================== */

  async function confirmarAlertaArquivo(
  linhaExcel:
    number
) {
  const linha =
    linhasAnalisadasAtivas.find(
      (item) =>
        item.linhaExcel ===
        linhaExcel
    );


  if (!linha) {
    return;
  }


  const auditada =
    await auditarImportacao({
      acao:
        "IMPORTACAO_ALERTA_ARQUIVO_CONFIRMADO",

      linhaExcel,

      dadosAnteriores: {
        ...linha.dados,
      },

      contexto: {
        decisao:
          "IMPORTAR_MESMO_ASSIM",

        alertas_apresentados:
          linha.alertas,
      },
    });


  if (!auditada) {
    return;
  }


  setAlertasArquivoConfirmados(
    (anteriores) => {
      const novo =
        new Set(
          anteriores
        );

      novo.add(
        linhaExcel
      );

      return novo;
    }
  );
}

  async function retirarConfirmacaoAlertaArquivo(
  linhaExcel:
    number
) {
  const linha =
    linhasAnalisadasAtivas.find(
      (item) =>
        item.linhaExcel ===
        linhaExcel
    );


  if (!linha) {
    return;
  }


  const auditada =
    await auditarImportacao({
      acao:
        "IMPORTACAO_ALERTA_ARQUIVO_DESCONFIRMADO",

      linhaExcel,

      dadosAnteriores: {
        ...linha.dados,
      },

      contexto: {
        decisao:
          "RETIRAR_CONFIRMACAO",

        alertas_apresentados:
          linha.alertas,
      },
    });


  if (!auditada) {
    return;
  }


  setAlertasArquivoConfirmados(
    (anteriores) => {
      const novo =
        new Set(
          anteriores
        );

      novo.delete(
        linhaExcel
      );

      return novo;
    }
  );


  invalidarAnaliseBanco();
}

  /* ===================================================
     PAYLOAD
  =================================================== */

  function montarLinhasServidor():
    LinhaImportacaoEntrada[] {
    return linhasAnalisadasAtivas.map(
      (linha) => ({
        linhaExcel:
          linha.linhaExcel,

        dados:
          linha.dados,

        alertaArquivoConfirmado:
          linha.alertas.length >
            0
            ? alertasArquivoConfirmados.has(
                linha.linhaExcel
              )
            : false,
      })
    );
  }

  /* ===================================================
     CONFERÊNCIA NO BANCO
  =================================================== */

  async function verificarBanco() {
    if (
      linhasComErros.length >
        0 ||
      alertasPendentes.length >
        0 ||
      linhasAnalisadasAtivas
        .length === 0
    ) {
      return;
    }

    setVerificandoBanco(
      true
    );

    setErroServidor(
      null
    );

    setMensagemBanco(
      null
    );

    try {
      const resultado =
        await analisarImportacaoNoBanco(
          montarLinhasServidor()
        );

      if (
        resultado.status ===
        "erro"
      ) {
        setErroServidor(
          [
            resultado.mensagem,
            ...resultado.erros,
          ].join("\n")
        );

        setAnaliseBancoRealizada(
          false
        );

        return;
      }

      setAlertasBanco(
        resultado
          .alertasBanco
      );

      setDecisoesBanco(
        {}
      );

      setMensagemBanco(
        resultado.mensagem
      );

      setAnaliseBancoRealizada(
        true
      );
    } catch (
      error
    ) {
      setErroServidor(
        error instanceof Error
          ? error.message
          : "Não foi possível verificar a pauta no banco de dados."
      );
    } finally {
      setVerificandoBanco(
        false
      );
    }
  }

  /* ===================================================
     DECISÕES DO BANCO
  =================================================== */

  async function decidirAlertaBanco(
  linhaExcel:
    number,

  decisao:
    DecisaoBanco
) {
  const alerta =
    alertasBanco.find(
      (item) =>
        item.linhaExcel ===
        linhaExcel
    );


  const linha =
    linhasAnalisadasAtivas.find(
      (item) =>
        item.linhaExcel ===
        linhaExcel
    );


  if (
    !alerta ||
    !linha
  ) {
    return;
  }


  const acao =
    decisao ===
    "importar"
      ? "IMPORTACAO_ALERTA_BANCO_IMPORTAR_CONFIRMADO"
      : "IMPORTACAO_ALERTA_BANCO_DESCARTADO";


  const auditada =
    await auditarImportacao({
      acao,

      linhaExcel,

      dadosAnteriores: {
        ...linha.dados,
      },

      contexto: {
        decisao:
          decisao ===
          "importar"
            ? "IMPORTAR_MESMO_ASSIM"
            : "DESCARTAR",

        decisao_anterior:
          decisoesBanco[
            linhaExcel
          ] ??
          null,

        processo:
          alerta.numeroProcesso,

        diligencias_apresentadas:
          alerta.diligencias,
      },
    });


  if (!auditada) {
    return;
  }


  setDecisoesBanco(
    (anterior) => ({
      ...anterior,

      [linhaExcel]:
        decisao,
    })
  );
}

  const todosAlertasBancoDecididos =
    alertasBanco.every(
      (alerta) =>
        Boolean(
          decisoesBanco[
            alerta.linhaExcel
          ]
        )
    );

  const linhasDescartadasNoBanco =
    alertasBanco.filter(
      (alerta) =>
        decisoesBanco[
          alerta.linhaExcel
        ] ===
        "descartar"
    );

  const quantidadeFinal =
    Math.max(
      0,

      linhasAnalisadasAtivas.length -
        linhasDescartadasNoBanco.length
    );

  /* ===================================================
     IMPORTAÇÃO FINAL
  =================================================== */

  async function concluirImportacao() {
    if (
      !analiseBancoRealizada ||
      !todosAlertasBancoDecididos ||
      quantidadeFinal === 0
    ) {
      return;
    }

    setImportando(
      true
    );

    setErroServidor(
      null
    );

    try {
      const linhasServidor =
        montarLinhasServidor();

      const descartadasBanco =
        new Set(
          linhasDescartadasNoBanco.map(
            (alerta) =>
              alerta.linhaExcel
          )
        );

      const linhasParaImportar =
        linhasServidor.filter(
          (linha) =>
            !descartadasBanco.has(
              linha.linhaExcel
            )
        );

      const confirmacoesBanco:
        ConfirmacaoBancoImportacao[] =
        alertasBanco
          .filter(
            (alerta) =>
              decisoesBanco[
                alerta.linhaExcel
              ] ===
              "importar"
          )
          .map(
            (alerta) => ({
              linhaExcel:
                alerta
                  .linhaExcel,

              diligenciaIds:
                alerta
                  .diligencias
                  .map(
                    (diligencia) =>
                      diligencia.id
                  ),
            })
          );

      const resultado =
        await importarPauta(
          nomeArquivo,
          linhasParaImportar,
          confirmacoesBanco
        );

      if (
        resultado.status ===
        "alertas_atualizados"
      ) {
        setAlertasBanco(
          resultado
            .alertasBanco
        );

        setDecisoesBanco(
          {}
        );

        setMensagemBanco(
          resultado.mensagem
        );

        return;
      }

      if (
        resultado.status ===
        "erro"
      ) {
        setErroServidor(
          [
            resultado.mensagem,
            ...resultado.erros,
          ].join("\n")
        );

        return;
      }

      setQuantidadeImportada(
        resultado.quantidade
      );

      setImportacaoConcluida(
        true
      );

      setMensagemBanco(
        resultado.mensagem
      );
    } catch (
      error
    ) {
      setErroServidor(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a importação."
      );
    } finally {
      setImportando(
        false
      );
    }
  }

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div className="space-y-8">
      {/* MODELO */}

      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5" />

              <h2 className="text-lg font-semibold">
                Modelo de pauta
              </h2>
            </div>

            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Para importar sua pauta, utilize o modelo oficial do NOTE LITIS.
              Basta baixar a planilha, preenchê-la e enviá-la abaixo.
            </p>

            <p className="mt-2 text-sm font-medium">
              Não altere os nomes ou a ordem das colunas.
            </p>
          </div>

          <button
            type="button"
            onClick={
              baixarModeloPauta
            }
            disabled={
              importacaoConcluida
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />

            Baixar modelo de pauta
          </button>
        </div>
      </section>

      {/* ARQUIVO */}

      <section className="rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">
            Arquivo da pauta
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Selecione o modelo do NOTE LITIS já preenchido com sua pauta.
          </p>
        </div>

        <div className="p-6">
          <input
            ref={
              inputArquivoRef
            }
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={
              selecionarArquivo
            }
            disabled={
              importacaoConcluida
            }
            className="hidden"
          />

          {!nomeArquivo ? (
            <button
              type="button"
              onClick={() =>
                inputArquivoRef
                  .current
                  ?.click()
              }
              className="flex min-h-44 w-full flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center transition-colors hover:bg-muted/30"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />

              <p className="mt-4 font-medium">
                Selecionar planilha preenchida
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Formatos .xlsx ou .xls — até 20 MB
              </p>
            </button>
          ) : (
            <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-6 w-6" />

                <div>
                  <p className="font-medium">
                    {nomeArquivo}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {arquivoValido
                      ? "Modelo do NOTE LITIS identificado"
                      : "Arquivo precisa ser revisado"}
                  </p>
                </div>
              </div>

              {!importacaoConcluida && (
                <button
                  type="button"
                  onClick={
                    limparArquivo
                  }
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-background"
                >
                  <X className="h-4 w-4" />

                  Remover
                </button>
              )}
            </div>
          )}

          {erro && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-medium">
                  Não foi possível utilizar esta planilha
                </p>

                <p className="mt-1 text-sm">
                  {erro}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {arquivoValido && (
        <>
          {/* RESUMO */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                Diligências
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {
                  linhasUteis.length
                }
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                Prontas
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {
                  linhasProntas.length
                }
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                Com alertas
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {
                  linhasComAlertas.length
                }
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                Com erros
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {
                  linhasComErros.length
                }
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                Descartadas
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {
                  descartadas.size
                }
              </p>
            </div>
          </section>

          {linhasExemplo.length >
            0 && (
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-medium">
                  Linha de exemplo ignorada
                </p>

                <p className="mt-1 text-sm">
                  A linha demonstrativa do modelo não fará parte da importação.
                </p>
              </div>
            </div>
          )}

          {/* ANÁLISE */}

          <section className="rounded-xl border bg-card">
            <div className="flex flex-col gap-4 border-b px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Análise da pauta
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Corrija ou descarte erros e confirme individualmente os alertas antes de continuar.
                </p>
              </div>

              <select
                value={
                  filtro
                }
                onChange={(
                  event
                ) => {
                  setFiltro(
                    event.target
                      .value as FiltroTabela
                  );

                  setPagina(
                    1
                  );
                }}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="todas">
                  Todas
                </option>

                <option value="erro">
                  Com erros
                </option>

                <option value="alerta">
                  Com alertas
                </option>

                <option value="pronta">
                  Prontas
                </option>

                <option value="descartada">
                  Descartadas
                </option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[2000px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-4 py-3 font-semibold">
                      Linha
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Situação
                    </th>

                    {CAMPOS_IMPORTACAO.map(
                      (campo) => (
                        <th
                          key={
                            campo.chave
                          }
                          className="px-4 py-3 font-semibold"
                        >
                          {campo.rotulo}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {linhasPagina.map(
                    (linha) => (
                      <tr
                        key={
                          linha.linhaExcel
                        }
                        className="border-b align-top"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                          {
                            linha.linhaExcel
                          }
                        </td>

                        <td className="min-w-96 px-4 py-3">
                          {linha.situacao ===
                            "pronta" && (
                            <div className="space-y-3">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                                <CheckCircle2 className="h-3.5 w-3.5" />

                                Pronta para importar
                              </span>

                              {!importacaoConcluida && (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      abrirEdicao(
                                        linha
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />

                                    Editar
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      descartarLinha(
                                        linha.linhaExcel
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />

                                    Descartar
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {linha.situacao ===
                            "erro" && (
                            <div className="space-y-3">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
                                <XCircle className="h-3.5 w-3.5" />

                                Corrigir dados
                              </span>

                              <div className="space-y-1">
                                {linha.erros.map(
                                  (
                                    erroLinha
                                  ) => (
                                    <p
                                      key={
                                        erroLinha
                                      }
                                      className="text-xs text-red-800"
                                    >
                                      {erroLinha}
                                    </p>
                                  )
                                )}
                              </div>

                              {!importacaoConcluida && (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      abrirEdicao(
                                        linha
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />

                                    Corrigir
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      descartarLinha(
                                        linha.linhaExcel
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />

                                    Descartar
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {linha.situacao ===
                            "alerta" && (
                            <div className="space-y-3">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
                                <AlertTriangle className="h-3.5 w-3.5" />

                                Atenção
                              </span>

                              <div className="space-y-1">
                                {linha.alertas.map(
                                  (
                                    alerta
                                  ) => (
                                    <p
                                      key={
                                        alerta
                                      }
                                      className="text-xs text-amber-900"
                                    >
                                      {alerta}
                                    </p>
                                  )
                                )}
                              </div>

                              {alertasArquivoConfirmados.has(
                                linha.linhaExcel
                              ) ? (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-green-700">
                                    Alerta confirmado para importação.
                                  </p>

                                  {!importacaoConcluida && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        retirarConfirmacaoAlertaArquivo(
                                          linha.linhaExcel
                                        )
                                      }
                                      className="text-xs font-medium underline"
                                    >
                                      Retirar confirmação
                                    </button>
                                  )}
                                </div>
                              ) : (
                                !importacaoConcluida && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      confirmarAlertaArquivo(
                                        linha.linhaExcel
                                      )
                                    }
                                    className="rounded-md bg-[#0b1f3a] px-3 py-2 text-xs font-medium text-white"
                                  >
                                    Confirmar e manter na importação
                                  </button>
                                )
                              )}

                              {!importacaoConcluida && (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      abrirEdicao(
                                        linha
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />

                                    Editar
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      descartarLinha(
                                        linha.linhaExcel
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />

                                    Descartar
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {linha.situacao ===
                            "descartada" && (
                            <div className="space-y-3">
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                Descartada
                              </span>

                              {!importacaoConcluida && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    restaurarLinha(
                                      linha.linhaExcel
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />

                                  Restaurar
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {CAMPOS_IMPORTACAO.map(
                          (campo) => (
                            <td
                              key={
                                campo.chave
                              }
                              className="max-w-72 px-4 py-3"
                            >
                              {linha.dados[
                                campo.chave
                              ] || (
                                <span className="text-muted-foreground">
                                  —
                                </span>
                              )}
                            </td>
                          )
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {linhasFiltradas.length >
              LINHAS_POR_PAGINA && (
              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Página{" "}
                  {paginaSegura} de{" "}
                  {totalPaginas}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={
                      paginaSegura <= 1
                    }
                    onClick={() =>
                      setPagina(
                        Math.max(
                          1,
                          paginaSegura -
                            1
                        )
                      )
                    }
                    className="rounded-lg border p-2 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={
                      paginaSegura >=
                      totalPaginas
                    }
                    onClick={() =>
                      setPagina(
                        Math.min(
                          totalPaginas,
                          paginaSegura +
                            1
                        )
                      )
                    }
                    className="rounded-lg border p-2 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* PREPARAR IMPORTAÇÃO */}

          {!importacaoConcluida && (
            <section className="rounded-xl border bg-card p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5" />

                    <h2 className="text-lg font-semibold">
                      Conferência no NOTE LITIS
                    </h2>
                  </div>

                  {linhasComErros.length >
                    0 ? (
                    <p className="mt-2 text-sm text-red-700">
                      Corrija ou descarte as {linhasComErros.length} linha(s) com erro antes de continuar.
                    </p>
                  ) : alertasPendentes.length >
                    0 ? (
                    <p className="mt-2 text-sm text-amber-800">
                      Confirme ou descarte as {alertasPendentes.length} linha(s) com alerta antes de continuar.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      A pauta está pronta para ser comparada com as diligências ativas já cadastradas.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={
                    verificandoBanco ||
                    linhasComErros.length >
                      0 ||
                    alertasPendentes.length >
                      0 ||
                    linhasAnalisadasAtivas
                      .length === 0
                  }
                  onClick={
                    verificarBanco
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verificandoBanco ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}

                  Verificar e preparar importação
                </button>
              </div>
            </section>
          )}

          {/* ERRO SERVIDOR */}

          {erroServidor && (
            <div className="whitespace-pre-line rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
              {erroServidor}
            </div>
          )}

          {/* ALERTAS DO BANCO */}

          {!importacaoConcluida &&
            analiseBancoRealizada &&
            alertasBanco.length >
              0 && (
              <section className="rounded-xl border border-amber-200 bg-amber-50">
                <div className="border-b border-amber-200 px-6 py-5">
                  <h2 className="font-semibold text-amber-950">
                    Processos com diligências ativas
                  </h2>

                  <p className="mt-1 text-sm text-amber-900">
                    {mensagemBanco}
                  </p>
                </div>

                <div className="divide-y divide-amber-200">
                  {alertasBanco.map(
                    (alerta) => (
                      <div
                        key={
                          alerta.linhaExcel
                        }
                        className="p-6"
                      >
                        <p className="font-semibold text-amber-950">
                          Linha{" "}
                          {alerta.linhaExcel} — Processo{" "}
                          {formatarProcesso(
                            alerta.numeroProcesso
                          )}
                        </p>

                        <p className="mt-1 text-sm text-amber-900">
                          Já existem {alerta.diligencias.length} diligência(s) ativa(s) deste processo.
                        </p>

                        <div className="mt-4 space-y-3">
                          {alerta.diligencias.map(
                            (diligencia) => (
                              <div
                                key={
                                  diligencia.id
                                }
                                className="rounded-lg border border-amber-200 bg-white p-4 text-sm"
                              >
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                  <strong>
                                    {formatarDataBanco(
                                      diligencia.data_diligencia
                                    )}
                                  </strong>

                                  <strong>
                                    {diligencia.horario.slice(
                                      0,
                                      5
                                    )}
                                  </strong>

                                  <span>
                                    {
                                      diligencia.tipo_diligencia
                                    }
                                  </span>

                                  <span>
                                    {diligencia.modalidade ===
                                    "virtual"
                                      ? "Virtual"
                                      : "Presencial"}
                                  </span>
                                </div>

                                <p className="mt-2 text-muted-foreground">
                                  {diligencia.vara ||
                                    "Vara não informada"}
                                  {diligencia.comarca
                                    ? ` • ${diligencia.comarca}`
                                    : ""}
                                  {diligencia.uf
                                    ? `/${diligencia.uf}`
                                    : ""}
                                </p>
                              </div>
                            )
                          )}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              decidirAlertaBanco(
                                alerta.linhaExcel,
                                "importar"
                              )
                            }
                            className={
                              decisoesBanco[
                                alerta.linhaExcel
                              ] ===
                              "importar"
                                ? "rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white"
                                : "rounded-lg border bg-white px-4 py-2 text-sm font-medium"
                            }
                          >
                            Importar mesmo assim
                          </button>

                          <button
                              type="button"
                              onClick={() => {
                                const linha =
                                  linhasAnalisadasAtivas.find(
                                    (item) =>
                                      item.linhaExcel ===
                                      alerta.linhaExcel
                                  );

                                if (linha) {
                                  abrirEdicao(
                                    linha
                                  );
                                }
                              }}
                              className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-amber-100/50"
                            >
                              <Pencil className="h-4 w-4" />

                              Corrigir esta linha
                            </button>

                          <button
                            type="button"
                            onClick={() =>
                              decidirAlertaBanco(
                                alerta.linhaExcel,
                                "descartar"
                              )
                            }
                            className={
                              decisoesBanco[
                                alerta.linhaExcel
                              ] ===
                              "descartar"
                                ? "rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white"
                                : "rounded-lg border bg-white px-4 py-2 text-sm font-medium"
                            }
                          >
                            Descartar esta linha
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

          {/* CONFIRMAÇÃO FINAL */}

          {!importacaoConcluida &&
            analiseBancoRealizada && (
              <section className="rounded-xl border bg-card p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Confirmar importação
                    </h2>

                    {alertasBanco.length ===
                    0 ? (
                      <p className="mt-2 text-sm text-green-700">
                        {mensagemBanco}
                      </p>
                    ) : !todosAlertasBancoDecididos ? (
                      <p className="mt-2 text-sm text-amber-800">
                        Ainda existem alertas do banco aguardando decisão.
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {quantidadeFinal} diligência(s) serão importadas.
                        {linhasDescartadasNoBanco.length >
                          0
                          ? ` ${linhasDescartadasNoBanco.length} linha(s) serão descartadas nesta conferência.`
                          : ""}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={
                      importando ||
                      !todosAlertasBancoDecididos ||
                      quantidadeFinal ===
                        0
                    }
                    onClick={
                      concluirImportacao
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {importando && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    Importar{" "}
                    {quantidadeFinal} diligência(s)
                  </button>
                </div>
              </section>
            )}

          {/* SUCESSO */}

          {importacaoConcluida && (
            <section className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-950">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" />

                <div>
                  <h2 className="text-lg font-semibold">
                    Importação concluída
                  </h2>

                  <p className="mt-2 text-sm">
                    {quantidadeImportada} diligência(s) foram cadastradas no NOTE LITIS.
                  </p>

                  <a
                    href="/protected/diligencias"
                    className="mt-4 inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white"
                  >
                    Ver diligências
                  </a>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* MODAL DE EDIÇÃO */}

      {linhaEmEdicao !==
        null &&
        dadosEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-background shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold">
                  Corrigir linha{" "}
                  {linhaEmEdicao}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  As alterações serão aplicadas somente à prévia da importação.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fecharEdicao
                }
                className="rounded-lg border p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              {CAMPOS_IMPORTACAO.map(
                (campo) => (
                  <div
                    key={
                      campo.chave
                    }
                    className={
                      campo.chave ===
                      "observacoes"
                        ? "md:col-span-2"
                        : ""
                    }
                  >
                    <label className="text-sm font-medium">
                      {campo.rotulo}

                      {campo.obrigatorio
                        ? " *"
                        : ""}
                    </label>

                    {campo.chave ===
                    "modalidade" ? (
                      <select
                        value={
                          dadosEdicao[
                            campo.chave
                          ]
                        }
                        onChange={(
                          event
                        ) =>
                          alterarCampoEdicao(
                            campo.chave,
                            event.target
                              .value
                          )
                        }
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                      >
                        <option value="">
                          Selecione
                        </option>

                        <option value="PRESENCIAL">
                          Presencial
                        </option>

                        <option value="VIRTUAL">
                          Virtual
                        </option>
                      </select>
                    ) : campo.chave ===
                      "observacoes" ? (
                      <textarea
                        value={
                          dadosEdicao[
                            campo.chave
                          ]
                        }
                        onChange={(
                          event
                        ) =>
                          alterarCampoEdicao(
                            campo.chave,
                            event.target
                              .value
                          )
                        }
                        rows={4}
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                      />
                    ) : (
                      <input
                        type="text"
                        value={
                          dadosEdicao[
                            campo.chave
                          ]
                        }
                        onChange={(
                          event
                        ) =>
                          alterarCampoEdicao(
                            campo.chave,
                            event.target
                              .value
                          )
                        }
                        className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                      />
                    )}
                  </div>
                )
              )}
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-5">
              <button
                type="button"
                onClick={
                  fecharEdicao
                }
                className="rounded-lg border px-4 py-2.5 text-sm font-medium"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  salvarEdicao
                }
                className="rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white"
              >
                Salvar correção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}