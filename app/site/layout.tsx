import type {
  Metadata,
} from "next";

import type {
  ReactNode,
} from "react";

export const metadata:
  Metadata = {
  title:
    "NOTE LITIS | Gestão de Diligências Jurídicas",

  description:
    "Gestão de diligências jurídicas com organização de pauta, controle de conflitos, pendências, participantes e histórico operacional.",

  keywords: [
    "gestão de diligências",
    "gestão de audiências",
    "controladoria jurídica",
    "pauta de audiências",
    "software jurídico",
    "correspondente jurídico",
    "NOTE LITIS",
  ],

  openGraph: {
    title:
      "NOTE LITIS | Gestão de Diligências Jurídicas",

    description:
      "Mais controle sobre pautas, diligências, conflitos e participantes.",

    type:
      "website",
  },
};

export default function SiteLayout({
  children,
}: {
  children:
    ReactNode;
}) {
  return children;
}
