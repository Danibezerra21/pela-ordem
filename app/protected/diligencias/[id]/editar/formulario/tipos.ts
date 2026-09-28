import type { RascunhoDiligencia } from "../../../nova/formulario/tipos";

export type ContratacaoDetalheEdicao = {
  id?: string;
  tipo_profissional:
    | "advogado"
    | "preposto";
  correspondente_id:
    | string
    | null;
  valor:
    | number
    | null;
  pagamento_combinado_em:
    | string
    | null;
  pago_em:
    | string
    | null;
};

export type DetalhesEdicaoDiligencia = {
  diligencia: {
    id: string;

    tipo_diligencia: string;

    modalidade:
      | "presencial"
      | "virtual";

    numero_processo:
      | string
      | null;

    parte_autora:
      | string
      | null;

    parte_re:
      | string
      | null;

    data_diligencia: string;

    horario: string;

    vara:
      | string
      | null;

    comarca:
      | string
      | null;

    uf:
      | string
      | null;

    local:
      | string
      | null;

    correspondente_id:
      | string
      | null;

    necessita_preposto:
      | boolean
      | null;

    preposto_id:
      | string
      | null;

    testemunhas_confirmadas:
      | boolean
      | null;

    testemunhas_status?:
      | "confirmadas"
      | "desnecessarias"
      | null;

    contratacao_confirmada?:
      | boolean
      | null;

    contratacao_status?:
      | "confirmada"
      | "desnecessaria"
      | null;

    contratacao_tipo?:
      | "advogado"
      | "preposto"
      | "advogado_preposto"
      | null;

    orientacoes_encaminhadas:
      boolean;

    observacoes:
      | string
      | null;

    status: string;
  };

  advogado:
    RascunhoDiligencia["advogado"];

  preposto:
    RascunhoDiligencia["preposto"];

  testemunhas:
    RascunhoDiligencia["testemunhas"];

  contratacoes?:
    | ContratacaoDetalheEdicao[]
    | null;
};