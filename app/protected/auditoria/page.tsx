import Link from "next/link";

import { redirect } from "next/navigation";

import {
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Filter,
  History,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const instant = false;

/* =====================================================
   TIPOS
===================================================== */

type SearchParamsAuditoria = {
  data_inicio?: string | string[];
  data_fim?: string | string[];

  usuario?: string | string[];
  acao?: string | string[];
  modulo?: string | string[];
  busca?: string | string[];

  pagina?: string | string[];
};

type AuditoriaRegistro = {
  id: string;

  empresa_id: string;
  usuario_id: string | null;

  usuario_nome_snapshot: string | null;
  usuario_email_snapshot: string | null;
  usuario_papel_snapshot: string | null;

  empresa_nome_snapshot: string | null;

  acao: string;
  entidade_tipo: string;
  entidade_id: string | null;

  dados_anteriores: unknown;
  dados_novos: unknown;
  contexto: unknown;

  criado_em: string;

  total_registros:
    | number
    | string;
};

type DetalheCampo = {
  chave: string;
  rotulo: string;
  valor: string;
};

type AlteracaoCampo = {
  chave: string;
  rotulo: string;
  anterior: string;
  novo: string;
};

/* =====================================================
   CONSTANTES
===================================================== */

const REGISTROS_POR_PAGINA = 30;

const CHAVES_SENSIVEIS =
  /(^|_)(cpf|senha|password|token|access_token|refresh_token|authorization|secret|service_role|api_key|apikey)($|_)/i;

const CAMPOS_OCULTOS =
  new Set([
    "id",
    "empresa_id",
    "usuario_id",

    "criada_por",
    "atualizada_por",
    "excluida_por",
    "cancelada_por",
    "desfecho_por",

    "financeiro_liberado_por",

    "contratacao_confirmada_por",
    "orientacoes_encaminhadas_por",

    "diligencia_origem_id",

    "confirmacao_alerta",
  ]);

const CAMPOS_MOSTRAR_MESMO_NULOS =
  new Set([
    "correspondente_id",
    "necessita_preposto",
    "preposto_id",
    "testemunhas_status",
    "contratacao_status",
    "orientacoes_encaminhadas",
  ]);

const ROTULOS_CAMPOS:
  Record<string, string> = {
  tipo_diligencia:
    "Tipo da diligência",

  modalidade:
    "Modalidade",

  numero_processo:
    "Número do processo",

  parte_autora:
    "Parte autora",

  parte_re:
    "Parte ré",

  data_diligencia:
    "Data da diligência",

  horario:
    "Horário",

  vara:
    "Vara / unidade",

  comarca:
    "Comarca / cidade",

  uf:
    "UF",

  local:
    "Local",

  origem:
    "Origem",

  status:
    "Status",

  correspondente_id:
    "Advogado / correspondente",

  necessita_preposto:
    "Necessita de preposto",

  preposto_id:
    "Preposto",

  testemunhas_status:
    "Testemunhas",

  testemunhas_confirmadas:
    "Testemunhas confirmadas",

  contratacao_status:
    "Contratação",

  contratacao_tipo:
    "Tipo de contratação",

  contratacao_confirmada:
    "Contratação confirmada",

  orientacoes_encaminhadas:
    "Orientações encaminhadas",

  observacoes:
    "Observações",

  resultado_diligencia:
    "Resultado da diligência",

  financeiro_status:
    "Situação financeira",

  financeiro_liberado_em:
    "Liberada ao financeiro em",

  desfecho_em:
    "Desfecho registrado em",

  desfecho_observacoes:
    "Observações do desfecho",

  cancelada_em:
    "Cancelada em",

  excluida_em:
    "Excluída em",

  criada_em:
    "Criada em",

  atualizada_em:
    "Atualizada em",

  arquivo:
    "Arquivo",

  linha_excel:
    "Linha da planilha",

  origem_importacao:
    "Origem da importação",

  regra:
    "Regra verificada",

  motivo:
    "Motivo",

  resultado:
    "Resultado",

  quantidade_encontrada:
    "Ocorrências encontradas",

  quantidade_conflitos:
    "Conflitos encontrados",

  confirmado:
    "Confirmação",

  financeiro:
    "Direcionamento financeiro",

  financeiro_status_contexto:
    "Situação financeira",

  sera_criada_continuidade:
    "Nova diligência de continuidade",

  data_anterior:
    "Data anterior",

  horario_anterior:
    "Horário anterior",

  nova_data:
    "Nova data",

  novo_horario:
    "Novo horário",
};

const TITULOS_ACOES:
  Record<string, string> = {
  DILIGENCIA_CRIADO:
    "Diligência cadastrada",

  DILIGENCIA_CRIADA:
    "Diligência cadastrada",

  DILIGENCIA_CRIADA_COM_ALERTA_CONFIRMADO:
    "Diligência cadastrada após confirmação de alerta",

  DILIGENCIA_CADASTRO_TENTADO:
    "Tentativa de cadastro de diligência",

  DILIGENCIA_ATUALIZADO:
    "Diligência alterada",

  DILIGENCIA_EDITADA:
    "Diligência alterada",

  DILIGENCIA_EXCLUIDO:
    "Diligência excluída",

  DILIGENCIA_CONCLUIDA:
    "Diligência concluída",

  DILIGENCIA_REAGENDADA:
    "Diligência reagendada",

  ALERTA_POSSIVEL_DUPLICIDADE_APRESENTADO:
    "Alerta de possível duplicidade apresentado",

  ALERTA_PROCESSO_EXISTENTE_APRESENTADO:
    "Alerta de processo existente apresentado",

  ALERTA_DUPLICIDADE_E_PROCESSO_EXISTENTE_APRESENTADO:
    "Alertas de duplicidade apresentados",

  ALERTA_CONFLITO_AGENDA_APRESENTADO:
    "Alerta de conflito de agenda apresentado",

  USUARIO_OPTOU_POR_REVISAR:
    "Usuário optou por revisar os dados",

  USUARIO_CONFIRMOU_PROCESSO_EXISTENTE:
    "Usuário confirmou processo existente",

  USUARIO_CONFIRMOU_POSSIVEL_DUPLICIDADE:
    "Usuário confirmou possível duplicidade",

  USUARIO_CONFIRMOU_DUPLICIDADE_E_PROCESSO_EXISTENTE:
    "Usuário confirmou os alertas apresentados",

  USUARIO_CONFIRMOU_CONFLITO_AGENDA:
    "Usuário confirmou conflito de agenda",

  IMPORTACAO_LINHA_CORRIGIDA:
    "Linha da importação corrigida",

  IMPORTACAO_LINHA_DESCARTADA:
    "Linha da importação descartada",

  IMPORTACAO_LINHA_RESTAURADA:
    "Linha da importação restaurada",

  IMPORTACAO_ALERTA_ARQUIVO_CONFIRMADO:
    "Alerta da planilha confirmado",

  IMPORTACAO_ALERTA_ARQUIVO_DESCONFIRMADO:
    "Confirmação de alerta retirada",

  IMPORTACAO_ALERTA_BANCO_IMPORTAR_CONFIRMADO:
    "Importação confirmada apesar do alerta",

  IMPORTACAO_ALERTA_BANCO_DESCARTADO:
    "Linha descartada após alerta do sistema",

  IMPORTACAO_LOTE_CONCLUIDO:
    "Importação de pauta concluída",

  CORRESPONDENTE_CRIADO:
    "Correspondente cadastrado",

  CORRESPONDENTE_ATUALIZADO:
    "Correspondente alterado",

  CORRESPONDENTE_EXCLUIDO:
    "Correspondente excluído",

  TESTEMUNHA_CRIADO:
    "Testemunha cadastrada",

  TESTEMUNHA_ATUALIZADO:
    "Testemunha alterada",

  CONTRATACAO_CRIADO:
    "Contratação registrada",

  CONTRATACAO_ATUALIZADO:
    "Contratação alterada",
};

/* =====================================================
   URL
===================================================== */

function primeiroValor(
  valor:
    | string
    | string[]
    | undefined
) {
  if (Array.isArray(valor)) {
    return valor[0] ?? "";
  }

  return valor ?? "";
}

function paginaValida(
  valor: string
) {
  const numero =
    Number.parseInt(
      valor,
      10
    );

  if (
    !Number.isFinite(numero) ||
    numero < 1
  ) {
    return 1;
  }

  return numero;
}

function montarUrlPagina(
  pagina: number,

  filtros: {
    dataInicio: string;
    dataFim: string;
    usuario: string;
    acao: string;
    modulo: string;
    busca: string;
  }
) {
  const params =
    new URLSearchParams();

  if (filtros.dataInicio) {
    params.set(
      "data_inicio",
      filtros.dataInicio
    );
  }

  if (filtros.dataFim) {
    params.set(
      "data_fim",
      filtros.dataFim
    );
  }

  if (filtros.usuario) {
    params.set(
      "usuario",
      filtros.usuario
    );
  }

  if (filtros.acao) {
    params.set(
      "acao",
      filtros.acao
    );
  }

  if (filtros.modulo) {
    params.set(
      "modulo",
      filtros.modulo
    );
  }

  if (filtros.busca) {
    params.set(
      "busca",
      filtros.busca
    );
  }

  if (pagina > 1) {
    params.set(
      "pagina",
      String(pagina)
    );
  }

  const query =
    params.toString();

  return query
    ? `/protected/auditoria?${query}`
    : "/protected/auditoria";
}

/* =====================================================
   OBJETOS
===================================================== */

function ehObjeto(
  valor: unknown
): valor is Record<
  string,
  unknown
> {
  return (
    typeof valor ===
      "object" &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

function protegerJson(
  valor: unknown
): unknown {
  if (
    valor === null ||
    valor === undefined
  ) {
    return valor;
  }

  if (Array.isArray(valor)) {
    return valor.map(
      protegerJson
    );
  }

  if (ehObjeto(valor)) {
    return Object.fromEntries(
      Object.entries(
        valor
      ).map(
        ([
          chave,
          conteudo,
        ]) => [
          chave,

          CHAVES_SENSIVEIS.test(
            chave
          )
            ? "[PROTEGIDO]"
            : protegerJson(
                conteudo
              ),
        ]
      )
    );
  }

  return valor;
}

/*
  Alguns eventos de importação
  armazenam os dados úteis dentro
  da propriedade "dados".

  Para o Master, mostramos o
  conteúdo operacional diretamente.
*/
function obterObjetoOperacional(
  valor: unknown
): Record<
  string,
  unknown
> {
  if (!ehObjeto(valor)) {
    return {};
  }

  if (
    ehObjeto(
      valor.dados
    )
  ) {
    return valor
      .dados;
  }

  return valor;
}

/* =====================================================
   FORMATAÇÕES
===================================================== */

function formatarProcesso(
  processo:
    string | null
) {
  if (!processo) {
    return null;
  }

  const numeros =
    processo.replace(
      /\D/g,
      ""
    );

  if (
    numeros.length !== 20
  ) {
    return processo;
  }

  return (
    `${numeros.slice(
      0,
      7
    )}-` +
    `${numeros.slice(
      7,
      9
    )}.` +
    `${numeros.slice(
      9,
      13
    )}.` +
    `${numeros.slice(
      13,
      14
    )}.` +
    `${numeros.slice(
      14,
      16
    )}.` +
    `${numeros.slice(
      16,
      20
    )}`
  );
}

function formatarDataISO(
  valor: string
) {
  const correspondencia =
    valor.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!correspondencia) {
    return valor;
  }

  return `${correspondencia[3]}/${correspondencia[2]}/${correspondencia[1]}`;
}

function formatarDataHora(
  valor: string
) {
  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Recife",

      day: "2-digit",
      month: "2-digit",
      year: "numeric",

      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  ).format(data);
}

function formatarHorario(
  valor: string
) {
  if (
    /^\d{2}:\d{2}/.test(
      valor
    )
  ) {
    return valor.slice(
      0,
      5
    );
  }

  return valor;
}

function formatarTitulo(
  valor:
    | string
    | null
    | undefined
) {
  if (!valor) {
    return "Não informado";
  }

  return valor
    .replace(
      /_/g,
      " "
    )
    .toLowerCase()
    .replace(
      /(^|\s)\S/g,
      (letra) =>
        letra.toUpperCase()
    );
}

function tituloAcao(
  acao: string
) {
  return (
    TITULOS_ACOES[
      acao
    ] ??
    formatarTitulo(
      acao
    )
  );
}

function nomeModulo(
  entidadeTipo: string
) {
  const nomes:
    Record<
      string,
      string
    > = {
    diligencia:
      "Diligência",

    correspondente:
      "Correspondente",

    testemunha:
      "Testemunha",

    contratacao:
      "Contratação",

    importacao_pauta:
      "Importação de pauta",

    membro_empresa:
      "Usuário",

    empresa:
      "Empresa",
  };

  return (
    nomes[
      entidadeTipo
    ] ??
    formatarTitulo(
      entidadeTipo
    )
  );
}

/* =====================================================
   VALORES LEGÍVEIS
===================================================== */

function participanteLegivel(
  valor: Record<
    string,
    unknown
  >
) {
  const nome =
    typeof valor.nome ===
      "string"
      ? valor.nome
      : "";

  const oab =
    typeof valor.oab_numero ===
      "string"
      ? valor.oab_numero
      : "";

  const uf =
    typeof valor.oab_uf ===
      "string"
      ? valor.oab_uf
      : "";

  if (
    nome &&
    oab &&
    uf
  ) {
    return `${nome} — OAB/${uf} ${oab}`;
  }

  if (nome) {
    return nome;
  }

  return "Profissional registrado";
}

function formatarValorCampo(
  chave: string,
  valor: unknown
): string {
  if (
    CHAVES_SENSIVEIS.test(
      chave
    )
  ) {
    return "[PROTEGIDO]";
  }

  if (
    chave ===
      "correspondente_id" ||
    chave ===
      "preposto_id"
  ) {
    return valor
      ? "Designado"
      : "Não designado";
  }

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    if (
      chave ===
        "necessita_preposto" ||
      chave ===
        "testemunhas_status" ||
      chave ===
        "contratacao_status"
    ) {
      return "Ainda não definido";
    }

    if (
      chave ===
      "financeiro_status"
    ) {
      return "Não direcionado";
    }

    return "Não informado";
  }

  if (
    typeof valor ===
    "boolean"
  ) {
    return valor
      ? "Sim"
      : "Não";
  }

  if (
    chave ===
      "numero_processo" &&
    typeof valor ===
      "string"
  ) {
    return (
      formatarProcesso(
        valor
      ) ??
      valor
    );
  }

  if (
    chave ===
      "data_diligencia" ||
    chave ===
      "data_anterior" ||
    chave ===
      "nova_data"
  ) {
    return typeof valor ===
      "string"
      ? formatarDataISO(
          valor
        )
      : String(valor);
  }

  if (
    chave ===
      "horario" ||
    chave ===
      "horario_anterior" ||
    chave ===
      "novo_horario"
  ) {
    return typeof valor ===
      "string"
      ? formatarHorario(
          valor
        )
      : String(valor);
  }

  if (
    chave.endsWith(
      "_em"
    ) &&
    typeof valor ===
      "string"
  ) {
    if (
      valor.includes(
        "T"
      )
    ) {
      return formatarDataHora(
        valor
      );
    }

    return formatarDataISO(
      valor
    );
  }

  if (
    typeof valor ===
      "number" &&
    chave.includes(
      "valor"
    )
  ) {
    return new Intl.NumberFormat(
      "pt-BR",
      {
        style:
          "currency",
        currency:
          "BRL",
      }
    ).format(valor);
  }

  if (
    typeof valor ===
    "string"
  ) {
    const traducoes:
      Record<
        string,
        string
      > = {
      presencial:
        "Presencial",

      virtual:
        "Virtual",

      ativa:
        "Ativa",

      concluida:
        "Concluída",

      cancelada:
        "Cancelada",

      importacao:
        "Importação de pauta",

      manual:
        "Cadastro manual",

      confirmada:
        "Confirmada",

      desnecessaria:
        "Desnecessária",

      confirmadas:
        "Confirmadas",

      finalidade_atingida:
        "Finalidade atingida",

      finalidade_nao_atingida:
        "Finalidade não atingida",

      liberado_para_pagamento:
        "Liberado para pagamento",

      nao_devido:
        "Pagamento não devido",

      pendente:
        "Pendente",

      pago:
        "Pago",

      NAO_DIRECIONADO:
        "Não direcionado",
    };

    return (
      traducoes[
        valor
      ] ??
      valor
    );
  }

  if (
    Array.isArray(valor)
  ) {
    if (
      valor.length ===
      0
    ) {
      return "Nenhuma ocorrência";
    }

    const nomes =
      valor
        .filter(
          ehObjeto
        )
        .map(
          (
            item
          ) =>
            typeof item
              .nome ===
              "string"
              ? item
                  .nome
              : null
        )
        .filter(
          (
            nome
          ): nome is string =>
            Boolean(
              nome
            )
        );

    if (
      nomes.length ===
      valor.length
    ) {
      return nomes.join(
        ", "
      );
    }

    return `${valor.length} ${
      valor.length === 1
        ? "ocorrência registrada"
        : "ocorrências registradas"
    }`;
  }

  if (ehObjeto(valor)) {
    if (
      typeof valor.nome ===
      "string"
    ) {
      return participanteLegivel(
        valor
      );
    }

    if (
      valor.confirmado ===
      true
    ) {
      return "Confirmado pelo usuário";
    }

    return "Informação registrada";
  }

  return String(
    valor
  );
}

