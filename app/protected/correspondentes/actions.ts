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

/* =====================================================
   TIPOS
===================================================== */

type TipoCorrespondente =
  | "advogado"
  | "preposto";

type TipoParticipante =
  | TipoCorrespondente
  | "testemunha";

type CorrespondenteExistente = {
  id: string;
  ativo: boolean;
};

/* =====================================================
   NORMALIZAÇÃO
===================================================== */

function lerCampo(
  formData: FormData,
  campo: string
) {
  const valor =
    formData.get(campo);

  return typeof valor ===
    "string"
      ? valor
      : "";
}

function normalizarTexto(
  valor: string
) {
  return valor
    .trim()
    .replace(
      /\s+/g,
      " "
    )
    .toUpperCase();
}

function somenteNumeros(
  valor: string
) {
  return valor.replace(
    /\D/g,
    ""
  );
}

function normalizarUF(
  valor: string
) {
  return valor
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z]/g,
      ""
    )
    .slice(
      0,
      2
    );
}

function normalizarTipo(
  valor: string
): TipoCorrespondente | null {
  if (
    valor === "advogado" ||
    valor === "preposto"
  ) {
    return valor;
  }

  return null;
}

function normalizarTipoParticipante(
  valor: string
): TipoParticipante | null {
  if (
    valor === "advogado" ||
    valor === "preposto" ||
    valor === "testemunha"
  ) {
    return valor;
  }

  return null;
}

function validarCPF(
  cpf: string
) {
  return (
    somenteNumeros(
      cpf
    ).length ===
    11
  );
}

/* =====================================================
   CONTEXTO
===================================================== */

async function obterContextoUsuario() {
  const supabase:
    any =
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
      .sub as string;

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
    throw new Error(
      "Não foi possível identificar a empresa do usuário."
    );
  }

  return {
    supabase,
    usuarioId,

    empresaId:
      membro
        .empresa_id as string,
  };
}

/* =====================================================
   REDIRECIONAMENTO
===================================================== */

function redirecionarComErro(
  caminho: string,
  mensagem: string
): never {
  redirect(
    `${caminho}?erro=${encodeURIComponent(
      mensagem
    )}`
  );
}

function redirecionarComSucesso(
  mensagem: string
): never {
  redirect(
    `/protected/correspondentes?mensagem=${encodeURIComponent(
      mensagem
    )}`
  );
}

/* =====================================================
   DUPLICIDADE
===================================================== */

async function buscarCorrespondenteExistente(
  supabase: any,
  empresaId: string,
  tipo:
    TipoCorrespondente,

  identificacao: {
    oabNumero?: string;
    oabUf?: string;
    cpf?: string;
  },

  ignorarId?:
    string
): Promise<
  CorrespondenteExistente | null
> {
  let consulta =
    supabase
      .from(
        "correspondentes"
      )
      .select(
        `
          id,
          ativo
        `
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        "tipo",
        tipo
      )
      .is(
        "excluido_em",
        null
      );

  if (
    ignorarId
  ) {
    consulta =
      consulta.neq(
        "id",
        ignorarId
      );
  }

  if (
    tipo ===
    "advogado"
  ) {
    consulta =
      consulta
        .eq(
          "oab_numero",
          identificacao
            .oabNumero
        )
        .eq(
          "oab_uf",
          identificacao
            .oabUf
        );
  } else {
    consulta =
      consulta.eq(
        "cpf",
        identificacao
          .cpf
      );
  }

  const {
    data,
    error,
  } =
    await consulta
      .limit(1)
      .maybeSingle();

  if (error) {
    throw new Error(
      `Erro ao verificar cadastro existente: ${error.message}`
    );
  }

  return (
    data ??
    null
  ) as
    CorrespondenteExistente | null;
}

/* =====================================================
   REVALIDAÇÃO
===================================================== */

