"use client";

import {
  useActionState,
} from "react";

import {
  useFormStatus,
} from "react-dom";

import {
  Check,
  Loader2,
  RotateCcw,
} from "lucide-react";

import {
  alterarPagamentoContratacao,
  type PagamentoState,
} from "./pagamento-actions";


type ControlePagamentoProps = {
  contratacaoId:
    string;

  pagoEm:
    string | null;

  podeGerenciar:
    boolean;
};


const estadoInicial:
  PagamentoState = {
    status:
      "inicial",

    mensagem:
      null,
  };


function BotaoPagamento({
  pago,
}: {
  pago:
    boolean;
}) {

  const {
    pending,
  } =
    useFormStatus();


  if (pago) {
    return (
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />

            Atualizando...
          </>
        ) : (
          <>
            <RotateCcw className="h-4 w-4" />

            Desfazer pagamento
          </>
        )}
      </button>
    );
  }


  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />

          Registrando...
        </>
      ) : (
        <>
          <Check className="h-4 w-4" />

          Marcar como pago
        </>
      )}
    </button>
  );
}


function formatarPagamento(
  valor: string
) {
  const data =
    new Date(
      valor
    );


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
    data
  );
}


export function ControlePagamento({
  contratacaoId,
  pagoEm,
  podeGerenciar,
}: ControlePagamentoProps) {

  const [
    estado,
    formAction,
  ] =
    useActionState(
      alterarPagamentoContratacao,
      estadoInicial
    );


  const pago =
    Boolean(
      pagoEm
    );


  return (
    <div className="flex flex-col items-start gap-2">

      {pago ? (
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            <Check className="h-3.5 w-3.5" />

            Pago
          </span>

          {pagoEm && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Registrado em{" "}
              {formatarPagamento(
                pagoEm
              )}
            </p>
          )}
        </div>
      ) : (
        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          Pagamento pendente
        </span>
      )}


      {podeGerenciar && (
        <form
          action={
            formAction
          }
        >
          <input
            type="hidden"
            name="contratacao_id"
            value={
              contratacaoId
            }
          />

          <input
            type="hidden"
            name="pago"
            value={
              pago
                ? "false"
                : "true"
            }
          />

          <BotaoPagamento
            pago={
              pago
            }
          />
        </form>
      )}


      {estado.status ===
        "erro" &&
        estado.mensagem && (
          <p className="max-w-xs text-xs font-medium text-red-700">
            {
              estado.mensagem
            }
          </p>
        )}


      {estado.status ===
        "sucesso" &&
        estado.mensagem && (
          <p className="max-w-xs text-xs font-medium text-emerald-700">
            {
              estado.mensagem
            }
          </p>
        )}

    </div>
  );
}