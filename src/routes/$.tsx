import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { ErpApp } from "@/erp-app";

// Catch-all: as rotas internas do ERP (React Router DOM) são tratadas pelo ErpApp.
export const Route = createFileRoute("/$")({
  component: () => (
    <ClientOnly fallback={<div className="min-h-screen bg-slate-900" />}>
      <ErpApp />
    </ClientOnly>
  ),
});