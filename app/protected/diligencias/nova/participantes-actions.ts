"use server";

import { revalidatePath } from "next/cache";
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
      status: "ativo";
      encontrado: true;
      desativado: false;
      participante: T;
      mensagem: string;
    }
  | {
      status: "desativado";
      encontrado: false;
      desativado: true;
      participante: T;
      mensagem: string;
    }
  | {
      status: "nao_encontrado";
      encontrado: false;
      desativado: false;
      participante: null;
      mensagem: string;
    };

type ResultadoCadastro<T> = {
  sucesso: true;
  participante: T;
  criado: boolean;
  mensagem: string;
};

type ResultadoReativacao<T> = {
  sucesso: true;
  participante: T;
  mensagem: string;
};

type AdvogadoBanco = {
  id: string;
  nome: string;
  tipo: string;
  oab_numero: string | null;
  oab_uf: string | null;
  ativo: boolean;
};

type PrepostoBanco = {
  id: string;
  nome: string;
  tipo: string;
  cpf: string | null;
  ativo: boolean;
};

function normalizarTexto(
  valor: string
) {
  return valor
    .trim()
    .replace(/\s+/g, " ")
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

function validarCPFBasico(
  cpf: string
) {
  return (
    somenteNumeros(cpf)
      .length === 11
  );
}

function advogadoParticipante(
  registro: AdvogadoBanco
): AdvogadoParticipante {
  return {
    id:
      registro.id,

    nome:
      registro.nome,

    tipo:
      "advogado",

    oab_numero:
      registro.oab_numero ??
      "",

    oab_uf:
      registro.oab_uf ??
      "",
  };
}

function prepostoParticipante(
  registro: PrepostoBanco
): PrepostoParticipante {
  return {
    id:
      registro.id,

    nome:
      registro.nome,

    tipo:
      "preposto",

    cpf:
      registro.cpf ??
      "",
  };
}

function atualizarPaginasCorrespondentes() {
  revalidatePath(
    "/protected"
  );

  revalidatePath(
    "/protected/diligencias"
  );

  revalidatePath(
    "/protected/correspondentes"
  );
}

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
      "Não foi possível identificar sua empresa."
    );
  }

  return {
    supabase,

    empresaId:
      membro
        .empresa_id as string,
  };
}

async function buscarAdvogadoNoBanco(
  supabase: any,
  empresaId: string,
  oabNumero: string,
  oabUf: string
): Promise<
  AdvogadoBanco | null
> {
  const {
    data,
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
          tipo,
          oab_numero,
          oab_uf,
          ativo
        `
      )
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

  return (
    data as
      | AdvogadoBanco
      | null
  );
}

async function buscarPrepostoNoBanco(
  supabase: any,
  empresaId: string,
  cpf: string
): Promise<
  PrepostoBanco | null
> {
  const {
    data,
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
          tipo,
          cpf,
          ativo
        `
      )
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

  return (
    data as
      | PrepostoBanco
      | null
  );
}

/* =========================================================
   ADVOGADO
========================================================= */

export async function buscarAdvogado(
  oabNumeroInformado: string,
  oabUfInformada: string
): Promise<
  ResultadoBusca<
    AdvogadoParticipante
  >
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

  if (
    oabUf.length !== 2
  ) {
    throw new Error(
      "Informe a UF da OAB."
    );
  }

  const registro =
    await buscarAdvogadoNoBanco(
      supabase,
      empresaId,
      oabNumero,
      oabUf
    );

  if (!registro) {
    return {
      status:
        "nao_encontrado",

      encontrado:
        false,

      desativado:
        false,

      participante:
        null,

      mensagem:
        "Nenhum advogado cadastrado com esta OAB e UF.",
    };
  }

  const participante =
    advogadoParticipante(
      registro
    );

  if (
    !registro.ativo
  ) {
    return {
      status:
        "desativado",

      encontrado:
        false,

      desativado:
        true,

      participante,

      mensagem:
        "Este advogado já está cadastrado, mas está desativado.",
    };
  }

  return {
    status:
      "ativo",

    encontrado:
      true,

    desativado:
      false,

    participante,

    mensagem:
      "Advogado localizado.",
  };
}