/* =====================================================
   CAMPOS VISÍVEIS
===================================================== */

function campoOculto(
  chave: string
) {
  if (
    CHAVES_SENSIVEIS.test(
      chave
    )
  ) {
    return true;
  }

  return CAMPOS_OCULTOS.has(
    chave
  );
}

function rotuloCampo(
  chave: string
) {
  return (
    ROTULOS_CAMPOS[
      chave
    ] ??
    formatarTitulo(
      chave
    )
  );
}

function detalhesObjeto(
  valor: unknown
): DetalheCampo[] {
  const objeto =
    obterObjetoOperacional(
      protegerJson(
        valor
      )
    );

  return Object.entries(
    objeto
  )
    .filter(
      ([
        chave,
        conteudo,
      ]) => {
        if (
          campoOculto(
            chave
          )
        ) {
          return false;
        }

        if (
          conteudo ===
            null ||
          conteudo ===
            undefined ||
          conteudo ===
            ""
        ) {
          return CAMPOS_MOSTRAR_MESMO_NULOS.has(
            chave
          );
        }

        return true;
      }
    )
    .map(
      ([
        chave,
        conteudo,
      ]) => ({
        chave,

        rotulo:
          rotuloCampo(
            chave
          ),

        valor:
          formatarValorCampo(
            chave,
            conteudo
          ),
      })
    );
}

