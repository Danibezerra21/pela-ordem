import type {
  RascunhoDiligencia,
  ModalidadeDiligencia,
  TestemunhasStatus,
  ContratacaoStatus,
  ContratacaoTipo,
} from "./tipos";

type CampoTexto =
  | "tipo_diligencia"
  | "numero_processo"
  | "parte_autora"
  | "parte_re"
  | "data_diligencia"
  | "horario"
  | "vara"
  | "comarca"
  | "uf"
  | "local"
  | "contratacao_advogado_valor"
  | "contratacao_advogado_pagamento_combinado_em"
  | "contratacao_preposto_valor"
  | "contratacao_preposto_pagamento_combinado_em"
  | "observacoes";

export type AcaoRascunhoDiligencia =
  | {
      type: "ALTERAR_TEXTO";
      campo: CampoTexto;
      valor: string;
    }
  | {
      type: "ALTERAR_MODALIDADE";
      valor: ModalidadeDiligencia;
    }
  | {
      type: "DEFINIR_ADVOGADO";
      valor: RascunhoDiligencia["advogado"];
    }
  | {
      type: "DEFINIR_NECESSIDADE_PREPOSTO";
      valor: boolean | null;
    }
  | {
      type: "DEFINIR_PREPOSTO";
      valor: RascunhoDiligencia["preposto"];
    }
  | {
      type: "DEFINIR_TESTEMUNHAS_STATUS";
      valor: TestemunhasStatus;
    }
  | {
      type: "ADICIONAR_TESTEMUNHA";
      valor: RascunhoDiligencia["testemunhas"][number];
    }
  | {
      type: "REMOVER_TESTEMUNHA";
      id: string;
    }
  | {
      type: "DEFINIR_CONTRATACAO_STATUS";
      valor: ContratacaoStatus;
    }
  | {
      type: "DEFINIR_CONTRATACAO_TIPO";
      valor: ContratacaoTipo;
    }
  | {
      type: "DEFINIR_ORIENTACOES_ENCAMINHADAS";
      valor: boolean;
    }
  | {
      type: "SUBSTITUIR_RASCUNHO";
      valor: RascunhoDiligencia;
    }
  | {
      type: "LIMPAR_RASCUNHO";
      valor: RascunhoDiligencia;
    };

export function reducerRascunhoDiligencia(
  estado: RascunhoDiligencia,
  acao: AcaoRascunhoDiligencia
): RascunhoDiligencia {
  switch (acao.type) {
    case "ALTERAR_TEXTO":
      return {
        ...estado,
        [acao.campo]:
          acao.campo === "uf"
            ? acao.valor
                .toUpperCase()
                .slice(0, 2)
            : acao.valor,
      };

    case "ALTERAR_MODALIDADE":
      return {
        ...estado,
        modalidade: acao.valor,
      };

    case "DEFINIR_ADVOGADO":
      return {
        ...estado,
        advogado: acao.valor,
      };

    case "DEFINIR_NECESSIDADE_PREPOSTO":
      return {
        ...estado,

        necessita_preposto:
          acao.valor,

        /*
         * Se o usuário disser que não
         * precisará de preposto — ou limpar
         * a decisão — não pode permanecer
         * um preposto silenciosamente
         * vinculado ao rascunho.
         */
        preposto:
          acao.valor === true
            ? estado.preposto
            : null,
      };

    case "DEFINIR_PREPOSTO":
      /*
       * Só permitimos manter preposto quando
       * a decisão operacional for "Sim".
       */
      if (
        estado.necessita_preposto !==
        true
      ) {
        return {
          ...estado,
          preposto: null,
        };
      }

      return {
        ...estado,
        preposto: acao.valor,
      };

    case "DEFINIR_TESTEMUNHAS_STATUS":
      return {
        ...estado,

        testemunhas_status:
          acao.valor,

        /*
         * Confirmadas podem manter a lista.
         *
         * Desnecessárias ou sem seleção
         * não podem manter testemunhas
         * vinculadas escondidas.
         */
        testemunhas:
          acao.valor ===
          "confirmadas"
            ? estado.testemunhas
            : [],
      };

    case "ADICIONAR_TESTEMUNHA": {
      if (
        estado.testemunhas_status !==
        "confirmadas"
      ) {
        return estado;
      }

      const jaExiste =
        estado.testemunhas.some(
          (testemunha) =>
            testemunha.id ===
            acao.valor.id
        );

      if (jaExiste) {
        return estado;
      }

      return {
        ...estado,
        testemunhas: [
          ...estado.testemunhas,
          acao.valor,
        ],
      };
    }

    case "REMOVER_TESTEMUNHA":
      return {
        ...estado,

        testemunhas:
          estado.testemunhas.filter(
            (testemunha) =>
              testemunha.id !==
              acao.id
          ),
      };

    case "DEFINIR_CONTRATACAO_STATUS":
      /*
       * Se a contratação deixou de ser
       * confirmada, nenhuma informação
       * financeira pode continuar associada
       * silenciosamente ao rascunho.
       */
      if (
        acao.valor !== "confirmada"
      ) {
        return {
          ...estado,

          contratacao_status:
            acao.valor,

          contratacao_tipo: null,

          contratacao_advogado_valor:
            "",

          contratacao_advogado_pagamento_combinado_em:
            "",

          contratacao_preposto_valor:
            "",

          contratacao_preposto_pagamento_combinado_em:
            "",
        };
      }

      return {
        ...estado,

        contratacao_status:
          "confirmada",
      };

    case "DEFINIR_CONTRATACAO_TIPO": {
      /*
       * Tipo de contratação só faz sentido
       * quando a contratação estiver
       * confirmada.
       */
      if (
        estado.contratacao_status !==
        "confirmada"
      ) {
        return estado;
      }

      const tipo =
        acao.valor;

      const possuiAdvogado =
        tipo === "advogado" ||
        tipo ===
          "advogado_preposto";

      const possuiPreposto =
        tipo === "preposto" ||
        tipo ===
          "advogado_preposto";

      return {
        ...estado,

        contratacao_tipo: tipo,

        contratacao_advogado_valor:
          possuiAdvogado
            ? estado
                .contratacao_advogado_valor
            : "",

        contratacao_advogado_pagamento_combinado_em:
          possuiAdvogado
            ? estado
                .contratacao_advogado_pagamento_combinado_em
            : "",

        contratacao_preposto_valor:
          possuiPreposto
            ? estado
                .contratacao_preposto_valor
            : "",

        contratacao_preposto_pagamento_combinado_em:
          possuiPreposto
            ? estado
                .contratacao_preposto_pagamento_combinado_em
            : "",
      };
    }

    case "DEFINIR_ORIENTACOES_ENCAMINHADAS":
      return {
        ...estado,

        orientacoes_encaminhadas:
          acao.valor,
      };

    case "SUBSTITUIR_RASCUNHO":
      return acao.valor;

    case "LIMPAR_RASCUNHO":
      return acao.valor;

    default:
      return estado;
  }
}