export async function cadastrarAdvogado(
  nomeInformado: string,
  oabNumeroInformado: string,
  oabUfInformada: string
): Promise<
  ResultadoCadastro<
    AdvogadoParticipante
  >
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

  if (
    oabUf.length !== 2
  ) {
    throw new Error(
      "Informe a UF da OAB."
    );
  }

  const existente =
    await buscarAdvogadoNoBanco(
      supabase,
      empresaId,
      oabNumero,
      oabUf
    );

  if (existente) {
    if (
      !existente.ativo
    ) {
      throw new Error(
        "Este advogado já está cadastrado, mas está desativado. Reative o cadastro existente para utilizá-lo."
      );
    }

    return {
      sucesso:
        true,

      participante:
        advogadoParticipante(
          existente
        ),

      criado:
        false,

      mensagem:
        "Este advogado já estava cadastrado e foi localizado.",
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "correspondentes"
      )
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
      .select(
        `
          id,
          nome,
          tipo,
          oab_numero,
          oab_uf,
          ativo
        `
      )
      .single();

  if (
    error?.code ===
    "23505"
  ) {
    const localizado =
      await buscarAdvogadoNoBanco(
        supabase,
        empresaId,
        oabNumero,
        oabUf
      );

    if (localizado) {
      if (
        !localizado.ativo
      ) {
        throw new Error(
          "Este advogado já está cadastrado, mas está desativado. Reative o cadastro existente para utilizá-lo."
        );
      }

      return {
        sucesso:
          true,

        participante:
          advogadoParticipante(
            localizado
          ),

        criado:
          false,

        mensagem:
          "O advogado já havia sido cadastrado e foi vinculado ao registro existente.",
      };
    }
  }

  if (
    error ||
    !data
  ) {
    throw new Error(
      `Erro ao cadastrar advogado: ${
        error?.message ??
        "cadastro não realizado"
      }`
    );
  }

  atualizarPaginasCorrespondentes();

  return {
    sucesso:
      true,

    participante:
      advogadoParticipante(
        data as AdvogadoBanco
      ),

    criado:
      true,

    mensagem:
      "Advogado cadastrado com sucesso.",
  };
}

export async function reativarAdvogado(
  correspondenteId: string
): Promise<
  ResultadoReativacao<
    AdvogadoParticipante
  >
> {
  const {
    supabase,
    empresaId,
  } =
    await obterContextoUsuario();

  if (
    !correspondenteId
  ) {
    throw new Error(
      "Não foi possível identificar o advogado."
    );
  }

  const {
    data:
      existente,

    error:
      erroBusca,
  } =
    await supabase
      .from(
        "correspondentes"
      )
      .select(
        `
          id,
          nome,
          tipo,
          oab_numero,
          oab_uf,
          ativo
        `
      )
      .eq(
        "id",
        correspondenteId
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        "tipo",
        "advogado"
      )
      .is(
        "excluido_em",
        null
      )
      .maybeSingle();

  if (erroBusca) {
    throw new Error(
      `Erro ao localizar advogado: ${erroBusca.message}`
    );
  }

  if (!existente) {
    throw new Error(
      "O advogado não foi localizado nesta empresa."
    );
  }

  const registro =
    existente as AdvogadoBanco;

  if (
    registro.ativo
  ) {
    return {
      sucesso:
        true,

      participante:
        advogadoParticipante(
          registro
        ),

      mensagem:
        "O advogado já estava ativo e foi vinculado.",
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "correspondentes"
      )
      .update({
        ativo:
          true,
      })
      .eq(
        "id",
        correspondenteId
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        "tipo",
        "advogado"
      )
      .is(
        "excluido_em",
        null
      )
      .select(
        `
          id,
          nome,
          tipo,
          oab_numero,
          oab_uf,
          ativo
        `
      )
      .single();

  if (
    error ||
    !data
  ) {
    throw new Error(
      `Erro ao reativar advogado: ${
        error?.message ??
        "reativação não realizada"
      }`
    );
  }

  atualizarPaginasCorrespondentes();

  return {
    sucesso:
      true,

    participante:
      advogadoParticipante(
        data as AdvogadoBanco
      ),

    mensagem:
      "Advogado reativado e vinculado com sucesso.",
  };
}

/* =========================================================
   PREPOSTO
========================================================= */

export async function buscarPreposto(
  cpfInformado: string
): Promise<
  ResultadoBusca<
    PrepostoParticipante
  >
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
    !validarCPFBasico(
      cpf
    )
  ) {
    throw new Error(
      "Informe um CPF com 11 números."
    );
  }

  const registro =
    await buscarPrepostoNoBanco(
      supabase,
      empresaId,
      cpf
    );

  if (!registro) {
    return {
      status:
        "nao_encontrado",

      encontrado:
        false,

      desativado:
        false,

      participante:
        null,

      mensagem:
        "Nenhum preposto cadastrado com este CPF.",
    };
  }

  const participante =
    prepostoParticipante(
      registro
    );

  if (
    !registro.ativo
  ) {
    return {
      status:
        "desativado",

      encontrado:
        false,

      desativado:
        true,

      participante,

      mensagem:
        "Este preposto já está cadastrado, mas está desativado.",
    };
  }

  return {
    status:
      "ativo",

    encontrado:
      true,

    desativado:
      false,

    participante,

    mensagem:
      "Preposto localizado.",
  };
}

