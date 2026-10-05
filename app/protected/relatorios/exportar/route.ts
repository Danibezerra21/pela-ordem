import ExcelJS from "exceljs";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  carregarRelatorio,
  normalizarTipoRelatorio,
  type FiltrosRelatorio,
  type DiligenciaRelatorio,
  type LinhaFinanceiraRelatorio,
} from "../dados";





/* =====================================================
   UTILIDADES
===================================================== */

function textoSeguro(
  valor:
    unknown
):
  string | number {

  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }


  if (
    typeof valor ===
    "boolean"
  ) {
    return valor
      ? "SIM"
      : "NÃO";
  }


  if (
    typeof valor ===
      "number"
  ) {
    return valor;
  }


  if (
    typeof valor ===
      "object"
  ) {
    return JSON.stringify(
      valor
    );
  }


  return String(
    valor
  );
}


function formatarProcesso(
  processo:
    string | null
) {

  if (!processo) {
    return "";
  }


  const digitos =
    processo.replace(
      /\D/g,
      ""
    );


  if (
    digitos.length !==
    20
  ) {
    return processo;
  }


  return digitos.replace(
    /^(\d{7})(\d{2})(\d{4})(\d)(\d{2})(\d{4})$/,
    "$1-$2.$3.$4.$5.$6"
  );
}


function textoResultado(
  valor:
    string | null
) {

  if (
    valor ===
    "finalidade_atingida"
  ) {
    return "FINALIDADE ATINGIDA";
  }


  if (
    valor ===
    "finalidade_nao_atingida"
  ) {
    return "FINALIDADE NÃO ATINGIDA";
  }


  return "";
}


function identificacaoProfissional(
  linha:
    LinhaFinanceiraRelatorio
) {

  const profissional =
    linha.profissional;


  if (!profissional) {
    return "";
  }


  if (
    linha
      .contratacao
      .tipo_profissional ===
      "advogado"
  ) {

    if (
      profissional
        .oab_numero
    ) {
      return (
        `OAB/${profissional.oab_uf ?? ""} ` +
        profissional.oab_numero
      ).trim();
    }
  }


  if (
    profissional.cpf
  ) {
    return profissional.cpf;
  }


  return "";
}


function prefixarCampos(
  prefixo:
    string,

  objeto:
    Record<
      string,
      unknown
    >
) {

  return Object.fromEntries(
    Object.entries(
      objeto
    ).map(
      (
        [
          chave,
          valor,
        ]
      ) => [
        `${prefixo}${chave}`,
        textoSeguro(
          valor
        ),
      ]
    )
  );
}


/* =====================================================
   LINHA OPERACIONAL

   IMPORTANTE:
   TODOS OS CAMPOS DA DILIGÊNCIA SÃO INCLUÍDOS.
===================================================== */

function linhaDiligencia(
  diligencia:
    DiligenciaRelatorio
) {

  return {
    "ID da diligência":
      diligencia.id,

    "Processo":
      formatarProcesso(
        diligencia
          .numero_processo
      ),

    "Parte autora":
      diligencia
        .parte_autora ??
      "",

    "Parte ré":
      diligencia
        .parte_re ??
      "",

    "Tipo de diligência":
      diligencia
        .tipo_diligencia,

    "Modalidade":
      diligencia
        .modalidade ??
      "",

    "Data da diligência":
      diligencia
        .data_diligencia,

    "Horário":
      diligencia
        .horario,

    "Vara / unidade":
      diligencia
        .vara ??
      "",

    "Comarca":
      diligencia
        .comarca ??
      "",

    "UF":
      diligencia.uf ??
      "",

    "Local":
      diligencia
        .local ??
      "",

    "Status":
      diligencia
        .status,

    "Resultado":
      textoResultado(
        diligencia
          .resultado_diligencia
      ),

    "Situação financeira":
      diligencia
        .financeiro_status ??
      "",

    "Desfecho registrado em":
      diligencia
        .desfecho_em ??
      "",

    "Observações do desfecho":
      diligencia
        .desfecho_observacoes ??
      "",

    ...prefixarCampos(
      "Diligência • ",
      diligencia
    ),
  };
}


/* =====================================================
   LINHA FINANCEIRA

   UMA CONTRATAÇÃO = UMA LINHA.

   TODOS OS CAMPOS DA DILIGÊNCIA TAMBÉM SÃO REPETIDOS.
===================================================== */

