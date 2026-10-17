import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  Gavel,
  History,
  LockKeyhole,
  Scale,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import {
  OFERTA_COMERCIAL,
} from "./configuracao-comercial";


const pilares = [
  {
    icone:
      CalendarDays,

    titulo:
      "Pauta organizada",

    texto:
      "Centralize diligências, datas, horários, responsáveis, orientações e informações relevantes em um único ambiente.",
  },

  {
    icone:
      AlertTriangle,

    titulo:
      "Conflitos sob controle",

    texto:
      "Identifique situações que exigem revisão antes do ato, inclusive conflitos envolvendo advogados, prepostos e testemunhas.",
  },

  {
    icone:
      History,

    titulo:
      "Histórico preservado",

    texto:
      "Mantenha contexto e rastreabilidade para que a equipe não precise reconstruir diariamente o que já foi tratado.",
  },
];


const funcionalidades = [
  "Cadastro e acompanhamento de diligências",
  "Importação de pautas por Excel",
  "Controle de advogados, prepostos e testemunhas",
  "Alertas de conflitos de agenda",
  "Identificação de pendências operacionais",
  "Registro de orientações e observações",
  "Informações financeiras vinculadas à diligência",
  "Histórico e auditoria de ações",
];


const perguntas = [
  {
    titulo:
      "O NOTE LITIS exige contratação de correspondentes pela Encontre Correspondente?",

    resposta:
      "Não. O sistema pode ser utilizado com advogados internos, correspondentes contratados diretamente, prepostos ou outros profissionais definidos pelo próprio escritório.",
  },

  {
    titulo:
      "O sistema serve apenas para grandes escritórios?",

    resposta:
      "Não. O NOTE LITIS foi pensado especialmente para pequenos e médios escritórios que já administram volume suficiente para sentir os riscos de planilhas dispersas, conferências repetitivas e conflitos de agenda.",
  },

  {
    titulo:
      "Posso trabalhar mais de uma diligência futura do mesmo processo?",

    resposta:
      "Sim. O sistema permite múltiplas diligências futuras e sinaliza situações que merecem conferência antes da continuidade do cadastro.",
  },

  {
    titulo:
      "O NOTE LITIS substitui a conferência profissional da equipe?",

    resposta:
      "Não. O sistema organiza informações e oferece alertas operacionais, mas a análise jurídica, o acompanhamento processual e as decisões profissionais continuam sob responsabilidade do escritório.",
  },
];


function Marca() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#10243e]">
        <Scale className="h-5 w-5" />
      </div>

      <div>
        <p className="font-serif text-lg font-semibold tracking-[0.08em] text-[#10243e]">
          NOTE LITIS
        </p>

        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Gestão de Diligências
        </p>
      </div>
    </div>
  );
}


function LinhaInstitucional() {
  return (
    <div className="h-px w-full bg-slate-200" />
  );
}


