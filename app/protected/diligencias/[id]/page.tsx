import type {
  ReactNode,
} from "react";

import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Monitor,
  Pencil,
  Scale,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  temPermissao,
} from "@/lib/permissoes";

import {
  ControlePagamento,
} from "../controle-pagamento";

import {
  BotaoCancelarDiligencia,
} from "./botao-cancelar-diligencia";


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


type Diligencia = {
  id: string;

  tipo_diligencia:
    string;

  modalidade:
    | "presencial"
    | "virtual";

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

  necessita_preposto:
    boolean | null;

  preposto_id:
    string | null;

  testemunhas_status?:
    string | null;

  testemunhas_confirmadas?:
    boolean | null;

  contratacao_status?:
    string | null;

  contratacao_tipo?:
    string | null;

  contratacao_confirmada?:
    boolean | null;

  orientacoes_encaminhadas:
    boolean;

  observacoes:
    string | null;

  status:
    string;

  financeiro_status?:
  | "liberado_para_pagamento"
  | "nao_aplicavel"
  | null;  

  origem:
    string | null;

  cancelada_em?:
    string | null;

  cancelada_por?:
    string | null;

  excluida_em?:
    string | null;
};


type Advogado = {
  id: string;

  nome: string;

  oab_numero:
    string | null;

  oab_uf:
    string | null;
};


type Preposto = {
  id: string;

  nome: string;

  cpf:
    string | null;
};


type Testemunha = {
  id: string;

  nome: string;

  cpf:
    string | null;
};


type ContratacaoDetalhe = {
  id?:
    string;

  tipo_profissional:
    | "advogado"
    | "preposto";

  correspondente_id?:
    string | null;

  valor?:
    number
    | string
    | null;

  pagamento_combinado_em?:
    string | null;

  pagamento_devido?:
    boolean | null;

  pago_em?:
    string | null;

  pago_por?:
    string | null;

  pagamento_desfeito_em?:
    string | null;

  pagamento_desfeito_por?:
    string | null;

  criado_em?:
    string | null;
};


type DetalhesDiligencia = {
  diligencia:
    Diligencia;

  advogado:
    Advogado | null;

  preposto:
    Preposto | null;

  testemunhas?:
    Testemunha[];

  contratacoes?:
    ContratacaoDetalhe[];
};


/* =====================================================
   FORMATAÇÃO
===================================================== */

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


function formatarData(
  data:
    string | null | undefined
) {
  if (!data) {
    return "Não informada";
  }

  const valor =
    data.slice(
      0,
      10
    );

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
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}


function formatarDataHora(
  data:
    string | null | undefined
) {
  if (!data) {
    return null;
  }

  const objeto =
    new Date(
      data
    );

  if (
    Number.isNaN(
      objeto.getTime()
    )
  ) {
    return data;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Recife",

      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    objeto
  );
}


function formatarCpf(
  cpf:
    string | null
) {
  if (!cpf) {
    return "CPF não informado";
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
    `${numeros.slice(0, 3)}.` +
    `${numeros.slice(3, 6)}.` +
    `${numeros.slice(6, 9)}-` +
    `${numeros.slice(9, 11)}`
  );
}


function formatarValor(
  valor:
    number
    | string
    | null
    | undefined
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "Não informado";
  }

  let numero:
    number;

  if (
    typeof valor ===
    "number"
  ) {
    numero =
      valor;
  } else {
    const texto =
      String(
        valor
      ).trim();

    if (
      texto.includes(",")
    ) {
      numero =
        Number(
          texto
            .replace(
              /\./g,
              ""
            )
            .replace(
              ",",
              "."
            )
        );
    } else {
      numero =
        Number(
          texto
        );
    }
  }

  if (
    !Number.isFinite(
      numero
    )
  ) {
    return String(
      valor
    );
  }

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    numero
  );
}


/* =====================================================
   NOMES
===================================================== */