function linhaFinanceira(
  linha:
    LinhaFinanceiraRelatorio
) {

  const {
    diligencia,
    contratacao,
    profissional,
  } =
    linha;


  return {
    "ID da contratação":
      contratacao.id,

    "ID da diligência":
      diligencia.id,

    "Processo":
      formatarProcesso(
        diligencia
          .numero_processo
      ),

    "Parte autora":
      diligencia
        .parte_autora ??
      "",

    "Parte ré":
      diligencia
        .parte_re ??
      "",

    "Tipo de diligência":
      diligencia
        .tipo_diligencia,

    "Modalidade":
      diligencia
        .modalidade ??
      "",

    "Data da diligência":
      diligencia
        .data_diligencia,

    "Horário":
      diligencia
        .horario,

    "Vara / unidade":
      diligencia
        .vara ??
      "",

    "Comarca":
      diligencia
        .comarca ??
      "",

    "UF":
      diligencia.uf ??
      "",

    "Local":
      diligencia
        .local ??
      "",

    "Profissional":
      profissional
        ?.nome ??
      "",

    "Tipo do profissional":
      contratacao
        .tipo_profissional ===
        "advogado"
        ? "ADVOGADO"
        : "PREPOSTO",

    "OAB / CPF":
      identificacaoProfissional(
        linha
      ),

    "Valor contratado":
      Number(
        contratacao
          .valor
      ) || 0,

    "Data combinada para pagamento":
      contratacao
        .pagamento_combinado_em ??
      "",

    "Pagamento devido":
      contratacao
        .pagamento_devido ===
        true
        ? "SIM"
        : contratacao
            .pagamento_devido ===
            false
          ? "NÃO"
          : "NÃO DEFINIDO",

    "Decisão financeira em":
      contratacao
        .pagamento_decidido_em ??
      "",

    "Situação do pagamento":
      contratacao
        .pago_em
        ? "PAGO"
        : "PENDENTE",

    "Pagamento realizado em":
      contratacao
        .pago_em ??
      "",

    "Resultado da diligência":
      textoResultado(
        diligencia
          .resultado_diligencia
      ),

    "Observações do desfecho":
      diligencia
        .desfecho_observacoes ??
      "",

    ...prefixarCampos(
      "Diligência • ",
      diligencia
    ),

    ...prefixarCampos(
      "Contratação • ",
      contratacao
    ),

    ...(profissional
      ? prefixarCampos(
          "Profissional • ",
          profissional
        )
      : {}),
  };
}


/* =====================================================
   FORMATAÇÃO DA PLANILHA
===================================================== */

function configurarPlanilha(
  planilha:
    ExcelJS.Worksheet,

  registros:
    Record<
      string,
      string | number
    >[]
) {

  if (
    registros.length ===
    0
  ) {

    planilha.addRow([
      "Nenhum registro encontrado para os filtros selecionados.",
    ]);

    planilha.getCell(
      "A1"
    ).font = {
      bold:
        true,
    };

    planilha.getColumn(
      1
    ).width =
      60;

    return;
  }


  const cabecalhos =
    Array.from(
      new Set(
        registros.flatMap(
          (
            registro
          ) =>
            Object.keys(
              registro
            )
        )
      )
    );


  planilha.columns =
    cabecalhos.map(
      (
        cabecalho
      ) => ({
        header:
          cabecalho,

        key:
          cabecalho,

        width:
          18,
      })
    );


  for (
    const registro of
    registros
  ) {
    planilha.addRow(
      registro
    );
  }


  const cabecalho =
    planilha.getRow(
      1
    );


  cabecalho.font = {
    bold:
      true,

    color: {
      argb:
        "FFFFFFFF",
    },
  };


  cabecalho.fill = {
    type:
      "pattern",

    pattern:
      "solid",

    fgColor: {
      argb:
        "FF0B1F3A",
    },
  };


  cabecalho.alignment = {
    vertical:
      "middle",

    wrapText:
      true,
  };


  cabecalho.height =
    32;


  planilha.views = [
    {
      state:
        "frozen",

      ySplit:
        1,
    },
  ];


  planilha.autoFilter = {
    from:
      "A1",

    to:
      planilha
        .getCell(
          1,
          cabecalhos.length
        )
        .address,
  };


  planilha.eachRow(
    (
      row,
      rowNumber
    ) => {

      if (
        rowNumber >
        1
      ) {

        row.alignment = {
          vertical:
            "top",

          wrapText:
            true,
        };
      }
    }
  );


  planilha.columns.forEach(
    (
      coluna
    ) => {

      const titulo =
        String(
          coluna.header ??
          ""
        );


      let largura =
        Math.min(
          Math.max(
            titulo.length +
              2,
            12
          ),
          40
        );


      coluna.eachCell?.(
        {
          includeEmpty:
            false,
        },
        (
          celula
        ) => {

          const tamanho =
            String(
              celula.value ??
              ""
            ).length +
            2;


          largura =
            Math.min(
              Math.max(
                largura,
                tamanho
              ),
              40
            );
        }
      );


      coluna.width =
        largura;


      if (
        titulo
          .toLowerCase()
          .includes(
            "valor"
          )
      ) {
        coluna.numFmt =
          '"R$" #,##0.00';
      }
    }
  );
}


/* =====================================================
   GET
===================================================== */

