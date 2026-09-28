export type DiligenciaConflitante = {
  id: string;
  numero_processo: string | null;
  tipo_diligencia: string;
  modalidade: "presencial" | "virtual";
  data_diligencia: string;
  horario: string;
  parte_autora: string | null;
  parte_re: string | null;
  vara: string | null;
  comarca: string | null;
  uf: string | null;
  local: string | null;
};

export type ConflitoAgenda = {
  participante_tipo:
    | "advogado"
    | "preposto"
    | "testemunha";

  participante_id: string;
  participante_nome: string;
  identificacao: string;

  diferenca_minutos: number;

  diligencia: DiligenciaConflitante;
};

type ValoresAgenda = {
  data_diligencia: string;
  horario: string;

  correspondente_id: string;

  necessita_preposto:
    | boolean
    | null;

  preposto_id: string;

  testemunhas_confirmadas:
    | boolean
    | null;

  testemunha_ids: string[];
};

function horarioEmMinutos(
  horario: string
) {
  const [hora, minuto] =
    horario
      .slice(0, 5)
      .split(":")
      .map(Number);

  return (
    hora * 60 +
    minuto
  );
}

function diferencaEntreHorarios(
  horarioA: string,
  horarioB: string
) {
  return Math.abs(
    horarioEmMinutos(horarioA) -
      horarioEmMinutos(horarioB)
  );
}

/*
  REGRA FUNDAMENTAL:

  Só pode haver conflito de agenda
  se as duas diligências ocorrerem
  NA MESMA DATA.
*/
function existeConflito(
  novaData: string,
  novoHorario: string,
  diligencia:
    DiligenciaConflitante
) {
  if (
    diligencia.data_diligencia !==
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
  return diferenca < 300;
}

function mascararCpf(
  cpf: string | null
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
    numeros.length !== 11
  ) {
    return "CPF";
  }

  return `CPF ***.***.***-${numeros.slice(
    -2
  )}`;
}

async function buscarDiligenciasPorCampo(
  supabase: any,
  empresaId: string,
  data: string,
  campo:
    | "correspondente_id"
    | "preposto_id",
  participanteId: string
): Promise<
  DiligenciaConflitante[]
> {
  const {
    data: diligencias,
    error,
  } = await supabase
    .from("diligencias")
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

  /*
    Segunda proteção:
    mesmo que por qualquer razão
    a consulta devolva outra data,
    ela é descartada aqui.
  */
  return (
    (
      diligencias ?? []
    ) as DiligenciaConflitante[]
  ).filter(
    (diligencia) =>
      diligencia.data_diligencia ===
      data
  );
}

export async function buscarConflitosAgenda(
  supabase: any,
  empresaId: string,
  valores: ValoresAgenda
): Promise<
  ConflitoAgenda[]
> {
  const conflitos:
    ConflitoAgenda[] = [];

  const novaData =
    valores.data_diligencia;

  const novoHorario =
    valores.horario;

  /* =====================================================
     ADVOGADO
  ===================================================== */

  if (
    valores.correspondente_id
  ) {
    const {
      data: advogado,
      error,
    } = await supabase
      .from("correspondentes")
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
        valores.correspondente_id
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
            diligencia.horario
          );

        conflitos.push({
          participante_tipo:
            "advogado",

          participante_id:
            advogado.id,

          participante_nome:
            advogado.nome,

          identificacao:
            `OAB/${advogado.oab_uf} ${advogado.oab_numero}`,

          diferenca_minutos:
            diferenca,

          diligencia,
        });
      }
    }
  }

  /* =====================================================
     PREPOSTO
  ===================================================== */

  if (
    valores.necessita_preposto ===
      true &&
    valores.preposto_id
  ) {
    const {
      data: preposto,
      error,
    } = await supabase
      .from("correspondentes")
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
        valores.preposto_id
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
            diligencia.horario
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

  /* =====================================================
     TESTEMUNHAS
  ===================================================== */

  if (
    valores
      .testemunhas_confirmadas ===
      true &&
    valores.testemunha_ids
      .length > 0
  ) {
    const {
      data: testemunhas,
      error: erroTestemunhas,
    } = await supabase
      .from("testemunhas")
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
        valores.testemunha_ids
      );

    if (
      erroTestemunhas
    ) {
      throw new Error(
        `Erro ao consultar testemunhas: ${erroTestemunhas.message}`
      );
    }

    const {
      data: vinculos,
      error: erroVinculos,
    } = await supabase
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
        valores.testemunha_ids
      );

    if (
      erroVinculos
    ) {
      throw new Error(
        `Erro ao consultar agenda das testemunhas: ${erroVinculos.message}`
      );
    }

    const diligenciaIds =
      Array.from(
        new Set(
          (
            vinculos ?? []
          ).map(
            (item: any) =>
              item.diligencia_id
          )
        )
      );

    let diligencias:
      DiligenciaConflitante[] = [];

    if (
      diligenciaIds.length >
      0
    ) {
      const {
        data,
        error,
      } = await supabase
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

      if (error) {
        throw new Error(
          `Erro ao consultar diligências das testemunhas: ${error.message}`
        );
      }

      diligencias =
        (
          data ?? []
        ) as DiligenciaConflitante[];

      /*
        Segunda proteção de data
        também para testemunhas.
      */
      diligencias =
        diligencias.filter(
          (diligencia) =>
            diligencia
              .data_diligencia ===
            novaData
        );
    }

    const mapaDiligencias =
      new Map(
        diligencias.map(
          (diligencia) => [
            diligencia.id,
            diligencia,
          ]
        )
      );

    const mapaTestemunhas =
      new Map(
        (
          testemunhas ?? []
        ).map(
          (testemunha: any) => [
            testemunha.id,
            testemunha,
          ]
        )
      );

    for (
      const vinculo
      of vinculos ?? []
    ) {
      const testemunha =
        mapaTestemunhas.get(
          vinculo.testemunha_id
        );

      const diligencia =
        mapaDiligencias.get(
          vinculo.diligencia_id
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
          diligencia.horario
        );

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

export function assinaturaConflitosAgenda(
  conflitos:
    ConflitoAgenda[]
) {
  return JSON.stringify(
    conflitos
      .map(
        (conflito) =>
          [
            conflito
              .participante_tipo,

            conflito
              .participante_id,

            conflito
              .diligencia.id,

            conflito
              .diligencia
              .data_diligencia,

            conflito
              .diferenca_minutos,
          ].join("|")
      )
      .sort()
  );
}