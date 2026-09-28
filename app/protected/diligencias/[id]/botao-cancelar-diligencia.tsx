"use client";

import {
  useActionState,
  useEffect,
  useState,
} from "react";

import {
  AlertTriangle,
  Ban,
  LoaderCircle,
  X,
} from "lucide-react";

import { useRouter } from "next/navigation";

import {
  cancelarDiligencia,
  type CancelamentoState,
} from "./actions";


const estadoInicial: CancelamentoState = {
  status: "inicial",
};


export function BotaoCancelarDiligencia({
  diligenciaId,
}: {
  diligenciaId: string;
}) {

  const router =
    useRouter();

  const [
    aberto,
    setAberto,
  ] =
    useState(false);


  const [
    state,
    formAction,
    isPending,
  ] =
    useActionState(
      cancelarDiligencia,
      estadoInicial
    );


  useEffect(() => {
    if (
      state.status ===
      "sucesso"
    ) {
      setAberto(false);
      router.refresh();
    }
  }, [
    state.status,
    router,
  ]);


  return (
    <>
      <button
        type="button"
        onClick={() =>
          setAberto(true)
        }
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
      >
        <Ban className="h-4 w-4" />

        Cancelar diligência
      </button>


      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-lg rounded-xl border bg-background shadow-xl">

            <div className="flex items-start justify-between gap-4 border-b p-6">

              <div className="flex items-start gap-3">

                <div className="rounded-full bg-red-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-700" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Cancelar diligência?
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Esta ação retira a diligência da operação ativa.
                  </p>
                </div>

              </div>


              <button
                type="button"
                onClick={() =>
                  setAberto(false)
                }
                disabled={isPending}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-50"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            <div className="space-y-4 p-6">

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-medium">
                  A diligência não será apagada.
                </p>

                <p className="mt-1">
                  Ela permanecerá disponível para histórico e auditoria, mas deixará de ocupar a agenda do advogado, preposto e testemunhas vinculados.
                </p>
              </div>


              {state.status ===
                "erro" && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {state.mensagem}
                </div>
              )}


              <form
                action={
                  formAction
                }
                className="flex flex-wrap justify-end gap-3"
              >

                <input
                  type="hidden"
                  name="diligencia_id"
                  value={
                    diligenciaId
                  }
                />


                <button
                  type="button"
                  onClick={() =>
                    setAberto(
                      false
                    )
                  }
                  disabled={
                    isPending
                  }
                  className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  Voltar
                </button>


                <button
                  type="submit"
                  disabled={
                    isPending
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />

                      Cancelando...
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4" />

                      Confirmar cancelamento
                    </>
                  )}
                </button>

              </form>

            </div>

          </div>

        </div>
      )}
    </>
  );
}