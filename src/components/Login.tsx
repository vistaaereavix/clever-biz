import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { lovable } from '@/integrations/lovable';
import { Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react';

type Modo = 'login' | 'signup' | 'recuperar';

export function Login() {
  const { login, signup } = useAuth();
  const [modo, setModo] = useState<Modo>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [googleCarregando, setGoogleCarregando] = useState(false);

  const entrarComGoogle = async () => {
    setErro('');
    setSucesso('');
    setGoogleCarregando(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setErro(result.error.message || 'Falha ao entrar com Google');
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao entrar com Google');
    } finally {
      setGoogleCarregando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);

    if (modo === 'login') {
      const r = await login(email, senha);
      if (!r.success) setErro(r.error || 'Erro ao entrar');
    } else if (modo === 'signup') {
      if (!nome.trim()) {
        setErro('Informe seu nome');
        setCarregando(false);
        return;
      }
      const r = await signup(email, senha, nome.trim());
      if (!r.success) setErro(r.error || 'Erro ao cadastrar');
      else setSucesso('Cadastro criado! Enviamos um e-mail de confirmação — clique no link para ativar sua conta antes de entrar.');
    } else if (modo === 'recuperar') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) setErro(error.message);
      else setSucesso('Enviamos um e-mail com o link para redefinir sua senha.');
    }
    setCarregando(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-4">
              <Lock size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">ERP</h1>
            <p className="text-slate-400">Sistema de Gestão Empresarial</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Seu nome"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="voce@empresa.com"
                />
              </div>
            </div>

            {modo !== 'recuperar' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {erro && (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
                <AlertCircle size={18} /> {erro}
              </div>
            )}
            {sucesso && (
              <div className="bg-green-900/20 border border-green-800 text-green-400 px-4 py-3 rounded-lg text-sm">
                {sucesso}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {carregando ? <Loader2 className="animate-spin" size={18} /> : null}
              {modo === 'login' ? 'Entrar' : modo === 'signup' ? 'Criar conta' : 'Enviar link de redefinição'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-sm text-center text-slate-400">
            {modo === 'login' && (
              <>
                <button onClick={() => { setModo('signup'); setErro(''); setSucesso(''); }} className="hover:text-white transition-colors">
                  Não tem conta? <span className="text-blue-400">Criar uma agora</span>
                </button>
                <button onClick={() => { setModo('recuperar'); setErro(''); setSucesso(''); }} className="hover:text-white transition-colors">
                  Esqueci minha senha
                </button>
              </>
            )}
            {modo !== 'login' && (
              <button onClick={() => { setModo('login'); setErro(''); setSucesso(''); }} className="hover:text-white transition-colors">
                ← Voltar para o login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
