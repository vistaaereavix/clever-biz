import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { buscarCEP, formatarCEP } from '../lib/utils';
import { IMaskInput } from 'react-imask';
import type { CompanySettings } from '../types';
import {
  Building2, Image as ImageIcon, Upload, Save, Loader2, CheckCircle,
  AlertCircle, MapPin, KeyRound,
} from 'lucide-react';

const VAZIO: CompanySettings = {
  razao_social: '', nome_fantasia: '', cnpj: '', inscricao_estadual: '',
  email: '', telefone: '', cep: '', logradouro: '', numero: '',
  complemento: '', bairro: '', cidade: '', estado: '', logo_url: '',
};

export function Configuracoes() {
  const { usuario, trocarSenha } = useAuth();
  const [form, setForm] = useState<CompanySettings>(VAZIO);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Troca de senha
  const [novaSenha, setNovaSenha] = useState('');
  const [confSenha, setConfSenha] = useState('');
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [msgSenha, setMsgSenha] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    if (!usuario) return;
    carregar();
  }, [usuario]);

  const carregar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', usuario!.id)
      .maybeSingle();
    if (data) {
      setForm({ ...VAZIO, ...data });
      if (data.logo_url) {
        const { data: signed } = await supabase.storage
          .from('company-logos')
          .createSignedUrl(data.logo_url, 60 * 60);
        if (signed?.signedUrl) setLogoPreview(signed.signedUrl);
      }
    }
    setLoading(false);
  };

  const handleCEP = async () => {
    const cepLimpo = (form.cep || '').replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setMsg({ tipo: 'erro', texto: 'CEP deve ter 8 dígitos' });
      return;
    }
    setBuscandoCEP(true);
    setMsg(null);
    try {
      const dados = await buscarCEP(cepLimpo);
      setForm((f) => ({ ...f, cep: dados.cep, logradouro: dados.logradouro, bairro: dados.bairro, cidade: dados.cidade, estado: dados.estado }));
    } catch (err: any) {
      setMsg({ tipo: 'erro', texto: err?.message || 'Erro ao buscar CEP' });
    }
    setBuscandoCEP(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const salvar = async () => {
    if (!usuario) return;
    setSalvando(true);
    setMsg(null);
    try {
      let logoPath = form.logo_url || null;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop() || 'png';
        const path = `${usuario.id}/logo-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('company-logos')
          .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
        if (upErr) throw upErr;
        logoPath = path;
      }

      const payload = { ...form, user_id: usuario.id, logo_url: logoPath };
      delete (payload as any).id;
      delete (payload as any).created_at;
      delete (payload as any).updated_at;

      const { error } = await supabase
        .from('company_settings')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;

      setForm((f) => ({ ...f, logo_url: logoPath }));
      setLogoFile(null);
      setMsg({ tipo: 'ok', texto: 'Configurações salvas com sucesso!' });
      setTimeout(() => setMsg(null), 3500);
    } catch (err: any) {
      setMsg({ tipo: 'erro', texto: err?.message || 'Erro ao salvar' });
    }
    setSalvando(false);
  };

  const handleTrocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgSenha(null);
    if (novaSenha.length < 6) {
      setMsgSenha({ tipo: 'erro', texto: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }
    if (novaSenha !== confSenha) {
      setMsgSenha({ tipo: 'erro', texto: 'As senhas não coincidem' });
      return;
    }
    setTrocandoSenha(true);
    const r = await trocarSenha(novaSenha);
    setTrocandoSenha(false);
    if (r.success) {
      setMsgSenha({ tipo: 'ok', texto: 'Senha atualizada!' });
      setNovaSenha(''); setConfSenha('');
      setTimeout(() => setMsgSenha(null), 3500);
    } else {
      setMsgSenha({ tipo: 'erro', texto: r.error || 'Erro ao trocar senha' });
    }
  };

  const upd = <K extends keyof CompanySettings>(k: K, v: CompanySettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header titulo="Configurações" subtitulo="Configure os dados da sua empresa" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header titulo="Configurações" subtitulo="Dados da empresa, logo e segurança" />
      <div className="p-6 w-full space-y-6">

        {/* Dados da empresa */}
        <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-600/20"><Building2 className="h-6 w-6 text-blue-400" /></div>
            <div>
              <h2 className="text-lg font-semibold text-white">Dados da Empresa</h2>
              <p className="text-sm text-slate-400">Estas informações aparecem no cabeçalho dos PDFs gerados</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Razão Social" value={form.razao_social ?? ''} onChange={(v) => upd('razao_social', v)} />
            <Field label="Nome Fantasia" value={form.nome_fantasia ?? ''} onChange={(v) => upd('nome_fantasia', v)} />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">CNPJ</label>
              <IMaskInput
                mask="00.000.000/0000-00"
                value={form.cnpj ?? ''}
                onAccept={(v) => upd('cnpj', String(v))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <Field label="Inscrição Estadual" value={form.inscricao_estadual ?? ''} onChange={(v) => upd('inscricao_estadual', v)} />

            <Field label="E-mail" type="email" value={form.email ?? ''} onChange={(v) => upd('email', v)} />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Telefone</label>
              <IMaskInput
                mask={[{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]}
                value={form.telefone ?? ''}
                onAccept={(v) => upd('telefone', String(v))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </section>

        {/* Endereço */}
        <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-emerald-600/20"><MapPin className="h-6 w-6 text-emerald-400" /></div>
            <div>
              <h2 className="text-lg font-semibold text-white">Endereço</h2>
              <p className="text-sm text-slate-400">Digite o CEP e o resto é preenchido automaticamente</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">CEP</label>
              <div className="flex gap-2">
                <IMaskInput
                  mask="00000-000"
                  value={form.cep ?? ''}
                  onAccept={(v) => upd('cep', formatarCEP(String(v)))}
                  onComplete={() => handleCEP()}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="00000-000"
                />
                <button onClick={handleCEP} disabled={buscandoCEP} type="button"
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50">
                  {buscandoCEP ? <Loader2 size={16} className="animate-spin" /> : 'Buscar'}
                </button>
              </div>
            </div>
            <Field className="md:col-span-2" label="Logradouro" value={form.logradouro ?? ''} onChange={(v) => upd('logradouro', v)} />
            <Field label="Número" value={form.numero ?? ''} onChange={(v) => upd('numero', v)} />
            <Field label="Complemento" value={form.complemento ?? ''} onChange={(v) => upd('complemento', v)} />
            <Field label="Bairro" value={form.bairro ?? ''} onChange={(v) => upd('bairro', v)} />
            <Field label="Cidade" value={form.cidade ?? ''} onChange={(v) => upd('cidade', v)} />
            <Field label="UF" value={form.estado ?? ''} onChange={(v) => upd('estado', v.toUpperCase().slice(0, 2))} />
          </div>
        </section>

        {/* Logo quadrada */}
        <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-600/20"><ImageIcon className="h-6 w-6 text-purple-400" /></div>
            <div>
              <h2 className="text-lg font-semibold text-white">Logo da Empresa</h2>
              <p className="text-sm text-slate-400">Recomendamos uma imagem quadrada (ex: 512×512). Ela aparecerá quadrada no PDF.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-40 h-40 bg-slate-900 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-12 w-12 text-slate-600" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFile} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                <Upload size={18} /> Selecionar imagem
              </button>
              <p className="text-xs text-slate-500">PNG ou JPG. A logo será exibida em formato quadrado nos PDFs.</p>
            </div>
          </div>
        </section>

        {msg && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${msg.tipo === 'ok' ? 'bg-green-900/20 border border-green-800 text-green-400' : 'bg-red-900/20 border border-red-800 text-red-400'}`}>
            {msg.tipo === 'ok' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {msg.texto}
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={salvar} disabled={salvando}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50">
            {salvando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Salvar configurações
          </button>
        </div>

        {/* Troca de senha */}
        <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-600/20"><KeyRound className="h-6 w-6 text-amber-400" /></div>
            <div>
              <h2 className="text-lg font-semibold text-white">Trocar senha de acesso</h2>
              <p className="text-sm text-slate-400">Defina uma nova senha para entrar no sistema</p>
            </div>
          </div>

          <form onSubmit={handleTrocarSenha} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nova senha</label>
              <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} minLength={6}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirmar nova senha</label>
              <input type="password" value={confSenha} onChange={(e) => setConfSenha(e.target.value)} minLength={6}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {msgSenha && (
              <div className={`md:col-span-2 flex items-center gap-2 px-4 py-3 rounded-lg ${msgSenha.tipo === 'ok' ? 'bg-green-900/20 border border-green-800 text-green-400' : 'bg-red-900/20 border border-red-800 text-red-400'}`}>
                {msgSenha.tipo === 'ok' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                {msgSenha.texto}
              </div>
            )}

            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={trocandoSenha}
                className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg disabled:opacity-50">
                {trocandoSenha ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
                Atualizar senha
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', className = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
