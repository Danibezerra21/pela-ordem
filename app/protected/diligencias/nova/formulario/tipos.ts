import type {
  AdvogadoParticipante,
  PrepostoParticipante,
  TestemunhaParticipante,
} from "../participantes-actions";

export type ModalidadeDiligencia =
  | ""
  | "presencial"
  | "virtual";

export type TestemunhasStatus =
  | null
  | "confirmadas"
  | "desnecessarias";

export type ContratacaoStatus =
  | null
  | "confirmada"
  | "desnecessaria";

export type ContratacaoTipo =
  | null
  | "advogado"
  | "preposto"
  | "advogado_preposto";

export type RascunhoDiligencia = {
  tipo_diligencia: string;
  modalidade: ModalidadeDiligencia;

  numero_processo: string;

  parte_autora: string;
  parte_re: string;

  data_diligencia: string;
  horario: string;

  vara: string;
  comarca: string;
  uf: string;
  local: string;

  advogado:
    | AdvogadoParticipante
    | null;

  necessita_preposto:
    | boolean
    | null;

  preposto:
    | PrepostoParticipante
    | null;

  testemunhas_status:
    TestemunhasStatus;

  testemunhas:
    TestemunhaParticipante[];

  contratacao_status:
    ContratacaoStatus;

  contratacao_tipo:
    ContratacaoTipo;

  contratacao_advogado_valor:
    string;

  contratacao_advogado_pagamento_combinado_em:
    string;

  contratacao_preposto_valor:
    string;

  contratacao_preposto_pagamento_combinado_em:
    string;

  orientacoes_encaminhadas:
    boolean;

  observacoes: string;
};

export type ErrosRascunhoDiligencia =
  Partial<
    Record<
      | keyof RascunhoDiligencia
      | "geral",
      string
    >
  >;