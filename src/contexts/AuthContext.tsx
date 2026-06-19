import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Usuario } from '../types';

interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('erp_usuario');
    if (savedUser) {
      try {
        setUsuario(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('erp_usuario');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      // Verificar na tabela usuarios
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('senha', senha)
        .maybeSingle();

      if (data) {
        setUsuario(data);
        localStorage.setItem('erp_usuario', JSON.stringify(data));
        setLoading(false);
        return { success: true };
      }

      // Se não encontrou mas é o usuárioadmin, criar
      if (email === 'admin@erp.com' && senha === 'admin123') {
        const { data: novoUsuario, error: insertError } = await supabase
          .from('usuarios')
          .insert([{
            email: email,
            senha: senha,
            nome: 'Administrador'
          }])
          .select()
          .single();

        if (insertError) {
          setLoading(false);
          return { success: false, error: 'Erro ao criar usuário de demonstração' };
        }

        if (novoUsuario) {
          setUsuario(novoUsuario);
          localStorage.setItem('erp_usuario', JSON.stringify(novoUsuario));
          setLoading(false);
          return { success: true };
        }
      }

      setLoading(false);
      return { success: false, error: 'E-mail ou senha inválidos. Use admin@erp.com / admin123' };
    } catch (err) {
      setLoading(false);
      return { success: false, error: 'Erro ao realizar login' };
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('erp_usuario');
  };

  return (
    <AuthContext.Provider value={{
      usuario,
      isAuthenticated: !!usuario,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
