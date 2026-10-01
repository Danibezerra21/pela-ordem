"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  CAMPOS_IMPORTACAO,
  modalidadeEhValida,
  normalizarDataImportacao,
  normalizarHorarioImportacao,
  normalizarNumeroProcesso,
  normalizarUfImportacao,
  processoTemFormatoValido,
  type ValoresLinhaImportacao,
} from "./configuracao";

/* =====================================================
   TIPOS EXPOSTOS AO CLIENTE
===================================================== */

export type LinhaImportacaoEntrada = {
  linhaExcel: number;

  dados:
    ValoresLinhaImportacao;

  alertaArquivoConfirmado:
    boolean;
};

export type DiligenciaAtivaImportacao = {
  id: string;

  numero_processo:
    string | null;

  tipo_diligencia:
    string;

  modalidade:
    "presencial" | "virtual";

  data_diligencia:
    string;

  horario:
    string;

  parte_autora:
    string | null;

  parte_re:
    string | null;

  vara:
    string | null;

  comarca:
    string | null;

  uf:
    string | null;

  local:
    string | null;
};

export type AlertaBancoImportacao = {
  linhaExcel: number;

  numeroProcesso:
    string;

  diligencias:
    DiligenciaAtivaImportacao[];
};

export type ConfirmacaoBancoImportacao = {
  linhaExcel: number;

  diligenciaIds:
    string[];
};

export type ResultadoAnaliseImportacao =
  | {
      status: "pronta";

      mensagem: string;

      alertasBanco: [];
    }
  | {
      status: "alertas";

      mensagem: string;

      alertasBanco:
        AlertaBancoImportacao[];
    }
  | {
      status: "erro";

      mensagem: string;

      erros: string[];

      alertasBanco: [];
    };

export type ResultadoImportacao =
  | {
      status: "sucesso";

      mensagem: string;

      quantidade: number;
    }
  | {
      status: "alertas_atualizados";

      mensagem: string;

      alertasBanco:
        AlertaBancoImportacao[];
    }
  | {
      status: "erro";

      mensagem: string;

      erros: string[];
    };

/* =====================================================
   TIPOS INTERNOS
===================================================== */

type LinhaNormalizada = {
  linhaExcel: number;

  alertaArquivoConfirmado:
    boolean;

  dados: {
    tipo_diligencia:
      string;

    modalidade:
      "presencial" | "virtual";

    numero_processo:
      string;

    parte_autora:
      string;

    parte_re:
      string;

    data_diligencia:
      string;

    horario:
      string;

    vara:
      string;

    comarca:
      string;

    uf:
      string;

    local:
      string;

    observacoes:
      string;
  };
};

/* =====================================================
   NORMALIZAÇÃO
===================================================== */

