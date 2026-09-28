import type {
  RascunhoDiligencia,
} from "./tipos";

export const RASCUNHO_DILIGENCIA_INICIAL:
  RascunhoDiligencia = {
    tipo_diligencia: "",
    modalidade: "",

    numero_processo: "",

    parte_autora: "",
    parte_re: "",

    data_diligencia: "",
    horario: "",

    vara: "",
    comarca: "",
    uf: "",
    local: "",

    advogado: null,

    necessita_preposto: null,
    preposto: null,

    testemunhas_status: null,
    testemunhas: [],

    contratacao_status: null,
    contratacao_tipo: null,

    contratacao_advogado_valor: "",
    contratacao_advogado_pagamento_combinado_em:
      "",

    contratacao_preposto_valor: "",
    contratacao_preposto_pagamento_combinado_em:
      "",

    orientacoes_encaminhadas:
      false,

    observacoes: "",
  };