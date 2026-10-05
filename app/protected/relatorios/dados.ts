import "server-only";


/* =====================================================
   TIPOS DE RELATÓRIO
===================================================== */

export const NOMES_RELATORIOS = {
  diligencias_periodo:
    "Diligências por período",

  desfechos:
    "Desfechos",

  sem_desfecho:
    "Diligências sem desfecho",

  pagamentos_pendentes:
    "Pagamentos pendentes",

  pagamentos_realizados:
    "Pagamentos realizados",
} as const;


export type TipoRelatorio =
  keyof typeof NOMES_RELATORIOS;


export type FiltrosRelatorio = {
  tipo:
    TipoRelatorio;

  inicio:
    string;

  fim:
    string;

  tipoDiligencia:
    string;

  uf:
    string;

  profissionalId:
    string;
};


export type DiligenciaRelatorio =
  Record<
    string,
    unknown
  > & {
    id:
      string;

    tipo_diligencia:
      string;

    modalidade:
      string | null;

    numero_processo:
      string | null;

    parte_autora:
      string | null;

    parte_re:
      string | null;

    data_diligencia:
      string;

    horario:
      string;

    vara:
      string | null;

    comarca:
      string | null;

    uf:
      string | null;

    local:
      string | null;

    correspondente_id:
      string | null;

    preposto_id:
      string | null;

    status:
      string;

    resultado_diligencia:
      string | null;

    financeiro_status:
      string | null;

    desfecho_em:
      string | null;

    desfecho_observacoes:
      string | null;

    excluida_em:
      string | null;
  };


export type ContratacaoRelatorio =
  Record<
    string,
    unknown
  > & {
    id:
      string;

    empresa_id:
      string;

    diligencia_id:
      string;

    tipo_profissional:
      string;

    correspondente_id:
      string;

    valor:
      string | number;

    pagamento_combinado_em:
      string | null;

    pagamento_devido:
      boolean | null;

    pagamento_decidido_em:
      string | null;

    pago_em:
      string | null;

    pago_por?:
      string | null;
  };


export type ProfissionalRelatorio =
  Record<
    string,
    unknown
  > & {
    id:
      string;

    nome:
      string;

    tipo:
      string;

    oab_numero:
      string | null;

    oab_uf:
      string | null;

    cpf:
      string | null;
  };


export type LinhaFinanceiraRelatorio = {
  diligencia:
    DiligenciaRelatorio;

  contratacao:
    ContratacaoRelatorio;

  profissional:
    ProfissionalRelatorio | null;
};


export type ResultadoRelatorio = {
  tipo:
    TipoRelatorio;

  nome:
    string;

  criterioPeriodo:
    string;

  diligencias:
    DiligenciaRelatorio[];

  linhasFinanceiras:
    LinhaFinanceiraRelatorio[];

  quantidade:
    number;

  diligenciasUnicas:
    number;

  valorTotal:
    number;

  opcoes: {
    tiposDiligencia:
      string[];

    ufs:
      string[];

    profissionais:
      ProfissionalRelatorio[];
  };
};


/* =====================================================
   NORMALIZAÇÃO
===================================================== */

export function normalizarTipoRelatorio(
  valor:
    string | null | undefined
): TipoRelatorio {

  if (
    valor ===
      "desfechos" ||

    valor ===
      "sem_desfecho" ||

    valor ===
      "pagamentos_pendentes" ||

    valor ===
      "pagamentos_realizados"
  ) {
    return valor;
  }


  return "diligencias_periodo";
}


export function relatorioFinanceiro(
  tipo:
    TipoRelatorio
) {

  return (
    tipo ===
      "pagamentos_pendentes" ||

    tipo ===
      "pagamentos_realizados"
  );
}


/* =====================================================
   DATAS
===================================================== */

export function hojeEmRecife() {

  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Recife",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).formatToParts(
      new Date()
    );


  const obter =
    (
      tipo:
        Intl.DateTimeFormatPartTypes
    ) =>
      partes.find(
        (
          parte
        ) =>
          parte.type ===
          tipo
      )?.value ?? "";


  return `${obter("year")}-${obter("month")}-${obter("day")}`;
}