export async function cadastrarPreposto(
  nomeInformado: string,
  cpfInformado: string
): Promise<
  ResultadoCadastro<
    PrepostoParticipante
  >
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
    !validarCPFBasico(
      cpf
    )
  ) {
    throw new Error(
      "Informe um CPF com 11 números."
    );
  }

  const existente =
    await buscarPrepostoNoBanco(
      supabase,
      empresaId,
      cpf
    );

  if (existente) {
    if (
      !existente.ativo
    ) {
      throw new Error(
        "Este preposto já está cadastrado, mas está desativado. Reative o cadastro existente para utilizá-lo."
      );
    }

    return {
      sucesso:
        true,

      participante:
        prepostoParticipante(
          existente
        ),

      criado:
        false,

      mensagem:
        "Este preposto já estava cadastrado e foi localizado.",
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "correspondentes"
      )
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
      .select(
        `
          id,
          nome,
          tipo,
          cpf,
          ativo
        `
      )
      .single();

  if (
    error?.code ===
    "23505"
  ) {
    const localizado =
      await buscarPrepostoNoBanco(
        supabase,
        empresaId,
        cpf
      );

    if (localizado) {
      if (
        !localizado.ativo
      ) {
        throw new Error(
          "Este preposto já está cadastrado, mas está desativado. Reative o cadastro existente para utilizá-lo."
        );
      }

      return {
        sucesso:
          true,

        participante:
          prepostoParticipante(
            localizado
          ),

        criado:
          false,

        mensagem:
          "O preposto já havia sido cadastrado e foi vinculado ao registro existente.",
      };
    }
  }

  if (
    error ||
    !data
  ) {
    throw new Error(
      `Erro ao cadastrar preposto: ${
        error?.message ??
        "cadastro não realizado"
      }`
    );
  }

  atualizarPaginasCorrespondentes();

  return {
    sucesso:
      true,

    participante:
      prepostoParticipante(
        data as PrepostoBanco
      ),

    criado:
      true,

    mensagem:
      "Preposto cadastrado com sucesso.",
  };
}

export async function reativarPreposto(
  correspondenteId: string
): Promise<
  ResultadoReativacao<
    PrepostoParticipante
  >