function revalidarCorrespondentes() {
  revalidatePath(
    "/protected/correspondentes"
  );

  revalidatePath(
    "/protected/diligencias"
  );

  revalidatePath(
    "/protected/diligencias/nova"
  );

  revalidatePath(
    "/protected/pendencias"
  );
}

/* =====================================================
   CADASTRO
===================================================== */

export async function cadastrarCorrespondente(
  formData: FormData
) {
  const {
    supabase,
    usuarioId,
    empresaId,
  } =
    await obterContextoUsuario();

  const tipo =
    normalizarTipo(
      lerCampo(
        formData,
        "tipo"
      )
    );

  const nome =
    normalizarTexto(
      lerCampo(
        formData,
        "nome"
      )
    );

  if (
    !tipo
  ) {
    redirecionarComErro(
      "/protected/correspondentes/novo",
      "Tipo de correspondente inválido."
    );
  }

  if (
    !nome
  ) {
    redirecionarComErro(
      "/protected/correspondentes/novo",
      "Informe o nome do profissional."
    );
  }

  let oabNumero:
    string | null =
    null;

  let oabUf:
    string | null =
    null;

  let cpf:
    string | null =
    null;

  if (
    tipo ===
    "advogado"
  ) {
    oabNumero =
      somenteNumeros(
        lerCampo(
          formData,
          "oab_numero"
        )
      );

    oabUf =
      normalizarUF(
        lerCampo(
          formData,
          "oab_uf"
        )
      );

    if (
      !oabNumero
    ) {
      redirecionarComErro(
        "/protected/correspondentes/novo",
        "Informe o número da OAB."
      );
    }

    if (
      oabUf.length !==
      2
    ) {
      redirecionarComErro(
        "/protected/correspondentes/novo",
        "Informe a UF da OAB."
      );
    }
  }

  if (
    tipo ===
    "preposto"
  ) {
    cpf =
      somenteNumeros(
        lerCampo(
          formData,
          "cpf"
        )
      );

    if (
      !validarCPF(
        cpf
      )
    ) {
      redirecionarComErro(
        "/protected/correspondentes/novo",
        "Informe um CPF com 11 números."
      );
    }
  }

  const existente =
    await buscarCorrespondenteExistente(
      supabase,
      empresaId,
      tipo,
      {
        oabNumero:
          oabNumero ??
          undefined,

        oabUf:
          oabUf ??
          undefined,

        cpf:
          cpf ??
          undefined,
      }
    );

  if (
    existente
  ) {
    const complemento =
      existente.ativo
        ? "O cadastro está ativo."
        : "O cadastro está inativo e pode ser reativado na lista de correspondentes.";

    redirecionarComErro(
      "/protected/correspondentes/novo",
      `Já existe um profissional cadastrado com esta identificação. ${complemento}`
    );
  }

  const {
    error,
  } =
    await supabase
      .from(
        "correspondentes"
      )
      .insert({
        empresa_id:
          empresaId,

        tipo,

        nome,

        oab_numero:
          tipo ===
          "advogado"
            ? oabNumero
            : null,

        oab_uf:
          tipo ===
          "advogado"
            ? oabUf
            : null,

        cpf:
          tipo ===
          "preposto"
            ? cpf
            : null,

        ativo:
          true,

        criado_por:
          usuarioId,

        atualizado_por:
          usuarioId,
      });

  if (
    error?.code ===
    "23505"
  ) {
    redirecionarComErro(
      "/protected/correspondentes/novo",
      "Já existe um profissional cadastrado com esta identificação."
    );
  }

  if (error) {
    redirecionarComErro(
      "/protected/correspondentes/novo",
      `Erro ao cadastrar correspondente: ${error.message}`
    );
  }

  revalidarCorrespondentes();

  redirecionarComSucesso(
    tipo ===
    "advogado"
      ? "Advogado cadastrado com sucesso."
      : "Preposto cadastrado com sucesso."
  );
}