/* =====================================================
   ALTERAÇÕES ANTES / DEPOIS
===================================================== */

function assinaturaValor(
  valor: unknown
) {
  return JSON.stringify(
    protegerJson(
      valor
    )
  );
}

function calcularAlteracoes(
  anterior: unknown,
  novo: unknown
): AlteracaoCampo[] {
  const antes =
    obterObjetoOperacional(
      protegerJson(
        anterior
      )
    );

  const depois =
    obterObjetoOperacional(
      protegerJson(
        novo
      )
    );

  const chaves =
    new Set([
      ...Object.keys(
        antes
      ),

      ...Object.keys(
        depois
      ),
    ]);

  return Array.from(
    chaves
  )
    .filter(
      (chave) => {
        if (
          campoOculto(
            chave
          )
        ) {
          return false;
        }

        return (
          assinaturaValor(
            antes[chave]
          ) !==
          assinaturaValor(
            depois[chave]
          )
        );
      }
    )
    .map(
      (chave) => ({
        chave,

        rotulo:
          rotuloCampo(
            chave
          ),

        anterior:
          formatarValorCampo(
            chave,
            antes[
              chave
            ]
          ),

        novo:
          formatarValorCampo(
            chave,
            depois[
              chave
            ]
          ),
      })
    );
}

