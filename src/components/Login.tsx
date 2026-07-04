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

          {modo !== 'recuperar' && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-xs uppercase tracking-wider text-slate-500">ou</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <button
                type="button"
                onClick={entrarComGoogle}
                disabled={googleCarregando}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {googleCarregando ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.3c-2 1.5-4.6 2.6-7.4 2.6-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.4-4.3 5.8l6.3 5.3C41.8 35.7 44 30.3 44 24c0-1.2-.1-2.3-.4-3.5z" />
                  </svg>
                )}
                Continuar com Google
              </button>
            </>
          )}

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
