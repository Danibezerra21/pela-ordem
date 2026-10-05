import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  ControlePagamento,
} from "./controle-pagamento";

import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  DollarSign,
  FileText,
  Plus,
} from "lucide-react";


/* =====================================================
   TIPOS
===================================================== */

type DiligenciaLista = {
  id: string;

  tipo_diligencia:
    string;

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

  status:
    string | null;

  correspondente_id:
    string | null;

  necessita_preposto:
    boolean | null;

  preposto_id:
    string | null;

  testemunhas_status:
    | "confirmadas"
    | "desnecessarias"
    | null;

  contratacao_status:
    | "confirmada"
    | "desnecessaria"
    | null;

  orientacoes_encaminhadas:
    boolean | null;

  resultado_diligencia:
    string | null;

  financeiro_status:
    string | null;

  desfecho_em:
    string | null;
};


type ContratacaoFinanceira = {
  id:
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
};


type Profissional = {
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


type MembroEmpresa = {
  empresa_id:
    string;

  papel:
    string;

  nucleo:
    string | null;
};


type FiltroDiligencias =
  | "hoje"
  | "proximos_15_dias"
  | "fila_operacional"
  | "sem_correspondente"
  | "sem_orientacoes"
  | "preposto_pendente"
  | "definicoes_pendentes"
  | "conflito_agenda"
  | "com_desfecho"
  | "sem_desfecho"
  | "pagamento_pendente"
  | "pagamento_realizado";


type SearchParamsDiligencias = {
  filtro?:
    | string
    | string[];
};


type AgoraLocal = {
  data:
    string;

  horario:
    string;
};


/* =====================================================
   NOMES DOS FILTROS
===================================================== */

const nomesFiltros:
  Record<
    FiltroDiligencias,
    string
  > = {

  hoje:
    "Diligências hoje",

  proximos_15_dias:
    "Próximas diligências",

  fila_operacional:
    "Na fila operacional",

  sem_correspondente:
    "Sem correspondente",

  sem_orientacoes:
    "Sem orientações",

  preposto_pendente:
    "Preposto necessário sem designação",

  definicoes_pendentes:
    "Definições pendentes até amanhã",

  conflito_agenda:
    "Possíveis conflitos",

  com_desfecho:
    "Com desfecho",

  sem_desfecho:
    "Sem desfecho",

  pagamento_pendente:
    "Pagamentos pendentes",

  pagamento_realizado:
    "Pagamentos realizados",
};


/* =====================================================
   FILTROS
===================================================== */

function ehFiltroDiligencias(
  valor:
    | string
    | null
    | undefined
): valor is FiltroDiligencias {

  return (
    valor ===
      "hoje" ||

    valor ===
      "proximos_15_dias" ||

    valor ===
      "fila_operacional" ||

    valor ===
      "sem_correspondente" ||

    valor ===
      "sem_orientacoes" ||

    valor ===
      "preposto_pendente" ||

    valor ===
      "definicoes_pendentes" ||

    valor ===
      "conflito_agenda" ||

    valor ===
      "com_desfecho" ||

    valor ===
      "sem_desfecho" ||

    valor ===
      "pagamento_pendente" ||

    valor ===
      "pagamento_realizado"
  );
}


function ehFiltroFinanceiro(
  filtro:
    FiltroDiligencias | null
) {

  return (
    filtro ===
      "pagamento_pendente" ||

    filtro ===
      "pagamento_realizado"
  );
}


/* =====================================================
   DATA / HORA RECIFE
===================================================== */

function agoraEmRecife():
  AgoraLocal {

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
      partes.find(
        (parte) =>
          parte.type ===
          tipo
      )?.value ?? "";


  return {
    data:
      `${obter("year")}-${obter(
        "month"
      )}-${obter("day")}`,

    horario:
      `${obter("hour")}:${obter(
        "minute"
      )}`,
  };
}


function hojeEmRecife() {

  return agoraEmRecife()
    .data;
}


/* =====================================================
   SOMA DE DIAS
===================================================== */

function somarDiasISO(
  dataISO:
    string,

  dias:
    number
) {

  const [
    ano,
    mes,
    dia,
  ] =
    dataISO
      .split("-")
      .map(Number);


  const data =
    new Date(
      Date.UTC(
        ano,
        mes - 1,
        dia
      )
    );


  data.setUTCDate(
    data.getUTCDate() +
      dias
  );


  return data
    .toISOString()
    .slice(
      0,
      10
    );
}


/* =====================================================
   HORÁRIO EM MINUTOS
===================================================== */

function minutosDoHorario(
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
    (
      Number.isFinite(
        hora
      )
        ? hora
        : 0
    ) *
      60 +
    (
      Number.isFinite(
        minuto
      )
        ? minuto
        : 0
    )
  );
}


