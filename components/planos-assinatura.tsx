"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Plano = {
  codigo: string;
  nome: string;
  ciclo: "mensal" | "anual";
  valor: number;
  descricao: string | null;
};

type Props = {
  planos: Plano[];
  planoAtualCodigo?: string | null;
};

type RespostaCheckout = {
  ok?: boolean;
  tipo?: "checkout" | "aguardando_checkout" | "mudanca_agendada";
  checkoutId?: string;
  checkoutUrl?: string;
  contratacaoId?: string;
  primeiraCobrancaEm?: string;
  reutilizado?: boolean;
  mensagem?: string;
};

type RespostaConsultaCheckout = {
  ok?: boolean;
  pronto?: boolean;
  checkoutId?: string | null;
  checkoutUrl?: string;
  primeiraCobrancaEm?: string;
  mensagem?: string;
};

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function aguardar(milissegundos: number) {
  return new Promise<void>((resolver) => {
    window.setTimeout(resolver, milissegundos);
  });
}

export function PlanosAssinatura({ planos, planoAtualCodigo = null }: Props) {
  const router = useRouter();

  const [processando, setProcessando] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const economiaAnual = useMemo(() => {
    const mensal = planos.find((plano) => plano.ciclo === "mensal");
    const anual = planos.find((plano) => plano.ciclo === "anual");

    if (!mensal || !anual) {
      return null;
    }

    const economia = mensal.valor * 12 - anual.valor;

    return economia > 0 ? economia : null;
  }, [planos]);

  async function contratar(planoCodigo: string) {
    const abaPagamento = window.open("", "_blank");

    if (!abaPagamento) {
      setErro(
        "O navegador bloqueou a nova aba de pagamento. Permita pop-ups para o NOTE LITIS e tente novamente."
      );
      return;
    }

    abaPagamento.opener = null;
    abaPagamento.document.title = "NOTE LITIS - Pagamento";
    abaPagamento.document.body.innerHTML = `
      <main style="font-family: Arial, sans-serif; padding: 32px; color: #0f172a;">
        <p>Preparando o ambiente seguro de pagamento...</p>
      </main>
    `;

    setProcessando(planoCodigo);
    setMensagem(null);
    setErro(null);

    try {
      const resposta = await fetch("/api/asaas/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planoCodigo,
        }),
      });

      const dados = (await resposta.json().catch(() => null)) as
        | RespostaCheckout
        | null;

      if (!resposta.ok) {
        throw new Error(
          dados?.mensagem ?? "Não foi possível iniciar a contratação."
        );
      }

      if (dados?.tipo === "checkout" && dados.checkoutUrl) {
        abaPagamento.location.replace(dados.checkoutUrl);
        return;
      }

      if (dados?.tipo === "mudanca_agendada") {
        abaPagamento.close();

        setMensagem(
          dados.mensagem ?? "A alteração do plano foi agendada."
        );

        router.refresh();
        return;
      }

      if (dados?.tipo === "aguardando_checkout" && dados.contratacaoId) {
        let checkoutUrl: string | null = null;

        for (let tentativa = 0; tentativa < 30; tentativa += 1) {
          await aguardar(500);

          const consulta = await fetch(
            `/api/asaas/checkout?contratacaoId=${encodeURIComponent(
              dados.contratacaoId
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          const resultado = (await consulta.json().catch(() => null)) as
            | RespostaConsultaCheckout
            | null;

          if (!consulta.ok) {
            throw new Error(
              resultado?.mensagem ??
                "Não foi possível consultar o ambiente de pagamento."
            );
          }

          if (resultado?.pronto && resultado.checkoutUrl) {
            checkoutUrl = resultado.checkoutUrl;
            break;
          }
        }

        if (checkoutUrl) {
          abaPagamento.location.replace(checkoutUrl);
          return;
        }

        throw new Error(
          "O ambiente de pagamento foi criado, mas o link ainda não ficou disponível. Clique novamente em contratar."
        );
      }

      throw new Error("O servidor retornou uma resposta inesperada.");
    } catch (error: unknown) {
      if (!abaPagamento.closed) {
        abaPagamento.close();
      }

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar a contratação."
      );
    } finally {
      setProcessando(null);
    }
  }

  if (planos.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          {planoAtualCodigo ? "Alterar plano" : "Planos disponíveis"}
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          {planoAtualCodigo
            ? "Seu plano atual está identificado abaixo. A mudança para outro plano será agendada para o término do período já contratado."
            : "Todos os planos incluem usuários e diligências ilimitados."}
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
        {planos.map((plano) => {
          const anual = plano.ciclo === "anual";
          const carregando = processando === plano.codigo;
          const planoAtual = planoAtualCodigo === plano.codigo;

          return (
            <div
              key={plano.codigo}
              className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              {planoAtual ? (
                <div className="absolute right-4 top-4 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                  Plano atual
                </div>
              ) : (
                anual &&
                economiaAnual && (
                  <div className="absolute right-4 top-4 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                    Economize {moeda(economiaAnual)}
                  </div>
                )
              )}

              <div className="text-sm font-medium uppercase tracking-wide text-slate-500">
                {anual ? "Anual" : "Mensal"}
              </div>

              <div className="mt-3 flex items-end gap-1">
                <span className="text-3xl font-semibold text-slate-900">
                  {moeda(plano.valor)}
                </span>

                <span className="pb-1 text-sm text-slate-500">
                  {anual ? "/ano" : "/mês"}
                </span>
              </div>

              {anual && (
                <p className="mt-2 text-sm text-slate-600">
                  Equivale a {moeda(plano.valor / 12)} por mês.
                </p>
              )}

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {plano.descricao}
              </p>

              <div className="mt-5 space-y-2 text-sm text-slate-700">
                <div>✓ Diligências ilimitadas</div>
                <div>✓ Usuários ilimitados</div>
                <div>✓ Todas as funcionalidades do NOTE LITIS</div>
              </div>

              <button
                type="button"
                disabled={processando !== null || planoAtual}
                onClick={() => contratar(plano.codigo)}
                className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {planoAtual
                  ? "Plano atual"
                  : carregando
                    ? "Abrindo ambiente seguro..."
                    : planoAtualCodigo
                      ? anual
                        ? "Alterar para plano anual"
                        : "Alterar para plano mensal"
                      : anual
                        ? "Contratar plano anual"
                        : "Contratar plano mensal"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        {planoAtualCodigo
          ? "A alteração para outro plano é programada para o término do período já contratado, sem nova cobrança imediata."
          : "O pagamento é realizado em ambiente seguro do Asaas. O teste gratuito não exige cartão; ao contratar um plano, o período gratuito é encerrado e a primeira cobrança é realizada no ato da contratação."}
      </p>
    </section>
  );
}