function nomeStatus(
  status:
    string
) {
  if (
    status === "ativa"
  ) {
    return "Ativa";
  }

  if (
    status ===
    "concluida"
  ) {
    return "Concluída";
  }

  if (
    status ===
    "cancelada"
  ) {
    return "Cancelada";
  }

  return status;
}


function nomeOrigem(
  origem:
    string | null
) {
  if (
    origem === "manual"
  ) {
    return "Cadastro manual";
  }

  if (
    origem ===
    "importacao"
  ) {
    return "Importação";
  }

  return (
    origem ||
    "Não informada"
  );
}


function normalizarContratacaoTipo(
  valor:
    string | null | undefined
): ContratacaoTipo {
  if (
    valor === "advogado" ||
    valor === "preposto" ||
    valor ===
      "advogado_preposto"
  ) {
    return valor;
  }

  return null;
}


function nomeContratacaoTipo(
  tipo:
    ContratacaoTipo
) {
  if (
    tipo === "advogado"
  ) {
    return "Apenas advogado";
  }

  if (
    tipo === "preposto"
  ) {
    return "Apenas preposto";
  }

  if (
    tipo ===
    "advogado_preposto"
  ) {
    return "Advogado e preposto";
  }

  return null;
}


/* =====================================================
   NORMALIZAÇÃO
===================================================== */

