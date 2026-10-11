"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";


type Plano = {
  codigo: string;
  nome: string;
  ciclo:
    | "mensal"
    | "anual";
  valor: number;
  descricao:
    | string
    | null;
};


type Props = {
  planos: Plano[];
};


type RespostaCheckout = {
  ok?: boolean;
  tipo?:
    | "checkout"
    | "mudanca_agendada";
  checkoutUrl?: string;
  primeiraCobrancaEm?: string;
  mensagem?: string;
};


function moeda(
  valor: number
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


export function PlanosAssinatura({
  planos,
}: Props) {
  const router =
    useRouter();

  const [
    processando,
    setProcessando,
  ] =
    useState<
      string | null
    >(null);

  const [
    mensagem,
    setMensagem,
  ] =
    useState<
      string | null
    >(null);

  const [
    erro,
    setErro,
  ] =
    useState<
      string | null
    >(null);


  const economiaAnual =
    useMemo(
      () => {
        const mensal =
          planos.find(
            (plano) =>
              plano.ciclo ===
              "mensal"
          );

        const anual =
          planos.find(
            (plano) =>
              plano.ciclo ===
              "anual"
          );


        if (
          !mensal ||
          !anual
        ) {
          return null;
        }


        const economia =
          mensal.valor *
            12 -
          anual.valor;


        return economia >
          0
          ? economia
          : null;
      },
      [
        planos,
      ]
    );


  async function contratar(
    planoCodigo:
      string
  ) {
    setProcessando(
      planoCodigo
    );

    setMensagem(
      null
    );

    setErro(
      null
    );


    try {
      const resposta =
        await fetch(
          "/api/asaas/checkout",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                planoCodigo,
              }),
          }
        );


      const dados =
        (await resposta
          .json()
          .catch(
            () => null
          )) as
          | RespostaCheckout
          | null;


      if (
        !resposta.ok
      ) {
        throw new Error(
          dados?.mensagem ??
            "Não foi possível iniciar a contratação."
        );
      }


      if (
        dados?.tipo ===
          "checkout" &&
        dados.checkoutUrl
      ) {
        window.location.assign(
          dados.checkoutUrl
        );

        return;
      }


      if (
        dados?.tipo ===
        "mudanca_agendada"
      ) {
        setMensagem(
          dados.mensagem ??
            "A alteração do plano foi agendada."
        );

        router.refresh();

        return;
      }


      throw new Error(
        "O servidor retornou uma resposta inesperada."
      );
    } catch (
      error:
        unknown
    ) {
      setErro(
        error instanceof
          Error
          ? error.message
          : "Não foi possível iniciar a contratação."
      );
    } finally {
      setProcessando(
        null
      );
    }
  }


  if (
    planos.length ===
    0
  ) {
    return null;
  }


  return (
    <section className="mt-8">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Planos disponíveis
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Todos os planos incluem
          usuários e diligências
          ilimitados.
        </p>
      </div>


      {mensagem && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {mensagem}
        </div>
      )}


      {erro && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {erro}
        </div>
      )}


      <div className="grid gap-5 md:grid-cols-2">
        {planos.map(
          (
            plano
          ) => {
            const anual =
              plano.ciclo ===
              "anual";

            const carregando =
              processando ===
              plano.codigo;


            return (
              <div
                key={
                  plano.codigo
                }
                className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                {anual &&
                  economiaAnual && (
                    <div className="absolute right-4 top-4 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                      Economize{" "}
                      {moeda(
                        economiaAnual
                      )}
                    </div>
                  )}


                <div className="text-sm font-medium uppercase tracking-wide text-slate-500">
                  {anual
                    ? "Anual"
                    : "Mensal"}
                </div>


                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-semibold text-slate-900">
                    {moeda(
                      plano.valor
                    )}
                  </span>

                  <span className="pb-1 text-sm text-slate-500">
                    {anual
                      ? "/ano"
                      : "/mês"}
                  </span>
                </div>


                {anual && (
                  <p className="mt-2 text-sm text-slate-600">
                    Equivale a{" "}
                    {moeda(
                      plano.valor /
                        12
                    )}{" "}
                    por mês.
                  </p>
                )}


                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {plano.descricao}
                </p>


                <div className="mt-5 space-y-2 text-sm text-slate-700">
                  <div>
                    ✓ Diligências
                    ilimitadas
                  </div>

                  <div>
                    ✓ Usuários
                    ilimitados
                  </div>

                  <div>
                    ✓ Todas as
                    funcionalidades
                    do NOTE LITIS
                  </div>
                </div>


                <button
                  type="button"
                  disabled={
                    processando !==
                    null
                  }
                  onClick={() =>
                    contratar(
                      plano.codigo
                    )
                  }
                  className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregando
                    ? "Abrindo ambiente seguro..."
                    : anual
                      ? "Contratar plano anual"
                      : "Contratar plano mensal"}
                </button>
              </div>
            );
          }
        )}
      </div>


      <p className="mt-4 text-xs leading-5 text-slate-500">
        O pagamento é realizado em
        ambiente seguro do Asaas.
        Durante o período gratuito,
        a primeira cobrança seguirá
        a data indicada na sua
        contratação.
      </p>
    </section>
  );
}