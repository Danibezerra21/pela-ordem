"use client";

import {
  Loader2,
  Send,
} from "lucide-react";

import {
  useFormStatus,
} from "react-dom";

export function BotaoEnviarConvite() {
  const {
    pending,
  } =
    useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="
        inline-flex
        min-w-[170px]
        items-center
        justify-center
        gap-2
        rounded-lg
        bg-[#0b1f3a]
        px-5
        py-2.5
        text-sm
        font-medium
        text-white
        transition
        hover:opacity-90
        disabled:cursor-not-allowed
        disabled:opacity-70
      "
    >
      {pending ? (
        <>
          <Loader2
            className="h-4 w-4 animate-spin"
          />

          Enviando convite...
        </>
      ) : (
        <>
          <Send
            className="h-4 w-4"
          />

          Enviar convite
        </>
      )}
    </button>
  );
}