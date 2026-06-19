import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import {
  Settings,
  Upload,
  Image,
  Save,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export function Configuracoes() {
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'logo_url')
      .single();

    if (data) {
      setLogoUrl(data.valor);
      setPreview(data.valor);
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvar = async () => {
    setSalvando(true);
    setSucesso('');

    let url = logoUrl;

    if (logoFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        url = reader.result as string;

        const { error } = await supabase
          .from('configuracoes')
          .update({ valor: url })
          .eq('chave', 'logo_url');

        if (!error) {
          setLogoUrl(url);
          setSucesso('Configurações salvas com sucesso!');
          setTimeout(() => setSucesso(''), 3000);
        }

        setSalvando(false);
      };
      reader.readAsDataURL(logoFile);
    } else {
      const { error } = await supabase
        .from('configuracoes')
        .update({ valor: url })
        .eq('chave', 'logo_url');

      if (!error) {
        setSucesso('Configurações salvas com sucesso!');
        setTimeout(() => setSucesso(''), 3000);
      }

      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header titulo="Configurações" subtitulo="Configure seu sistema ERP" />

      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-600/20">
                      <Image className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Logo da Empresa</h2>
                      <p className="text-sm text-slate-400">
                        Faça upload da logo que será exibida no menu lateral e nos documentos
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-slate-500 transition-colors">
                  {preview ? (
                    <div className="mb-4">
                      <img
                        src={preview}
                        alt="Preview da Logo"
                        className="max-h-24 mx-auto object-contain"
                      />
                    </div>
                  ) : (
                    <div className="mb-4">
                      <Image className="h-16 w-16 mx-auto text-slate-600" />
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="logo-upload"
                  />

                  <button
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    <Upload size={18} />
                    Selecionar Imagem
                  </button>

                  <p className="text-sm text-slate-500 mt-3">
                    Formatos aceitos: PNG, JPG, JPEG. Tamanho recomendado: 150x50px
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-green-600/20">
                    <Settings className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Sistema</h2>
                    <p className="text-sm text-slate-400">
                      Informações e versão do sistema
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-400">Versão do Sistema</span>
                    <span className="text-white font-medium">1.0.0</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-400">Ambiente</span>
                    <span className="text-yellow-400 font-medium">Produção</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-400">Banco de Dados</span>
                    <span className="text-green-400 font-medium">Conectado</span>
                  </div>
                </div>
              </div>

              {sucesso && (
                <div className="bg-green-900/20 border border-green-800 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
                  <CheckCircle size={18} />
                  {sucesso}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSalvar}
                  disabled={salvando}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Salvar Configurações
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