/* =====================================================
   CONTEXTO OPERACIONAL
===================================================== */

const CONTEXTO_OCULTO =
  new Set([
    "usuario_id",

    "diligencia_id",

    "diligencia_ids",

    "participante_id",

    "diligencias_apresentadas",

    "diligencias_encontradas",

    "conflitos",

    "conflitos_agenda",

    "conflitos_confirmados",

    "possivel_duplicidade",
  ]);

function detalhesContexto(
  valor: unknown
): DetalheCampo[] {
  if (!ehObjeto(valor)) {
    return [];
  }

  const protegido =
    protegerJson(
      valor
    );

  if (
    !ehObjeto(
      protegido
    )
  ) {
    return [];
  }

  return Object.entries(
    protegido
  )
    .filter(
      ([
        chave,
        conteudo,
      ]) => {
        if (
          CONTEXTO_OCULTO.has(
            chave
          )
        ) {
          return false;
        }

        if (
          campoOculto(
            chave
          )
        ) {
          return false;
        }

        return (
          conteudo !==
            null &&
          conteudo !==
            undefined &&
          conteudo !==
            ""
        );
      }
    )
    .map(
      ([
        chave,
        conteudo,
      ]) => ({
        chave,

        rotulo:
          rotuloCampo(
            chave
          ),

        valor:
          formatarValorCampo(
            chave,
            conteudo
          ),
      })
    );
}