/* =====================================================
   ATO JÁ TRANSCORREU
===================================================== */

function atoJaTranscorreu(
  diligencia:
    DiligenciaLista,

  agora:
    AgoraLocal
) {

  if (
    diligencia
      .data_diligencia <
    agora.data
  ) {
    return true;
  }


  if (
    diligencia
      .data_diligencia >
    agora.data
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
    agora.horario
  );
}


/* =====================================================
   FORMATAÇÕES
===================================================== */

function formatarProcesso(
  processo:
    string | null
) {

  if (!processo) {
    return "PROCESSO NÃO INFORMADO";
  }


  const numeros =
    processo.replace(
      /\D/g,
      ""
    );


  if (
    numeros.length !==
    20
  ) {
    return processo;
  }


  return (
    `${numeros.slice(0, 7)}-` +
    `${numeros.slice(7, 9)}.` +
    `${numeros.slice(9, 13)}.` +
    `${numeros.slice(13, 14)}.` +
    `${numeros.slice(14, 16)}.` +
    `${numeros.slice(16, 20)}`
  );
}


function formatarData(
  data:
    string | null
) {

  if (!data) {
    return "Não informada";
  }


  const partes =
    data
      .slice(
        0,
        10
      )
      .split("-");


  if (
    partes.length !==
    3
  ) {
    return data;
  }


  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


function formatarMoeda(
  valor:
    string | number
) {

  const numero =
    typeof valor ===
      "number"
      ? valor
      : Number(valor);


  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    Number.isFinite(
      numero
    )
      ? numero
      : 0
  );
}


function formatarCpf(
  cpf:
    string | null
) {

  if (!cpf) {
    return null;
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
    return cpf;
  }


  return (
    `***.${numeros.slice(3, 6)}.` +
    `${numeros.slice(6, 9)}-**`
  );
}


function identificacaoProfissional(
  profissional:
    Profissional | undefined,

  tipo:
    string
) {

  if (!profissional) {
    return null;
  }


  if (
    tipo ===
      "advogado" &&
    profissional
      .oab_numero
  ) {
    return (
      `OAB/${profissional.oab_uf ?? ""} ` +
      profissional.oab_numero
    ).trim();
  }


  if (
    tipo ===
    "preposto"
  ) {
    const cpf =
      formatarCpf(
        profissional.cpf
      );

    return cpf
      ? `CPF ${cpf}`
      : null;
  }


  return null;
}


function textoResultado(
  resultado:
    string | null
) {

  if (
    resultado ===
    "finalidade_atingida"
  ) {
    return "Finalidade atingida";
  }


  if (
    resultado ===
    "finalidade_nao_atingida"
  ) {
    return "Finalidade não atingida";
  }


  return null;
}


/* =====================================================
   PENDÊNCIAS
===================================================== */

function temPendencia(
  diligencia:
    DiligenciaLista
) {

  return (
    !diligencia
      .correspondente_id ||

    diligencia
      .orientacoes_encaminhadas !==
      true ||

    diligencia
      .necessita_preposto ===
      null ||

    (
      diligencia
        .necessita_preposto ===
        true &&
      !diligencia
        .preposto_id
    ) ||

    diligencia
      .testemunhas_status ===
      null ||

    diligencia
      .contratacao_status ===
      null
  );
}


