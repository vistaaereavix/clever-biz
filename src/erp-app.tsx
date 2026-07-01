import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Painel } from './pages/Painel';
import { Clientes } from './pages/Clientes';
import { Fornecedores } from './pages/Fornecedores';
import { Produtos } from './pages/Produtos';
import { Servicos } from './pages/Servicos';
import { Orcamentos } from './pages/Orcamentos';
import { Faturamento } from './pages/Faturamento';
import { Configuracoes } from './pages/Configuracoes';
import { Assistente } from './pages/Assistente';
import { Loader2 } from 'lucide-react';

const DEFAULT_LOGO = 'https://via.placeholder.com/150x50/1e3a8a/ffffff?text=ERP';

function Private({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout() {
  const { usuario } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO);

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      const { data } = await supabase
        .from('company_settings')
        .select('logo_url')
        .eq('user_id', usuario.id)
        .maybeSingle();
      if (data?.logo_url) {
        const { data: signed } = await supabase.storage
          .from('company-logos')
          .createSignedUrl(data.logo_url, 60 * 60);
        if (signed?.signedUrl) setLogoUrl(signed.signedUrl);
      }
    })();
  }, [usuario]);

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar logoUrl={logoUrl} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 overflow-x-hidden">
        <Routes>
          <Route path="/painel" element={<Painel />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/orcamentos" element={<Orcamentos />} />
          <Route path="/notas-fiscais" element={<Navigate to="/notas-fiscais/nfe" replace />} />
          <Route path="/notas-fiscais/nfe" element={<Faturamento tipo="NF-e" />} />
          <Route path="/notas-fiscais/nfse" element={<Faturamento tipo="NFS-e" />} />
          <Route path="/faturamento" element={<Navigate to="/notas-fiscais/nfe" replace />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/assistente" element={<Assistente />} />
          <Route path="*" element={<Navigate to="/painel" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AppShell() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }
  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/painel" replace /> : <Login />} />
      <Route path="/*" element={<Private><Layout /></Private>} />
    </Routes>
  );
}

export function ErpApp() {
  return (
    <BrowserRouter>
      <ScrollTop />
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