/* =====================================================
   EDIÇÃO
===================================================== */

export async function atualizarCorrespondente(
  formData: FormData
) {
  const {
    supabase,
    usuarioId,
    empresaId,
  } =
    await obterContextoUsuario();

  const id =
    lerCampo(
      formData,
      "id"
    ).trim();

  if (!id) {
    redirecionarComErro(
      "/protected/correspondentes",
      "Correspondente não identificado."
    );
  }

  const caminhoEdicao =
    `/protected/correspondentes/${id}/editar`;

  const {
    data:
      atual,

    error:
      erroAtual,
  } =
    await supabase
      .from(
        "correspondentes"
      )
      .select(
        `
          id,
          tipo
        `
      )
      .eq(
        "id",
        id
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .is(
        "excluido_em",
        null
      )
      .maybeSingle();

  if (
    erroAtual ||
    !atual
  ) {
    redirecionarComErro(
      "/protected/correspondentes",
      "O correspondente não foi encontrado."
    );
  }

  const tipo =
    normalizarTipo(
      atual.tipo
    );

  if (!tipo) {
    redirecionarComErro(
      caminhoEdicao,
      "Tipo de correspondente inválido."
    );
  }

  const nome =
    normalizarTexto(
      lerCampo(
        formData,
        "nome"
      )
    );

  if (!nome) {
    redirecionarComErro(
      caminhoEdicao,
      "Informe o nome do profissional."
    );
  }

  let oabNumero:
    string | null =
    null;

  let oabUf:
    string | null =
    null;

  let cpf:
    string | null =
    null;

  if (
    tipo ===
    "advogado"
  ) {
    oabNumero =
      somenteNumeros(
        lerCampo(
          formData,
          "oab_numero"
        )
      );

    oabUf =
      normalizarUF(
        lerCampo(
          formData,
          "oab_uf"
        )
      );

    if (!oabNumero) {
      redirecionarComErro(
        caminhoEdicao,
        "Informe o número da OAB."
      );
    }

    if (
      oabUf.length !==
      2
    ) {
      redirecionarComErro(
        caminhoEdicao,
        "Informe a UF da OAB."
      );
    }
  }

  if (
    tipo ===
    "preposto"
  ) {
    cpf =
      somenteNumeros(
        lerCampo(
          formData,
          "cpf"
        )
      );

    if (
      !validarCPF(
        cpf
      )
    ) {
      redirecionarComErro(
        caminhoEdicao,
        "Informe um CPF com 11 números."
      );
    }
  }

  const duplicado =
    await buscarCorrespondenteExistente(
      supabase,
      empresaId,
      tipo,
      {
        oabNumero:
          oabNumero ??
          undefined,

        oabUf:
          oabUf ??
          undefined,

        cpf:
          cpf ??
          undefined,
      },
      id
    );

  if (
    duplicado
  ) {
    redirecionarComErro(
      caminhoEdicao,
      "Já existe outro profissional cadastrado com esta identificação."
    );
  }

  const {
    error,
  } =
    await supabase
      .from(
        "correspondentes"
      )
      .update({
        nome,

        oab_numero:
          tipo ===
          "advogado"
            ? oabNumero
            : null,

        oab_uf:
          tipo ===
          "advogado"
            ? oabUf
            : null,

        cpf:
          tipo ===
          "preposto"
            ? cpf
            : null,

        atualizado_por:
          usuarioId,

        atualizado_em:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        id
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .is(
        "excluido_em",
        null
      );

  if (
    error?.code ===
    "23505"
  ) {
    redirecionarComErro(
      caminhoEdicao,
      "Já existe outro profissional cadastrado com esta identificação."
    );
  }

  if (error) {
    redirecionarComErro(
      caminhoEdicao,
      `Erro ao atualizar correspondente: ${error.message}`
    );
  }

  revalidarCorrespondentes();

  redirecionarComSucesso(
    "Correspondente atualizado com sucesso."
  );
}

/* =====================================================
   ATIVAR / INATIVAR PARTICIPANTE

   Abrange:
   - advogado
   - preposto
   - testemunha

   A observação é opcional e só é atualizada
   em uma nova inativação.

   Na reativação, os dados da última
   inativação são preservados como histórico.
===================================================== */

function nomeTipoParticipante(
  tipo:
    TipoParticipante
) {
  if (
    tipo ===
    "advogado"
  ) {
    return "Advogado";
  }

  if (
    tipo ===
    "preposto"
  ) {
    return "Preposto";
  }

  return "Testemunha";
}

export async function alternarStatusParticipante(
  formData: FormData
) {
  const {
    supabase,
    usuarioId,
    empresaId,
  } =
    await obterContextoUsuario();

  const id =
    lerCampo(
      formData,
      "id"
    ).trim();

  const tipo =
    normalizarTipoParticipante(
      lerCampo(
        formData,
        "tipo_participante"
      )
    );

  const observacao =
    lerCampo(
      formData,
      "observacao_inativacao"
    ).trim();

  if (!id) {
    redirecionarComErro(
      "/protected/correspondentes",
      "Participante não identificado."
    );
  }

  if (!tipo) {
    redirecionarComErro(
      "/protected/correspondentes",
      "Tipo de participante inválido."
    );
  }

  if (
    observacao.length >
    2000
  ) {
    redirecionarComErro(
      "/protected/correspondentes",
      "A observação da inativação deve ter no máximo 2.000 caracteres."
    );
  }

  const tabela =
    tipo ===
    "testemunha"
      ? "testemunhas"
      : "correspondentes";

  const campoExclusao =
    tipo ===
    "testemunha"
      ? "excluida_em"
      : "excluido_em";

  let consulta =
    supabase
      .from(
        tabela
      )
      .select(
        `
          id,
          ativo
        `
      )
      .eq(
        "id",
        id
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .is(
        campoExclusao,
        null
      );

  if (
    tipo !==
    "testemunha"
  ) {
    consulta =
      consulta.eq(
        "tipo",
        tipo
      );
  }

  const {
    data:
      participante,

    error:
      erroConsulta,
  } =
    await consulta
      .maybeSingle();

  if (
    erroConsulta ||
    !participante
  ) {
    redirecionarComErro(
      "/protected/correspondentes",
      "O participante não foi encontrado."
    );
  }

  const novoStatus =
    !participante
      .ativo;

  const agora =
    new Date()
      .toISOString();

  const atualizacao:
    Record<
      string,
      string |
      boolean |
      null
    > = {
      ativo:
        novoStatus,

      atualizado_por:
        usuarioId,

      atualizado_em:
        agora,
    };

  if (
    !novoStatus
  ) {
    atualizacao
      .observacao_inativacao =
      observacao ||
      null;

    atualizacao
      .inativado_em =
      agora;

    atualizacao
      .inativado_por =
      usuarioId;
  }

  let atualizacaoQuery =
    supabase
      .from(
        tabela
      )
      .update(
        atualizacao
      )
      .eq(
        "id",
        id
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .is(
        campoExclusao,
        null
      );

  if (
    tipo !==
    "testemunha"
  ) {
    atualizacaoQuery =
      atualizacaoQuery.eq(
        "tipo",
        tipo
      );
  }

  const {
    error,
  } =
    await atualizacaoQuery;

  if (error) {
    redirecionarComErro(
      "/protected/correspondentes",
      `Erro ao alterar situação do participante: ${error.message}`
    );
  }

  revalidarCorrespondentes();

  const nomeTipo =
    nomeTipoParticipante(
      tipo
    );

  redirecionarComSucesso(
    novoStatus
      ? `${nomeTipo} reativado com sucesso.`
      : `${nomeTipo} inativado com sucesso.`
  );
}