export default function SitePage() {
  return (
    <main className="min-h-screen bg-[#fbfbfa] text-slate-900">

      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-[#fbfbfa]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/site"
            aria-label="NOTE LITIS"
          >
            <Marca />
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-600 lg:flex">
            <a
              href="#solucao"
              className="transition-colors hover:text-[#10243e]"
            >
              O sistema
            </a>

            <a
              href="#conflitos"
              className="transition-colors hover:text-[#10243e]"
            >
              Conflitos
            </a>

            <a
              href="#funcionalidades"
              className="transition-colors hover:text-[#10243e]"
            >
              Funcionalidades
            </a>

            <a
              href="#duvidas"
              className="transition-colors hover:text-[#10243e]"
            >
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="hidden rounded-md px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 sm:inline-flex"
            >
              Acessar sistema
            </Link>

            <Link
              href="/auth/sign-up"
              className="inline-flex items-center gap-2 rounded-md bg-[#10243e] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#183455]"
            >
              Conhecer o NOTE LITIS

              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>


      {/* =================================================
          HERO
      ================================================= */}

      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-32">
          <div>
            <div className="mb-7 flex items-center gap-3">
              <div className="h-px w-10 bg-[#10243e]" />

              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#10243e]">
                Tecnologia para uma advocacia organizada
              </p>
            </div>

            <h1 className="max-w-4xl font-serif text-4xl font-semibold leading-[1.12] tracking-[-0.025em] text-[#10243e] sm:text-5xl lg:text-[3.65rem]">
              Controle de pauta para quem não pode descobrir um problema tarde demais.
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600">
              O NOTE LITIS organiza diligências, participantes, pendências e
              conflitos em uma única operação — para que o escritório trabalhe
              com mais previsibilidade, segurança e clareza.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#10243e] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#183455]"
              >
                Conhecer o sistema

                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#solucao"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Entender a solução

                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-200 pt-6 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#10243e]" />
                Controle por usuários
              </span>

              <span className="inline-flex items-center gap-2">
                <History className="h-4 w-4 text-[#10243e]" />
                Rastreabilidade
              </span>

              <span className="inline-flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-[#10243e]" />
                Ambiente autenticado
              </span>
            </div>
          </div>


          {/* QUADRO VISUAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Visão operacional
                </p>

                <p className="mt-1 font-serif text-xl font-semibold text-[#10243e]">
                  Pauta do escritório
                </p>
              </div>

              <BadgeCheck className="h-5 w-5 text-emerald-700" />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-[#fafafa] p-4">
                <p className="text-xs text-slate-500">
                  Diligências
                </p>

                <p className="mt-2 font-serif text-2xl font-semibold text-[#10243e]">
                  148
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-[#fafafa] p-4">
                <p className="text-xs text-slate-500">
                  Pendências
                </p>

                <p className="mt-2 font-serif text-2xl font-semibold text-[#10243e]">
                  12
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-[#fafafa] p-4">
                <p className="text-xs text-slate-500">
                  Conflitos
                </p>

                <p className="mt-2 font-serif text-2xl font-semibold text-[#10243e]">
                  03
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                <div>
                  <p className="text-sm font-semibold text-amber-950">
                    Conflito identificado
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-900/75">
                    Advogado vinculado a compromissos em horários incompatíveis.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {[
                "Audiência trabalhista · Recife/PE",
                "Audiência virtual · São Paulo/SP",
                "Diligência externa · Salvador/BA",
              ].map(
                (
                  item,
                  indice
                ) => (
                  <div
                    key={
                      item
                    }
                    className="flex items-center justify-between gap-4 px-4 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-xs text-slate-400">
                        0{indice + 1}
                      </span>

                      <p className="text-sm font-medium text-slate-700">
                        {item}
                      </p>
                    </div>

                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>


      {/* =================================================
          POSICIONAMENTO
      ================================================= */}

      <section
        id="solucao"
        className="scroll-mt-24 border-b border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#10243e]">
                O desafio da operação
              </p>

              <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight text-[#10243e] sm:text-4xl">
                Quando a pauta cresce, o risco não está apenas no volume.
              </h2>
            </div>

            <div className="space-y-6 text-lg leading-8 text-slate-600">
              <p>
                Está na informação espalhada, na confirmação que não chegou,
                no profissional designado para dois compromissos, na orientação
                que ficou em uma conversa e na necessidade de conferir tudo
                novamente.
              </p>

              <p>
                O NOTE LITIS foi pensado para transformar essa rotina em uma
                operação organizada, com visão do que está resolvido e do que
                ainda exige atenção.
              </p>
            </div>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {pilares.map(
              (
                item
              ) => {
                const Icone =
                  item.icone;

                return (
                  <article
                    key={
                      item.titulo
                    }
                    className="rounded-xl border border-slate-200 bg-[#fbfbfa] p-6"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#10243e]">
                      <Icone className="h-5 w-5" />
                    </div>

                    <h3 className="mt-5 font-serif text-xl font-semibold text-[#10243e]">
                      {item.titulo}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.texto}
                    </p>
                  </article>
                );
              }
            )}
          </div>
        </div>
      </section>


      {/* =================================================
          CONFLITOS
      ================================================= */}

      <section
        id="conflitos"
        className="scroll-mt-24 border-b border-slate-200 bg-[#f6f7f8]"
      >
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#10243e]">
              Um ponto crítico da controladoria
            </p>

            <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight text-[#10243e] sm:text-4xl">
              O conflito que o escritório identifica antes custa menos do que o conflito descoberto na última hora.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              O NOTE LITIS cruza informações da operação e sinaliza situações
              que merecem revisão antes da realização do ato.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Advogados vinculados a agendas incompatíveis",
                "Prepostos designados para compromissos conflitantes",
                "Testemunhas envolvidas em atos próximos",
                "Diligências que exigem conferência antes da confirmação",
              ].map(
                (
                  item
                ) => (
                  <div
                    key={
                      item
                    }
                    className="flex items-start gap-3"
                  >
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#10243e]" />

                    <p className="text-sm leading-6 text-slate-700">
                      {item}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Exemplo de atenção operacional
            </p>

            <div className="mt-5 rounded-xl border border-red-200 bg-red-50/70 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

                <div>
                  <p className="font-semibold text-red-950">
                    Possível incompatibilidade de agenda
                  </p>

                  <p className="mt-2 text-sm leading-6 text-red-900/75">
                    O mesmo advogado aparece vinculado a duas diligências
                    dentro da janela de conflito configurada.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  09:00 · Recife/PE
                </p>

                <p className="mt-1 font-medium">
                  Audiência trabalhista
                </p>
              </div>

              <div className="flex justify-center">
                <div className="h-5 w-px bg-slate-300" />
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  11:00 · Jaboatão dos Guararapes/PE
                </p>

                <p className="mt-1 font-medium">
                  Audiência de instrução
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              O alerta apoia a conferência da equipe e não substitui a análise profissional.
            </p>
          </div>
        </div>
      </section>


      {/* =================================================
          FUNCIONALIDADES
      ================================================= */}

      <section
        id="funcionalidades"
        className="scroll-mt-24 border-b border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#10243e]">
                Uma operação em um só lugar
              </p>

              <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight text-[#10243e] sm:text-4xl">
                Menos reconstrução. Mais continuidade.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600">
                O sistema reúne os pontos que normalmente ficam distribuídos
                entre planilhas, mensagens e controles paralelos.
              </p>
            </div>

            <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
              {funcionalidades.map(
                (
                  item
                ) => (
                  <div
                    key={
                      item
                    }
                    className="flex items-start gap-3 border-b border-slate-200 py-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />

                    <p className="text-sm leading-6 text-slate-700">
                      {item}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-[#fbfbfa] p-6">
              <BriefcaseBusiness className="h-5 w-5 text-[#10243e]" />

              <h3 className="mt-4 font-serif text-lg font-semibold text-[#10243e]">
                Equipe interna
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Utilize o NOTE LITIS com advogados e profissionais do próprio escritório.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-[#fbfbfa] p-6">
              <UsersRound className="h-5 w-5 text-[#10243e]" />

              <h3 className="mt-4 font-serif text-lg font-semibold text-[#10243e]">
                Correspondentes externos
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Gerencie profissionais contratados diretamente ou por outros fornecedores.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-[#fbfbfa] p-6">
              <FileSpreadsheet className="h-5 w-5 text-[#10243e]" />

              <h3 className="mt-4 font-serif text-lg font-semibold text-[#10243e]">
                Pautas em volume
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Importe dados por Excel e trate a operação com mais padronização.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* =================================================
          SEGURANÇA / CONFIANÇA
      ================================================= */}

      <section className="border-b border-slate-200 bg-[#10243e] text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <Gavel className="h-7 w-7 text-slate-300" />

            <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
              Tecnologia sem perder a sobriedade que a advocacia exige.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icone:
                  ShieldCheck,
                texto:
                  "Acesso controlado por usuários e perfis.",
              },
              {
                icone:
                  History,
                texto:
                  "Registro de ações para preservar rastreabilidade.",
              },
              {
                icone:
                  LockKeyhole,
                texto:
                  "Ambiente autenticado para informações operacionais.",
              },
              {
                icone:
                  Scale,
                texto:
                  "Termos de Uso e Política de Privacidade disponíveis ao usuário.",
              },
            ].map(
              (
                item
              ) => {
                const Icone =
                  item.icone;

                return (
                  <div
                    key={
                      item.texto
                    }
                    className="flex gap-3 border-t border-white/15 pt-4"
                  >
                    <Icone className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />

                    <p className="text-sm leading-6 text-slate-200">
                      {item.texto}
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>


      {/* =================================================
          BLOCO COMERCIAL ÚNICO
          NÃO REPETIR BETA OU PREÇO FORA DESTA SEÇÃO
      ================================================= */}

      <section className="border-b border-slate-200 bg-[#f6f7f8]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#10243e]">
                  {OFERTA_COMERCIAL.rotulo}
                </p>

                <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight text-[#10243e]">
                  {OFERTA_COMERCIAL.destaque}
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {OFERTA_COMERCIAL.descricao}
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-[#fbfbfa] text-[#10243e]">
                <BadgeCheck className="h-5 w-5" />
              </div>
            </div>

            <LinhaInstitucional />

            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                Cadastro realizado diretamente no ambiente do NOTE LITIS.
              </div>

              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#10243e] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#183455]"
              >
                {OFERTA_COMERCIAL.textoBotao}

                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* =================================================
          DÚVIDAS
      ================================================= */}

      <section
        id="duvidas"
        className="scroll-mt-24 border-b border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#10243e]">
              Perguntas frequentes
            </p>

            <h2 className="mt-4 font-serif text-3xl font-semibold text-[#10243e] sm:text-4xl">
              Informações objetivas antes de começar.
            </h2>
          </div>

          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {perguntas.map(
              (
                item
              ) => (
                <details
                  key={
                    item.titulo
                  }
                  className="group py-5"
                >
                  <summary className="cursor-pointer list-none pr-8 font-medium text-slate-900 marker:hidden">
                    {item.titulo}
                  </summary>

                  <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
                    {item.resposta}
                  </p>
                </details>
              )
            )}
          </div>
        </div>
      </section>


      {/* =================================================
          CTA FINAL — SEM PREÇO / BETA
      ================================================= */}

      <section className="bg-[#fbfbfa]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="flex flex-col gap-8 border-y border-slate-200 py-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-serif text-2xl font-semibold text-[#10243e] sm:text-3xl">
                Uma pauta bem administrada começa pela clareza da operação.
              </p>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Conheça o NOTE LITIS e veja como ele pode se adaptar à rotina do seu escritório.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#10243e] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#183455]"
              >
                Ir para o NOTE LITIS

                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Já sou usuário
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* =================================================
          RODAPÉ
      ================================================= */}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Marca />

              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
                Gestão de diligências jurídicas com foco em organização,
                previsibilidade e segurança operacional.
              </p>

              <p className="mt-3 text-xs text-slate-400">
                by Encontre Correspondente
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              <Link
                href="/termos"
                className="hover:text-[#10243e]"
              >
                Termos de Uso
              </Link>

              <Link
                href="/privacidade"
                className="hover:text-[#10243e]"
              >
                Privacidade e LGPD
              </Link>

              <Link
                href="/auth/login"
                className="hover:text-[#10243e]"
              >
                Acessar sistema
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-400">
            © 2026 NOTE LITIS · ENCONTRE CORRESPONDENTE INOVA SIMPLES (I.S.)
          </div>
        </div>
      </footer>
    </main>
  );
}