/* =====================================================
   BUSCA DE PROCESSO / METADADOS
===================================================== */

function procurarValor(
  valor: unknown,
  chaves:
    Set<string>
): string | null {
  if (
    valor === null ||
    valor === undefined
  ) {
    return null;
  }

  if (Array.isArray(valor)) {
    for (
      const item of valor
    ) {
      const encontrado =
        procurarValor(
          item,
          chaves
        );

      if (encontrado) {
        return encontrado;
      }
    }

    return null;
  }

  if (!ehObjeto(valor)) {
    return null;
  }

  for (
    const [
      chave,
      conteudo,
    ] of Object.entries(
      valor
    )
  ) {
    if (
      chaves.has(
        chave
      ) &&
      (
        typeof conteudo ===
          "string" ||
        typeof conteudo ===
          "number"
      )
    ) {
      return String(
        conteudo
      );
    }
  }

  for (
    const conteudo of
      Object.values(
        valor
      )
  ) {
    const encontrado =
      procurarValor(
        conteudo,
        chaves
      );

    if (encontrado) {
      return encontrado;
    }
  }

  return null;
}

/* =====================================================
   COMPONENTES VISUAIS
===================================================== */

function ListaDados({
  titulo,
  dados,
}: {
  titulo: string;
  dados: DetalheCampo[];
}) {
  if (
    dados.length ===
    0
  ) {
    return null;
  }

  return (
    <section>
      <h4 className="text-sm font-semibold">
        {titulo}
      </h4>

      <div className="mt-3 overflow-hidden rounded-lg border">
        {dados.map(
          (
            campo,
            indice
          ) => (
            <div
              key={`${campo.chave}-${indice}`}
              className="grid gap-1 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[220px_1fr] sm:gap-4"
            >
              <p className="text-sm text-muted-foreground">
                {
                  campo.rotulo
                }
              </p>

              <p className="break-words text-sm font-medium">
                {
                  campo.valor
                }
              </p>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function ListaAlteracoes({
  alteracoes,
}: {
  alteracoes:
    AlteracaoCampo[];
}) {
  if (
    alteracoes.length ===
    0
  ) {
    return null;
  }

  return (
    <section>
      <h4 className="text-sm font-semibold">
        Alterações realizadas
      </h4>

      <div className="mt-3 overflow-hidden rounded-lg border">
        {alteracoes.map(
          (
            alteracao,
            indice
          ) => (
            <div
              key={`${alteracao.chave}-${indice}`}
              className="border-b px-4 py-4 last:border-b-0"
            >
              <p className="text-sm font-semibold">
                {
                  alteracao.rotulo
                }
              </p>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-muted/40 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Antes
                  </p>

                  <p className="mt-1 break-words text-sm">
                    {
                      alteracao.anterior
                    }
                  </p>
                </div>

                <div className="rounded-lg bg-muted/40 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Depois
                  </p>

                  <p className="mt-1 break-words text-sm font-medium">
                    {
                      alteracao.novo
                    }
                  </p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

/* =====================================================
   PÁGINA
===================================================== */

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams:
    Promise<SearchParamsAuditoria>;
}) {
  const parametros =
    await searchParams;

  /* ===================================================
     FILTROS
  =================================================== */

  const dataInicio =
    primeiroValor(
      parametros.data_inicio
    ).trim();

  const dataFim =
    primeiroValor(
      parametros.data_fim
    ).trim();

  const usuario =
    primeiroValor(
      parametros.usuario
    ).trim();

  const acao =
    primeiroValor(
      parametros.acao
    ).trim();

  const modulo =
    primeiroValor(
      parametros.modulo
    ).trim();

  const busca =
    primeiroValor(
      parametros.busca
    ).trim();

  const pagina =
    paginaValida(
      primeiroValor(
        parametros.pagina
      )
    );

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
    redirect(
      "/auth/login"
    );
  }

  const usuarioId =
    authData
      .claims
      .sub;

  /* ===================================================
     MASTER
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
        `
          empresa_id,
          papel,
          ativo
        `
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

  if (erroMembro) {
    throw new Error(
      `Erro ao validar acesso à auditoria: ${erroMembro.message}`
    );
  }

  if (
    !membro ||
    membro.papel !==
      "master"
  ) {
    redirect(
      "/protected/acesso-negado"
    );
  }

  /* ===================================================
     EMPRESA
  =================================================== */

  const {
    data:
      empresa,

    error:
      erroEmpresa,
  } =
    await supabase
      .from(
        "empresas"
      )
      .select(
        `
          id,
          nome,
          status_acesso
        `
      )
      .eq(
        "id",
        membro
          .empresa_id
      )
      .maybeSingle();

  if (
    erroEmpresa ||
    !empresa
  ) {
    throw new Error(
      `Erro ao identificar empresa: ${
        erroEmpresa
          ?.message ??
        "Empresa não encontrada."
      }`
    );
  }

  if (
    empresa
      .status_acesso !==
    "ativo"
  ) {
    redirect(
      "/protected/acesso-negado"
    );
  }

  /* ===================================================
     AUDITORIA
  =================================================== */

  const offset =
    (
      pagina -
      1
    ) *
    REGISTROS_POR_PAGINA;

  const {
    data:
      dadosAuditoria,

    error:
      erroAuditoria,
  } =
    await (
      supabase as any
    ).rpc(
      "listar_auditoria_master",
      {
        p_data_inicio:
          dataInicio ||
          null,

        p_data_fim:
          dataFim ||
          null,

        p_usuario:
          usuario ||
          null,

        p_acao:
          acao ||
          null,

        p_modulo:
          modulo ||
          null,

        p_busca:
          busca ||
          null,

        p_limite:
          REGISTROS_POR_PAGINA,

        p_offset:
          offset,
      }
    );

  if (erroAuditoria) {
    throw new Error(
      `Não foi possível carregar a auditoria: ${erroAuditoria.message}`
    );
  }

  const registros =
    (
      dadosAuditoria ??
      []
    ) as AuditoriaRegistro[];

  const totalRegistros =
    registros.length >
    0
      ? Number(
          registros[0]
            .total_registros ??
            0
        )
      : 0;

  const totalPaginas =
    Math.max(
      1,

      Math.ceil(
        totalRegistros /
          REGISTROS_POR_PAGINA
      )
    );

  const filtros = {
    dataInicio,
    dataFim,
    usuario,
    acao,
    modulo,
    busca,
  };

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <main className="w-full">
      {/* CABEÇALHO */}

      <section className="mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />

              Área exclusiva do Master
            </div>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Auditoria
            </h1>

            <p className="mt-2 max-w-3xl text-muted-foreground">
              Consulte o histórico
              de ações, alterações,
              alertas e decisões
              registradas no NOTE
              LITIS para{" "}
              <strong>
                {empresa.nome}
              </strong>
              .
            </p>
          </div>

          <div className="rounded-xl border bg-card px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Registros encontrados
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {totalRegistros}
            </p>
          </div>
        </div>
      </section>

      {/* FILTROS */}

      <section className="mb-6 rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />

            <h2 className="font-semibold">
              Filtros
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Refine o histórico por
            período, usuário, ação,
            módulo, processo ou
            identificador.
          </p>
        </div>

        <form
          action="/protected/auditoria"
          method="get"
          className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4"
        >
          <div>
            <label
              htmlFor="data_inicio"
              className="text-sm font-medium"
            >
              Data inicial
            </label>

            <input
              id="data_inicio"
              name="data_inicio"
              type="date"
              defaultValue={
                dataInicio
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="data_fim"
              className="text-sm font-medium"
            >
              Data final
            </label>

            <input
              id="data_fim"
              name="data_fim"
              type="date"
              defaultValue={
                dataFim
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="usuario"
              className="text-sm font-medium"
            >
              Usuário
            </label>

            <input
              id="usuario"
              name="usuario"
              type="text"
              defaultValue={
                usuario
              }
              placeholder="Nome ou e-mail"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="modulo"
              className="text-sm font-medium"
            >
              Módulo
            </label>

            <select
              id="modulo"
              name="modulo"
              defaultValue={
                modulo
              }
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
            >
              <option value="">
                Todos
              </option>

              <option value="diligencia">
                Diligências
              </option>

              <option value="correspondente">
                Correspondentes
              </option>

              <option value="testemunha">
                Testemunhas
              </option>

              <option value="contratacao">
                Contratações
              </option>

              <option value="importacao_pauta">
                Importação de pauta
              </option>

              <option value="membro_empresa">
                Usuários
              </option>

              <option value="empresa">
                Empresa
              </option>
            </select>
          </div>

          <div className="md:col-span-1 xl:col-span-2">
            <label
              htmlFor="acao"
              className="text-sm font-medium"
            >
              Ação
            </label>

            <input
              id="acao"
              name="acao"
              type="text"
              defaultValue={
                acao
              }
              placeholder="Ex.: cadastrada, alterada, concluída..."
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div className="md:col-span-1 xl:col-span-2">
            <label
              htmlFor="busca"
              className="text-sm font-medium"
            >
              Processo ou identificador
            </label>

            <div className="relative mt-2">
              <FileSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <input
                id="busca"
                name="busca"
                type="text"
                defaultValue={
                  busca
                }
                placeholder="Número do processo, arquivo..."
                className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-4">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Filter className="h-4 w-4" />

              Aplicar filtros
            </button>

            <Link
              href="/protected/auditoria"
              className="inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Limpar filtros
            </Link>
          </div>
        </form>
      </section>

      {/* HISTÓRICO */}

      <section className="rounded-xl border bg-card">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />

            <h2 className="text-lg font-semibold">
              Histórico de auditoria
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Histórico somente para
            consulta. Os registros
            não podem ser alterados
            por esta área.
          </p>
        </div>

        {registros.length ===
        0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full bg-muted p-4">
              <History className="h-7 w-7 text-muted-foreground" />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              Nenhum registro encontrado
            </h3>

            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Não existem eventos
              correspondentes aos
              filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {registros.map(
              (registro) => {
                const processo =
                  formatarProcesso(
                    procurarValor(
                      registro
                        .dados_novos,

                      new Set([
                        "numero_processo",
                      ])
                    ) ??
                      procurarValor(
                        registro
                          .dados_anteriores,

                        new Set([
                          "numero_processo",
                        ])
                      ) ??
                      procurarValor(
                        registro
                          .contexto,

                        new Set([
                          "numero_processo",
                        ])
                      )
                  );

                const arquivo =
                  procurarValor(
                    registro.contexto,

                    new Set([
                      "arquivo",
                    ])
                  );

                const linhaExcel =
                  procurarValor(
                    registro.contexto,

                    new Set([
                      "linha_excel",
                    ])
                  );

                const usuarioRegistro =
                  registro
                    .usuario_nome_snapshot ||
                  registro
                    .usuario_email_snapshot ||
                  "Sistema";

                const alteracoes =
                  calcularAlteracoes(
                    registro
                      .dados_anteriores,

                    registro
                      .dados_novos
                  );

                const dadosNovos =
                  detalhesObjeto(
                    registro
                      .dados_novos
                  );

                const contexto =
                  detalhesContexto(
                    registro.contexto
                  );

                const temAnterior =
                  ehObjeto(
                    registro
                      .dados_anteriores
                  );

                const mostrarAlteracoes =
                  temAnterior &&
                  alteracoes.length >
                    0;

                const mostrarDados =
                  !mostrarAlteracoes &&
                  dadosNovos.length >
                    0;

                const possuiDetalhes =
                  mostrarAlteracoes ||
                  mostrarDados ||
                  contexto.length >
                    0;

                return (
                  <article
                    key={
                      registro.id
                    }
                    className="px-6 py-5"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-[#0b1f3a]/10 px-2.5 py-1 text-xs font-semibold text-[#0b1f3a]">
                            {tituloAcao(
                              registro
                                .acao
                            )}
                          </span>

                          <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                            {nomeModulo(
                              registro
                                .entidade_tipo
                            )}
                          </span>
                        </div>

                        <div className="mt-4 flex items-start gap-2">
                          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                          <div>
                            <p className="text-sm font-medium">
                              {
                                usuarioRegistro
                              }
                            </p>

                            {registro
                              .usuario_email_snapshot &&
                              registro
                                .usuario_email_snapshot !==
                                usuarioRegistro && (
                                <p className="text-xs text-muted-foreground">
                                  {
                                    registro
                                      .usuario_email_snapshot
                                  }
                                </p>
                              )}

                            {registro
                              .usuario_papel_snapshot && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Perfil:{" "}
                                {formatarTitulo(
                                  registro
                                    .usuario_papel_snapshot
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          {processo && (
                            <p>
                              <span className="text-muted-foreground">
                                Processo:{" "}
                              </span>

                              <strong>
                                {
                                  processo
                                }
                              </strong>
                            </p>
                          )}

                          {arquivo && (
                            <p>
                              <span className="text-muted-foreground">
                                Arquivo:{" "}
                              </span>

                              {
                                arquivo
                              }
                            </p>
                          )}

                          {linhaExcel && (
                            <p>
                              <span className="text-muted-foreground">
                                Linha:{" "}
                              </span>

                              {
                                linhaExcel
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <p className="text-sm font-medium">
                          {formatarDataHora(
                            registro
                              .criado_em
                          )}
                        </p>

                        <p className="mt-1 text-right text-xs text-muted-foreground">
                          Horário de Recife
                        </p>
                      </div>
                    </div>

                    {possuiDetalhes && (
                      <details className="mt-5 rounded-lg border">
                        <summary className="cursor-pointer px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/40">
                          Ver detalhes
                        </summary>

                        <div className="space-y-6 border-t p-5">
                          {mostrarAlteracoes && (
                            <ListaAlteracoes
                              alteracoes={
                                alteracoes
                              }
                            />
                          )}

                          {mostrarDados && (
                            <ListaDados
                              titulo="Dados registrados"
                              dados={
                                dadosNovos
                              }
                            />
                          )}

                          <ListaDados
                            titulo="Informações da operação"
                            dados={
                              contexto
                            }
                          />
                        </div>
                      </details>
                    )}
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* PAGINAÇÃO */}

      {totalRegistros >
        0 && (
        <section className="mt-6 flex flex-col gap-3 rounded-xl border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Página{" "}
            <strong>
              {pagina}
            </strong>{" "}
            de{" "}
            <strong>
              {totalPaginas}
            </strong>
            {" • "}
            {totalRegistros}{" "}
            {totalRegistros ===
            1
              ? "registro"
              : "registros"}
          </p>

          <div className="flex items-center gap-2">
            {pagina > 1 ? (
              <Link
                href={montarUrlPagina(
                  pagina - 1,
                  filtros
                )}
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />

                Anterior
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium opacity-40">
                <ChevronLeft className="h-4 w-4" />

                Anterior
              </span>
            )}

            {pagina <
            totalPaginas ? (
              <Link
                href={montarUrlPagina(
                  pagina + 1,
                  filtros
                )}
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Próxima

                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium opacity-40">
                Próxima

                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </section>
      )}
    </main>
  );
}