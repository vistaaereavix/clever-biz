import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { ErpApp } from "@/erp-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ERP - Sistema de Gestão" },
      { name: "description", content: "ERP com clientes, fornecedores, produtos, orçamentos e faturamento" },
      { property: "og:title", content: "ERP - Sistema de Gestão" },
      { property: "og:description", content: "ERP com clientes, fornecedores, produtos, orçamentos e faturamento" },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<div className="min-h-screen bg-slate-900" />}>
      <ErpApp />
    </ClientOnly>
  ),
});