function normalizarTexto(
  valor: string
) {
  return valor
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function converterDataParaBanco(
  valor: string
) {
  const data =
    normalizarDataImportacao(
      valor
    );

  if (!data) {
    return null;
  }

  const [
    dia,
    mes,
    ano,
  ] =
    data.split("/");

  return `${ano}-${mes}-${dia}`;
}

/* =====================================================
   AUTENTICAÇÃO / EMPRESA
===================================================== */

async function obterEmpresaUsuario() {
  const supabase =
    await createClient();

  const {
    data: authData,
    error: authError,
  } =
    await supabase.auth.getClaims();

  if (
    authError ||
    !authData?.claims?.sub
  ) {
    redirect(
      "/auth/login"
    );
  }

  const usuarioId =
    authData.claims.sub;

  const {
    data: membro,
    error: erroMembro,
  } = await supabase
    .from(
      "membros_empresa"
    )
    .select(
      "empresa_id"
    )
    .eq(
      "usuario_id",
      usuarioId
    )
    .eq(
      "ativo",
      true
    )
    .maybeSingle();

  if (
    erroMembro ||
    !membro
  ) {
    throw new Error(
      "Não foi possível identificar a empresa do usuário."
    );
  }

  return {
    supabase,
    usuarioId,
    empresaId:
      membro.empresa_id,
  };
}

/* =====================================================
   VALIDAÇÃO DE UMA LINHA
===================================================== */

function normalizarLinha(
  linha:
    LinhaImportacaoEntrada
):
  | {
      ok: true;

      linha:
        LinhaNormalizada;
    }
  | {
      ok: false;

      erros:
        string[];
    } {
  const erros:
    string[] = [];

  for (
    const campo of
    CAMPOS_IMPORTACAO
  ) {
    if (
      campo.obrigatorio &&
      !linha.dados[
        campo.chave
      ].trim()
    ) {
      erros.push(
        `Linha ${linha.linhaExcel}: ${campo.rotulo} é obrigatório.`
      );
    }
  }

  if (
    linha.dados
      .numero_processo &&
    !processoTemFormatoValido(
      linha.dados
        .numero_processo
    )
  ) {
    erros.push(
      `Linha ${linha.linhaExcel}: número do processo inválido.`
    );
  }

  if (
    linha.dados
      .modalidade &&
    !modalidadeEhValida(
      linha.dados
        .modalidade
    )
  ) {
    erros.push(
      `Linha ${linha.linhaExcel}: modalidade inválida. Utilize PRESENCIAL ou VIRTUAL.`
    );
  }

  const dataBanco =
    converterDataParaBanco(
      linha.dados
        .data_diligencia
    );

  if (
    linha.dados
      .data_diligencia &&
    !dataBanco
  ) {
    erros.push(
      `Linha ${linha.linhaExcel}: data inválida.`
    );
  }

  const horario =
    normalizarHorarioImportacao(
      linha.dados
        .horario
    );

  if (
    linha.dados.horario &&
    !horario
  ) {
    erros.push(
      `Linha ${linha.linhaExcel}: horário inválido.`
    );
  }

  const uf =
    normalizarUfImportacao(
      linha.dados.uf
    );

  if (
    linha.dados.uf &&
    !uf
  ) {
    erros.push(
      `Linha ${linha.linhaExcel}: UF inválida.`
    );
  }

  if (
    erros.length > 0
  ) {
    return {
      ok: false,
      erros,
    };
  }

  const modalidade =
    linha.dados
      .modalidade
      .trim()
      .toLowerCase();

  return {
    ok: true,

    linha: {
      linhaExcel:
        linha.linhaExcel,

      alertaArquivoConfirmado:
        linha
          .alertaArquivoConfirmado,

      dados: {
        tipo_diligencia:
          normalizarTexto(
            linha.dados
              .tipo_diligencia
          ),

        modalidade:
          modalidade as
            | "presencial"
            | "virtual",

        numero_processo:
          normalizarNumeroProcesso(
            linha.dados
              .numero_processo
          ),

        parte_autora:
          normalizarTexto(
            linha.dados
              .parte_autora
          ),

        parte_re:
          normalizarTexto(
            linha.dados
              .parte_re
          ),

        data_diligencia:
          dataBanco!,

        horario:
          horario!,

        vara:
          normalizarTexto(
            linha.dados.vara
          ),

        comarca:
          normalizarTexto(
            linha.dados.comarca
          ),

        uf:
          uf!,

        local:
          normalizarTexto(
            linha.dados.local
          ),

        observacoes:
          normalizarTexto(
            linha.dados
              .observacoes
          ),
      },
    },
  };
}

/* =====================================================
   VALIDAÇÃO DO LOTE

   O servidor não confia na análise realizada
   anteriormente no navegador.
===================================================== */

function validarLote(
  linhas:
    LinhaImportacaoEntrada[]
) {
  const erros:
    string[] = [];

  if (
    linhas.length === 0
  ) {
    return {
      erros: [
        "Nenhuma diligência foi selecionada para importação.",
      ],

      linhasNormalizadas:
        [] as LinhaNormalizada[],
    };
  }

  if (
    linhas.length > 5000
  ) {
    return {
      erros: [
        "O lote excede o limite de 5.000 diligências.",
      ],

      linhasNormalizadas:
        [] as LinhaNormalizada[],
    };
  }

  const linhasNormalizadas:
    LinhaNormalizada[] = [];

  for (
    const linha of linhas
  ) {
    const resultado =
      normalizarLinha(
        linha
      );

    if (!resultado.ok) {
      erros.push(
        ...resultado.erros
      );

      continue;
    }

    linhasNormalizadas.push(
      resultado.linha
    );
  }

  if (
    erros.length > 0
  ) {
    return {
      erros,
      linhasNormalizadas,
    };
  }

  /*
    ============================================
    ALERTAS INTERNOS DO ARQUIVO

    Mesmo processo repetido continua sendo
    permitido, mas exige confirmação.
    ============================================
  */

  const porProcesso =
    new Map<
      string,
      LinhaNormalizada[]
    >();

  for (
    const linha of
    linhasNormalizadas
  ) {
    const processo =
      linha.dados
        .numero_processo;

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

  for (
    const linha of
    linhasNormalizadas
  ) {
    const repeticoes =
      porProcesso.get(
        linha.dados
          .numero_processo
      ) ?? [];

    if (
      repeticoes.length > 1 &&
      !linha
        .alertaArquivoConfirmado
    ) {
      erros.push(
        `Linha ${linha.linhaExcel}: o processo aparece mais de uma vez no arquivo e o alerta ainda não foi confirmado.`
      );
    }
  }

  return {
    erros,
    linhasNormalizadas,
  };
}

/* =====================================================
   CONSULTA DE DILIGÊNCIAS ATIVAS

   IMPORTANTE:
   concluídas e canceladas NÃO participam
   do alerta.
===================================================== */

async function consultarDiligenciasAtivas(
  supabase: any,
  empresaId: string,
  processos: string[]
): Promise<
  DiligenciaAtivaImportacao[]
> {
  const unicos =
    Array.from(
      new Set(
        processos
          .filter(Boolean)
      )
    );

  if (
    unicos.length === 0
  ) {
    return [];
  }

  /*
    Evita gerar uma consulta gigantesca
    quando o Excel possui muitas linhas.
  */
  const blocos:
    string[][] = [];

  for (
    let indice = 0;
    indice < unicos.length;
    indice += 100
  ) {
    blocos.push(
      unicos.slice(
        indice,
        indice + 100
      )
    );
  }

  const resultados =
    await Promise.all(
      blocos.map(
        async (
          bloco
        ) => {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "diligencias"
              )
              .select(`
                id,
                numero_processo,
                tipo_diligencia,
                modalidade,
                data_diligencia,
                horario,
                parte_autora,
                parte_re,
                vara,
                comarca,
                uf,
                local
              `)
              .eq(
                "empresa_id",
                empresaId
              )
              .eq(
                "status",
                "ativa"
              )
              .is(
                "excluida_em",
                null
              )
              .in(
                "numero_processo",
                bloco
              );

          if (error) {
            throw new Error(
              `Erro ao consultar diligências ativas: ${error.message}`
            );
          }

          return (
            data ?? []
          ) as DiligenciaAtivaImportacao[];
        }
      )
    );

  return resultados.flat();
}

/* =====================================================
   ALERTAS DO BANCO
===================================================== */

function montarAlertasBanco(
  linhas:
    LinhaNormalizada[],
  diligencias:
    DiligenciaAtivaImportacao[]
) {
  const porProcesso =
    new Map<
      string,
      DiligenciaAtivaImportacao[]
    >();

  for (
    const diligencia of
    diligencias
  ) {
    const processo =
      diligencia
        .numero_processo;

    if (!processo) {
      continue;
    }

    const existentes =
      porProcesso.get(
        processo
      ) ?? [];

    existentes.push(
      diligencia
    );

    porProcesso.set(
      processo,
      existentes
    );
  }

  const alertas:
    AlertaBancoImportacao[] = [];

  for (
    const linha of linhas
  ) {
    const existentes =
      porProcesso.get(
        linha.dados
          .numero_processo
      ) ?? [];

    if (
      existentes.length === 0
    ) {
      continue;
    }

    alertas.push({
      linhaExcel:
        linha.linhaExcel,

      numeroProcesso:
        linha.dados
          .numero_processo,

      diligencias:
        existentes,
    });
  }

  return alertas;
}

/* =====================================================
   COMPARAÇÃO DE CONFIRMAÇÕES

   Se a pauta mudar depois da análise,
   obrigamos o usuário a analisar novamente.
===================================================== */

function idsIguais(
  anteriores:
    string[],
  atuais:
    string[]
) {
  const a =
    [...anteriores]
      .sort();

  const b =
    [...atuais]
      .sort();

  return (
    JSON.stringify(a) ===
    JSON.stringify(b)
  );
}

/* =====================================================
   ETAPA 1 — CONFERÊNCIA NO BANCO
===================================================== */

export async function analisarImportacaoNoBanco(
  linhas:
    LinhaImportacaoEntrada[]
): Promise<
  ResultadoAnaliseImportacao
> {
  const {
    supabase,
    empresaId,
  } =
    await obterEmpresaUsuario();

  const {
    erros,
    linhasNormalizadas,
  } =
    validarLote(
      linhas
    );

  if (
    erros.length > 0
  ) {
    return {
      status: "erro",

      mensagem:
        "A pauta possui informações que impedem a importação.",

      erros,

      alertasBanco: [],
    };
  }

  const diligenciasAtivas =
    await consultarDiligenciasAtivas(
      supabase,
      empresaId,
      linhasNormalizadas.map(
        (linha) =>
          linha.dados
            .numero_processo
      )
    );

  const alertasBanco =
    montarAlertasBanco(
      linhasNormalizadas,
      diligenciasAtivas
    );

  if (
    alertasBanco.length > 0
  ) {
    return {
      status: "alertas",

      mensagem:
        "Alguns processos já possuem diligências ativas no NOTE LITIS. Analise cada ocorrência antes de importar.",

      alertasBanco,
    };
  }

  return {
    status: "pronta",

    mensagem:
      "Conferência concluída. Nenhum processo selecionado possui diligência ativa cadastrada.",

    alertasBanco: [],
  };
}

/* =====================================================
   ETAPA 2 — IMPORTAÇÃO
===================================================== */

export async function importarPauta(
  arquivo: string,
  linhas:
    LinhaImportacaoEntrada[],
  confirmacoesBanco:
    ConfirmacaoBancoImportacao[]
): Promise<
  ResultadoImportacao
> {
  const {
    supabase,
    usuarioId,
    empresaId,
  } =
    await obterEmpresaUsuario();

  /*
    Revalidação integral imediatamente antes
    da gravação.
  */
  const {
    erros,
    linhasNormalizadas,
  } =
    validarLote(
      linhas
    );

  if (
    erros.length > 0
  ) {
    return {
      status: "erro",

      mensagem:
        "A importação foi interrompida porque a pauta possui informações inválidas.",

      erros,
    };
  }

  /*
    Reconsulta o banco imediatamente antes
    de salvar.
  */
  const diligenciasAtivas =
    await consultarDiligenciasAtivas(
      supabase,
      empresaId,
      linhasNormalizadas.map(
        (linha) =>
          linha.dados
            .numero_processo
      )
    );

  const alertasAtuais =
    montarAlertasBanco(
      linhasNormalizadas,
      diligenciasAtivas
    );

  const confirmacoesPorLinha =
    new Map<
      number,
      string[]
    >(
      confirmacoesBanco.map(
        (confirmacao) => [
          confirmacao
            .linhaExcel,

          confirmacao
            .diligenciaIds,
        ]
      )
    );

  const alertasNaoConfirmados =
    alertasAtuais.filter(
      (alerta) => {
        const confirmados =
          confirmacoesPorLinha.get(
            alerta.linhaExcel
          );

        if (!confirmados) {
          return true;
        }

        return !idsIguais(
          confirmados,
          alerta.diligencias.map(
            (diligencia) =>
              diligencia.id
          )
        );
      }
    );

  /*
    Se alguma diligência ativa apareceu,
    desapareceu ou mudou desde a conferência,
    mostramos novamente.
  */
  if (
    alertasNaoConfirmados.length >
    0
  ) {
    return {
      status:
        "alertas_atualizados",

      mensagem:
        "A situação da pauta mudou desde a última conferência. Revise novamente os alertas antes de importar.",

      alertasBanco:
        alertasAtuais,
    };
  }

  const arquivoSeguro =
    arquivo
      .trim()
      .slice(
        0,
        255
      );

  const lote =
    linhasNormalizadas.map(
      (linha) => {
        const idsBanco =
          alertasAtuais
            .find(
              (alerta) =>
                alerta
                  .linhaExcel ===
                linha
                  .linhaExcel
            )
            ?.diligencias
            .map(
              (diligencia) =>
                diligencia.id
            ) ?? [];

        const houveAlerta =
          linha
            .alertaArquivoConfirmado ||
          idsBanco.length > 0;

        const diligencia = {
          tipo_diligencia:
            linha.dados
              .tipo_diligencia,

          modalidade:
            linha.dados
              .modalidade,

          numero_processo:
            linha.dados
              .numero_processo,

          parte_autora:
            linha.dados
              .parte_autora,

          parte_re:
            linha.dados
              .parte_re,

          data_diligencia:
            linha.dados
              .data_diligencia,

          horario:
            linha.dados
              .horario,

          vara:
            linha.dados
              .vara,

          comarca:
            linha.dados
              .comarca,

          uf:
            linha.dados.uf,

          local:
            linha.dados.local,

          correspondente_id:
            "",

          necessita_preposto:
            null,

          preposto_id:
            "",

          testemunhas_status:
            null,

          testemunhas_confirmadas:
            null,

          contratacao_status:
            null,

          contratacao_tipo:
            null,

          contratacao_confirmada:
            false,

          contratacao_advogado_valor:
            null,

          contratacao_advogado_pagamento_combinado_em:
            null,

          contratacao_preposto_valor:
            null,

          contratacao_preposto_pagamento_combinado_em:
            null,

          orientacoes_encaminhadas:
            false,

          observacoes:
            linha.dados
              .observacoes,

          ...(houveAlerta
            ? {
                confirmacao_alerta: {
                  confirmado:
                    true,

                  usuario_id:
                    usuarioId,

                  origem:
                    "IMPORTACAO_EXCEL",

                  arquivo:
                    arquivoSeguro,

                  linha_excel:
                    linha
                      .linhaExcel,

                  alerta_arquivo_confirmado:
                    linha
                      .alertaArquivoConfirmado,

                  possivel_duplicidade:
                    idsBanco,
                },
              }
            : {}),
        };

        return {
          arquivo:
            arquivoSeguro,

          linha_excel:
            linha.linhaExcel,

          alerta_arquivo_confirmado:
            linha
              .alertaArquivoConfirmado,

          diligencias_ativas_confirmadas:
            idsBanco,

          diligencia,
        };
      }
    );

  const {
    error,
  } = await supabase.rpc(
    "importar_diligencias_lote",
    {
      p_empresa_id:
        empresaId,

      p_diligencias:
        lote,
    }
  );

  if (error) {
    return {
      status: "erro",

      mensagem:
        "Não foi possível concluir a importação. Nenhuma diligência deste lote foi cadastrada.",

      erros: [
        error.message,
      ],
    };
  }

  revalidatePath(
    "/protected"
  );

  revalidatePath(
    "/protected/diligencias"
  );

  revalidatePath(
    "/protected/pendencias"
  );

  revalidatePath(
    "/protected/importacoes"
  );

  return {
    status: "sucesso",

    mensagem:
      `${linhasNormalizadas.length} diligência(s) importada(s) com sucesso.`,

    quantidade:
      linhasNormalizadas.length,
  };
}