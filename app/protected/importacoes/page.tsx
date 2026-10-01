import {
  FileSpreadsheet,
} from "lucide-react";

import {
  ImportadorPauta,
} from "./importador-pauta";

export default function ImportacoesPage() {
  return (
    <main className="w-full">
      <section className="mb-8">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-[#0b1f3a] p-3 text-white">
            <FileSpreadsheet className="h-6 w-6" />
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Gestão operacional
            </p>

            <h1 className="mt-1 text-4xl font-bold tracking-tight">
              Importar pauta
            </h1>

            <p className="mt-2 max-w-3xl text-muted-foreground">
              Importe diligências a partir de uma planilha Excel.
              Antes de qualquer cadastro, o NOTE LITIS apresentará os dados para conferência.
            </p>
          </div>
        </div>
      </section>

      <ImportadorPauta />
    </main>
  );
}