import {
  type NextRequest,
  NextResponse,
} from "next/server";

import {
  updateSession,
} from "@/lib/supabase/proxy";


export async function proxy(
  request: NextRequest
) {
  /*
   * O webhook do Asaas é chamado
   * diretamente pelos servidores do Asaas
   * e não possui sessão de usuário.
   *
   * A autenticação dele acontece dentro
   * da própria rota por meio do header:
   *
   * asaas-access-token
   */
  if (
    request.nextUrl.pathname ===
    "/api/asaas/webhook"
  ) {
    return NextResponse.next();
  }


  return await updateSession(
    request
  );
}


export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};