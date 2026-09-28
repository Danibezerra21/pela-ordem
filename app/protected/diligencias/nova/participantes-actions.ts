"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AdvogadoParticipante = {
  id: string;
  nome: string;
  tipo: "advogado";
  oab_numero: string;
  oab_uf: string;
};

export type PrepostoParticipante = {
  id: string;
  nome: string;
  tipo: "preposto";
  cpf: string;
};

export type TestemunhaParticipante = {
  id: string;
  nome: string;
  cpf: string;
};

type ResultadoBusca<T> =
  | {
      encontrado: true;
      participante: T;
      mensagem: string;
    }
  | {
      encontrado: false;
      participante: null;
      mensagem: string;
    };

type ResultadoCadastro<T> = {
  sucesso: true;
  participante: T;
  criado: boolean;
  mensagem: string;
};

function normalizarTexto(valor: string) {
  return valor
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function normalizarUF(valor: string) {
  return valor
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
}

function validarCPFBasico(cpf: string) {
  return somenteNumeros(cpf).length === 11;
}

async function obterContextoUsuario() {
  const supabase = await createClient();

  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getClaims();

  if (
    authError ||
    !authData?.claims?.sub
  ) {
    redirect("/auth/login");
  }

  const usuarioId =
    authData.claims.sub;

  const {
    data: membro,
    error: erroMembro,
  } = await supabase
    .from("membros_empresa")
    .select("empresa_id")
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
      "Não foi possível identificar sua empresa."
    );
  }

  return {
    supabase,
    empresaId:
      membro.empresa_id,
  };
}

/* =========================================================
   ADVOGADO
   IDENTIFICAÇÃO: OAB + UF
========================================================= */

export async function buscarAdvogado(
  oabNumeroInformado: string,
  oabUfInformada: string
): Promise<
  ResultadoBusca<AdvogadoParticipante>
