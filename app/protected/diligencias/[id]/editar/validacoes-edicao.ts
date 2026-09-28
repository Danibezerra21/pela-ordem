/* =====================================================
   TIPOS
===================================================== */

export type DiligenciaEncontradaEdicao = {
  id: string;

  numero_processo:
    string | null;

  tipo_diligencia:
    string;

  modalidade:
    | "presencial"
    | "virtual";

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

export type ConflitoAgendaEdicao = {
  participante_tipo:
    | "advogado"
    | "preposto"
    | "testemunha";

  participante_id:
    string;

  participante_nome:
    string;

  identificacao:
    string;

  diferenca_minutos:
    number;

  diligencia:
    DiligenciaEncontradaEdicao;
};

export type ValoresAgendaEdicao = {
  data_diligencia:
    string;

  horario:
    string;

  correspondente_id:
    string;

  necessita_preposto:
    boolean | null;

  preposto_id:
    string;

  /*
    Aceitamos tanto o estado canônico
    quanto o legado para manter
    compatibilidade durante a transição.
  */
  testemunhas_status?:
    | "confirmadas"
    | "desnecessarias"
    | null;

  testemunhas_confirmadas?:
    boolean | null;

  testemunha_ids:
    string[];
};

type AdvogadoAgenda = {
  id:
    string;

  nome:
    string;

  oab_numero:
    string | null;

  oab_uf:
    string | null;
};

type PrepostoAgenda = {
  id:
    string;

  nome:
    string;

  cpf:
    string | null;
};

type TestemunhaAgenda = {
  id:
    string;

  nome:
    string;

  cpf:
    string | null;
};

type VinculoTestemunhaAgenda = {
  testemunha_id:
    string;

  diligencia_id:
    string;
};

/* =====================================================
   NORMALIZAÇÃO
===================================================== */

export function normalizarProcesso(
  valor:
    string
) {
  return valor.replace(
    /\D/g,
    ""
  );
}

function obterHojeRecife() {
  return new Intl.DateTimeFormat(
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
  ).format(
    new Date()
  );
}

function horarioEmMinutos(
  horario:
    string
) {
  const [
    hora,
    minuto,
  ] =
    horario
      .slice(
        0,
        5
      )
      .split(":")
      .map(Number);

  return (
    hora * 60 +
    minuto
  );
}

function diferencaEntreHorarios(
  horarioA:
    string,

  horarioB:
    string
) {
  return Math.abs(
    horarioEmMinutos(
      horarioA
    ) -
      horarioEmMinutos(
        horarioB
      )
  );
}

function mascararCpf(
  cpf:
    string | null
) {
  if (!cpf) {
    return "CPF";
  }

  const numeros =
    cpf.replace(
      /\D/g,
      ""
    );

  if (
    numeros.length !==
    11
  ) {
    return "CPF";
  }

  return `CPF ***.***.***-${numeros.slice(
    -2
  )}`;
}

function testemunhasEstaoConfirmadas(
  valores:
    ValoresAgendaEdicao
) {
  /*
    Estado canônico tem prioridade.
  */

  if (
    valores
      .testemunhas_status ===
      "confirmadas"
  ) {
    return true;
  }

  if (
    valores
      .testemunhas_status ===
      "desnecessarias"
  ) {
    return false;
  }

  /*
    Fallback legado.

    Somente TRUE prova confirmação.
    FALSE não significa "desnecessárias".
  */

  return (
    valores
      .testemunhas_confirmadas ===
    true
  );
}

/* =====================================================
   POSSÍVEL DUPLICIDADE
===================================================== */

/*
  REGRA OPERACIONAL:

  A possível duplicidade serve para
  evitar duas diligências ATIVAS para
  o mesmo processo sem que o controller
  perceba.

  Registros concluídos são histórico
  operacional e não representam
  duplicidade da pauta atual.

  Cancelados também não participam.

  Na edição:
  - mesmo processo;
  - hoje ou futuro;
  - somente status ATIVA;
  - ignora a própria diligência.
*/

export async function buscarPossiveisDuplicidadesEdicao(
  supabase:
    any,

  empresaId:
    string,

  diligenciaId:
    string,

  numeroProcesso:
    string
): Promise<
  DiligenciaEncontradaEdicao[]
> {
  const processo =
    normalizarProcesso(
      numeroProcesso
    );

  if (!processo) {
    return [];
  }

  const hoje =
    obterHojeRecife();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "diligencias"
      )
      .select(
        `
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
        `
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        "numero_processo",
        processo
      )
      .gte(
        "data_diligencia",
        hoje
      )
      .neq(
        "id",
        diligenciaId
      )
      .is(
        "excluida_em",
        null
      )

      /*
        CORREÇÃO CENTRAL:

        antes:
        status != cancelada

        agora:
        status = ativa

        Concluída não disputa pauta.
      */
      .eq(
        "status",
        "ativa"
      )
      .order(
        "data_diligencia",
        {
          ascending:
            true,
        }
      )
      .order(
        "horario",
        {
          ascending:
            true,
        }
      );

  if (error) {
    throw new Error(
      `Erro ao verificar possível duplicidade: ${error.message}`
    );
  }

  return (
    data ??
    []
  ) as
    DiligenciaEncontradaEdicao[];
}