export function inicioMesAtual() {

  const hoje =
    hojeEmRecife();

  return `${hoje.slice(0, 7)}-01`;
}


function dataTimestampEmRecife(
  valor:
    string | null
) {

  if (!valor) {
    return null;
  }


  const data =
    new Date(
      valor
    );


  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return valor.slice(
      0,
      10
    );
  }


  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Recife",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).formatToParts(
      data
    );


  const obter =
    (
      tipo:
        Intl.DateTimeFormatPartTypes
    ) =>
      partes.find(
        (
          parte
        ) =>
          parte.type ===
          tipo
      )?.value ?? "";


  return `${obter("year")}-${obter("month")}-${obter("day")}`;
}


function estaNoPeriodo(
  data:
    string | null,

  inicio:
    string,

  fim:
    string
) {

  if (!data) {
    return false;
  }


  if (
    inicio &&
    data < inicio
  ) {
    return false;
  }


  if (
    fim &&
    data > fim
  ) {
    return false;
  }


  return true;
}


/* =====================================================
   ATO TRANSCORRIDO
===================================================== */

function atoJaTranscorreu(
  diligencia:
    DiligenciaRelatorio
) {

  const agoraPartes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Recife",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hourCycle:
          "h23",
      }
    ).formatToParts(
      new Date()
    );


  const obter =
    (
      tipo:
        Intl.DateTimeFormatPartTypes
    ) =>
      agoraPartes.find(
        (
          parte
        ) =>
          parte.type ===
          tipo
      )?.value ?? "";


  const hoje =
    `${obter("year")}-${obter("month")}-${obter("day")}`;


  const horario =
    `${obter("hour")}:${obter("minute")}`;


  if (
    diligencia
      .data_diligencia <
    hoje
  ) {
    return true;
  }


  if (
    diligencia
      .data_diligencia >
    hoje
  ) {
    return false;
  }


  return (
    diligencia
      .horario
      .slice(
        0,
        5
      ) <=
    horario
  );
}


/* =====================================================
   CRITÉRIO DO PERÍODO
===================================================== */

function criterioPeriodo(
  tipo:
    TipoRelatorio
) {

  if (
    tipo ===
    "desfechos"
  ) {
    return "Data em que o desfecho foi registrado";
  }


  if (
    tipo ===
    "pagamentos_pendentes"
  ) {
    return "Data combinada para pagamento";
  }


  if (
    tipo ===
    "pagamentos_realizados"
  ) {
    return "Data em que o pagamento foi registrado";
  }


  return "Data da diligência";
}


/* =====================================================
   CARREGAMENTO
===================================================== */

