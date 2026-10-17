import type { ReactNode } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  FileText,
  ShieldCheck,
} from "lucide-react";

import {
  CNPJ_EMPRESA,
  DOCUMENTOS_LEGAIS_VIGENCIA,
  EMAIL_PRIVACIDADE,
  NOME_EMPRESARIAL,
  TERMOS_USO_VERSAO,
} from "@/lib/legal";

export const metadata = {
  title:
    "Termos de Uso | NOTE LITIS",

  description:
    "Termos de Uso do NOTE LITIS, sistema de gestão de diligências jurídicas.",
};

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children:
    ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight text-slate-950">
        {titulo}
      </h2>

      <div className="space-y-3 text-sm leading-7 text-slate-700">
        {children}
      </div>
    </section>
  );
}

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <article className="mx-auto w-full max-w-4xl rounded-2xl border bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b1f3a] text-white">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  NOTE LITIS
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                  Termos de Uso
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              Estes Termos disciplinam o acesso e a utilização do NOTE LITIS,
              solução tecnológica disponibilizada pela Encontre Correspondente
              para gestão de pautas e diligências jurídicas.
            </p>
          </div>

          <div className="shrink-0 rounded-xl border bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
            <p>
              Versão{" "}
              <strong className="text-slate-900">
                {TERMOS_USO_VERSAO}
              </strong>
            </p>

            <p>
              Vigência:{" "}
              <strong className="text-slate-900">
                {DOCUMENTOS_LEGAIS_VIGENCIA}
              </strong>
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-9">
          <Secao titulo="1. Identificação e aplicação">
            <p>
              O NOTE LITIS é uma plataforma de gestão de diligências jurídicas
              disponibilizada por{" "}
              <strong>
                {NOME_EMPRESARIAL}
              </strong>
              , inscrita no CNPJ sob o nº{" "}
              <strong>
                {CNPJ_EMPRESA}
              </strong>
              , doravante também denominada Encontre Correspondente.
            </p>

            <p>
              Estes Termos se aplicam aos escritórios, empresas, profissionais e
              demais usuários autorizados que utilizem o sistema.
            </p>

            <p>
              Ao aceitar estes Termos, o usuário declara possuir capacidade para
              utilizá-lo e, quando atuar como usuário Master ou representante de
              uma organização, declara possuir autorização para realizar o
              cadastro e administrar a respectiva conta.
            </p>
          </Secao>

          <Secao titulo="2. Objeto do NOTE LITIS">
            <p>
              O NOTE LITIS disponibiliza recursos destinados à organização e ao
              acompanhamento de diligências, pautas, participantes, orientações,
              pagamentos, pendências, conflitos operacionais, auditoria e outros
              elementos relacionados à rotina de gestão jurídica.
            </p>

            <p>
              O sistema constitui ferramenta de apoio operacional. Ele não
              substitui a análise profissional, a conferência de prazos,
              publicações, processos, agendas, documentos, intimações ou qualquer
              outra obrigação jurídica ou administrativa atribuída ao usuário ou
              à organização contratante.
            </p>
          </Secao>

          <Secao titulo="3. Independência em relação à contratação de correspondentes">
            <p>
              A utilização do NOTE LITIS é independente da contratação de
              serviços de correspondência jurídica pela Encontre Correspondente.
              O usuário poderá utilizar o sistema com profissionais internos,
              profissionais contratados diretamente, correspondentes de terceiros
              ou outras estruturas operacionais compatíveis com sua realidade.
            </p>

            <p>
              Eventuais serviços de intermediação ou correspondência jurídica
              contratados junto à Encontre Correspondente possuem condições
              comerciais e operacionais próprias e não se presumem incluídos na
              simples utilização do NOTE LITIS.
            </p>
          </Secao>

          <Secao titulo="4. Cadastro, credenciais e perfis de acesso">
            <p>
              O usuário é responsável pela veracidade das informações fornecidas,
              pela proteção de suas credenciais e pela utilização realizada em
              sua conta. Senhas são pessoais e não devem ser compartilhadas.
            </p>

            <p>
              O usuário Master é responsável pela administração dos usuários
              vinculados à sua organização, incluindo convites, permissões,
              inativações e demais ações disponibilizadas pelo sistema.
            </p>

            <p>
              Cada usuário deverá utilizar apenas o acesso que lhe foi atribuído,
              sendo vedada a utilização de credenciais de terceiros.
            </p>
          </Secao>

          <Secao titulo="5. Dados e informações inseridos pelo usuário">
            <p>
              A organização usuária é responsável pela origem, exatidão,
              atualização, pertinência e licitude dos dados que inserir no NOTE
              LITIS, incluindo dados relacionados a processos, partes, advogados,
              prepostos, testemunhas, correspondentes, clientes, instruções,
              observações e informações financeiras.
            </p>

            <p>
              Cabe à organização usuária assegurar que possui fundamento jurídico
              adequado para realizar o tratamento dos dados pessoais inseridos no
              sistema e limitar o conteúdo ao necessário para suas finalidades.
            </p>

            <p>
              Informações especialmente sensíveis, sigilosas ou sujeitas a dever
              profissional de confidencialidade devem ser inseridas somente
              quando necessárias e em conformidade com as obrigações legais,
              éticas e profissionais aplicáveis.
            </p>
          </Secao>

          <Secao titulo="6. Alertas, conflitos e automações">
            <p>
              Recursos de alerta, conflito de agenda, duplicidade, pendência,
              validação, normalização ou automação têm natureza auxiliar e
              dependem das informações cadastradas no sistema.
            </p>

            <p>
              A ausência de alerta não constitui garantia absoluta de inexistência
              de conflito, duplicidade, prazo, erro ou risco operacional. O
              usuário permanece responsável pela conferência das informações
              relevantes para sua atividade.
            </p>
          </Secao>

          <Secao titulo="7. Versão beta e evolução do produto">
            <p>
              Durante períodos identificados como versão beta, o NOTE LITIS
              poderá ser disponibilizado gratuitamente para utilização real com
              o objetivo de validação, aprimoramento e evolução do produto.
            </p>

            <p>
              A gratuidade durante a beta não gera direito adquirido à utilização
              gratuita após seu encerramento. Quando houver data prevista de
              encerramento, ela será informada no próprio sistema.
            </p>

            <p>
              Funcionalidades poderão ser aprimoradas, reorganizadas ou
              substituídas desde que preservada a finalidade essencial do
              serviço e observadas as obrigações assumidas perante usuários com
              contratação vigente.
            </p>
          </Secao>

          <Secao titulo="8. Planos, pagamentos, renovação e cancelamento">
            <p>
              Quando o uso do NOTE LITIS estiver sujeito a contratação paga,
              valores, ciclo de cobrança, período de vigência, renovação e demais
              condições comerciais serão apresentados ao usuário no momento da
              contratação.
            </p>

            <p>
              O pagamento de um período garante o acesso durante a respectiva
              vigência, observadas as condições contratadas. O cancelamento não
              elimina o período já pago, salvo hipótese legal ou disposição
              expressa em sentido diverso.
            </p>

            <p>
              Alterações de plano ou ciclo realizadas durante período já pago
              poderão ser programadas para o término da vigência atual, evitando
              cobrança concorrente pelo mesmo período.
            </p>
          </Secao>

          <Secao titulo="9. Disponibilidade e manutenção">
            <p>
              A Encontre Correspondente empregará esforços razoáveis para manter
              o NOTE LITIS disponível e seguro, mas não garante funcionamento
              ininterrupto ou livre de indisponibilidades decorrentes de
              manutenção, falhas de internet, serviços de terceiros, caso
              fortuito, força maior ou eventos fora de seu controle razoável.
            </p>

            <p>
              O usuário deve manter procedimentos próprios de contingência para
              informações e obrigações críticas de sua atividade jurídica.
            </p>
          </Secao>

          <Secao titulo="10. Uso permitido e condutas vedadas">
            <p>
              O NOTE LITIS deve ser utilizado de forma lícita e compatível com
              sua finalidade. É vedado utilizar a plataforma para prática ilícita,
              acesso não autorizado, violação de direitos de terceiros,
              introdução de código malicioso, tentativa de comprometer a
              segurança, engenharia reversa indevida, exploração abusiva da
              infraestrutura ou qualquer ação que prejudique outros usuários ou o
              serviço.
            </p>
          </Secao>

          <Secao titulo="11. Propriedade intelectual">
            <p>
              A marca NOTE LITIS, a identidade visual, a estrutura do sistema,
              interfaces, códigos, textos, funcionalidades e demais elementos
              próprios da plataforma são protegidos pela legislação aplicável,
              ressalvados componentes, bibliotecas e direitos de terceiros.
            </p>

            <p>
              A utilização do sistema não transfere ao usuário qualquer direito
              de propriedade intelectual além da licença de uso correspondente
              ao acesso legitimamente concedido.
            </p>
          </Secao>

          <Secao titulo="12. Proteção de dados pessoais">
            <p>
              O tratamento de dados pessoais relacionado ao NOTE LITIS observa a
              legislação aplicável, especialmente a Lei nº 13.709/2018 — Lei
              Geral de Proteção de Dados Pessoais (LGPD).
            </p>

            <p>
              As informações sobre categorias de dados, finalidades, papéis dos
              agentes de tratamento, compartilhamentos, retenção e direitos dos
              titulares estão descritas na{" "}
              <Link
                href="/privacidade"
                className="font-medium text-[#0b1f3a] underline underline-offset-4"
              >
                Política de Privacidade e Proteção de Dados
              </Link>
              .
            </p>
          </Secao>

          <Secao titulo="13. Suspensão e encerramento de acesso">
            <p>
              O acesso poderá ser suspenso ou encerrado em hipóteses de
              inadimplemento após o término do período pago, uso ilícito,
              comprometimento de segurança, violação material destes Termos,
              encerramento da relação contratual ou demais situações previstas
              em lei ou nas condições comerciais aplicáveis.
            </p>

            <p>
              Sempre que razoavelmente possível, serão preservados os direitos
              relativos ao período já contratado e às informações que devam ser
              mantidas por obrigação legal, exercício regular de direitos ou
              outras hipóteses legítimas.
            </p>
          </Secao>

          <Secao titulo="14. Responsabilidades">
            <p>
              A Encontre Correspondente responde pelos atos que lhe sejam
              legalmente imputáveis na disponibilização do NOTE LITIS. O usuário
              e a organização contratante respondem pelas decisões profissionais,
              instruções, cadastros, dados inseridos, gestão de sua equipe e uso
              que façam da plataforma.
            </p>

            <p>
              O NOTE LITIS não garante resultado processual, comparecimento de
              terceiros, cumprimento de obrigações profissionais externas ao
              sistema ou correção de dados originados de fontes controladas pelo
              usuário.
            </p>
          </Secao>

          <Secao titulo="15. Alterações destes Termos">
            <p>
              Estes Termos poderão ser atualizados para refletir mudanças
              legais, regulatórias, comerciais ou funcionais. Alterações
              relevantes serão identificadas por nova versão e, quando
              necessário, será solicitado novo aceite ao usuário.
            </p>
          </Secao>

          <Secao titulo="16. Suporte e contato">
            <p>
              Dúvidas relacionadas ao NOTE LITIS ou a estes Termos podem ser
              encaminhadas para{" "}
              <a
                href={`mailto:${EMAIL_PRIVACIDADE}`}
                className="font-medium text-[#0b1f3a] underline underline-offset-4"
              >
                {EMAIL_PRIVACIDADE}
              </a>
              .
            </p>

            <p>
              O suporte é realizado de forma assíncrona em dias úteis, dentro do
              horário de atendimento informado pela plataforma.
            </p>
          </Secao>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>

          <Link
            href="/privacidade"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#0b1f3a]"
          >
            <ShieldCheck className="h-4 w-4" />
            Política de Privacidade e LGPD
          </Link>
        </div>
      </article>
    </main>
  );
}