function obterContratacaoStatus(
  diligencia:
    Diligencia
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


function obterTestemunhasStatus(
  diligencia:
    Diligencia
): TestemunhasStatus {
  const valor =
    diligencia
      .testemunhas_status;

  if (
    valor ===
    "confirmadas"
  ) {
    return "confirmadas";
  }

  if (
    valor ===
      "desnecessarias" ||
    valor ===
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


function inferirContratacaoTipo(
  tipo:
    ContratacaoTipo,

  contratacoes:
    ContratacaoDetalhe[]
): ContratacaoTipo {
  if (
    tipo
  ) {
    return tipo;
  }

  const temAdvogado =
    contratacoes.some(
      (item) =>
        item
          .tipo_profissional ===
        "advogado"
    );

  const temPreposto =
    contratacoes.some(
      (item) =>
        item
          .tipo_profissional ===
        "preposto"
    );

  if (
    temAdvogado &&
    temPreposto
  ) {
    return "advogado_preposto";
  }

  if (
    temAdvogado
  ) {
    return "advogado";
  }

  if (
    temPreposto
  ) {
    return "preposto";
  }

  return null;
}


/* =====================================================
   COMPONENTES
===================================================== */

type SituacaoVisual =
  | "resolvida"
  | "pendente"
  | "alerta"
  | "informativa";


function classesSituacao(
  situacao:
    SituacaoVisual
) {
  if (
    situacao ===
    "resolvida"
  ) {
    return {
      icone:
        "text-emerald-700",

      texto:
        "text-emerald-800",

      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  if (
    situacao ===
    "pendente"
  ) {
    return {
      icone:
        "text-amber-700",

      texto:
        "text-amber-800",

      badge:
        "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  if (
    situacao ===
    "alerta"
  ) {
    return {
      icone:
        "text-red-700",

      texto:
        "text-red-800",

      badge:
        "border-red-200 bg-red-50 text-red-800",
    };
  }

  return {
    icone:
      "text-slate-500",

    texto:
      "text-slate-700",

    badge:
      "border-slate-200 bg-slate-50 text-slate-700",
  };
}


function LinhaTratamento({
  titulo,
  valor,
  situacao,
}: {
  titulo:
    string;

  valor:
    string;

  situacao:
    SituacaoVisual;
}) {
  const classes =
    classesSituacao(
      situacao
    );

  const Icone =
    situacao ===
    "pendente"
      ? Clock3
      : situacao ===
          "alerta"
        ? AlertTriangle
        : CheckCircle2;

  return (
    <div className="flex items-start gap-3">
      <Icone
        className={`mt-0.5 h-5 w-5 shrink-0 ${classes.icone}`}
      />

      <div>
        <p className="font-medium">
          {titulo}
        </p>

        <p
          className={`mt-1 text-sm ${classes.texto}`}
        >
          {valor}
        </p>
      </div>
    </div>
  );
}


function CampoDetalhe({
  titulo,
  valor,
  ocuparDuasColunas = false,
}: {
  titulo:
    string;

  valor:
    string;

  ocuparDuasColunas?:
    boolean;
}) {
  return (
    <div
      className={
        ocuparDuasColunas
          ? "md:col-span-2"
          : undefined
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>

      <p className="mt-2 break-words font-medium">
        {valor}
      </p>
    </div>
  );
}


function ResumoCard({
  titulo,
  valor,
  icone,
}: {
  titulo:
    string;

  valor:
    string;

  icone:
    ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icone}

        <span className="text-sm">
          {titulo}
        </span>
      </div>

      <p className="mt-2 break-words text-lg font-semibold">
        {valor}
      </p>
    </div>
  );
}


/* =====================================================
   PÁGINA
===================================================== */

export default async function DiligenciaPage({
  params,
}: {
  params:
    Promise<{
      id:
        string;
    }>;
}) {
  const {
    id,
  } =
    await params;

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
    !authData
      ?.claims
      ?.sub
  ) {
    redirect(
      "/auth/login"
    );
  }


  /* ===================================================
     PERMISSÕES
  =================================================== */

  const [
    podeEditar,
    podeGerenciarFinanceiro,
  ] =
    await Promise.all([
      temPermissao(
        "diligencias.editar"
      ),

      temPermissao(
        "financeiro.gerenciar"
      ),
    ]);


  /* ===================================================
     DADOS
  =================================================== */

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "obter_detalhes_diligencia",
      {
        p_diligencia_id:
          id,
      }
    );

  if (
    error
  ) {
    throw new Error(
      `Erro ao carregar diligência: ${error.message}`
    );
  }

  if (
    !data
  ) {
    notFound();
  }

  const detalhes =
    data as
      DetalhesDiligencia;

  const diligencia =
    detalhes.diligencia;

  if (
    !diligencia
  ) {
    notFound();
  }

  const advogado =
    detalhes.advogado ??
    null;

  const preposto =
    detalhes.preposto ??
    null;

  const testemunhas =
    detalhes.testemunhas ??
    [];

  const contratacoes =
    detalhes.contratacoes ??
    [];


  /* ===================================================
     ESTADOS
  =================================================== */

  const contratacaoStatus =
    obterContratacaoStatus(
      diligencia
    );

  const testemunhasStatus =
    obterTestemunhasStatus(
      diligencia
    );

  const contratacaoTipo =
    inferirContratacaoTipo(
      normalizarContratacaoTipo(
        diligencia
          .contratacao_tipo
      ),
      contratacoes
    );

  const nomeTipoContratacao =
    nomeContratacaoTipo(
      contratacaoTipo
    );

  const contratacaoIncluiAdvogado =
    contratacaoTipo ===
      "advogado" ||
    contratacaoTipo ===
      "advogado_preposto";

  const contratacaoIncluiPreposto =
    contratacaoTipo ===
      "preposto" ||
    contratacaoTipo ===
      "advogado_preposto";


  /* CONTRATAÇÃO */

  const textoContratacao =
    contratacaoStatus ===
      "confirmada"
      ? "Confirmada"
      : contratacaoStatus ===
          "desnecessaria"
        ? "Desnecessária"
        : "Pendente";

  const situacaoContratacao:
    SituacaoVisual =
      contratacaoStatus ===
      null
        ? "pendente"
        : "resolvida";


  /* PREPOSTO */

  let textoPreposto:
    string;

  let situacaoPreposto:
    SituacaoVisual;

  if (
    diligencia
      .necessita_preposto ===
    null
  ) {
    textoPreposto =
      "Pendente de definição";

    situacaoPreposto =
      "pendente";
  } else if (
    diligencia
      .necessita_preposto ===
    false
  ) {
    textoPreposto =
      "Desnecessário";

    situacaoPreposto =
      "resolvida";
  } else if (
    preposto
  ) {
    textoPreposto =
      "Designado";

    situacaoPreposto =
      "resolvida";
  } else {
    textoPreposto =
      "Pendente de designação";

    situacaoPreposto =
      "pendente";
  }


  /* TESTEMUNHAS */

  let textoTestemunhas:
    string;

  let situacaoTestemunhas:
    SituacaoVisual;

  if (
    testemunhasStatus ===
    "desnecessarias"
  ) {
    textoTestemunhas =
      "Desnecessárias";

    situacaoTestemunhas =
      "resolvida";
  } else if (
    testemunhasStatus ===
    "confirmadas"
  ) {
    if (
      testemunhas.length >
      0
    ) {
      textoTestemunhas =
        `${testemunhas.length} confirmada(s)`;

      situacaoTestemunhas =
        "resolvida";
    } else {
      textoTestemunhas =
        "Confirmadas, mas sem testemunha vinculada";

      situacaoTestemunhas =
        "alerta";
    }
  } else {
    textoTestemunhas =
      "Pendente de definição";

    situacaoTestemunhas =
      "pendente";
  }


  /* ORIENTAÇÕES */

  const textoOrientacoes =
    diligencia
      .orientacoes_encaminhadas
      ? "Encaminhadas"
      : "Pendentes";

  const situacaoOrientacoes:
    SituacaoVisual =
      diligencia
        .orientacoes_encaminhadas
        ? "resolvida"
        : "pendente";


  /* ===================================================
     PENDÊNCIAS
  =================================================== */

  const pendencias:
    string[] = [];

  if (
    diligencia.status ===
    "ativa"
  ) {
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
        "Revisar os profissionais vinculados à contratação confirmada."
      );
    }

    if (
      contratacaoStatus ===
        "confirmada" &&
      contratacaoIncluiAdvogado &&
      !advogado
    ) {
      pendencias.push(
        "Vincular o advogado da contratação confirmada."
      );
    }

    if (
      contratacaoStatus ===
        "confirmada" &&
      contratacaoIncluiPreposto &&
      diligencia
        .necessita_preposto !==
        true
    ) {
      pendencias.push(
        "Revisar a contratação: ela inclui preposto, mas a diligência não está definida como necessitando desse profissional."
      );
    }

    if (
      contratacaoStatus ===
        "confirmada" &&
      contratacaoIncluiPreposto &&
      diligencia
        .necessita_preposto ===
        true &&
      !preposto
    ) {
      pendencias.push(
        "Vincular o preposto da contratação confirmada."
      );
    }

    if (
      diligencia
        .necessita_preposto ===
      null
    ) {
      pendencias.push(
        "Definir se a diligência necessita de preposto."
      );
    }

    if (
      diligencia
        .necessita_preposto ===
        true &&
      !preposto
    ) {
      pendencias.push(
        "Designar o preposto da diligência."
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
      testemunhas.length ===
        0
    ) {
      pendencias.push(
        "Vincular pelo menos uma testemunha confirmada."
      );
    }

    if (
      !diligencia
        .orientacoes_encaminhadas
    ) {
      pendencias.push(
        "Encaminhar ou registrar o envio das orientações."
      );
    }
  }

  const semPendencias =
    pendencias.length ===
    0;

  const canceladaEm =
    formatarDataHora(
      diligencia
        .cancelada_em
    );


  /* ===================================================
     RENDER
  =================================================== */

  return (
    <main className="w-full">

      {/* CABEÇALHO */}

      <section className="mb-8">
        <Link
          href="/protected/diligencias"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          Voltar para diligências
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                Gestão da diligência
              </p>

              <span
                className={
                  diligencia.status ===
                  "ativa"
                    ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                    : diligencia.status ===
                        "cancelada"
                      ? "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800"
                      : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                }
              >
                {nomeStatus(
                  diligencia.status
                )}
              </span>

              {diligencia.status ===
                "ativa" &&
                pendencias.length >
                  0 && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    {
                      pendencias.length
                    }{" "}
                    pendência(s)
                  </span>
                )}
            </div>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              {
                diligencia
                  .tipo_diligencia
              }
            </h1>

            <p className="mt-2 text-lg text-muted-foreground">
              Processo{" "}
              {formatarProcesso(
                diligencia
                  .numero_processo
              )}
            </p>
          </div>


          {/* AÇÕES OPERACIONAIS */}

          {podeEditar &&
            diligencia.status !==
              "cancelada" && (
              <div className="flex flex-wrap items-center gap-3">

                <Link
                  href={`/protected/diligencias/${diligencia.id}/editar`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  <Pencil className="h-4 w-4" />

                  Editar
                </Link>

                {diligencia.status !==
                  "concluida" && (
                  <BotaoCancelarDiligencia
                    diligenciaId={
                      diligencia.id
                    }
                  />
                )}

              </div>
            )}

        </div>
      </section>


      {/* CANCELADA */}

      {diligencia.status ===
        "cancelada" && (
        <section className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-900">
            Diligência cancelada
          </p>

          <p className="mt-1 text-sm text-red-800">
            Este registro foi preservado para histórico e auditoria e não pode mais ser alterado.
          </p>

          {canceladaEm && (
            <p className="mt-2 text-sm text-red-800">
              Cancelamento registrado em{" "}
              <strong>
                {canceladaEm}
              </strong>
              .
            </p>
          )}
        </section>
      )}


      {/* RESUMO */}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Data"
          valor={formatarData(
            diligencia
              .data_diligencia
          )}
          icone={
            <CalendarDays className="h-4 w-4" />
          }
        />

        <ResumoCard
          titulo="Horário"
          valor={
            diligencia
              .horario
              ?.slice(
                0,
                5
              ) ||
            "Não informado"
          }
          icone={
            <Clock3 className="h-4 w-4" />
          }
        />

        <ResumoCard
          titulo="Modalidade"
          valor={
            diligencia
              .modalidade ===
            "virtual"
              ? "Virtual"
              : "Presencial"
          }
          icone={
            diligencia
              .modalidade ===
            "virtual" ? (
              <Monitor className="h-4 w-4" />
            ) : (
              <MapPin className="h-4 w-4" />
            )
          }
        />

        <ResumoCard
          titulo="Processo"
          valor={formatarProcesso(
            diligencia
              .numero_processo
          )}
          icone={
            <FileText className="h-4 w-4" />
          }
        />
      </section>


      {/* SITUAÇÃO OPERACIONAL */}

      {diligencia.status ===
        "ativa" && (
        <section
          className={
            semPendencias
              ? "mb-6 rounded-xl border border-emerald-200 bg-emerald-50"
              : "mb-6 rounded-xl border border-amber-200 bg-amber-50"
          }
        >
          <div className="border-b border-black/5 px-6 py-5">
            <div className="flex items-start gap-3">
              {semPendencias ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              ) : (
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              )}

              <div>
                <h2
                  className={
                    semPendencias
                      ? "text-lg font-semibold text-emerald-900"
                      : "text-lg font-semibold text-amber-950"
                  }
                >
                  Situação operacional
                </h2>

                <p
                  className={
                    semPendencias
                      ? "mt-1 text-sm text-emerald-800"
                      : "mt-1 text-sm text-amber-900"
                  }
                >
                  {semPendencias
                    ? "Não identificamos pendências operacionais nesta diligência."
                    : "Existem providências que ainda exigem atuação ou conferência do controller."}
                </p>
              </div>
            </div>
          </div>

          {!semPendencias && (
            <div className="p-6">
              <ul className="space-y-3">
                {pendencias.map(
                  (
                    pendencia,
                    indice
                  ) => (
                    <li
                      key={`${indice}-${pendencia}`}
                      className="flex items-start gap-3 text-sm text-amber-950"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-700" />

                      <span>
                        {pendencia}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </section>
      )}


      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">

        {/* COLUNA PRINCIPAL */}

        <div className="space-y-6">

          {/* DADOS */}

          <section className="rounded-xl border bg-card">
            <div className="border-b px-6 py-5">
              <h2 className="text-lg font-semibold">
                Dados da diligência
              </h2>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              <CampoDetalhe
                titulo="Parte autora"
                valor={
                  diligencia
                    .parte_autora ||
                  "Não informada"
                }
              />

              <CampoDetalhe
                titulo="Parte ré"
                valor={
                  diligencia
                    .parte_re ||
                  "Não informada"
                }
              />

              <CampoDetalhe
                titulo="Vara / unidade"
                valor={
                  diligencia
                    .vara ||
                  "Não informada"
                }
              />

              <CampoDetalhe
                titulo="Comarca"
                valor={`${diligencia.comarca || "Não informada"}${
                  diligencia.uf
                    ? `/${diligencia.uf}`
                    : ""
                }`}
              />

              <CampoDetalhe
                titulo="Local"
                valor={
                  diligencia
                    .local ||
                  "Não informado"
                }
                ocuparDuasColunas
              />
            </div>
          </section>


          {/* PARTICIPANTES */}

          <section className="rounded-xl border bg-card">
            <div className="border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <UsersRound className="h-5 w-5" />

                <div>
                  <h2 className="text-lg font-semibold">
                    Participantes
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Pessoas vinculadas a esta diligência.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y">

              {/* ADVOGADO */}

              <div className="p-6">
                <div className="flex items-start gap-3">
                  <Scale className="mt-0.5 h-5 w-5" />

                  <div className="w-full">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Advogado
                      </p>

                      <span
                        className={
                          advogado
                            ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                            : "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
                        }
                      >
                        {advogado
                          ? "Vinculado"
                          : "Sem vínculo"}
                      </span>
                    </div>

                    {advogado ? (
                      <>
                        <p className="mt-2 font-semibold">
                          {
                            advogado
                              .nome
                          }
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          OAB/
                          {advogado.oab_uf ||
                            "—"}{" "}
                          {advogado.oab_numero ||
                            "não informada"}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm">
                        Nenhum advogado vinculado à diligência.
                      </p>
                    )}
                  </div>
                </div>
              </div>


              {/* PREPOSTO */}

              <div className="p-6">
                <div className="flex items-start gap-3">
                  <UserRound className="mt-0.5 h-5 w-5" />

                  <div className="w-full">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Preposto
                      </p>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          classesSituacao(
                            situacaoPreposto
                          ).badge
                        }`}
                      >
                        {textoPreposto}
                      </span>
                    </div>

                    {preposto ? (
                      <>
                        <p className="mt-2 font-semibold">
                          {
                            preposto
                              .nome
                          }
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          CPF{" "}
                          {formatarCpf(
                            preposto.cpf
                          )}
                        </p>
                      </>
                    ) : diligencia
                        .necessita_preposto ===
                      false ? (
                      <p className="mt-2 text-sm">
                        Não há necessidade de preposto para este ato.
                      </p>
                    ) : diligencia
                        .necessita_preposto ===
                      null ? (
                      <p className="mt-2 text-sm text-amber-800">
                        A necessidade de preposto ainda não foi definida.
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-amber-800">
                        O ato necessita de preposto, mas nenhum profissional foi designado.
                      </p>
                    )}
                  </div>
                </div>
              </div>


              {/* TESTEMUNHAS */}

              <div className="p-6">
                <div className="flex items-start gap-3">
                  <UsersRound className="mt-0.5 h-5 w-5" />

                  <div className="w-full">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Testemunhas
                      </p>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          classesSituacao(
                            situacaoTestemunhas
                          ).badge
                        }`}
                      >
                        {textoTestemunhas}
                      </span>
                    </div>

                    {testemunhasStatus ===
                      "confirmadas" &&
                    testemunhas.length >
                      0 ? (
                      <div className="mt-4 space-y-3">
                        {testemunhas.map(
                          (
                            testemunha
                          ) => (
                            <div
                              key={
                                testemunha.id
                              }
                              className="rounded-lg border bg-muted/20 p-3"
                            >
                              <p className="font-semibold">
                                {
                                  testemunha.nome
                                }
                              </p>

                              <p className="mt-1 text-sm text-muted-foreground">
                                CPF{" "}
                                {formatarCpf(
                                  testemunha.cpf
                                )}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    ) : testemunhasStatus ===
                      "desnecessarias" ? (
                      <p className="mt-2 text-sm">
                        Não há necessidade de testemunhas para este ato.
                      </p>
                    ) : testemunhasStatus ===
                      null ? (
                      <p className="mt-2 text-sm text-amber-800">
                        A necessidade de testemunhas ainda não foi definida.
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-red-700">
                        Existem testemunhas marcadas como confirmadas, mas nenhuma está vinculada à diligência.
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </section>


          {/* FINANCEIRO */}

          {contratacaoStatus ===
            "confirmada" && (
            <section className="rounded-xl border bg-card">
              <div className="border-b px-6 py-5">
                <h2 className="text-lg font-semibold">
                  Dados da contratação
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Informações financeiras vinculadas à contratação.
                </p>
              </div>

              <div className="p-6">

                {nomeTipoContratacao && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Contratação
                    </p>

                    <p className="mt-2 font-semibold">
                      {
                        nomeTipoContratacao
                      }
                    </p>
                  </div>
                )}


                {contratacoes.length >
                0 ? (
                  <div className="space-y-4">

                    {contratacoes.map(
                      (
                        contratacao,
                        indice
                      ) => (
                        <div
                          key={
                            contratacao.id ??
                            `${contratacao.tipo_profissional}-${indice}`
                          }
                          className="rounded-xl border bg-muted/20 p-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                            <div>
                              <p className="font-semibold">
                                {contratacao.tipo_profissional ===
                                "advogado"
                                  ? "Advogado"
                                  : "Preposto"}
                              </p>
                            </div>


                            {contratacao.id ? (
                              <ControlePagamento
                                contratacaoId={
                                  contratacao.id
                                }

                                diligenciaId={
                                  diligencia.id
                                }

                                pagoEm={
                                  contratacao.pago_em ??
                                  null
                                }

                                pagamentoDesfeitoEm={
                                  contratacao.pagamento_desfeito_em ??
                                  null
                                }

                                podeGerenciar={
                                  podeGerenciarFinanceiro
                                }

                                liberadoParaPagamento={
                                  diligencia.financeiro_status ===
                                  "liberado_para_pagamento"
                                }
                              />
                            ) : (
                              <span
                                className={
                                  contratacao.pago_em
                                    ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                                    : "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"
                                }
                              >
                                {contratacao.pago_em
                                  ? "Pago"
                                  : "Pagamento pendente"}
                              </span>
                            )}

                          </div>


                          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                            <CampoDetalhe
                              titulo="Valor"
                              valor={formatarValor(
                                contratacao.valor
                              )}
                            />

                            <CampoDetalhe
                              titulo="Pagamento combinado"
                              valor={formatarData(
                                contratacao
                                  .pagamento_combinado_em
                              )}
                            />

                            <CampoDetalhe
                              titulo="Pago em"
                              valor={
                                contratacao.pago_em
                                  ? (
                                      formatarDataHora(
                                        contratacao.pago_em
                                      ) ??
                                      "Não informado"
                                    )
                                  : "Ainda não pago"
                              }
                            />

                          </div>
                        </div>
                      )
                    )}

                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                      <p className="text-sm text-amber-900">
                        A contratação está confirmada, mas não há dados financeiros registrados.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </section>
          )}


          {/* OBSERVAÇÕES */}

          <section className="rounded-xl border bg-card">
            <div className="border-b px-6 py-5">
              <h2 className="text-lg font-semibold">
                Observações
              </h2>
            </div>

            <div className="p-6">
              <p className="whitespace-pre-wrap text-sm leading-6">
                {diligencia
                  .observacoes ||
                  "Nenhuma observação registrada."}
              </p>
            </div>
          </section>

        </div>


        {/* COLUNA LATERAL */}

        <div className="space-y-6">

          {/* TRATAMENTO */}

          <section className="rounded-xl border bg-card">
            <div className="border-b px-6 py-5">
              <h2 className="text-lg font-semibold">
                Tratamento
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Situação operacional atual da diligência.
              </p>
            </div>

            <div className="space-y-5 p-6">
              <LinhaTratamento
                titulo="Contratação"
                valor={
                  textoContratacao
                }
                situacao={
                  situacaoContratacao
                }
              />

              <LinhaTratamento
                titulo="Preposto"
                valor={
                  textoPreposto
                }
                situacao={
                  situacaoPreposto
                }
              />

              <LinhaTratamento
                titulo="Testemunhas"
                valor={
                  textoTestemunhas
                }
                situacao={
                  situacaoTestemunhas
                }
              />

              <LinhaTratamento
                titulo="Orientações"
                valor={
                  textoOrientacoes
                }
                situacao={
                  situacaoOrientacoes
                }
              />
            </div>
          </section>


          {/* RESUMO OPERACIONAL */}

          <section className="rounded-xl border bg-card">
            <div className="border-b px-6 py-5">
              <h2 className="text-lg font-semibold">
                Resumo operacional
              </h2>
            </div>

            <div className="space-y-4 p-6 text-sm">

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  Status
                </span>

                <strong>
                  {nomeStatus(
                    diligencia.status
                  )}
                </strong>
              </div>


              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  Origem
                </span>

                <strong className="text-right">
                  {nomeOrigem(
                    diligencia.origem
                  )}
                </strong>
              </div>


              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  Advogado
                </span>

                <strong>
                  {advogado
                    ? "Vinculado"
                    : "Sem vínculo"}
                </strong>
              </div>


              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  Contratação
                </span>

                <strong>
                  {
                    textoContratacao
                  }
                </strong>
              </div>


              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  Preposto
                </span>

                <strong className="text-right">
                  {
                    textoPreposto
                  }
                </strong>
              </div>


              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  Testemunhas
                </span>

                <strong className="text-right">
                  {
                    textoTestemunhas
                  }
                </strong>
              </div>


              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  Orientações
                </span>

                <strong>
                  {
                    textoOrientacoes
                  }
                </strong>
              </div>


              {diligencia.status ===
                "ativa" && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      Pendências
                    </span>

                    <strong
                      className={
                        pendencias.length ===
                        0
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }
                    >
                      {
                        pendencias.length
                      }
                    </strong>
                  </div>
                </div>
              )}

            </div>
          </section>


          {/* CONTRATAÇÃO DESNECESSÁRIA */}

          {contratacaoStatus ===
            "desnecessaria" && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

                <div>
                  <p className="font-semibold text-emerald-900">
                    Contratação resolvida
                  </p>

                  <p className="mt-1 text-sm text-emerald-800">
                    Foi definido que não há necessidade de contratação externa para esta diligência.
                  </p>
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
    </main>
  );
}