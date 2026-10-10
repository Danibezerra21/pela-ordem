"use client";

import {
  useActionState,
} from "react";

import {
  useFormStatus,
} from "react-dom";

import {
  AlertTriangle,
  Check,
  Clock3,
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

  diligenciaId:
    string;

  pagoEm:
    string | null;

  pagamentoDesfeitoEm:
    string | null;

  podeGerenciar:
    boolean;

  liberadoParaPagamento:
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
        disabled={
          pending
        }
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
      disabled={
        pending
      }
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


function formatarDataHora(
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
        "America/Sao_Paulo",

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

      hour12:
        false,
    }
  ).format(
    data
  );
}


export function ControlePagamento({
  contratacaoId,
  diligenciaId,
  pagoEm,
  pagamentoDesfeitoEm,
  podeGerenciar,
  liberadoParaPagamento,
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


  const possuiDesfazimento =
    Boolean(
      pagamentoDesfeitoEm
    );


  return (
    <div className="flex flex-col items-start gap-2">

      {/* =================================================
          ESTADO ATUAL
      ================================================= */}

      {pago ? (
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            <Check className="h-3.5 w-3.5" />

            Pago
          </span>

          {pagoEm && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Registrado em{" "}
              {formatarDataHora(
                pagoEm
              )}
            </p>
          )}
        </div>

      ) : possuiDesfazimento ? (

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800">
            <RotateCcw className="h-3.5 w-3.5" />

            Pagamento desfeito
          </span>

          {pagamentoDesfeitoEm && (
            <p className="mt-1.5 text-xs text-red-700">
              Desfeito em{" "}
              {formatarDataHora(
                pagamentoDesfeitoEm
              )}
            </p>
          )}
        </div>

      ) : liberadoParaPagamento ? (

        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          Pagamento pendente
        </span>

      ) : (

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Clock3 className="h-4 w-4" />

            Aguardando liberação para pagamento
          </div>

          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            O desfecho da diligência ainda não autorizou o pagamento.
          </p>
        </div>
      )}


      {/* =================================================
          ALERTA DE HISTÓRICO

          Continua aparecendo mesmo se a contratação
          tiver sido paga novamente.
      ================================================= */}

      {pago &&
        possuiDesfazimento &&
        pagamentoDesfeitoEm && (
          <div className="mt-1 max-w-sm rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

              <div>
                <p className="text-xs font-semibold text-amber-900">
                  Este pagamento já foi desfeito anteriormente.
                </p>

                <p className="mt-1 text-xs text-amber-800">
                  Último desfazimento em{" "}
                  {formatarDataHora(
                    pagamentoDesfeitoEm
                  )}.
                </p>
              </div>
            </div>
          </div>
        )}


      {/* =================================================
          AÇÃO FINANCEIRA
      ================================================= */}

      {podeGerenciar &&
        (
          pago ||
          liberadoParaPagamento
        ) && (
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
              name="diligencia_id"
              value={
                diligenciaId
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


      {/* =================================================
          RETORNOS
      ================================================= */}

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