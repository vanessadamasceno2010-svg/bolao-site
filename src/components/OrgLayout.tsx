import type { ReactNode } from 'react';
import { navigate } from '../lib/router';
import { getOrgSession, orgLogout } from '../lib/storage';
import { Toaster } from './Toaster';

/**
 * Layout exclusivo do Portal do Organizador.
 * Header próprio com identidade visual diferente —
 * não expõe que a plataforma é "BolaoCopa".
 */
export function OrgLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-100 relative overflow-hidden">
      {/* Ambient bg glow — tom azul para diferenciar do participante */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-30%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[100px]" />
      </div>
      <div className="relative z-10">
        <OrgHeader />
        <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">{children}</main>
        <OrgFooter />
      </div>
      <Toaster />
    </div>
  );
}

function OrgHeader() {
  const org = getOrgSession();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-white/5 shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo do portal do organizador — genérico, sem marca */}
        <button onClick={() => navigate(org ? '/organizador/dashboard' : '/organizador')}
          className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            📊
          </div>
          <div className="text-left">
            <div className="font-black text-lg leading-tight tracking-tight">
              Portal do <span className="text-indigo-400">Organizador</span>
            </div>
            <div className="text-[9px] text-slate-500 leading-none tracking-widest uppercase">
              Painel de gestão de bolões
            </div>
          </div>
        </button>

        <nav className="flex items-center gap-1">
          {org && (
            <>
              <OrgNavBtn onClick={() => navigate('/organizador/dashboard')}>📊 Painel</OrgNavBtn>
              <OrgNavBtn onClick={() => navigate('/organizador/create')}>+ Novo Bolão</OrgNavBtn>
              <OrgNavBtn onClick={() => navigate('/organizador/results')}>⚙️ Resultados</OrgNavBtn>
              <div className="ml-2 flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">👤 {org.name.split(' ')[0]}</span>
                <button onClick={() => { orgLogout(); navigate('/organizador'); }}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition border border-white/10">
                  Sair
                </button>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function OrgNavBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="hidden sm:flex px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition">
      {children}
    </button>
  );
}

function OrgFooter() {
  return (
    <footer className="border-t border-white/5 mt-16 relative z-10">
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-slate-500">
        <p>
          Painel do organizador ·{' '}
          <button onClick={() => navigate('/')} className="text-indigo-400 hover:underline">
            Acessar como participante
          </button>
        </p>
        <p className="text-xs text-slate-600 mt-2">
          Versão demonstrativa · Em produção: Supabase + PushinPay + API-Football
        </p>
      </div>
    </footer>
  );
}
