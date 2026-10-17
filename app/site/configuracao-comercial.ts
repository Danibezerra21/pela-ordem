/*
 * ============================================================
 * NOTE LITIS — CONFIGURAÇÃO COMERCIAL DO SITE
 * ============================================================
 *
 * ESTE É O ÚNICO ARQUIVO QUE DEVE SER ALTERADO QUANDO
 * A VERSÃO BETA TERMINAR E O PREÇO PASSAR A SER EXIBIDO.
 *
 * Regra:
 * - durante a Beta: mantenha o primeiro bloco ativo;
 * - quando houver preço: comente o primeiro bloco e
 *   descomente o segundo.
 *
 * Nenhuma outra parte do site contém informação de Beta
 * ou valor comercial.
 * ============================================================
 */

export const OFERTA_COMERCIAL = {
  /* =========================================================
     ATUAL — VERSÃO BETA
     ========================================================= */

  rotulo:
    "VERSÃO BETA DISPONÍVEL",

  destaque:
    "Acesso disponível durante o período Beta",

  descricao:
    "Conheça o NOTE LITIS em uma operação real do seu escritório. As condições comerciais para continuidade serão apresentadas antes do encerramento desse período.",

  textoBotao:
    "Começar no NOTE LITIS",

  /* =========================================================
     FUTURO — PLANO COMERCIAL

     Quando a Beta terminar:
     1. comente as quatro propriedades acima;
     2. descomente as quatro propriedades abaixo;
     3. substitua o valor e o texto conforme a oferta vigente.
     ========================================================= */

  // rotulo:
  //   "PLANO NOTE LITIS",

  // destaque:
  //   "R$ 00,00 / mês",

  // descricao:
  //   "Acesso ao NOTE LITIS para gestão de pautas e diligências jurídicas.",

  // textoBotao:
  //   "Contratar NOTE LITIS",
} as const;