/* =====================================================
   CONFLITOS DE AGENDA
===================================================== */

function idsDiligenciasComConflito(
  diligencias:
    DiligenciaLista[]
) {

  const agendaPorParticipante =
    new Map<
      string,
      DiligenciaLista[]
    >();


  for (
    const diligencia of
    diligencias
  ) {

    const participantes =
      [
        diligencia
          .correspondente_id,

        diligencia
          .preposto_id,
      ].filter(
        (
          id
        ): id is string =>
          Boolean(id)
      );


    for (
      const participanteId of
      participantes
    ) {

      const chave =
        `${participanteId}:${diligencia.data_diligencia}`;


      const lista =
        agendaPorParticipante.get(
          chave
        ) ?? [];


      lista.push(
        diligencia
      );


      agendaPorParticipante.set(
        chave,
        lista
      );
    }
  }


  const ids =
    new Set<string>();


  for (
    const agenda of
    agendaPorParticipante.values()
  ) {

    const ordenada =
      [
        ...agenda,
      ].sort(
        (
          a,
          b
        ) =>
          minutosDoHorario(
            a.horario
          ) -
          minutosDoHorario(
            b.horario
          )
      );


    for (
      let i = 0;
      i <
      ordenada.length;
      i += 1
    ) {

      for (
        let j =
          i + 1;
        j <
        ordenada.length;
        j += 1
      ) {

        const diferenca =
          Math.abs(
            minutosDoHorario(
              ordenada[j]
                .horario
            ) -
              minutosDoHorario(
                ordenada[i]
                  .horario
              )
          );


        if (
          diferenca >=
          300
        ) {
          break;
        }


        ids.add(
          ordenada[i].id
        );


        ids.add(
          ordenada[j].id
        );
      }
    }
  }


  return ids;
}


/* =====================================================
   FILTROS SOBRE DILIGÊNCIAS
===================================================== */

function aplicarFiltro(
  diligencias:
    DiligenciaLista[],

  filtro:
    FiltroDiligencias
) {

  const agora =
    agoraEmRecife();


  const hoje =
    agora.data;


  const amanha =
    somarDiasISO(
      hoje,
      1
    );


  const limite15Dias =
    somarDiasISO(
      hoje,
      15
    );


  /* ===================================================
     DESFECHO

     Não usamos a janela de 15 dias.
  =================================================== */

  if (
    filtro ===
    "com_desfecho"
  ) {
    return diligencias.filter(
      (
        diligencia
      ) =>
        Boolean(
          diligencia
            .desfecho_em
        )
    );
  }


  if (
    filtro ===
    "sem_desfecho"
  ) {
    return diligencias.filter(
      (
        diligencia
      ) =>
        diligencia.status ===
          "ativa" &&

        !diligencia
          .desfecho_em &&

        atoJaTranscorreu(
          diligencia,
          agora
        )
    );
  }


  /* ===================================================
     FILTROS FINANCEIROS

     São processados separadamente por contratação.
  =================================================== */

  if (
    filtro ===
      "pagamento_pendente" ||
    filtro ===
      "pagamento_realizado"
  ) {
    return [];
  }


  /* ===================================================
     JANELA OPERACIONAL DO DASHBOARD
  =================================================== */

  const janelaOperacional =
    diligencias.filter(
      (
        diligencia
      ) =>
        diligencia.status !==
          "cancelada" &&

        diligencia
          .data_diligencia >=
          hoje &&

        diligencia
          .data_diligencia <=
          limite15Dias
    );


  if (
    filtro ===
    "hoje"
  ) {
    return janelaOperacional.filter(
      (
        diligencia
      ) =>
        diligencia
          .data_diligencia ===
        hoje
    );
  }


  if (
    filtro ===
    "proximos_15_dias"
  ) {
    return janelaOperacional.filter(
      (
        diligencia
      ) =>
        diligencia
          .data_diligencia >
        hoje
    );
  }


  if (
    filtro ===
    "fila_operacional"
  ) {
    return janelaOperacional.filter(
      (
        diligencia
      ) =>
        temPendencia(
          diligencia
        )
    );
  }


  if (
    filtro ===
    "sem_correspondente"
  ) {
    return janelaOperacional.filter(
      (
        diligencia
      ) =>
        !diligencia
          .correspondente_id
    );
  }


  if (
    filtro ===
    "sem_orientacoes"
  ) {
    return janelaOperacional.filter(
      (
        diligencia
      ) =>
        diligencia
          .orientacoes_encaminhadas !==
        true
    );
  }


  if (
    filtro ===
    "preposto_pendente"
  ) {
    return janelaOperacional.filter(
      (
        diligencia
      ) =>
        diligencia
          .necessita_preposto ===
          true &&

        !diligencia
          .preposto_id
    );
  }


  if (
    filtro ===
    "definicoes_pendentes"
  ) {
    return janelaOperacional.filter(
      (
        diligencia
      ) =>
        diligencia
          .data_diligencia <=
          amanha &&

        (
          diligencia
            .necessita_preposto ===
            null ||

          diligencia
            .testemunhas_status ===
            null ||

          diligencia
            .contratacao_status ===
            null
        )
    );
  }


  const idsConflitos =
    idsDiligenciasComConflito(
      janelaOperacional
    );


  return janelaOperacional.filter(
    (
      diligencia
    ) =>
      idsConflitos.has(
        diligencia.id
      )
  );
}


