import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Usuario } from '../types';

interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, senha: string, nome: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  trocarSenha: (novaSenha: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function userToUsuario(user: any | null): Usuario | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? '',
    nome: (user.user_metadata?.nome as string) || user.email || 'Usuário',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(userToUsuario(session?.user));
    });
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(userToUsuario(data.session?.user));
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, senha: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) return { success: false, error: traduzirErro(error.message) };
    return { success: true };
  };

  const signup = async (email: string, senha: string, nome: string) => {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: redirectTo, data: { nome } },
    });
    if (error) return { success: false, error: traduzirErro(error.message) };
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const trocarSenha = async (novaSenha: string) => {
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) return { success: false, error: traduzirErro(error.message) };
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ usuario, isAuthenticated: !!usuario, login, signup, logout, trocarSenha, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function traduzirErro(msg: string): string {
  if (/invalid login/i.test(msg)) return 'E-mail ou senha inválidos';
  if (/already registered/i.test(msg)) return 'Este e-mail já está cadastrado';
  if (/password.*6/i.test(msg)) return 'A senha deve ter pelo menos 6 caracteres';
  return msg;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
