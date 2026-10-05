"use client";

import {
  CheckCircle2,
  X,
} from "lucide-react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

export function AvisoSucesso() {
  const searchParams =
    useSearchParams();

  const router =
    useRouter();

  const sucesso =
    searchParams.get(
      "sucesso"
    );

  if (!sucesso) {
    return null;
  }

  const mensagens:
    Record<
      string,
      {
        titulo: string;
        descricao: string;
      }
    > = {
      "convite-enviado": {
        titulo:
          "Convite enviado com sucesso",

        descricao:
          "O usuário receberá um e-mail para criar a senha e ativar o acesso ao NOTE LITIS.",
      },

      "convite-reenviado": {
        titulo:
          "Convite reenviado",

        descricao:
          "Um novo link de acesso foi enviado para o e-mail do usuário.",
      },

      "acesso-alterado": {
        titulo:
          "Tipo de acesso atualizado",

        descricao:
          "As permissões do usuário foram atualizadas com sucesso.",
      },

      "acesso-reativado": {
        titulo:
          "Acesso reativado",

        descricao:
          "O usuário voltou a possuir acesso ao NOTE LITIS.",
      },

      "acesso-revogado": {
        titulo:
          "Acesso revogado",

        descricao:
          "O usuário não possui mais acesso ao NOTE LITIS.",
      },
    };

  const mensagem =
    mensagens[sucesso];

  if (!mensagem) {
    return null;
  }

  function fechar() {
    router.replace(
      "/protected/usuarios",
      {
        scroll: false,
      }
    );
  }

  return (
    <div
      className="
        mb-6
        flex
        items-start
        justify-between
        gap-4
        rounded-xl
        border
        border-emerald-200
        bg-emerald-50
        px-5
        py-4
        text-emerald-950
      "
    >
      <div className="flex items-start gap-3">
        <CheckCircle2
          className="
            mt-0.5
            h-5
            w-5
            shrink-0
            text-emerald-700
          "
        />

        <div>
          <p className="font-semibold">
            {mensagem.titulo}
          </p>

          <p className="mt-1 text-sm text-emerald-800">
            {mensagem.descricao}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={fechar}
        aria-label="Fechar aviso"
        className="
          rounded-md
          p-1
          text-emerald-700
          transition
          hover:bg-emerald-100
        "
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}