/* =====================================================
   PÁGINA
===================================================== */

export default async function DiligenciasPage({
  searchParams,
}: {
  searchParams:
    Promise<SearchParamsDiligencias>;
}) {

  /* ===================================================
     FILTRO
  =================================================== */

  const parametros =
    await searchParams;


  const filtroRecebido =
    Array.isArray(
      parametros.filtro
    )
      ? parametros.filtro[0]
      : parametros.filtro;


  const filtroAtivo =
    ehFiltroDiligencias(
      filtroRecebido
    )
      ? filtroRecebido
      : null;


  const filtroFinanceiro =
    ehFiltroFinanceiro(
      filtroAtivo
    );


  /* ===================================================
     SUPABASE / AUTENTICAÇÃO
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
    redirect(
      "/auth/login"
    );
  }


  const usuarioId =
    authData
      .claims
      .sub;


  /* ===================================================
     EMPRESA / PERFIL
  =================================================== */

  const {
    data:
      membroConsulta,

    error:
      erroMembro,
  } =
    await supabase
      .from(
        "membros_empresa"
      )
      .select(
        "empresa_id, papel, nucleo"
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
    erroMembro
  ) {
    throw new Error(
      `Erro ao localizar empresa: ${erroMembro.message}`
    );
  }


  if (
    !membroConsulta
  ) {
    return (
      <div>
        <h1 className="text-3xl font-bold">
          Diligências
        </h1>

        <p className="mt-3 text-muted-foreground">
          Seu usuário ainda não está vinculado a uma empresa.
        </p>
      </div>
    );
  }


  const membro =
    membroConsulta as
      MembroEmpresa;


  const empresaId =
    membro
      .empresa_id;


  const podeGerenciarPagamento =
    membro.papel ===
      "master" ||
    membro.nucleo ===
      "financeiro";


  /* ===================================================
     DILIGÊNCIAS
  =================================================== */

  const {
    data:
      diligenciasConsultadas,

    error:
      erroDiligencias,
  } =
    await supabase
      .from(
        "diligencias"
      )
      .select(`
        id,
        tipo_diligencia,
        numero_processo,
        parte_autora,
        parte_re,
        data_diligencia,
        horario,
        vara,
        comarca,
        uf,
        status,
        correspondente_id,
        necessita_preposto,
        preposto_id,
        testemunhas_status,
        contratacao_status,
        orientacoes_encaminhadas,
        resultado_diligencia,
        financeiro_status,
        desfecho_em
      `)
      .eq(
        "empresa_id",
        empresaId
      )
      .is(
        "excluida_em",
        null
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


  if (
    erroDiligencias
  ) {
    throw new Error(
      `Erro ao carregar diligências: ${erroDiligencias.message}`
    );
  }


  const todasDiligencias =
    (
      diligenciasConsultadas ??
      []
    ) as
      DiligenciaLista[];


  const idsDiligencias =
    todasDiligencias.map(
      (
        diligencia
      ) =>
        diligencia.id
    );


  /* ===================================================
     CONTRATAÇÕES FINANCEIRAS
  =================================================== */

  let contratacoes:
    ContratacaoFinanceira[] =
    [];


  if (
    idsDiligencias.length >
    0
  ) {

    const {
      data:
        contratacoesConsultadas,

      error:
        erroContratacoes,
    } =
      await supabase
        .from(
          "diligencias_contratacoes"
        )
        .select(`
          id,
          diligencia_id,
          tipo_profissional,
          correspondente_id,
          valor,
          pagamento_combinado_em,
          pagamento_devido,
          pagamento_decidido_em,
          pago_em
        `)
        .eq(
          "empresa_id",
          empresaId
        )
        .in(
          "diligencia_id",
          idsDiligencias
        );


    if (
      erroContratacoes
    ) {
      throw new Error(
        `Erro ao carregar contratações: ${erroContratacoes.message}`
      );
    }


    contratacoes =
      (
        contratacoesConsultadas ??
        []
      ) as
        ContratacaoFinanceira[];
  }


  /* ===================================================
     PROFISSIONAIS
  =================================================== */

  const idsProfissionais =
    Array.from(
      new Set(
        contratacoes
          .map(
            (
              contratacao
            ) =>
              contratacao
                .correspondente_id
          )
          .filter(Boolean)
      )
    );


  let profissionais:
    Profissional[] =
    [];


  if (
    idsProfissionais.length >
    0
  ) {

    const {
      data:
        profissionaisConsultados,

      error:
        erroProfissionais,
    } =
      await supabase
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
        )
        .in(
          "id",
          idsProfissionais
        );


    if (
      erroProfissionais
    ) {
      throw new Error(
        `Erro ao carregar profissionais: ${erroProfissionais.message}`
      );
    }


    profissionais =
      (
        profissionaisConsultados ??
        []
      ) as
        Profissional[];
  }


  const diligenciaPorId =
    new Map(
      todasDiligencias.map(
        (
          diligencia
        ) => [
          diligencia.id,
          diligencia,
        ]
      )
    );


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


  /* ===================================================
     LISTA NORMAL
  =================================================== */

  const diligenciasExibidas =
    filtroAtivo
      ? aplicarFiltro(
          todasDiligencias,
          filtroAtivo
        )
      : todasDiligencias;


  /* ===================================================
     LISTA FINANCEIRA

     UMA CONTRATAÇÃO = UMA LINHA
  =================================================== */

  const contratacoesExibidas =
    filtroAtivo ===
      "pagamento_pendente"

      ? contratacoes
          .filter(
            (
              contratacao
            ) =>
              contratacao
                .pagamento_devido ===
                true &&

              !contratacao
                .pago_em
          )
          .sort(
            (
              a,
              b
            ) =>
              (
                a
                  .pagamento_combinado_em ??
                "9999-12-31"
              ).localeCompare(
                b
                  .pagamento_combinado_em ??
                  "9999-12-31"
              )
          )

      : filtroAtivo ===
          "pagamento_realizado"

        ? contratacoes
            .filter(
              (
                contratacao
              ) =>
                contratacao
                  .pagamento_devido ===
                  true &&

                Boolean(
                  contratacao
                    .pago_em
                )
            )
            .sort(
              (
                a,
                b
              ) =>
                (
                  b.pago_em ??
                  ""
                ).localeCompare(
                  a.pago_em ??
                    ""
                )
            )

        : [];


  const quantidade =
    filtroFinanceiro
      ? contratacoesExibidas
          .length
      : diligenciasExibidas
          .length;


  const nomeFiltro =
    filtroAtivo
      ? nomesFiltros[
          filtroAtivo
        ]
      : null;


  const totalFinanceiro =
    contratacoesExibidas
      .reduce(
        (
          total,
          contratacao
        ) =>
          total +
          (
            Number(
              contratacao
                .valor
            ) || 0
          ),
        0
      );


  const unidadeQuantidade =
    filtroFinanceiro
      ? quantidade ===
          1
        ? "contratação"
        : "contratações"
      : quantidade ===
          1
        ? "diligência"
        : "diligências";


  const hoje =
    hojeEmRecife();


  /* ===================================================
     RENDERIZAÇÃO
  =================================================== */

  return (
    <main className="w-full">

      {/* =================================================
          CABEÇALHO
      ================================================== */}

      <section className="mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Gestão operacional
            </p>

            <h1 className="mt-1 text-4xl font-bold tracking-tight">
              Diligências
            </h1>

            <p className="mt-2 text-muted-foreground">
              Consulte, acompanhe e gerencie o ciclo completo das diligências da sua empresa.
            </p>
          </div>


          <Link
            href="/protected/diligencias/nova"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />

            Nova diligência
          </Link>

        </div>
      </section>


      {/* =================================================
          FILTROS DE CICLO / FINANCEIRO
      ================================================== */}

      <section className="mb-6 rounded-xl border bg-card p-5">

        <div>
          <p className="text-sm font-semibold">
            Visões rápidas
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o encerramento das diligências e a situação dos pagamentos.
          </p>
        </div>


        <div className="mt-4 flex flex-wrap gap-2">

          <Link
            href="/protected/diligencias"
            className={
              !filtroAtivo
                ? "rounded-lg bg-[#0b1f3a] px-3.5 py-2 text-sm font-medium text-white"
                : "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted"
            }
          >
            Todas
          </Link>


          <Link
            href="/protected/diligencias?filtro=com_desfecho"
            className={
              filtroAtivo ===
                "com_desfecho"
                ? "rounded-lg bg-[#0b1f3a] px-3.5 py-2 text-sm font-medium text-white"
                : "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted"
            }
          >
            Com desfecho
          </Link>


          <Link
            href="/protected/diligencias?filtro=sem_desfecho"
            className={
              filtroAtivo ===
                "sem_desfecho"
                ? "rounded-lg bg-[#0b1f3a] px-3.5 py-2 text-sm font-medium text-white"
                : "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted"
            }
          >
            Sem desfecho
          </Link>


          <Link
            href="/protected/diligencias?filtro=pagamento_pendente"
            className={
              filtroAtivo ===
                "pagamento_pendente"
                ? "rounded-lg bg-[#0b1f3a] px-3.5 py-2 text-sm font-medium text-white"
                : "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted"
            }
          >
            Pagamento pendente
          </Link>


          <Link
            href="/protected/diligencias?filtro=pagamento_realizado"
            className={
              filtroAtivo ===
                "pagamento_realizado"
                ? "rounded-lg bg-[#0b1f3a] px-3.5 py-2 text-sm font-medium text-white"
                : "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted"
            }
          >
            Pagamento realizado
          </Link>

        </div>
      </section>


    {/* =================================================
          FILTRO ATIVO
      ================================================== */}

      {filtroAtivo &&
        nomeFiltro && (

        <section className="mb-6 rounded-xl border bg-card px-5 py-4">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Filtro ativo
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2">

                <p className="font-semibold">
                  {nomeFiltro}
                </p>

                <span className="text-sm text-muted-foreground">
                  •
                </span>

                <p className="text-sm text-muted-foreground">
                  {quantidade}{" "}
                  {unidadeQuantidade}
                </p>

                {filtroFinanceiro && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      •
                    </span>

                    <p className="text-sm font-semibold">
                      {formatarMoeda(
                        totalFinanceiro
                      )}
                    </p>
                  </>
                )}

              </div>
            </div>


            <Link
              href="/protected/diligencias"
              className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Limpar filtro
            </Link>

          </div>
        </section>
      )}


      {/* =================================================
          LISTA
      ================================================== */}

      <section className="rounded-xl border bg-card">

        <div className="flex items-center justify-between border-b px-6 py-5">

          <div>
            <h2 className="text-lg font-semibold">
              {filtroAtivo
                ? nomeFiltro
                : "Pauta cadastrada"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {quantidade}{" "}
              {unidadeQuantidade}

              {filtroFinanceiro && (
                <>
                  {" • "}
                  {formatarMoeda(
                    totalFinanceiro
                  )}
                </>
              )}
            </p>
          </div>

        </div>


        {/* =================================================
            SEM RESULTADOS
        ================================================== */}

        {filtroAtivo &&
        quantidade ===
          0 ? (

          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">

            <div className="rounded-full bg-muted p-4">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              Nenhum resultado encontrado
            </h3>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Não existem registros que atendam ao filtro{" "}
              <strong>
                {nomeFiltro}
              </strong>{" "}
              neste momento.
            </p>

            <Link
              href="/protected/diligencias"
              className="mt-6 inline-flex items-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Limpar filtro
            </Link>

          </div>

        ) : !filtroAtivo &&
          quantidade ===
            0 ? (

          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">

            <div className="rounded-full bg-muted p-4">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              Nenhuma diligência cadastrada
            </h3>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Cadastre sua primeira diligência manualmente ou importe uma pauta em Excel.
            </p>

            <Link
              href="/protected/diligencias/nova"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />

              Cadastrar primeira diligência
            </Link>

          </div>

        ) : filtroFinanceiro ? (

          /* =================================================
             RESULTADOS FINANCEIROS

             IMPORTANTE:
             UMA CONTRATAÇÃO = UMA LINHA
          ================================================== */

          <div className="divide-y">

            {contratacoesExibidas.map(
              (
                contratacao
              ) => {

                const diligencia =
                  diligenciaPorId.get(
                    contratacao
                      .diligencia_id
                  );


                const profissional =
                  profissionalPorId.get(
                    contratacao
                      .correspondente_id
                  );


                if (!diligencia) {
                  return null;
                }


                const identificacao =
                  identificacaoProfissional(
                    profissional,
                    contratacao
                      .tipo_profissional
                  );


                const vencido =
                  filtroAtivo ===
                    "pagamento_pendente" &&

                  Boolean(
                    contratacao
                      .pagamento_combinado_em
                  ) &&

                  (
                    contratacao
                      .pagamento_combinado_em as string
                  ) <
                    hoje;


                return (
                  <article
                    key={
                      contratacao.id
                    }
                    className="px-6 py-6"
                  >

                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                            {
                              diligencia
                                .tipo_diligencia
                            }
                          </span>


                          {contratacao
                            .tipo_profissional ===
                            "advogado" ? (

                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                              Advogado
                            </span>

                          ) : (

                            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800">
                              Preposto
                            </span>
                          )}


                          {vencido && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800">
                              <CircleAlert className="h-3.5 w-3.5" />

                              Pagamento em atraso
                            </span>
                          )}

                        </div>


                        <p className="mt-3 font-mono text-sm text-muted-foreground">
                          {formatarProcesso(
                            diligencia
                              .numero_processo
                          )}
                        </p>


                        <p className="mt-2 font-semibold">
                          {diligencia
                            .parte_autora ||
                            "Parte autora não informada"}

                          {" x "}

                          {diligencia
                            .parte_re ||
                            "Parte ré não informada"}
                        </p>


                        <div className="mt-4 grid gap-4 rounded-lg bg-muted/30 p-4 sm:grid-cols-2 xl:grid-cols-4">

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Profissional
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {profissional
                                ?.nome ||
                                "Profissional não localizado"}
                            </p>

                            {identificacao && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {identificacao}
                              </p>
                            )}
                          </div>


                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Diligência
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {formatarData(
                                diligencia
                                  .data_diligencia
                              )}

                              {" às "}

                              {diligencia
                                .horario
                                .slice(
                                  0,
                                  5
                                )}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {diligencia
                                .vara ||
                                "Vara não informada"}

                              {diligencia
                                .comarca
                                ? ` • ${diligencia.comarca}`
                                : ""}

                              {diligencia.uf
                                ? `/${diligencia.uf}`
                                : ""}
                            </p>
                          </div>


                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Valor
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                              {formatarMoeda(
                                contratacao
                                  .valor
                              )}
                            </p>
                          </div>


                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Pagamento combinado
                            </p>

                            <p
                              className={
                                vencido
                                  ? "mt-1 text-sm font-semibold text-red-700"
                                  : "mt-1 text-sm font-medium"
                              }
                            >
                              {formatarData(
                                contratacao
                                  .pagamento_combinado_em
                              )}
                            </p>
                          </div>

                        </div>
                      </div>


                      <div className="flex min-w-[220px] flex-col items-start gap-3 xl:items-end">

                        <ControlePagamento
                          contratacaoId={
                            contratacao.id
                          }
                          pagoEm={
                            contratacao
                              .pago_em
                          }
                          podeGerenciar={
                            podeGerenciarPagamento
                          }
                        />


                        <Link
                          href={`/protected/diligencias/${diligencia.id}`}
                          className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                          Ver diligência
                        </Link>

                      </div>

                    </div>
                  </article>
                );
              }
            )}

          </div>

        ) : (

          /* =================================================
             RESULTADOS POR DILIGÊNCIA
          ================================================== */

          <div className="divide-y">

            {diligenciasExibidas.map(
              (
                diligencia
              ) => {

                const dataFormatada =
                  formatarData(
                    diligencia
                      .data_diligencia
                  );


                const horarioFormatado =
                  diligencia
                    .horario
                    ?.slice(
                      0,
                      5
                    );


                const resultado =
                  textoResultado(
                    diligencia
                      .resultado_diligencia
                  );


                return (
                  <Link
                    key={
                      diligencia.id
                    }
                    href={`/protected/diligencias/${diligencia.id}`}
                    className="block px-6 py-5 transition-colors hover:bg-muted/40"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                            {
                              diligencia
                                .tipo_diligencia
                            }
                          </span>


                          {diligencia
                            .numero_processo && (

                            <span className="text-sm text-muted-foreground">
                              {formatarProcesso(
                                diligencia
                                  .numero_processo
                              )}
                            </span>
                          )}


                          {diligencia
                            .desfecho_em && (

                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                              <CheckCircle2 className="h-3.5 w-3.5" />

                              Desfecho registrado
                            </span>
                          )}


                          {resultado && (
                            <span className="rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                              {resultado}
                            </span>
                          )}

                        </div>


                        <p className="mt-3 font-medium">
                          {diligencia
                            .parte_autora ||
                            "Parte autora não informada"}

                          {" x "}

                          {diligencia
                            .parte_re ||
                            "Parte ré não informada"}
                        </p>


                        <p className="mt-2 text-sm text-muted-foreground">
                          {diligencia
                            .vara ||
                            "Vara não informada"}

                          {diligencia
                            .comarca
                            ? ` • ${diligencia.comarca}`
                            : ""}

                          {diligencia.uf
                            ? `/${diligencia.uf}`
                            : ""}
                        </p>

                      </div>


                      <div className="flex shrink-0 flex-wrap items-center gap-5 text-sm">

                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />

                          {
                            dataFormatada
                          }
                        </div>


                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-muted-foreground" />

                          {
                            horarioFormatado
                          }
                        </div>


                        {diligencia
                          .financeiro_status ===
                          "liberado_para_pagamento" && (

                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <DollarSign className="h-4 w-4" />

                            Liberado para pagamento
                          </div>
                        )}

                      </div>

                    </div>
                  </Link>
                );
              }
            )}

          </div>
        )}

      </section>

    </main>
  );
}