export async function GET(
  request:
    Request
) {

  const url =
    new URL(
      request.url
    );


  const filtros:
    FiltrosRelatorio = {

    tipo:
      normalizarTipoRelatorio(
        url.searchParams.get(
          "tipo"
        )
      ),

    inicio:
      url.searchParams.get(
        "inicio"
      ) ??
      "",

    fim:
      url.searchParams.get(
        "fim"
      ) ??
      "",

    tipoDiligencia:
      url.searchParams.get(
        "tipo_diligencia"
      ) ??
      "",

    uf:
      url.searchParams.get(
        "uf"
      ) ??
      "",

    profissionalId:
      url.searchParams.get(
        "profissional"
      ) ??
      "",
  };


  /* ===================================================
     AUTENTICAÇÃO
  =================================================== */

  const supabase =
    await createClient();


  const {
    data:
      authData,

    error:
      authError,
  } =
    await supabase
      .auth
      .getClaims();


  if (
    authError ||
    !authData
      ?.claims
      ?.sub
  ) {

    return new Response(
      "Usuário não autenticado.",
      {
        status:
          401,
      }
    );
  }


  const usuarioId =
    authData
      .claims
      .sub;


  const {
    data:
      membro,

    error:
      erroMembro,
  } =
    await supabase
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

    return new Response(
      "Vínculo ativo não localizado.",
      {
        status:
          403,
      }
    );
  }


  /* ===================================================
     RELATÓRIO
  =================================================== */

  const admin =
    createAdminClient();


  const resultado =
    await carregarRelatorio(
      admin,
      membro.empresa_id,
      filtros
    );


  const registros =
    resultado
      .linhasFinanceiras
      .length >
      0

      ? resultado
          .linhasFinanceiras
          .map(
            linhaFinanceira
          )

      : resultado
          .diligencias
          .map(
            linhaDiligencia
          );


  /* ===================================================
     WORKBOOK
  =================================================== */

  const workbook =
    new ExcelJS.Workbook();


  workbook.creator =
    "NOTE LITIS";


  workbook.company =
    "Encontre Correspondente";


  workbook.created =
    new Date();


  /* ===================================================
     ABA DETALHADA
  =================================================== */

  const detalhes =
    workbook.addWorksheet(
      "Dados detalhados"
    );


  configurarPlanilha(
    detalhes,
    registros
  );


  /* ===================================================
     ABA RESUMO
  =================================================== */

  const resumo =
    workbook.addWorksheet(
      "Resumo"
    );


  resumo.columns = [
    {
      key:
        "campo",

      width:
        32,
    },

    {
      key:
        "valor",

      width:
        42,
    },
  ];


  resumo.addRow([
    "RELATÓRIO",
    resultado.nome,
  ]);


  resumo.addRow([
    "PERÍODO INICIAL",
    filtros.inicio ||
      "TODOS",
  ]);


  resumo.addRow([
    "PERÍODO FINAL",
    filtros.fim ||
      "TODOS",
  ]);


  resumo.addRow([
    "CRITÉRIO DO PERÍODO",
    resultado
      .criterioPeriodo,
  ]);


  resumo.addRow([
    "TIPO DE DILIGÊNCIA",
    filtros
      .tipoDiligencia ||
      "TODOS",
  ]);


  resumo.addRow([
    "UF",
    filtros.uf ||
      "TODAS",
  ]);


  resumo.addRow([
    "REGISTROS",
    resultado
      .quantidade,
  ]);


  resumo.addRow([
    "DILIGÊNCIAS ÚNICAS",
    resultado
      .diligenciasUnicas,
  ]);


  if (
    resultado
      .linhasFinanceiras
      .length >
    0
  ) {

    resumo.addRow([
      "VALOR TOTAL",
      resultado
        .valorTotal,
    ]);


    resumo.getCell(
      `B${resumo.rowCount}`
    ).numFmt =
      '"R$" #,##0.00';
  }


  resumo.addRow([
    "GERADO EM",
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone:
          "America/Recife",

        dateStyle:
          "short",

        timeStyle:
          "medium",
      }
    ).format(
      new Date()
    ),
  ]);


  resumo.getColumn(
    1
  ).font = {
    bold:
      true,
  };


  resumo.getRow(
    1
  ).font = {
    bold:
      true,

    color: {
      argb:
        "FFFFFFFF",
    },
  };


  resumo.getRow(
    1
  ).fill = {
    type:
      "pattern",

    pattern:
      "solid",

    fgColor: {
      argb:
        "FF0B1F3A",
    },
  };


  /* ===================================================
     DOWNLOAD
  =================================================== */

  const buffer =
    await workbook
      .xlsx
      .writeBuffer();


  const dataArquivo =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );


  const nomeArquivo =
    `note-litis-${filtros.tipo}-${dataArquivo}.xlsx`;


  return new Response(
    buffer,
    {
      status:
        200,

      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        "Content-Disposition":
          `attachment; filename="${nomeArquivo}"`,

        "Cache-Control":
          "no-store",
      },
    }
  );
}