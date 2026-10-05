"use client";

import {
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  useFormStatus,
} from "react-dom";

export function BotaoReenviarConvite() {
  const {
    pending,
  } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="
        inline-flex
        w-full
        items-center
        justify-center
        gap-2
        rounded-lg
        border
        border-amber-300
        bg-amber-50
        px-4
        py-2.5
        text-sm
        font-medium
        text-amber-900
        transition
        hover:bg-amber-100
        disabled:cursor-not-allowed
        disabled:opacity-70
      "
    >
      {pending ? (
        <>
          <Loader2
            className="h-4 w-4 animate-spin"
          />

          Reenviando convite...
        </>
      ) : (
        <>
          <RefreshCw
            className="h-4 w-4"
          />

          Reenviar convite
        </>
      )}
    </button>
  );
}