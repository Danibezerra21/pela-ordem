import {
  AlertTriangle,
  Clock,
} from "lucide-react";

import type {
  ConflitoAgenda,
} from "./conflitos-agenda";

function formatarProcesso(
  processo: string | null
) {
  if (!processo) {
    return "Processo não informado";
  }

  const numeros =
    processo.replace(/\D/g, "");

  if (
    numeros.length !== 20
  ) {
    return processo;
  }

  return (
    `${numeros.slice(0, 7)}-` +
    `${numeros.slice(7, 9)}.` +
    `${numeros.slice(9, 13)}.` +
    `${numeros.slice(13, 14)}.` +
    `${numeros.slice(14, 16)}.` +
    `${numeros.slice(16, 20)}`
  );
}

function formatarDiferenca(
  minutos: number
) {
  if (minutos < 60) {
    return `${minutos} min`;
  }

  const horas =
    Math.floor(
      minutos / 60
    );

  const resto =
    minutos % 60;

  if (!resto) {
    return `${horas}h`;
  }

  return `${horas}h ${resto}min`;
}

function nomeTipo(
  tipo:
    ConflitoAgenda["participante_tipo"]
) {
  if (tipo === "advogado") {
    return "Advogado";
  }

  if (tipo === "preposto") {
    return "Preposto";
  }

  return "Testemunha";
}

export function ConflitosAgendaAlerta({
  conflitos,
}: {
  conflitos: ConflitoAgenda[];
}) {
  if (
    conflitos.length === 0
  ) {
    return null;
  }

  return (
    <div className="mt-7">
      <div className="rounded-lg border border-red-300 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

          <div>
            <h3 className="font-semibold text-red-950">
              Possível conflito de agenda
            </h3>

            <p className="mt-1 text-sm text-red-900">
              Um ou mais participantes já estão vinculados a outra diligência no mesmo dia e em intervalo inferior a 5 horas.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {conflitos.map(
          (
            conflito,
            indice
          ) => (
            <div
              key={`${conflito.participante_tipo}-${conflito.participante_id}-${conflito.diligencia.id}-${indice}`}
              className="rounded-lg border border-red-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {
                      conflito.participante_nome
                    }
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {nomeTipo(
                      conflito.participante_tipo
                    )}
                    {" • "}
                    {
                      conflito.identificacao
                    }
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
                  <Clock className="h-3.5 w-3.5" />

                  Intervalo:{" "}
                  {formatarDiferenca(
                    conflito.diferenca_minutos
                  )}
                </span>
              </div>

              <div className="mt-4 border-t pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Diligência conflitante
                </p>

                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <strong>
                    {
                      conflito
                        .diligencia
                        .horario
                        .slice(
                          0,
                          5
                        )
                    }
                  </strong>

                  <span>
                    {
                      conflito
                        .diligencia
                        .tipo_diligencia
                    }
                  </span>

                  <span>
                    {conflito
                      .diligencia
                      .modalidade ===
                    "presencial"
                      ? "Presencial"
                      : "Virtual"}
                  </span>
                </div>

                <p className="mt-3 text-sm font-medium">
                  Processo:{" "}
                  {formatarProcesso(
                    conflito
                      .diligencia
                      .numero_processo
                  )}
                </p>

                <p className="mt-2 text-sm">
                  {conflito
                    .diligencia
                    .parte_autora ||
                    "Parte autora não informada"}

                  {" x "}

                  {conflito
                    .diligencia
                    .parte_re ||
                    "Parte ré não informada"}
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  {conflito
                    .diligencia
                    .vara ||
                    "Vara não informada"}

                  {conflito
                    .diligencia
                    .comarca
                    ? ` • ${conflito.diligencia.comarca}`
                    : ""}

                  {conflito
                    .diligencia
                    .uf
                    ? `/${conflito.diligencia.uf}`
                    : ""}
                </p>

                {conflito
                  .diligencia
                  .local && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {
                      conflito
                        .diligencia
                        .local
                    }
                  </p>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}