/* =====================================================
   AGENDA DE ADVOGADO / PREPOSTO
===================================================== */

async function buscarDiligenciasPorParticipante(
  supabase:
    any,

  empresaId:
    string,

  diligenciaId:
    string,

  data:
    string,

  campo:
    | "correspondente_id"
    | "preposto_id",

  participanteId:
    string
): Promise<
  DiligenciaEncontradaEdicao[]
> {
  const {
    data:
      diligencias,

    error,
  } =
    await supabase
      .from(
        "diligencias"
      )
      .select(
        `
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
        `
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        campo,
        participanteId
      )
      .eq(
        "data_diligencia",
        data
      )
      .neq(
        "id",
        diligenciaId
      )
      .is(
        "excluida_em",
        null
      )

      /*
        CONFLITO DE AGENDA SÓ EXISTE
        ENTRE DILIGÊNCIAS ATIVAS.

        Isso exclui:
        - concluídas;
        - canceladas;
        - registros históricos.
      */
      .eq(
        "status",
        "ativa"
      );

  if (error) {
    throw new Error(
      `Erro ao consultar agenda: ${error.message}`
    );
  }

  const registros =
    (
      diligencias ??
      []
    ) as
      DiligenciaEncontradaEdicao[];

  /*
    Proteção redundante.

    Mesmo que a consulta já esteja
    limitada à data informada,
    reafirmamos a regra.
  */

  return registros.filter(
    (
      diligencia
    ) =>
      diligencia
        .data_diligencia ===
      data
  );
}

/* =====================================================
   CONFLITOS DE AGENDA
===================================================== */

/*
  REGRA:

  mesmo participante
  +
  mesma data
  +
  outra diligência ATIVA
  +
  diferença inferior a 5 horas.

  4h59 => conflito.
  5h00 => não é conflito.

  Nunca participam do conflito:

  - a própria diligência;
  - diligência concluída;
  - diligência cancelada;
  - diligência excluída.

  Consequência importante:

  uma diligência de continuidade
  NUNCA conflita com a diligência
  concluída que lhe deu origem.
*/

export async function buscarConflitosAgendaEdicao(
  supabase:
    any,

  empresaId:
    string,

  diligenciaId:
    string,

  valores:
    ValoresAgendaEdicao
): Promise<
  ConflitoAgendaEdicao[]
