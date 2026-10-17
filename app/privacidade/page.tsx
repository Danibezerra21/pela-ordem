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
  POLITICA_PRIVACIDADE_VERSAO,
} from "@/lib/legal";

export const metadata = {
  title:
    "Política de Privacidade e LGPD | NOTE LITIS",

  description:
    "Política de Privacidade e Proteção de Dados Pessoais do NOTE LITIS.",
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

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <article className="mx-auto w-full max-w-4xl rounded-2xl border bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b1f3a] text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  NOTE LITIS
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                  Política de Privacidade e Proteção de Dados
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              Esta Política explica como dados pessoais são tratados no contexto
              do NOTE LITIS e estabelece diretrizes de transparência em
              conformidade com a Lei nº 13.709/2018 — LGPD.
            </p>
          </div>

          <div className="shrink-0 rounded-xl border bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
            <p>
              Versão{" "}
              <strong className="text-slate-900">
                {POLITICA_PRIVACIDADE_VERSAO}
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
          <Secao titulo="1. Quem trata os dados no NOTE LITIS">
            <p>
              O NOTE LITIS é disponibilizado por{" "}
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
              Para dados relacionados à criação e administração da conta,
              autenticação, segurança, suporte, cobrança, relacionamento com o
              usuário e gestão da própria plataforma, a Encontre Correspondente
              atua como controladora, pois define as finalidades essenciais
              dessas operações.
            </p>

            <p>
              Para dados pessoais inseridos pelos escritórios e demais
              organizações usuárias no contexto de suas diligências e atividades
              jurídicas, a organização usuária define as finalidades e os dados
              necessários ao tratamento e, em regra, atua como controladora. O
              NOTE LITIS realiza o tratamento tecnológico desses dados em nome e
              de acordo com a utilização determinada pelo cliente, atuando, em
              regra, como operador.
            </p>
          </Secao>

          <Secao titulo="2. Quais dados podem ser tratados">
            <p>
              Dependendo da utilização do sistema, poderão ser tratados:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>
                dados de identificação e contato de usuários, como nome, e-mail,
                telefone e informações necessárias à autenticação;
              </li>

              <li>
                dados da organização cadastrada, como nome, CPF ou CNPJ utilizado
                no cadastro e informações administrativas;
              </li>

              <li>
                dados de utilização e segurança, como ações realizadas,
                registros de auditoria, datas e horários de operações e
                informações técnicas necessárias à proteção e ao funcionamento
                do serviço;
              </li>

              <li>
                dados de suporte e relacionamento, incluindo mensagens,
                solicitações, contatos e histórico de atendimento;
              </li>

              <li>
                dados comerciais e de pagamento necessários à contratação,
                confirmação de pagamento, faturamento e gestão do acesso;
              </li>

              <li>
                dados inseridos pelo cliente em diligências, como número de
                processo, partes, advogados, correspondentes, prepostos,
                testemunhas, CPF, OAB, orientações, observações, valores e demais
                informações operacionais relacionadas ao ato;
              </li>

              <li>
                outras informações que o próprio usuário decida inserir nos
                campos disponibilizados pelo sistema.
              </li>
            </ul>
          </Secao>

          <Secao titulo="3. Para quais finalidades os dados são utilizados">
            <p>
              Os dados tratados diretamente pela Encontre Correspondente podem
              ser utilizados para:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>
                criar, autenticar, manter e administrar contas e usuários;
              </li>

              <li>
                disponibilizar funcionalidades e executar o serviço contratado;
              </li>

              <li>
                manter segurança, rastreabilidade, prevenção de fraude,
                auditoria e integridade da plataforma;
              </li>

              <li>
                prestar suporte e responder solicitações;
              </li>

              <li>
                processar contratações, pagamentos e controles comerciais;
              </li>

              <li>
                cumprir obrigações legais, regulatórias e determinações de
                autoridades competentes;
              </li>

              <li>
                exercer direitos em processos judiciais, administrativos,
                arbitrais ou procedimentos de defesa;
              </li>

              <li>
                aprimorar estabilidade, desempenho, segurança e experiência de
                utilização do NOTE LITIS, respeitados os princípios da
                necessidade e da proporcionalidade.
              </li>
            </ul>
          </Secao>

          <Secao titulo="4. Bases legais">
            <p>
              O tratamento de dados pessoais não se fundamenta de forma única em
              consentimento. Conforme a finalidade e o contexto, podem ser
              utilizadas hipóteses previstas na LGPD, como execução de contrato
              ou procedimentos preliminares, cumprimento de obrigação legal ou
              regulatória, exercício regular de direitos e legítimo interesse,
              quando aplicável e após avaliação de compatibilidade com os
              direitos dos titulares.
            </p>

            <p>
              Quando determinada operação efetivamente depender de consentimento,
              ele será solicitado de forma específica e poderá ser revogado nos
              termos da legislação aplicável.
            </p>
          </Secao>

          <Secao titulo="5. Dados inseridos pelo cliente em diligências">
            <p>
              O escritório ou organização usuária é responsável por avaliar a
              necessidade, finalidade e base legal dos dados pessoais que inserir
              no NOTE LITIS.
            </p>

            <p>
              O cliente deve evitar inserir dados excessivos, desnecessários ou
              incompatíveis com a finalidade profissional e deve observar
              obrigações de sigilo, segredo profissional e demais normas
              aplicáveis à sua atividade.
            </p>

            <p>
              Quando houver dados pessoais sensíveis ou informações de crianças
              e adolescentes no contexto de processos e diligências, o cliente
              deverá possuir fundamento jurídico adequado para o tratamento e
              aplicar cautelas compatíveis com a natureza desses dados.
            </p>
          </Secao>

          <Secao titulo="6. Compartilhamento e fornecedores">
            <p>
              Para disponibilizar o NOTE LITIS, dados poderão ser tratados por
              fornecedores de infraestrutura, hospedagem, banco de dados,
              autenticação, envio de comunicações, segurança, suporte,
              processamento de pagamentos e outras tecnologias necessárias ao
              funcionamento da plataforma.
            </p>

            <p>
              Esses fornecedores recebem somente os dados necessários para a
              respectiva finalidade e ficam sujeitos às obrigações contratuais e
              legais aplicáveis.
            </p>

            <p>
              Dados também poderão ser compartilhados quando necessário ao
              cumprimento de obrigação legal, ordem judicial, requisição válida
              de autoridade pública ou exercício regular de direitos.
            </p>

            <p>
              A Encontre Correspondente não vende dados pessoais.
            </p>
          </Secao>

          <Secao titulo="7. Transferências internacionais">
            <p>
              Alguns fornecedores tecnológicos podem manter infraestrutura ou
              processar dados fora do Brasil. Quando houver transferência
              internacional de dados pessoais, serão observados os requisitos da
              LGPD e da regulamentação aplicável, incluindo a utilização dos
              mecanismos admitidos pela Autoridade Nacional de Proteção de Dados
              quando exigidos.
            </p>
          </Secao>

          <Secao titulo="8. Segurança da informação">
            <p>
              São adotadas medidas técnicas e administrativas compatíveis com a
              natureza do serviço e dos dados tratados, incluindo mecanismos de
              autenticação, controle de acesso, segregação por conta, registros
              de auditoria e outras medidas destinadas a reduzir riscos de
              acesso, alteração, destruição, perda ou divulgação não autorizada.
            </p>

            <p>
              Nenhum ambiente tecnológico é absolutamente imune a incidentes. Em
              caso de incidente envolvendo dados pessoais, serão avaliados os
              riscos e adotadas as providências previstas na legislação e na
              regulamentação aplicáveis.
            </p>
          </Secao>

          <Secao titulo="9. Retenção e eliminação">
            <p>
              Os dados serão mantidos pelo período necessário ao funcionamento da
              conta, execução do serviço e atendimento das finalidades descritas
              nesta Política.
            </p>

            <p>
              Após o encerramento da relação, determinados dados poderão ser
              mantidos pelo período necessário ao cumprimento de obrigações
              legais ou regulatórias, exercício regular de direitos, prevenção a
              fraudes, segurança ou outras hipóteses legítimas previstas na LGPD.
            </p>

            <p>
              Dados tratados em nome de clientes poderão estar sujeitos também
              às instruções do respectivo controlador e às obrigações legais
              aplicáveis à atividade jurídica.
            </p>
          </Secao>

          <Secao titulo="10. Direitos dos titulares">
            <p>
              Nos termos da LGPD e observadas as condições aplicáveis a cada
              hipótese, o titular pode solicitar medidas como confirmação da
              existência de tratamento, acesso, correção, informação sobre
              compartilhamento, anonimização, bloqueio ou eliminação de dados
              desnecessários ou tratados em desconformidade, portabilidade quando
              regulamentada e aplicável, além de outros direitos previstos em
              lei.
            </p>

            <p>
              Quando o NOTE LITIS atuar apenas como operador de dados inseridos
              por um cliente, determinadas solicitações poderão precisar ser
              direcionadas ao escritório ou organização que atua como
              controladora, sem prejuízo da cooperação técnica necessária.
            </p>
          </Secao>

          <Secao titulo="11. Canal de privacidade">
            <p>
              Solicitações relacionadas à proteção de dados pessoais podem ser
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
              Poderão ser solicitadas informações adicionais para confirmar a
              identidade do requerente e proteger os dados contra acesso
              indevido.
            </p>
          </Secao>

          <Secao titulo="12. Cookies e tecnologias necessárias">
            <p>
              O NOTE LITIS pode utilizar cookies ou mecanismos equivalentes
              estritamente necessários para autenticação, manutenção de sessão,
              segurança e funcionamento da plataforma.
            </p>

            <p>
              Caso sejam adotadas futuramente tecnologias não essenciais para
              publicidade, rastreamento ou finalidades que exijam escolhas
              adicionais do usuário, as informações e controles correspondentes
              serão apresentados de forma adequada.
            </p>
          </Secao>

          <Secao titulo="13. Crianças e adolescentes">
            <p>
              O NOTE LITIS é destinado ao uso profissional por escritórios,
              empresas e profissionais autorizados, não sendo oferecido como
              serviço direcionado diretamente a crianças ou adolescentes.
            </p>

            <p>
              Isso não impede que processos ou diligências legitimamente
              administrados por clientes contenham dados de menores. Nesses
              casos, a responsabilidade pela definição da finalidade e do
              fundamento jurídico do tratamento cabe ao respectivo controlador.
            </p>
          </Secao>

          <Secao titulo="14. Atualizações desta Política">
            <p>
              Esta Política poderá ser atualizada para refletir mudanças
              regulatórias, tecnológicas ou operacionais. Alterações relevantes
              serão identificadas por nova versão e, quando necessário, será
              solicitado novo aceite ou apresentada comunicação destacada aos
              usuários.
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
            href="/termos"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#0b1f3a]"
          >
            <FileText className="h-4 w-4" />
            Termos de Uso
          </Link>
        </div>
      </article>
    </main>
  );
}