export async function carregarRelatorio(
  admin:
    any,

  empresaId:
    string,

  filtros:
    FiltrosRelatorio
): Promise<ResultadoRelatorio> {

  const [
    consultaDiligencias,
    consultaContratacoes,
    consultaProfissionais,
  ] =
    await Promise.all([

      admin
        .from(
          "diligencias"
        )
        .select("*")
        .eq(
          "empresa_id",
          empresaId
        )
        .is(
          "excluida_em",
          null
        ),

      admin
        .from(
          "diligencias_contratacoes"
        )
        .select("*")
        .eq(
          "empresa_id",
          empresaId
        ),

      admin
        .from(
          "correspondentes"
        )
        .select(`
          id,
          nome,
          tipo,
          oab_numero,
          oab_uf,
          cpf
        `)
        .eq(
          "empresa_id",
          empresaId
        ),
    ]);


  if (
    consultaDiligencias.error
  ) {
    throw new Error(
      `Erro ao consultar diligências: ${consultaDiligencias.error.message}`
    );
  }


  if (
    consultaContratacoes.error
  ) {
    throw new Error(
      `Erro ao consultar contratações: ${consultaContratacoes.error.message}`
    );
  }


  if (
    consultaProfissionais.error
  ) {
    throw new Error(
      `Erro ao consultar profissionais: ${consultaProfissionais.error.message}`
    );
  }


  const diligencias =
    (
      consultaDiligencias.data ??
      []
    ) as
      DiligenciaRelatorio[];


  const contratacoes =
    (
      consultaContratacoes.data ??
      []
    ) as
      ContratacaoRelatorio[];


  const profissionais =
    (
      consultaProfissionais.data ??
      []
    ) as
      ProfissionalRelatorio[];


  const profissionalPorId =
    new Map(
      profissionais.map(
        (
          profissional
        ) => [
          profissional.id,
          profissional,
        ]
      )
    );


  const contratosPorDiligencia =
    new Map<
      string,
      ContratacaoRelatorio[]
    >();


  for (
    const contratacao of
    contratacoes
  ) {

    const atual =
      contratosPorDiligencia.get(
        contratacao
          .diligencia_id
      ) ?? [];


    atual.push(
      contratacao
    );


    contratosPorDiligencia.set(
      contratacao
        .diligencia_id,
      atual
    );
  }


  function atendeFiltrosGerais(
    diligencia:
      DiligenciaRelatorio,

    profissionalIdContrato?:
      string
  ) {

    if (
      filtros.tipoDiligencia &&
      diligencia
        .tipo_diligencia !==
        filtros.tipoDiligencia
    ) {
      return false;
    }


    if (
      filtros.uf &&
      diligencia.uf !==
        filtros.uf
    ) {
      return false;
    }


    if (
      filtros.profissionalId
    ) {

      if (
        profissionalIdContrato
      ) {
        return (
          profissionalIdContrato ===
          filtros.profissionalId
        );
      }


      const contratos =
        contratosPorDiligencia.get(
          diligencia.id
        ) ?? [];


      const vinculado =
        diligencia
          .correspondente_id ===
          filtros.profissionalId ||

        diligencia
          .preposto_id ===
          filtros.profissionalId ||

        contratos.some(
          (
            contratacao
          ) =>
            contratacao
              .correspondente_id ===
            filtros.profissionalId
        );


      if (!vinculado) {
        return false;
      }
    }


    return true;
  }


  let diligenciasSelecionadas:
    DiligenciaRelatorio[] =
    [];


  let linhasFinanceiras:
    LinhaFinanceiraRelatorio[] =
    [];


  /* ===================================================
     DILIGÊNCIAS POR PERÍODO
  =================================================== */

  if (
    filtros.tipo ===
    "diligencias_periodo"
  ) {

    diligenciasSelecionadas =
      diligencias.filter(
        (
          diligencia
        ) =>
          atendeFiltrosGerais(
            diligencia
          ) &&

          estaNoPeriodo(
            diligencia
              .data_diligencia,
            filtros.inicio,
            filtros.fim
          )
      );
  }


  /* ===================================================
     DESFECHOS
  =================================================== */

  if (
    filtros.tipo ===
    "desfechos"
  ) {

    diligenciasSelecionadas =
      diligencias.filter(
        (
          diligencia
        ) => {

          if (
            !diligencia
              .desfecho_em
          ) {
            return false;
          }


          return (
            atendeFiltrosGerais(
              diligencia
            ) &&

            estaNoPeriodo(
              dataTimestampEmRecife(
                diligencia
                  .desfecho_em
              ),
              filtros.inicio,
              filtros.fim
            )
          );
        }
      );
  }


  /* ===================================================
     SEM DESFECHO
  =================================================== */

  if (
    filtros.tipo ===
    "sem_desfecho"
  ) {

    diligenciasSelecionadas =
      diligencias.filter(
        (
          diligencia
        ) =>
          diligencia.status ===
            "ativa" &&

          !diligencia
            .desfecho_em &&

          atoJaTranscorreu(
            diligencia
          ) &&

          atendeFiltrosGerais(
            diligencia
          ) &&

          estaNoPeriodo(
            diligencia
              .data_diligencia,
            filtros.inicio,
            filtros.fim
          )
      );
  }


  /* ===================================================
     PAGAMENTOS
  =================================================== */

  if (
    filtros.tipo ===
      "pagamentos_pendentes" ||

    filtros.tipo ===
      "pagamentos_realizados"
  ) {

    const diligenciaPorId =
      new Map(
        diligencias.map(
          (
            diligencia
          ) => [
            diligencia.id,
            diligencia,
          ]
        )
      );


    linhasFinanceiras =
      contratacoes
        .filter(
          (
            contratacao
          ) => {

            const diligencia =
              diligenciaPorId.get(
                contratacao
                  .diligencia_id
              );


            if (!diligencia) {
              return false;
            }


            if (
              !atendeFiltrosGerais(
                diligencia,
                contratacao
                  .correspondente_id
              )
            ) {
              return false;
            }


            if (
              filtros.tipo ===
              "pagamentos_pendentes"
            ) {

              if (
                contratacao
                  .pagamento_devido !==
                  true ||

                contratacao
                  .pago_em
              ) {
                return false;
              }


              return estaNoPeriodo(
                contratacao
                  .pagamento_combinado_em,
                filtros.inicio,
                filtros.fim
              );
            }


            if (
              contratacao
                .pagamento_devido !==
                true ||

              !contratacao
                .pago_em
            ) {
              return false;
            }


            return estaNoPeriodo(
              dataTimestampEmRecife(
                contratacao
                  .pago_em
              ),
              filtros.inicio,
              filtros.fim
            );
          }
        )
        .map(
          (
            contratacao
          ) => {

            const diligencia =
              diligenciaPorId.get(
                contratacao
                  .diligencia_id
              )!;


            return {
              diligencia,

              contratacao,

              profissional:
                profissionalPorId.get(
                  contratacao
                    .correspondente_id
                ) ?? null,
            };
          }
        );
  }


  /* ===================================================
     ORDENAÇÃO
  =================================================== */

  diligenciasSelecionadas.sort(
    (
      a,
      b
    ) => {

      const data =
        a
          .data_diligencia
          .localeCompare(
            b
              .data_diligencia
          );


      if (data !== 0) {
        return data;
      }


      return (
        a.horario ??
        ""
      ).localeCompare(
        b.horario ??
          ""
      );
    }
  );


  linhasFinanceiras.sort(
    (
      a,
      b
    ) => {

      const dataA =
        filtros.tipo ===
          "pagamentos_realizados"
          ? (
              a.contratacao
                .pago_em ??
              ""
            )
          : (
              a.contratacao
                .pagamento_combinado_em ??
              ""
            );


      const dataB =
        filtros.tipo ===
          "pagamentos_realizados"
          ? (
              b.contratacao
                .pago_em ??
              ""
            )
          : (
              b.contratacao
                .pagamento_combinado_em ??
              ""
            );


      return dataA.localeCompare(
        dataB
      );
    }
  );


  /* ===================================================
     RESUMOS
  =================================================== */

  const valorTotal =
    linhasFinanceiras.reduce(
      (
        total,
        linha
      ) =>
        total +
        (
          Number(
            linha
              .contratacao
              .valor
          ) || 0
        ),
      0
    );


  const diligenciasUnicas =
    relatorioFinanceiro(
      filtros.tipo
    )
      ? new Set(
          linhasFinanceiras.map(
            (
              linha
            ) =>
              linha
                .diligencia
                .id
          )
        ).size
      : diligenciasSelecionadas
          .length;


  const tiposDiligencia =
    Array.from(
      new Set(
        diligencias
          .map(
            (
              diligencia
            ) =>
              diligencia
                .tipo_diligencia
          )
          .filter(Boolean)
      )
    ).sort();


  const ufs =
    Array.from(
      new Set(
        diligencias
          .map(
            (
              diligencia
            ) =>
              diligencia.uf
          )
          .filter(
            (
              uf
            ): uf is string =>
              Boolean(uf)
          )
      )
    ).sort();


  profissionais.sort(
    (
      a,
      b
    ) =>
      a.nome.localeCompare(
        b.nome,
        "pt-BR"
      )
  );


  return {
    tipo:
      filtros.tipo,

    nome:
      NOMES_RELATORIOS[
        filtros.tipo
      ],

    criterioPeriodo:
      criterioPeriodo(
        filtros.tipo
      ),

    diligencias:
      diligenciasSelecionadas,

    linhasFinanceiras,

    quantidade:
      relatorioFinanceiro(
        filtros.tipo
      )
        ? linhasFinanceiras
            .length
        : diligenciasSelecionadas
            .length,

    diligenciasUnicas,

    valorTotal,

    opcoes: {
      tiposDiligencia,

      ufs,

      profissionais,
    },
  };
}