> {
  const conflitos:
    ConflitoAgendaEdicao[] =
    [];

  const novaData =
    valores
      .data_diligencia;

  const novoHorario =
    valores.horario;

  /* ===================================================
     ADVOGADO
  =================================================== */

  if (
    valores
      .correspondente_id
  ) {
    const {
      data:
        advogadoConsulta,

      error,
    } =
      await supabase
        .from(
          "correspondentes"
        )
        .select(
          `
            id,
            nome,
            oab_numero,
            oab_uf
          `
        )
        .eq(
          "empresa_id",
          empresaId
        )
        .eq(
          "id",
          valores
            .correspondente_id
        )
        .eq(
          "tipo",
          "advogado"
        )
        .maybeSingle();

    if (error) {
      throw new Error(
        `Erro ao consultar advogado: ${error.message}`
      );
    }

    const advogado =
      advogadoConsulta as
        AdvogadoAgenda |
        null;

    if (advogado) {
      const diligencias =
        await buscarDiligenciasPorParticipante(
          supabase,
          empresaId,
          diligenciaId,
          novaData,
          "correspondente_id",
          advogado.id
        );

      for (
        const diligencia
        of diligencias
      ) {
        const diferenca =
          diferencaEntreHorarios(
            novoHorario,
            diligencia
              .horario
          );

        if (
          diferenca >=
          300
        ) {
          continue;
        }

        const oab =
          advogado
            .oab_numero &&
          advogado
            .oab_uf
            ? `OAB/${advogado.oab_uf} ${advogado.oab_numero}`
            : "OAB não informada";

        conflitos.push({
          participante_tipo:
            "advogado",

          participante_id:
            advogado.id,

          participante_nome:
            advogado.nome,

          identificacao:
            oab,

          diferenca_minutos:
            diferenca,

          diligencia,
        });
      }
    }
  }

  /* ===================================================
     PREPOSTO
  =================================================== */

  if (
    valores
      .necessita_preposto ===
      true &&
    valores
      .preposto_id
  ) {
    const {
      data:
        prepostoConsulta,

      error,
    } =
      await supabase
        .from(
          "correspondentes"
        )
        .select(
          `
            id,
            nome,
            cpf
          `
        )
        .eq(
          "empresa_id",
          empresaId
        )
        .eq(
          "id",
          valores
            .preposto_id
        )
        .eq(
          "tipo",
          "preposto"
        )
        .maybeSingle();

    if (error) {
      throw new Error(
        `Erro ao consultar preposto: ${error.message}`
      );
    }

    const preposto =
      prepostoConsulta as
        PrepostoAgenda |
        null;

    if (preposto) {
      const diligencias =
        await buscarDiligenciasPorParticipante(
          supabase,
          empresaId,
          diligenciaId,
          novaData,
          "preposto_id",
          preposto.id
        );

      for (
        const diligencia
        of diligencias
      ) {
        const diferenca =
          diferencaEntreHorarios(
            novoHorario,
            diligencia
              .horario
          );

        if (
          diferenca >=
          300
        ) {
          continue;
        }

        conflitos.push({
          participante_tipo:
            "preposto",

          participante_id:
            preposto.id,

          participante_nome:
            preposto.nome,

          identificacao:
            mascararCpf(
              preposto.cpf
            ),

          diferenca_minutos:
            diferenca,

          diligencia,
        });
      }
    }
  }

  /* ===================================================
     TESTEMUNHAS
  =================================================== */

  const testemunhasConfirmadas =
    testemunhasEstaoConfirmadas(
      valores
    );

  if (
    testemunhasConfirmadas &&
    valores
      .testemunha_ids
      .length >
      0
  ) {
    const {
      data:
        testemunhasConsulta,

      error:
        erroTestemunhas,
    } =
      await supabase
        .from(
          "testemunhas"
        )
        .select(
          `
            id,
            nome,
            cpf
          `
        )
        .eq(
          "empresa_id",
          empresaId
        )
        .in(
          "id",
          valores
            .testemunha_ids
        );

    if (
      erroTestemunhas
    ) {
      throw new Error(
        `Erro ao consultar testemunhas: ${erroTestemunhas.message}`
      );
    }

    const testemunhas =
      (
        testemunhasConsulta ??
        []
      ) as
        TestemunhaAgenda[];

    const {
      data:
        vinculosConsulta,

      error:
        erroVinculos,
    } =
      await supabase
        .from(
          "diligencias_testemunhas"
        )
        .select(
          `
            testemunha_id,
            diligencia_id
          `
        )
        .eq(
          "empresa_id",
          empresaId
        )
        .in(
          "testemunha_id",
          valores
            .testemunha_ids
        )
        .neq(
          "diligencia_id",
          diligenciaId
        );

    if (
      erroVinculos
    ) {
      throw new Error(
        `Erro ao consultar agenda das testemunhas: ${erroVinculos.message}`
      );
    }

    const vinculos =
      (
        vinculosConsulta ??
        []
      ) as
        VinculoTestemunhaAgenda[];

    const diligenciaIds =
      Array.from(
        new Set(
          vinculos.map(
            (
              vinculo
            ) =>
              vinculo
                .diligencia_id
          )
        )
      );

    if (
      diligenciaIds.length >
      0
    ) {
      const {
        data:
          diligenciasConsulta,

        error:
          erroDiligencias,
      } =
        await supabase
          .from(
            "diligencias"
          )
          .select(
            `
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
            `
          )
          .eq(
            "empresa_id",
            empresaId
          )
          .eq(
            "data_diligencia",
            novaData
          )
          .neq(
            "id",
            diligenciaId
          )
          .in(
            "id",
            diligenciaIds
          )
          .is(
            "excluida_em",
            null
          )

          /*
            MESMA REGRA:

            testemunha só possui
            conflito em outra
            diligência ATIVA.
          */
          .eq(
            "status",
            "ativa"
          );

      if (
        erroDiligencias
      ) {
        throw new Error(
          `Erro ao consultar diligências das testemunhas: ${erroDiligencias.message}`
        );
      }

      const diligencias =
        (
          diligenciasConsulta ??
          []
        ) as
          DiligenciaEncontradaEdicao[];

      /*
        Não usamos mapas aqui.

        Além de manter a tipagem simples,
        evitamos os problemas anteriores
        de inferência e redeclaração de
        mapaDiligencias.
      */

      for (
        const vinculo
        of vinculos
      ) {
        const testemunha =
          testemunhas.find(
            (
              item
            ) =>
              item.id ===
              vinculo
                .testemunha_id
          );

        if (
          !testemunha
        ) {
          continue;
        }

        const diligencia =
          diligencias.find(
            (
              item
            ) =>
              item.id ===
              vinculo
                .diligencia_id
          );

        if (
          !diligencia
        ) {
          /*
            Aqui também serão descartados,
            naturalmente, vínculos de
            diligências concluídas ou
            canceladas, pois elas não
            vieram na consulta acima.
          */
          continue;
        }

        if (
          diligencia
            .data_diligencia !==
          novaData
        ) {
          continue;
        }

        const diferenca =
          diferencaEntreHorarios(
            novoHorario,
            diligencia
              .horario
          );

        if (
          diferenca >=
          300
        ) {
          continue;
        }

        conflitos.push({
          participante_tipo:
            "testemunha",

          participante_id:
            testemunha.id,

          participante_nome:
            testemunha.nome,

          identificacao:
            mascararCpf(
              testemunha.cpf
            ),

          diferenca_minutos:
            diferenca,

          diligencia,
        });
      }
    }
  }

  return conflitos;
}