> {
  const {
    supabase,
    empresaId,
  } =
    await obterContextoUsuario();

  const oabNumero =
    somenteNumeros(
      oabNumeroInformado
    );

  const oabUf =
    normalizarUF(
      oabUfInformada
    );

  if (!oabNumero) {
    throw new Error(
      "Informe o número da OAB."
    );
  }

  if (oabUf.length !== 2) {
    throw new Error(
      "Informe a UF da OAB."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("correspondentes")
    .select(`
      id,
      nome,
      tipo,
      oab_numero,
      oab_uf
    `)
    .eq(
      "empresa_id",
      empresaId
    )
    .eq(
      "tipo",
      "advogado"
    )
    .eq(
      "oab_numero",
      oabNumero
    )
    .eq(
      "oab_uf",
      oabUf
    )
    .eq(
      "ativo",
      true
    )
    .is(
      "excluido_em",
      null
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      `Erro ao buscar advogado: ${error.message}`
    );
  }

  if (!data) {
    return {
      encontrado: false,
      participante: null,

      mensagem:
        "Nenhum advogado cadastrado com esta OAB e UF.",
    };
  }

  return {
    encontrado: true,

    participante:
      data as AdvogadoParticipante,

    mensagem:
      "Advogado localizado.",
  };
}

export async function cadastrarAdvogado(
  nomeInformado: string,
  oabNumeroInformado: string,
  oabUfInformada: string
): Promise<
  ResultadoCadastro<AdvogadoParticipante>
> {
  const {
    supabase,
    empresaId,
  } =
    await obterContextoUsuario();

  const nome =
    normalizarTexto(
      nomeInformado
    );

  const oabNumero =
    somenteNumeros(
      oabNumeroInformado
    );

  const oabUf =
    normalizarUF(
      oabUfInformada
    );

  if (!nome) {
    throw new Error(
      "Informe o nome do advogado."
    );
  }

  if (!oabNumero) {
    throw new Error(
      "Informe o número da OAB."
    );
  }

  if (oabUf.length !== 2) {
    throw new Error(
      "Informe a UF da OAB."
    );
  }

  /*
    Primeiro consultamos novamente.

    Além de melhorar a experiência,
    isso evita criar um cadastro que
    já passou a existir enquanto o
    usuário preenchia o nome.
  */
  const existente =
    await buscarAdvogado(
      oabNumero,
      oabUf
    );

  if (
    existente.encontrado &&
    existente.participante
  ) {
    return {
      sucesso: true,

      participante:
        existente.participante,

      criado: false,

      mensagem:
        "Este advogado já estava cadastrado e foi localizado.",
    };
  }

  const {
    data,
    error,
  } = await supabase
    .from("correspondentes")
    .insert({
      empresa_id:
        empresaId,

      tipo:
        "advogado",

      nome,

      oab_numero:
        oabNumero,

      oab_uf:
        oabUf,

      cpf:
        null,

      ativo:
        true,
    })
    .select(`
      id,
      nome,
      tipo,
      oab_numero,
      oab_uf
    `)
    .single();

  /*
    23505 = violação de índice UNIQUE.

    Mesmo com a consulta anterior,
    dois usuários podem tentar criar
    a mesma OAB simultaneamente.

    O banco continua sendo a última
    barreira contra duplicidade.
  */
  if (
    error?.code === "23505"
  ) {
    const localizado =
      await buscarAdvogado(
        oabNumero,
        oabUf
      );

    if (
      localizado.encontrado &&
      localizado.participante
    ) {
      return {
        sucesso: true,

        participante:
          localizado.participante,

        criado: false,

        mensagem:
          "O advogado já havia sido cadastrado e foi vinculado ao registro existente.",
      };
    }
  }

  if (error || !data) {
    throw new Error(
      `Erro ao cadastrar advogado: ${
        error?.message ??
        "cadastro não realizado"
      }`
    );
  }

  return {
    sucesso: true,

    participante:
      data as AdvogadoParticipante,

    criado: true,

    mensagem:
      "Advogado cadastrado com sucesso.",
  };
}

/* =========================================================
   PREPOSTO
   IDENTIFICAÇÃO: CPF
========================================================= */

export async function buscarPreposto(
  cpfInformado: string
): Promise<
  ResultadoBusca<PrepostoParticipante>
> {
  const {
    supabase,
    empresaId,
  } =
    await obterContextoUsuario();

  const cpf =
    somenteNumeros(
      cpfInformado
    );

  if (
    !validarCPFBasico(cpf)
  ) {
    throw new Error(
      "Informe um CPF com 11 números."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("correspondentes")
    .select(`
      id,
      nome,
      tipo,
      cpf
    `)
    .eq(
      "empresa_id",
      empresaId
    )
    .eq(
      "tipo",
      "preposto"
    )
    .eq(
      "cpf",
      cpf
    )
    .eq(
      "ativo",
      true
    )
    .is(
      "excluido_em",
      null
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      `Erro ao buscar preposto: ${error.message}`
    );
  }

  if (!data) {
    return {
      encontrado: false,
      participante: null,

      mensagem:
        "Nenhum preposto cadastrado com este CPF.",
    };
  }

  return {
    encontrado: true,

    participante:
      data as PrepostoParticipante,

    mensagem:
      "Preposto localizado.",
  };
}

export async function cadastrarPreposto(
  nomeInformado: string,
  cpfInformado: string
): Promise<
  ResultadoCadastro<PrepostoParticipante>
> {
  const {
    supabase,
    empresaId,
  } =
    await obterContextoUsuario();

  const nome =
    normalizarTexto(
      nomeInformado
    );

  const cpf =
    somenteNumeros(
      cpfInformado
    );

  if (!nome) {
    throw new Error(
      "Informe o nome do preposto."
    );
  }

  if (
    !validarCPFBasico(cpf)
  ) {
    throw new Error(
      "Informe um CPF com 11 números."
    );
  }

  const existente =
    await buscarPreposto(
      cpf
    );

  if (
    existente.encontrado &&
    existente.participante
  ) {
    return {
      sucesso: true,

      participante:
        existente.participante,

      criado: false,

      mensagem:
        "Este preposto já estava cadastrado e foi localizado.",
    };
  }

  const {
    data,
    error,
  } = await supabase
    .from("correspondentes")
    .insert({
      empresa_id:
        empresaId,

      tipo:
        "preposto",

      nome,

      cpf,

      oab_numero:
        null,

      oab_uf:
        null,

      ativo:
        true,
    })
    .select(`
      id,
      nome,
      tipo,
      cpf
    `)
    .single();

  if (
    error?.code === "23505"
  ) {
    const localizado =
      await buscarPreposto(
        cpf
      );

    if (
      localizado.encontrado &&
      localizado.participante
    ) {
      return {
        sucesso: true,

        participante:
          localizado.participante,

        criado: false,

        mensagem:
          "O preposto já havia sido cadastrado e foi vinculado ao registro existente.",
      };
    }
  }

  if (error || !data) {
    throw new Error(
      `Erro ao cadastrar preposto: ${
        error?.message ??
        "cadastro não realizado"
      }`
    );
  }

  return {
    sucesso: true,

    participante:
      data as PrepostoParticipante,

    criado: true,

    mensagem:
      "Preposto cadastrado com sucesso.",
  };
}

/* =========================================================
   TESTEMUNHA
   IDENTIFICAÇÃO: CPF
========================================================= */

export async function buscarTestemunha(
  cpfInformado: string
): Promise<
  ResultadoBusca<TestemunhaParticipante>
> {
  const {
    supabase,
    empresaId,
  } =
    await obterContextoUsuario();

  const cpf =
    somenteNumeros(
      cpfInformado
    );

  if (
    !validarCPFBasico(cpf)
  ) {
    throw new Error(
      "Informe um CPF com 11 números."
    );
  }

  const {
    data,
    error,
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
    .eq(
      "cpf",
      cpf
    )
    .eq(
      "ativo",
      true
    )
    .is(
      "excluida_em",
      null
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      `Erro ao buscar testemunha: ${error.message}`
    );
  }

  if (!data) {
    return {
      encontrado: false,
      participante: null,

      mensagem:
        "Nenhuma testemunha cadastrada com este CPF.",
    };
  }

  return {
    encontrado: true,

    participante:
      data as TestemunhaParticipante,

    mensagem:
      "Testemunha localizada.",
  };
}

export async function cadastrarTestemunha(
  nomeInformado: string,
  cpfInformado: string
): Promise<
  ResultadoCadastro<TestemunhaParticipante>
> {
  const {
    supabase,
    empresaId,
  } =
    await obterContextoUsuario();

  const nome =
    normalizarTexto(
      nomeInformado
    );

  const cpf =
    somenteNumeros(
      cpfInformado
    );

  if (!nome) {
    throw new Error(
      "Informe o nome da testemunha."
    );
  }

  if (
    !validarCPFBasico(cpf)
  ) {
    throw new Error(
      "Informe um CPF com 11 números."
    );
  }

  const existente =
    await buscarTestemunha(
      cpf
    );

  if (
    existente.encontrado &&
    existente.participante
  ) {
    return {
      sucesso: true,

      participante:
        existente.participante,

      criado: false,

      mensagem:
        "Esta testemunha já estava cadastrada e foi localizada.",
    };
  }

  const {
    data,
    error,
  } = await supabase
    .from("testemunhas")
    .insert({
      empresa_id:
        empresaId,

      nome,

      cpf,

      ativo:
        true,
    })
    .select(`
      id,
      nome,
      cpf
    `)
    .single();

  if (
    error?.code === "23505"
  ) {
    const localizada =
      await buscarTestemunha(
        cpf
      );

    if (
      localizada.encontrado &&
      localizada.participante
    ) {
      return {
        sucesso: true,

        participante:
          localizada.participante,

        criado: false,

        mensagem:
          "A testemunha já havia sido cadastrada e foi vinculada ao registro existente.",
      };
    }
  }

  if (error || !data) {
    throw new Error(
      `Erro ao cadastrar testemunha: ${
        error?.message ??
        "cadastro não realizado"
      }`
    );
  }

  return {
    sucesso: true,

    participante:
      data as TestemunhaParticipante,

    criado: true,

    mensagem:
      "Testemunha cadastrada com sucesso.",
  };
}