> {
  const {
    supabase,
    empresaId,
  } =
    await obterContextoUsuario();

  if (
    !correspondenteId
  ) {
    throw new Error(
      "Não foi possível identificar o preposto."
    );
  }

  const {
    data:
      existente,

    error:
      erroBusca,
  } =
    await supabase
      .from(
        "correspondentes"
      )
      .select(
        `
          id,
          nome,
          tipo,
          cpf,
          ativo
        `
      )
      .eq(
        "id",
        correspondenteId
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        "tipo",
        "preposto"
      )
      .is(
        "excluido_em",
        null
      )
      .maybeSingle();

  if (erroBusca) {
    throw new Error(
      `Erro ao localizar preposto: ${erroBusca.message}`
    );
  }

  if (!existente) {
    throw new Error(
      "O preposto não foi localizado nesta empresa."
    );
  }

  const registro =
    existente as PrepostoBanco;

  if (
    registro.ativo
  ) {
    return {
      sucesso:
        true,

      participante:
        prepostoParticipante(
          registro
        ),

      mensagem:
        "O preposto já estava ativo e foi vinculado.",
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "correspondentes"
      )
      .update({
        ativo:
          true,
      })
      .eq(
        "id",
        correspondenteId
      )
      .eq(
        "empresa_id",
        empresaId
      )
      .eq(
        "tipo",
        "preposto"
      )
      .is(
        "excluido_em",
        null
      )
      .select(
        `
          id,
          nome,
          tipo,
          cpf,
          ativo
        `
      )
      .single();

  if (
    error ||
    !data
  ) {
    throw new Error(
      `Erro ao reativar preposto: ${
        error?.message ??
        "reativação não realizada"
      }`
    );
  }

  atualizarPaginasCorrespondentes();

  return {
    sucesso:
      true,

    participante:
      prepostoParticipante(
        data as PrepostoBanco
      ),

    mensagem:
      "Preposto reativado e vinculado com sucesso.",
  };
}

/* =========================================================
   TESTEMUNHA
========================================================= */

export async function buscarTestemunha(
  cpfInformado: string
): Promise<
  ResultadoBusca<
    TestemunhaParticipante
  >
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
    !validarCPFBasico(
      cpf
    )
  ) {
    throw new Error(
      "Informe um CPF com 11 números."
    );
  }

  const {
    data,
    error,
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
      status:
        "nao_encontrado",

      encontrado:
        false,

      desativado:
        false,

      participante:
        null,

      mensagem:
        "Nenhuma testemunha cadastrada com este CPF.",
    };
  }

  return {
    status:
      "ativo",

    encontrado:
      true,

    desativado:
      false,

    participante: {
      id:
        String(
          data.id
        ),

      nome:
        String(
          data.nome ??
          ""
        ),

      cpf:
        String(
          data.cpf ??
          ""
        ),
    },

    mensagem:
      "Testemunha localizada.",
  };
}

export async function cadastrarTestemunha(
  nomeInformado: string,
  cpfInformado: string
): Promise<
  ResultadoCadastro<
    TestemunhaParticipante
  >
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
    !validarCPFBasico(
      cpf
    )
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
    existente.status ===
      "ativo" &&
    existente.participante
  ) {
    return {
      sucesso:
        true,

      participante:
        existente.participante,

      criado:
        false,

      mensagem:
        "Esta testemunha já estava cadastrada e foi localizada.",
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "testemunhas"
      )
      .insert({
        empresa_id:
          empresaId,

        nome,

        cpf,

        ativo:
          true,
      })
      .select(
        `
          id,
          nome,
          cpf
        `
      )
      .single();

  if (
    error?.code ===
    "23505"
  ) {
    const localizada =
      await buscarTestemunha(
        cpf
      );

    if (
      localizada.status ===
        "ativo" &&
      localizada.participante
    ) {
      return {
        sucesso:
          true,

        participante:
          localizada.participante,

        criado:
          false,

        mensagem:
          "A testemunha já havia sido cadastrada e foi vinculada ao registro existente.",
      };
    }
  }

  if (
    error ||
    !data
  ) {
    throw new Error(
      `Erro ao cadastrar testemunha: ${
        error?.message ??
        "cadastro não realizado"
      }`
    );
  }

  return {
    sucesso:
      true,

    participante: {
      id:
        String(
          data.id
        ),

      nome:
        String(
          data.nome ??
          ""
        ),

      cpf:
        String(
          data.cpf ??
          ""
        ),
    },

    criado:
      true,

    mensagem:
      "Testemunha cadastrada com sucesso.",
  };
}