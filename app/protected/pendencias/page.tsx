import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Eye,
  FileWarning,
  MapPin,
  Scale,
  UserRound,
  UsersRound,
} from "lucide-react";

import { ModalDesfecho } from "./modal-desfecho";

/* =====================================================
   TIPOS
===================================================== */

type ContratacaoStatus =
  | "confirmada"
  | "desnecessaria"
  | null;

type ContratacaoTipo =
  | "advogado"
  | "preposto"
  | "advogado_preposto"
  | null;

type TestemunhasStatus =
  | "confirmadas"
  | "desnecessarias"
  | null;

type DiligenciaBase = {
  id: string;
  empresa_id: string;
  tipo_diligencia: string;
  modalidade: string | null;
  numero_processo: string | null;
  parte_autora: string | null;
  parte_re: string | null;
  data_diligencia: string;
  horario: string;
  vara: string | null;
  comarca: string | null;
  uf: string | null;
  local: string | null;
  correspondente_id: string | null;
  necessita_preposto: boolean | null;
  preposto_id: string | null;
  testemunhas_status: string | null;
  testemunhas_confirmadas: boolean | null;
  contratacao_status: string | null;
  contratacao_tipo: string | null;
  contratacao_confirmada: boolean | null;
  orientacoes_encaminhadas: boolean | null;
  status: string;
  excluida_em: string | null;
};

type VinculoTestemunha = {
  diligencia_id: string;
  testemunha_id: string;
};

type VinculoFinanceiro = {
  diligencia_id: string;
};

type Urgencia =
  | "atrasada"
  | "hoje"
  | "critica"
  | "alta"
  | "proxima"
  | "futura";

type PendenciaCalculada =
  DiligenciaBase & {
    pendencias: string[];
    diasAte: number | null;
    urgencia: Urgencia;
    testemunhasVinculadas: number;
    temContratacaoFinanceira: boolean;
    desfechoPendente: boolean;
    monitoramentoProximo: boolean;
  };

type AgoraLocal = {
  data: string;
  horario: string;
};

type FiltroPendencias =
  | "fila_operacional"
  | "atos_hoje_anteriores"
  | "proximos_3_dias"
  | "de_4_a_15_dias";

type SearchParamsPendencias = {
  filtro?: string | string[];
};

/* =====================================================
   FILTROS
===================================================== */

const NOMES_FILTROS: Record<
  FiltroPendencias,
  string
> = {
  fila_operacional:
    "Na fila operacional",

  atos_hoje_anteriores:
    "Atos de hoje e anteriores",

  proximos_3_dias:
    "Próximos 3 dias",

  de_4_a_15_dias:
    "De 4 a 15 dias",
};

function ehFiltroPendencias(
  valor:
    | string
    | null
    | undefined
): valor is FiltroPendencias {
  return (
    valor === "fila_operacional" ||
    valor === "atos_hoje_anteriores" ||
    valor === "proximos_3_dias" ||
    valor === "de_4_a_15_dias"
  );
}

/* =====================================================
   CONSTANTES
===================================================== */

const TEXTO_MONITORAMENTO =
  "Tratamento concluído. Acompanhar a realização do ato e registrar o desfecho após o horário.";

const TEXTO_DESFECHO =
  "Registrar o desfecho da diligência.";

/* =====================================================
   DATA E HORA
===================================================== */

function agoraEmRecife(): AgoraLocal {
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

  const obter = (
    tipo:
      Intl.DateTimeFormatPartTypes
  ) =>
    partes.find(
      (parte) =>
        parte.type === tipo
    )?.value ?? "";

  return {
    data:
      `${obter("year")}-${obter("month")}-${obter("day")}`,

    horario:
      `${obter("hour")}:${obter("minute")}`,
  };
}

function diasEntreDatas(
  inicio: string,
  fim: string
) {
  const [
    anoInicio,
    mesInicio,
    diaInicio,
  ] = inicio
    .slice(0, 10)
    .split("-")
    .map(Number);

  const [
    anoFim,
    mesFim,
    diaFim,
  ] = fim
    .slice(0, 10)
    .split("-")
    .map(Number);

  if (
    !anoInicio ||
    !mesInicio ||
    !diaInicio ||
    !anoFim ||
    !mesFim ||
    !diaFim
  ) {
    return null;
  }

  const dataInicio =
    Date.UTC(
      anoInicio,
      mesInicio - 1,
      diaInicio
    );

  const dataFim =
    Date.UTC(
      anoFim,
      mesFim - 1,
      diaFim
    );

  return Math.round(
    (dataFim - dataInicio) /
      86_400_000
  );
}

