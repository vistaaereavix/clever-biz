import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc('has_role', {
    _user_id: context.userId,
    _role: 'admin',
  });
  if (error) throw new Error('Falha ao verificar permissão');
  if (!data) throw new Error('Acesso negado: requer papel admin');
}

export const adminCheck = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    });
    return { isAdmin: !!data };
  });

export const adminListUsers = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const { data: authList, error: authErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authErr) throw new Error(authErr.message);

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, nome, email, last_active, created_at');

    const profileMap = new Map<string, any>();
    (profiles || []).forEach((p: any) => profileMap.set(p.id, p));

    const users = authList.users.map((u) => {
      const p = profileMap.get(u.id);
      const lastActive = p?.last_active || u.last_sign_in_at || null;
      return {
        id: u.id,
        email: u.email || p?.email || '',
        nome: p?.nome || (u.user_metadata as any)?.nome || u.email || '',
        last_active: lastActive,
        created_at: u.created_at,
      };
    });

    return { users };
  });

export const adminDeleteUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!input?.userId || typeof input.userId !== 'string') {
      throw new Error('userId inválido');
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) {
      throw new Error('Você não pode excluir a própria conta');
    }
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    // auth.users cascade removes profiles/user_roles via FK ON DELETE CASCADE
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    // Best-effort cleanup of business tables scoped by user_id
    const tables = ['orcamento_itens', 'orcamentos', 'notas_fiscais', 'produtos', 'servicos', 'clientes', 'fornecedores', 'company_settings'] as const;
    const admin = supabaseAdmin as any;
    await Promise.all(
      tables.map((t) => admin.from(t).delete().eq('user_id', data.userId))
    );
    return { ok: true };
  });

export const touchLastActive = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from('profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('id', context.userId);
    return { ok: true };
  });