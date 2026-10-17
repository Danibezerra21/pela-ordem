"use client";

import {
  useState,
} from "react";

import {
  Power,
  RotateCcw,
  X,
} from "lucide-react";

import {
  useFormStatus,
} from "react-dom";

import {
  LoadingButton,
} from "@/components/ui/loading-button";

import {
  alternarStatusParticipante,
} from "./actions";


type TipoParticipante =
  | "advogado"
  | "preposto"
  | "testemunha";


type StatusParticipanteProps = {
  id:
    string;

  tipo:
    TipoParticipante;

  ativo:
    boolean;
};


function BotoesConfirmacao({
  onCancelar,
}: {
  onCancelar:
    () => void;
}) {
  const {
    pending,
  } =
    useFormStatus();


  return (
    <div className="flex flex-wrap justify-end gap-2">

      <button
        type="button"
        disabled={
          pending
        }
        onClick={
          onCancelar
        }
        className="inline-flex items-center gap-2 rounded-lg border bg-background px-3.5 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        <X className="h-4 w-4" />

        Cancelar
      </button>


      <LoadingButton
        type="submit"
        loadingText="Inativando..."
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
      >
        <Power className="h-4 w-4" />

        Confirmar inativação
      </LoadingButton>

    </div>
  );
}


export function StatusParticipante({
  id,
  tipo,
  ativo,
}: StatusParticipanteProps) {
  const [
    confirmando,
    setConfirmando,
  ] =
    useState(
      false
    );


  if (
    !ativo
  ) {
    return (
      <form
        action={
          alternarStatusParticipante
        }
      >
        <input
          type="hidden"
          name="id"
          value={
            id
          }
        />

        <input
          type="hidden"
          name="tipo_participante"
          value={
            tipo
          }
        />

        <LoadingButton
          type="submit"
          loadingText="Reativando..."
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
        >
          <RotateCcw className="h-4 w-4" />

          Reativar
        </LoadingButton>
      </form>
    );
  }


  if (
    !confirmando
  ) {
    return (
      <button
        type="button"
        onClick={() =>
          setConfirmando(
            true
          )
        }
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
      >
        <Power className="h-4 w-4" />

        Inativar
      </button>
    );
  }


  return (
    <form
      action={
        alternarStatusParticipante
      }
      className="w-full rounded-xl border border-red-200 bg-red-50/60 p-4 sm:min-w-[340px]"
    >
      <input
        type="hidden"
        name="id"
        value={
          id
        }
      />

      <input
        type="hidden"
        name="tipo_participante"
        value={
          tipo
        }
      />


      <label
        htmlFor={`observacao-inativacao-${id}`}
        className="text-sm font-medium text-red-950"
      >
        Observação da inativação

        <span className="ml-1 font-normal text-red-800">
          (opcional)
        </span>
      </label>


      <textarea
        id={`observacao-inativacao-${id}`}
        name="observacao_inativacao"
        rows={
          4
        }
        maxLength={
          2000
        }
        placeholder="Ex.: profissional não atende mais o escritório, indisponibilidade recorrente, solicitação interna..."
        className="mt-2 w-full resize-y rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-red-400"
      />


      <p className="mt-2 text-xs leading-5 text-red-800">
        Use este espaço para registrar informações que possam ser úteis no futuro. O preenchimento não é obrigatório.
      </p>


      <div className="mt-4">
        <BotoesConfirmacao
          onCancelar={() =>
            setConfirmando(
              false
            )
          }
        />
      </div>

    </form>
  );
}
