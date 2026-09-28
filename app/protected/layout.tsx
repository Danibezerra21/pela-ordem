import { Sidebar } from "@/components/pela-ordem/sidebar";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
      
       <Suspense fallback={null}>
        <Sidebar />
      </Suspense>

        <div className="min-w-0 flex-1">
          <main className="mx-auto w-full max-w-7xl px-8 py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}