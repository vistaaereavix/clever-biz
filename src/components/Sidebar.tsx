import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useIsAdmin } from '../hooks/useIsAdmin';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  Wrench,
  FileText,
  Receipt,
  Settings,
  LogOut,
  X,
  Menu,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  logoUrl: string;
  isOpen: boolean;
  onToggle: () => void;
}

type MenuItem = {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  children?: { path: string; label: string }[];
};

const menuItems: MenuItem[] = [
  { path: '/painel', label: 'Painel', icon: LayoutDashboard },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { path: '/produtos', label: 'Produtos', icon: Package },
  { path: '/servicos', label: 'Serviços', icon: Wrench },
  { path: '/orcamentos', label: 'Orçamentos', icon: FileText },
  {
    path: '/notas-fiscais',
    label: 'Notas Fiscais',
    icon: Receipt,
    children: [
      { path: '/notas-fiscais/nfe', label: 'NF-e' },
      { path: '/notas-fiscais/nfse', label: 'NFS-e' },
    ],
  },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar({ logoUrl, isOpen, onToggle }: SidebarProps) {
  const { logout, usuario } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => ({
    '/notas-fiscais': location.pathname.startsWith('/notas-fiscais'),
  }));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:w-64`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="Logo da Empresa"
              className="h-10 w-auto object-contain"
            />
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            ...menuItems,
            ...(isAdmin
              ? ([{ path: '/admin/usuarios', label: 'Gerenciamento de Usuários', icon: ShieldCheck }] as MenuItem[])
              : []),
          ].map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.children && location.pathname.startsWith(item.path));
            const isOpen = openMenus[item.path];

            if (item.children) {
              return (
                <div key={item.path}>
                  <button
                    onClick={() =>
                      setOpenMenus((prev) => ({ ...prev, [item.path]: !prev[item.path] }))
                    }
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium flex-1 text-left">{item.label}</span>
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {isOpen && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-slate-700 pl-3">
                      {item.children.map((child) => (
                        <button
                          key={child.path}
                          onClick={() => {
                            navigate(child.path);
                            if (window.innerWidth < 1024) onToggle();
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            location.pathname === child.path
                              ? 'bg-blue-600/80 text-white'
                              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {usuario?.nome?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{usuario?.nome || 'Administrador'}</p>
              <p className="text-xs text-slate-400 truncate">{usuario?.email || 'admin@erp.com'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-slate-800 rounded-lg text-white shadow-lg"
      >
        <Menu size={24} />
      </button>
    </>
  );
}
