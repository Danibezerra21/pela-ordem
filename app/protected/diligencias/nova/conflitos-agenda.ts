export type DiligenciaConflitante = {
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


export type ConflitoAgenda = {
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
    DiligenciaConflitante;
};


type ValoresAgenda = {
  data_diligencia:
    string;

  horario:
    string;

  correspondente_id:
    string;

  necessita_preposto:
    | boolean
    | null;

  preposto_id:
    string;

  testemunhas_confirmadas:
    | boolean
    | null;

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
   HORÁRIOS
===================================================== */

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
      .split(
        ":"
      )
      .map(
        Number
      );


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


/*
  REGRA FUNDAMENTAL:

  Só pode haver conflito de agenda
  se as duas diligências ocorrerem
  NA MESMA DATA.
*/

function existeConflito(
  novaData:
    string,

  novoHorario:
    string,

  diligencia:
    DiligenciaConflitante
) {
  if (
    diligencia
      .data_diligencia !==
    novaData
  ) {
    return false;
  }


  const diferenca =
    diferencaEntreHorarios(
      novoHorario,
      diligencia.horario
    );


  /*
    Menos de 5 horas.

    4h59 → alerta
    5h00 → não alerta
  */

  return (
    diferenca < 300
  );
}


/* =====================================================
   IDENTIFICAÇÃO
===================================================== */

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


/* =====================================================
   CONSULTA DA AGENDA DE ADVOGADO / PREPOSTO
===================================================== */

async function buscarDiligenciasPorCampo(
  supabase:
    any,

  empresaId:
    string,

  data:
    string,

  campo:
    | "correspondente_id"
    | "preposto_id",

  participanteId:
    string
): Promise<
  DiligenciaConflitante[]
> {
  const {
    data:
      diligenciasConsulta,

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
        campo,
        participanteId
      )
      .eq(
        "data_diligencia",
        data
      )
      .is(
        "excluida_em",
        null
      )
      .neq(
        "status",
        "cancelada"
      );


  if (error) {
    throw new Error(
      `Erro ao consultar agenda: ${error.message}`
    );
  }


  const diligencias =
    (
      diligenciasConsulta ??
      []
    ) as
      DiligenciaConflitante[];


  /*
    Proteção redundante:

    Mesmo que por qualquer razão
    a consulta devolva outra data,
    ela não participa do conflito.
  */

  return diligencias.filter(
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

   Regra:
   - mesmo participante;
   - mesma data;
   - intervalo inferior a 5 horas.

   4h59 → conflito
   5h00 → sem conflito
===================================================== */

export async function buscarConflitosAgenda(
  supabase:
    any,

  empresaId:
    string,

  valores:
    ValoresAgenda
): Promise<
  ConflitoAgenda[]
> {
  const conflitos:
    ConflitoAgenda[] =
    [];


  const novaData =
    valores
      .data_diligencia;


  const novoHorario =
    valores
      .horario;


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

      error:
        erroAdvogado,
    } =
      await supabase
        .from(
          "correspondentes"
        )
        .select(`
          id,
          nome,
          oab_numero,
          oab_uf
        `)
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


    if (
      erroAdvogado
    ) {
      throw new Error(
        `Erro ao consultar advogado: ${erroAdvogado.message}`
      );
    }


    const advogado =
      advogadoConsulta as
        AdvogadoAgenda |
        null;


    if (advogado) {
      const diligencias =
        await buscarDiligenciasPorCampo(
          supabase,
          empresaId,
          novaData,
          "correspondente_id",
          advogado.id
        );


      for (
        const diligencia
        of diligencias
      ) {
        if (
          !existeConflito(
            novaData,
            novoHorario,
            diligencia
          )
        ) {
          continue;
        }


        const diferenca =
          diferencaEntreHorarios(
            novoHorario,
            diligencia
              .horario
          );


        conflitos.push({
          participante_tipo:
            "advogado",

          participante_id:
            advogado.id,

          participante_nome:
            advogado.nome,

          identificacao:
            advogado
              .oab_numero
              ? `OAB/${advogado.oab_uf ?? ""} ${advogado.oab_numero}`.trim()
              : "OAB não informada",

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

      error:
        erroPreposto,
    } =
      await supabase
        .from(
          "correspondentes"
        )
        .select(`
          id,
          nome,
          cpf
        `)
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


    if (
      erroPreposto
    ) {
      throw new Error(
        `Erro ao consultar preposto: ${erroPreposto.message}`
      );
    }


    /*
      Tipagem explícita.

      Evita que o TypeScript interprete o
      retorno do Supabase como {}.
    */

    const preposto =
      prepostoConsulta as
        PrepostoAgenda |
        null;


    if (preposto) {
      const diligencias =
        await buscarDiligenciasPorCampo(
          supabase,
          empresaId,
          novaData,
          "preposto_id",
          preposto.id
        );


      for (
        const diligencia
        of diligencias
      ) {
        if (
          !existeConflito(
            novaData,
            novoHorario,
            diligencia
          )
        ) {
          continue;
        }


        const diferenca =
          diferencaEntreHorarios(
            novoHorario,
            diligencia
              .horario
          );


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

  if (
    valores
      .testemunhas_confirmadas ===
      true &&
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
        .select(`
          id,
          nome,
          cpf
        `)
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
        .select(`
          testemunha_id,
          diligencia_id
        `)
        .eq(
          "empresa_id",
          empresaId
        )
        .in(
          "testemunha_id",
          valores
            .testemunha_ids
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


    const diligenciaIds:
      string[] =
      Array.from(
        new Set<string>(
          vinculos.map(
            (
              item
            ) =>
              item
                .diligencia_id
          )
        )
      );


    let diligencias:
      DiligenciaConflitante[] =
      [];


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
            "data_diligencia",
            novaData
          )
          .in(
            "id",
            diligenciaIds
          )
          .is(
            "excluida_em",
            null
          )
          .neq(
            "status",
            "cancelada"
          );


      if (
        erroDiligencias
      ) {
        throw new Error(
          `Erro ao consultar diligências das testemunhas: ${erroDiligencias.message}`
        );
      }


      diligencias =
        (
          diligenciasConsulta ??
          []
        ) as
          DiligenciaConflitante[];


      /*
        Segunda proteção de data
        também para testemunhas.
      */

      diligencias =
        diligencias.filter(
          (
            diligencia
          ) =>
            diligencia
              .data_diligencia ===
            novaData
        );
    }


    const mapaDiligencias =
      new Map<
        string,
        DiligenciaConflitante
      >(
        diligencias.map(
          (
            diligencia
          ) => [
            diligencia.id,
            diligencia,
          ]
        )
      );


    const mapaTestemunhas =
      new Map<
        string,
        TestemunhaAgenda
      >(
        testemunhas.map(
          (
            testemunha
          ) => [
            testemunha.id,
            testemunha,
          ]
        )
      );


    for (
      const vinculo
      of vinculos
    ) {
      const testemunha =
        mapaTestemunhas.get(
          vinculo
            .testemunha_id
        );


      const diligencia =
        mapaDiligencias.get(
          vinculo
            .diligencia_id
        );


      if (
        !testemunha ||
        !diligencia
      ) {
        continue;
      }


      if (
        !existeConflito(
          novaData,
          novoHorario,
          diligencia
        )
      ) {
        continue;
      }


      const diferenca =
        diferencaEntreHorarios(
          novoHorario,
          diligencia
            .horario
        );


      /*
        Evita repetir exatamente o mesmo
        conflito caso exista vínculo
        duplicado por algum dado legado.
      */

      const conflitoJaIncluido =
        conflitos.some(
          (
            conflito
          ) =>
            conflito
              .participante_tipo ===
              "testemunha" &&
            conflito
              .participante_id ===
              testemunha.id &&
            conflito
              .diligencia
              .id ===
              diligencia.id
        );


      if (
        conflitoJaIncluido
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


  return conflitos;
}


/* =====================================================
   ASSINATURA DOS CONFLITOS

   Utilizada para verificar se o cenário
   mudou enquanto o usuário analisava
   um alerta.
===================================================== */

export function assinaturaConflitosAgenda(
  conflitos:
    ConflitoAgenda[]
) {
  return JSON.stringify(
    conflitos
      .map(
        (
          conflito
        ) =>
          [
            conflito
              .participante_tipo,

            conflito
              .participante_id,

            conflito
              .diligencia
              .id,

            conflito
              .diligencia
              .data_diligencia,

            conflito
              .diferenca_minutos,
          ].join(
            "|"
          )
      )
      .sort()
  );
}