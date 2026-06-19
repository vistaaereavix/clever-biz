// Re-export do cliente Lovable Cloud. As páginas do ERP usam um shape de tipos próprio
// (src/types/index.ts) que não corresponde ao gerado pelo schema. Para evitar centenas de
// erros de tipo sem cobrir nada que a runtime já não cubra (RLS + validação manual),
// expomos o cliente como SupabaseClient genérico aqui — os tipos das tabelas vivem nas
// interfaces locais.
import { supabase as typedSupabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export const supabase: SupabaseClient = typedSupabase as unknown as SupabaseClient;