function atoJaTranscorreu(
  diligencia:
    DiligenciaBase,
  agora:
    AgoraLocal
) {
  const data =
    diligencia.data_diligencia.slice(
      0,
      10
    );

  if (
    data < agora.data
  ) {
    return true;
  }

  if (
    data > agora.data
  ) {
    return false;
  }

  const horario =
    diligencia.horario?.slice(
      0,
      5
    ) ?? "";

  if (!horario) {
    return false;
  }

  return (
    horario <= agora.horario
  );
}

/* =====================================================
   FORMATAÇÃO
===================================================== */

function formatarData(
  data: string
) {
  const [
    ano,
    mes,
    dia,
  ] = data
    .slice(0, 10)
    .split("-");

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}

function formatarProcesso(
  processo:
    string | null
) {
  if (!processo) {
    return "Não informado";
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

function horarioCurto(
  horario:
    string | null
) {
  if (!horario) {
    return "—";
  }

  return horario.slice(
    0,
    5
  );
}

/* =====================================================
   MODELO CANÔNICO
===================================================== */

function obterContratacaoStatus(
  diligencia:
    DiligenciaBase
): ContratacaoStatus {
  if (
    diligencia
      .contratacao_status ===
    "confirmada"
  ) {
    return "confirmada";
  }

  if (
    diligencia
      .contratacao_status ===
    "desnecessaria"
  ) {
    return "desnecessaria";
  }

  if (
    diligencia
      .contratacao_confirmada ===
    true
  ) {
    return "confirmada";
  }

  return null;
}

function obterContratacaoTipo(
  diligencia:
    DiligenciaBase
): ContratacaoTipo {
  const tipo =
    diligencia
      .contratacao_tipo;

  if (
    tipo === "advogado" ||
    tipo === "preposto" ||
    tipo ===
      "advogado_preposto"
  ) {
    return tipo;
  }

  return null;
}

function obterTestemunhasStatus(
  diligencia:
    DiligenciaBase
): TestemunhasStatus {
  const status =
    diligencia
      .testemunhas_status;

  if (
    status ===
    "confirmadas"
  ) {
    return "confirmadas";
  }

  if (
    status ===
      "desnecessarias" ||
    status ===
      "desnecessaria"
  ) {
    return "desnecessarias";
  }

  if (
    diligencia
      .testemunhas_confirmadas ===
    true
  ) {
    return "confirmadas";
  }

  return null;
}

function tipoIncluiAdvogado(
  tipo:
    ContratacaoTipo
) {
  return (
    tipo === "advogado" ||
    tipo ===
      "advogado_preposto"
  );
}

function tipoIncluiPreposto(
  tipo:
    ContratacaoTipo
) {
  return (
    tipo === "preposto" ||
    tipo ===
      "advogado_preposto"
  );
}

/* =====================================================
   PENDÊNCIAS
===================================================== */

function calcularPendencias(
  diligencia:
    DiligenciaBase,
  quantidadeTestemunhas:
    number,
  agora:
    AgoraLocal
) {
  const pendencias:
    string[] = [];

  const contratacaoStatus =
    obterContratacaoStatus(
      diligencia
    );

  const contratacaoTipo =
    obterContratacaoTipo(
      diligencia
    );

  const testemunhasStatus =
    obterTestemunhasStatus(
      diligencia
    );

  if (
    !diligencia
      .correspondente_id
  ) {
    pendencias.push(
      "Advogado/correspondente ainda não designado."
    );
  }

  if (
    contratacaoStatus ===
    null
  ) {
    pendencias.push(
      "Definir a situação da contratação."
    );
  }

  if (
    contratacaoStatus ===
      "confirmada" &&
    !contratacaoTipo
  ) {
    pendencias.push(
      "Definir quais profissionais foram contratados."
    );
  }

  if (
    contratacaoStatus ===
      "confirmada" &&
    tipoIncluiAdvogado(
      contratacaoTipo
    ) &&
    !diligencia
      .correspondente_id
  ) {
    pendencias.push(
      "A contratação inclui advogado, mas nenhum advogado está designado."
    );
  }

  if (
    contratacaoStatus ===
      "confirmada" &&
    tipoIncluiPreposto(
      contratacaoTipo
    ) &&
    diligencia
      .necessita_preposto !==
      true
  ) {
    pendencias.push(
      "Revisar a contratação de preposto."
    );
  }

  if (
    contratacaoStatus ===
      "confirmada" &&
    tipoIncluiPreposto(
      contratacaoTipo
    ) &&
    diligencia
      .necessita_preposto ===
      true &&
    !diligencia
      .preposto_id
  ) {
    pendencias.push(
      "A contratação inclui preposto, mas nenhum preposto está designado."
    );
  }

  if (
    diligencia
      .necessita_preposto ===
    null
  ) {
    pendencias.push(
      "Definir se o ato necessita de preposto."
    );
  }

  if (
    diligencia
      .necessita_preposto ===
      true &&
    !diligencia
      .preposto_id
  ) {
    pendencias.push(
      "Designar o preposto."
    );
  }

  if (
    testemunhasStatus ===
    null
  ) {
    pendencias.push(
      "Definir a situação das testemunhas."
    );
  }

  if (
    testemunhasStatus ===
      "confirmadas" &&
    quantidadeTestemunhas ===
      0
  ) {
    pendencias.push(
      "Vincular pelo menos uma testemunha confirmada."
    );
  }

  if (
    diligencia
      .orientacoes_encaminhadas !==
    true
  ) {
    pendencias.push(
      "Orientações ainda não encaminhadas."
    );
  }

  const diasAte =
    diasEntreDatas(
      agora.data,
      diligencia
        .data_diligencia
    );

  const desfechoPendente =
    atoJaTranscorreu(
      diligencia,
      agora
    );

  const semTratamentoInicial =
    !diligencia
      .correspondente_id &&
    diligencia
      .necessita_preposto ===
      null &&
    testemunhasStatus ===
      null &&
    contratacaoStatus ===
      null &&
    diligencia
      .orientacoes_encaminhadas !==
      true;

  if (
    !desfechoPendente &&
    diasAte !== null &&
    diasAte >= 0 &&
    diasAte <= 15 &&
    semTratamentoInicial
  ) {
    pendencias.unshift(
      "Ato em até 15 dias ainda sem tratamento inicial."
    );
  }

  if (
    !desfechoPendente &&
    diasAte !== null &&
    diasAte >= 0 &&
    diasAte <= 15 &&
    pendencias.length === 0
  ) {
    pendencias.push(
      TEXTO_MONITORAMENTO
    );
  }

  if (
    desfechoPendente
  ) {
    pendencias.unshift(
      TEXTO_DESFECHO
    );
  }

  return Array.from(
    new Set(
      pendencias
    )
  );
}

/* =====================================================
   URGÊNCIA
===================================================== */

function obterUrgencia(
  diasAte:
    number | null
): Urgencia {
  if (
    diasAte === null
  ) {
    return "futura";
  }

  if (
    diasAte < 0
  ) {
    return "atrasada";
  }

  if (
    diasAte === 0
  ) {
    return "hoje";
  }

  if (
    diasAte <= 3
  ) {
    return "critica";
  }

  if (
    diasAte <= 7
  ) {
    return "alta";
  }

  if (
    diasAte <= 15
  ) {
    return "proxima";
  }

  return "futura";
}

function pesoUrgencia(
  urgencia:
    Urgencia
) {
  if (
    urgencia ===
    "atrasada"
  ) {
    return 0;
  }

  if (
    urgencia === "hoje"
  ) {
    return 1;
  }

  if (
    urgencia ===
    "critica"
  ) {
    return 2;
  }

  if (
    urgencia === "alta"
  ) {
    return 3;
  }

  if (
    urgencia ===
    "proxima"
  ) {
    return 4;
  }

  return 5;
}

function textoUrgencia(
  diasAte:
    number | null,
  urgencia:
    Urgencia
) {
  if (
    diasAte === null
  ) {
    return "Data a conferir";
  }

  if (
    urgencia ===
    "atrasada"
  ) {
    const quantidade =
      Math.abs(
        diasAte
      );

    return quantidade === 1
      ? "Ato vencido há 1 dia"
      : `Ato vencido há ${quantidade} dias`;
  }

  if (
    urgencia === "hoje"
  ) {
    return "Hoje";
  }

  if (
    diasAte === 1
  ) {
    return "Amanhã";
  }

  return `Em ${diasAte} dias`;
}

function classeUrgencia(
  urgencia:
    Urgencia
) {
  if (
    urgencia ===
      "atrasada" ||
    urgencia === "hoje"
  ) {
    return {
      badge:
        "border-red-200 bg-red-50 text-red-800",

      lateral:
        "border-l-red-500",
    };
  }

  if (
    urgencia ===
    "critica"
  ) {
    return {
      badge:
        "border-orange-200 bg-orange-50 text-orange-800",

      lateral:
        "border-l-orange-500",
    };
  }

  if (
    urgencia === "alta" ||
    urgencia === "proxima"
  ) {
    return {
      badge:
        "border-amber-200 bg-amber-50 text-amber-800",

      lateral:
        "border-l-amber-400",
    };
  }

  return {
    badge:
      "border-slate-200 bg-slate-50 text-slate-700",

    lateral:
      "border-l-slate-300",
  };
}

/* =====================================================
   COMPONENTES
===================================================== */

function ResumoCard({
  titulo,
  valor,
  descricao,
  destaque = false,
  href,
  ativo = false,
}: {
  titulo: string;
  valor: number;
  descricao: string;
  destaque?: boolean;
  href: string;
  ativo?: boolean;
}) {
  const classeVisual =
    ativo
      ? "border-[#0b1f3a] bg-slate-50 ring-1 ring-[#0b1f3a]/15"
      : destaque
        ? "border-amber-200 bg-amber-50 hover:bg-amber-100/70"
        : "bg-card hover:bg-muted/40";

  return (
    <Link
      href={href}
      className={`group block cursor-pointer rounded-xl border p-5 transition-all hover:border-slate-400 hover:shadow-sm ${classeVisual}`}
    >
      <p className="text-sm text-muted-foreground">
        {titulo}
      </p>

      <p
        className={
          destaque &&
          !ativo
            ? "mt-2 text-3xl font-bold text-amber-900 group-hover:underline"
            : "mt-2 text-3xl font-bold group-hover:underline"
        }
      >
        {valor}
      </p>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {descricao}
      </p>
    </Link>
  );
}

function IconePendencia({
  texto,
}: {
  texto: string;
}) {
  const normalizado =
    texto.toLowerCase();

  if (
    texto ===
    TEXTO_MONITORAMENTO
  ) {
    return (
      <Eye className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
    );
  }

  if (
    normalizado.includes(
      "desfecho"
    )
  ) {
    return (
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
    );
  }

  if (
    normalizado.includes(
      "testemunha"
    )
  ) {
    return (
      <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
    );
  }

  if (
    normalizado.includes(
      "preposto"
    )
  ) {
    return (
      <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
    );
  }

  if (
    normalizado.includes(
      "advogado"
    ) ||
    normalizado.includes(
      "contratação"
    )
  ) {
    return (
      <Scale className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
    );
  }

  if (
    normalizado.includes(
      "15 dias"
    )
  ) {
    return (
      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
    );
  }

  return (
    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
  );
}

/* =====================================================
   PÁGINA
===================================================== */

export default async function PendenciasPage({
  searchParams,
}: {
  searchParams:
    Promise<SearchParamsPendencias>;
}) {
  const parametros =
    await searchParams;

  const filtroRecebido =
    Array.isArray(
      parametros.filtro
    )
      ? parametros.filtro[0]
      : parametros.filtro;

  const filtroAtivo =
    ehFiltroPendencias(
      filtroRecebido
    )
      ? filtroRecebido
      : null;

  const supabase =
    await createClient();

  /* ===================================================
     AUTENTICAÇÃO
  =================================================== */

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
    !authData?.claims?.sub
  ) {
    redirect(
      "/auth/login"
    );
  }

  const usuarioId =
    authData
      .claims
      .sub as string;

  /* ===================================================
     EMPRESA
  =================================================== */

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
      .limit(1)
      .maybeSingle();

  if (
    erroMembro
  ) {
    throw new Error(
      `Erro ao identificar empresa: ${erroMembro.message}`
    );
  }

  if (
    !membro
  ) {
    return (
      <main className="w-full">
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />

            <div>
              <h1 className="font-semibold text-amber-950">
                Empresa não identificada
              </h1>

              <p className="mt-1 text-sm text-amber-900">
                Não foi possível localizar um vínculo ativo com uma empresa.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const empresaId =
    membro
      .empresa_id as string;

  /* ===================================================
     DILIGÊNCIAS
  =================================================== */

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
        empresa_id,
        tipo_diligencia,
        modalidade,
        numero_processo,
        parte_autora,
        parte_re,
        data_diligencia,
        horario,
        vara,
        comarca,
        uf,
        local,
        correspondente_id,
        necessita_preposto,
        preposto_id,
        testemunhas_status,
        testemunhas_confirmadas,
        contratacao_status,
        contratacao_tipo,
        contratacao_confirmada,
        orientacoes_encaminhadas,
        status,
        excluida_em
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

  const diligencias =
    (
      diligenciasConsulta ??
      []
    ) as DiligenciaBase[];

  const idsDiligencias =
    diligencias.map(
      (item) =>
        item.id
    );

  /* ===================================================
     TESTEMUNHAS
  =================================================== */

  const contagemTestemunhas =
    new Map<
      string,
      Set<string>
    >();

  if (
    idsDiligencias.length >
    0
  ) {
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
            diligencia_id,
            testemunha_id
          `
        )
        .eq(
          "empresa_id",
          empresaId
        )
        .in(
          "diligencia_id",
          idsDiligencias
        );

    if (
      erroVinculos
    ) {
      throw new Error(
        `Erro ao verificar testemunhas: ${erroVinculos.message}`
      );
    }

    const vinculos =
      (
        vinculosConsulta ??
        []
      ) as
        VinculoTestemunha[];

    for (
      const vinculo
      of vinculos
    ) {
      const atual =
        contagemTestemunhas.get(
          vinculo
            .diligencia_id
        ) ??
        new Set<string>();

      atual.add(
        vinculo
          .testemunha_id
      );

      contagemTestemunhas.set(
        vinculo
          .diligencia_id,
        atual
      );
    }
  }

  /* ===================================================
     FINANCEIRO
  =================================================== */

  const diligenciasComFinanceiro =
    new Set<string>();

  if (
    idsDiligencias.length >
    0
  ) {
    const {
      data:
        financeiroConsulta,

      error:
        erroFinanceiro,
    } =
      await supabase
        .from(
          "diligencias_contratacoes"
        )
        .select(
          "diligencia_id"
        )
        .eq(
          "empresa_id",
          empresaId
        )
        .in(
          "diligencia_id",
          idsDiligencias
        );

    if (
      erroFinanceiro
    ) {
      throw new Error(
        `Erro ao verificar contratações financeiras: ${erroFinanceiro.message}`
      );
    }

    const vinculosFinanceiros =
      (
        financeiroConsulta ??
        []
      ) as
        VinculoFinanceiro[];

    for (
      const vinculo
      of vinculosFinanceiros
    ) {
      diligenciasComFinanceiro.add(
        vinculo
          .diligencia_id
      );
    }
  }

  /* ===================================================
     FILA OPERACIONAL
  =================================================== */

  const agora =
    agoraEmRecife();

  const pendentes =
    diligencias
      .map(
        (
          diligencia
        ):
          PendenciaCalculada => {
          const quantidadeTestemunhas =
            contagemTestemunhas
              .get(
                diligencia.id
              )
              ?.size ??
            0;

          const pendencias =
            calcularPendencias(
              diligencia,
              quantidadeTestemunhas,
              agora
            );

          const diasAte =
            diasEntreDatas(
              agora.data,
              diligencia
                .data_diligencia
            );

          const desfechoPendente =
            atoJaTranscorreu(
              diligencia,
              agora
            );

          const monitoramentoProximo =
            pendencias.includes(
              TEXTO_MONITORAMENTO
            );

          return {
            ...diligencia,

            pendencias,

            diasAte,

            urgencia:
              obterUrgencia(
                diasAte
              ),

            testemunhasVinculadas:
              quantidadeTestemunhas,

            temContratacaoFinanceira:
              diligenciasComFinanceiro.has(
                diligencia.id
              ),

            desfechoPendente,

            monitoramentoProximo,
          };
        }
      )
      .filter(
        (item) =>
          item
            .pendencias
            .length >
          0
      )
      .sort(
        (
          a,
          b
        ) => {
          if (
            a.desfechoPendente !==
            b.desfechoPendente
          ) {
            return a
              .desfechoPendente
              ? -1
              : 1;
          }

          const pesoA =
            pesoUrgencia(
              a.urgencia
            );

          const pesoB =
            pesoUrgencia(
              b.urgencia
            );

          if (
            pesoA !== pesoB
          ) {
            return (
              pesoA -
              pesoB
            );
          }

          if (
            a.diasAte !==
              null &&
            b.diasAte !==
              null &&
            a.diasAte !==
              b.diasAte
          ) {
            return (
              a.diasAte -
              b.diasAte
            );
          }

          const data =
            a
              .data_diligencia
              .localeCompare(
                b
                  .data_diligencia
              );

          if (
            data !== 0
          ) {
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

  /* ===================================================
     CONTADORES
  =================================================== */

  const aguardandoDesfecho =
    pendentes.filter(
      (item) =>
        item
          .desfechoPendente
    ).length;

  const proximos3Dias =
    pendentes.filter(
      (item) =>
        !item
          .desfechoPendente &&
        item.diasAte !==
          null &&
        item.diasAte >= 0 &&
        item.diasAte <= 3
    ).length;

  const de4a15Dias =
    pendentes.filter(
      (item) =>
        !item
          .desfechoPendente &&
        item.diasAte !==
          null &&
        item.diasAte >= 4 &&
        item.diasAte <= 15
    ).length;

  const emMonitoramento =
    pendentes.filter(
      (item) =>
        item
          .monitoramentoProximo
    ).length;

  /* ===================================================
     FILTRO ATIVO
  =================================================== */

  const pendentesFiltrados =
    !filtroAtivo ||
    filtroAtivo ===
      "fila_operacional"
      ? pendentes

      : filtroAtivo ===
          "atos_hoje_anteriores"
        ? pendentes.filter(
            (item) =>
              item
                .desfechoPendente
          )

        : filtroAtivo ===
            "proximos_3_dias"
          ? pendentes.filter(
              (item) =>
                !item
                  .desfechoPendente &&
                item.diasAte !==
                  null &&
                item.diasAte >=
                  0 &&
                item.diasAte <=
                  3
            )

          : pendentes.filter(
              (item) =>
                !item
                  .desfechoPendente &&
                item.diasAte !==
                  null &&
                item.diasAte >=
                  4 &&
                item.diasAte <=
                  15
            );

  const nomeFiltroAtivo =
    filtroAtivo
      ? NOMES_FILTROS[
          filtroAtivo
        ]
      : null;

  /* ===================================================
     RENDERIZAÇÃO
  =================================================== */

  return (
    <main className="w-full">
      {/* CABEÇALHO */}

      <section className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">
          Gestão operacional
        </p>

        <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Verificar pendências
            </h1>

            <p className="mt-2 max-w-3xl text-muted-foreground">
              Acompanhe o tratamento das diligências desde a preparação, passando pelo monitoramento dos atos próximos, até o desfecho e encaminhamento ao financeiro.
            </p>
          </div>

          <Link
            href="/protected/diligencias"
            className="inline-flex w-fit items-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            <CalendarDays className="h-4 w-4" />

            Ver todas as diligências
          </Link>
        </div>
      </section>

      {/* EXPLICAÇÃO */}

      <section className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

          <div>
            <p className="font-semibold">
              A fila acompanha o ciclo completo da diligência
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Decisões como contratação, testemunhas ou preposto marcadas como{" "}
              <strong>
                desnecessárias
              </strong>{" "}
              estão resolvidas. Uma diligência totalmente tratada permanece em monitoramento quando o ato estiver em até 15 dias. Depois do horário do ato, registrar o desfecho passa a ser a providência prioritária.
            </p>
          </div>
        </div>
      </section>

      {/* CARDS CLICÁVEIS */}

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Na fila operacional"
          href="/protected/pendencias?filtro=fila_operacional"
          ativo={
            filtroAtivo ===
            "fila_operacional"
          }
          valor={
            pendentes.length
          }
          descricao={
            emMonitoramento >
            0
              ? `${emMonitoramento} ${
                  emMonitoramento ===
                  1
                    ? "ato está"
                    : "atos estão"
                } apenas em monitoramento.`
              : "Com pendência, monitoramento ou desfecho a registrar."
          }
          destaque={
            pendentes.length >
            0
          }
        />

        <ResumoCard
          titulo="Atos de hoje e anteriores"
          href="/protected/pendencias?filtro=atos_hoje_anteriores"
          ativo={
            filtroAtivo ===
            "atos_hoje_anteriores"
          }
          valor={
            aguardandoDesfecho
          }
          descricao="Diligências de hoje ou de datas anteriores que permanecem ativas."
          destaque={
            aguardandoDesfecho >
            0
          }
        />

        <ResumoCard
          titulo="Próximos 3 dias"
          href="/protected/pendencias?filtro=proximos_3_dias"
          ativo={
            filtroAtivo ===
            "proximos_3_dias"
          }
          valor={
            proximos3Dias
          }
          descricao="De hoje até D+3, sem incluir atos já vencidos."
          destaque={
            proximos3Dias >
            0
          }
        />

        <ResumoCard
          titulo="De 4 a 15 dias"
          href="/protected/pendencias?filtro=de_4_a_15_dias"
          ativo={
            filtroAtivo ===
            "de_4_a_15_dias"
          }
          valor={
            de4a15Dias
          }
          descricao="Faixa exclusiva de D+4 até D+15."
          destaque={
            de4a15Dias >
            0
          }
        />
      </section>

      {/* FILTRO ATIVO */}

      {filtroAtivo &&
        nomeFiltroAtivo && (
          <section className="mb-6 rounded-xl border bg-card px-5 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Filtro ativo
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    {
                      nomeFiltroAtivo
                    }
                  </p>

                  <span className="text-sm text-muted-foreground">
                    •
                  </span>

                  <p className="text-sm text-muted-foreground">
                    {
                      pendentesFiltrados.length
                    }{" "}
                    {pendentesFiltrados.length ===
                    1
                      ? "diligência"
                      : "diligências"}
                  </p>
                </div>
              </div>

              <Link
                href="/protected/pendencias"
                className="inline-flex w-fit items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Limpar filtro
              </Link>
            </div>
          </section>
        )}

      {/* FILA VAZIA */}

      {pendentes.length ===
        0 && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-700" />
          </div>

          <h2 className="mt-4 text-xl font-semibold text-emerald-950">
            Nenhuma providência operacional
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-emerald-800">
            Não há diligências com pendências, atos em monitoramento nos próximos 15 dias ou diligências aguardando registro de desfecho.
          </p>

          <Link
            href="/protected/diligencias"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2.5 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
          >
            Ver diligências

            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {/* FILTRO SEM RESULTADO */}

      {pendentes.length >
        0 &&
        pendentesFiltrados.length ===
          0 && (
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
              <FileWarning className="h-6 w-6 text-muted-foreground" />
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              Nenhuma diligência neste filtro
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              A fila possui diligências, mas nenhuma se enquadra em{" "}
              <strong>
                {nomeFiltroAtivo}
              </strong>{" "}
              neste momento.
            </p>

            <Link
              href="/protected/pendencias"
              className="mt-6 inline-flex items-center rounded-lg border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Limpar filtro
            </Link>
          </section>
        )}

      {/* LISTAGEM */}

      {pendentesFiltrados.length >
        0 && (
        <section className="rounded-xl border bg-card">
          <div className="border-b px-6 py-5">
            <div className="flex items-start gap-3">
              <FileWarning className="mt-0.5 h-5 w-5 text-amber-700" />

              <div>
                <h2 className="text-lg font-semibold">
                  {nomeFiltroAtivo ??
                    "Fila de tratamento"}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Desfechos pendentes aparecem primeiro. Depois, a fila considera a proximidade do ato e mantém em acompanhamento as diligências tratadas que ocorrerão em até 15 dias.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y">
            {pendentesFiltrados.map(
              (
                diligencia
              ) => {
                const classes =
                  classeUrgencia(
                    diligencia
                      .urgencia
                  );

                return (
                  <article
                    key={
                      diligencia.id
                    }
                    className={`border-l-4 p-6 ${classes.lateral}`}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {diligencia
                            .desfechoPendente && (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                              Aguardando desfecho
                            </span>
                          )}

                          {diligencia
                            .monitoramentoProximo && (
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                              Monitoramento
                            </span>
                          )}

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classes.badge}`}
                          >
                            {textoUrgencia(
                              diligencia
                                .diasAte,
                              diligencia
                                .urgencia
                            )}
                          </span>

                          <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            {
                              diligencia
                                .pendencias
                                .length
                            }{" "}
                            {diligencia
                              .pendencias
                              .length ===
                            1
                              ? "providência"
                              : "providências"}
                          </span>

                          <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            {diligencia
                              .modalidade ===
                            "virtual"
                              ? "Virtual"
                              : "Presencial"}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-semibold">
                          {
                            diligencia
                              .tipo_diligencia
                          }
                        </h3>

                        <p className="mt-1 font-mono text-sm text-muted-foreground">
                          {formatarProcesso(
                            diligencia
                              .numero_processo
                          )}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Link
                          href={`/protected/diligencias/${diligencia.id}`}
                          className="inline-flex items-center justify-center rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                        >
                          Ver detalhes
                        </Link>

                        <Link
                          href={`/protected/diligencias/${diligencia.id}/editar`}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                        >
                          Tratar agora

                          <ChevronRight className="h-4 w-4" />
                        </Link>

                        <ModalDesfecho
                          key={`${diligencia.id}-${diligencia.data_diligencia}-${diligencia.horario}`}
                          diligencia={{
                            id:
                              diligencia.id,

                            tipo_diligencia:
                              diligencia
                                .tipo_diligencia,

                            numero_processo:
                              diligencia
                                .numero_processo,

                            data_diligencia:
                              diligencia
                                .data_diligencia,

                            horario:
                              diligencia
                                .horario,

                            hoje:
                              agora.data,

                            temContratacaoFinanceira:
                              diligencia
                                .temContratacaoFinanceira,

                            desfechoPendente:
                              diligencia
                                .desfechoPendente,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 rounded-lg bg-muted/30 p-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Data e horário
                        </p>

                        <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                          <Clock3 className="h-4 w-4 text-muted-foreground" />

                          {formatarData(
                            diligencia
                              .data_diligencia
                          )}

                          {" • "}

                          {horarioCurto(
                            diligencia
                              .horario
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Vara / unidade
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {diligencia
                            .vara ||
                            "Não informada"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Comarca
                        </p>

                        <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                          <MapPin className="h-4 w-4 text-muted-foreground" />

                          {diligencia
                            .comarca ||
                            "Não informada"}

                          {diligencia
                            .uf
                            ? `/${diligencia.uf}`
                            : ""}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Partes
                        </p>

                        <p className="mt-1 truncate text-sm font-medium">
                          {diligencia
                            .parte_autora ||
                            "—"}

                          {" × "}

                          {diligencia
                            .parte_re ||
                            "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-semibold">
                        {diligencia
                          .monitoramentoProximo
                          ? "Acompanhamento"
                          : "Providências necessárias"}
                      </p>

                      <div className="mt-3 grid gap-2 lg:grid-cols-2">
                        {diligencia
                          .pendencias
                          .map(
                            (
                              pendencia,
                              indice
                            ) => {
                              const eDesfecho =
                                pendencia ===
                                TEXTO_DESFECHO;

                              const eMonitoramento =
                                pendencia ===
                                TEXTO_MONITORAMENTO;

                              let classe =
                                "flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950";

                              if (
                                eDesfecho
                              ) {
                                classe =
                                  "flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-950";
                              }

                              if (
                                eMonitoramento
                              ) {
                                classe =
                                  "flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-950";
                              }

                              return (
                                <div
                                  key={`${diligencia.id}-${indice}-${pendencia}`}
                                  className={
                                    classe
                                  }
                                >
                                  <IconePendencia
                                    texto={
                                      pendencia
                                    }
                                  />

                                  <span>
                                    {
                                      pendencia
                                    }
                                  </span>
                                </div>
                              );
                            }
                          )}
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </section>
      )}
    </main>
  );
}