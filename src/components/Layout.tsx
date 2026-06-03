import type { ReactNode } from 'react';
import { navigate } from '../lib/router';
import { Toaster } from './Toaster';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 text-slate-100 relative overflow-hidden">
      {/* Ambient bg glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-30%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-600/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-white/5 shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo participante — identidade visual limpa */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-yellow-400 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            ⚽
          </div>
          <div className="text-left">
            <div className="font-black text-lg leading-tight tracking-tight">
              Bolão<span className="text-emerald-400">Copa</span>
            </div>
            <div className="text-[9px] text-slate-500 leading-none tracking-widest uppercase">Copa do Mundo 2026</div>
          </div>
        </button>
        <nav className="flex items-center gap-1">
          <NavBtn onClick={() => navigate('/perfil')}>👤 Meu Perfil</NavBtn>
          {/* Link discreto para o portal do organizador — apenas texto, sem botão destacado */}
          <button
            onClick={() => navigate('/organizador')}
            className="hidden sm:block px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition"
          >
            📊 Área do Organizador
          </button>
        </nav>
      </div>
    </header>
  );
}

function NavBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="hidden sm:flex px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition">
      {children}
    </button>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 mt-16 relative z-10">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="font-black text-lg mb-3">
              Bolão<span className="text-emerald-400">Copa</span>
            </div>
            <p className="text-sm text-slate-500">
              Plataforma de bolões da Copa do Mundo 2026.
            </p>
          </div>
          <div>
            <div className="font-bold text-sm text-slate-300 mb-3">Para participantes</div>
            <div className="space-y-2 text-sm text-slate-500">
              <button onClick={() => navigate('/')} className="block hover:text-white transition">Início</button>
              <button onClick={() => navigate('/perfil')} className="block hover:text-white transition">Meu Perfil</button>
            </div>
          </div>
          <div>
            <div className="font-bold text-sm text-slate-300 mb-3">Legal</div>
            <div className="space-y-2 text-sm text-slate-500">
              <button onClick={() => navigate('/terms')} className="block hover:text-white transition">Termos de Uso</button>
              <button onClick={() => navigate('/privacy')} className="block hover:text-white transition">Política de Privacidade</button>
              <button onClick={() => navigate('/legal')} className="block hover:text-white transition">Aviso Legal</button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 text-center text-xs text-slate-600">
          <p>© 2025–2026 BolãoCopa</p>
        </div>
      </div>
    </footer>
  );
}

/* ===== Reusable UI ===== */

export function Card({ children, className = '', onClick, hover, style }: {
  children: ReactNode; className?: string; onClick?: () => void; hover?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`bg-white/[0.03] backdrop-blur-sm border border-white/[0.07] rounded-2xl transition-all ${
        hover ? 'cursor-pointer hover:border-emerald-500/30 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-emerald-500/5' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children, onClick, variant = 'primary', size = 'md', className = '', type = 'button', disabled, full,
}: {
  children: ReactNode; onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg'; className?: string;
  type?: 'button' | 'submit'; disabled?: boolean; full?: boolean;
}) {
  const v = {
    primary: 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-bold shadow-lg shadow-emerald-500/20',
    secondary: 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10',
    ghost: 'hover:bg-white/5 text-slate-300',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30',
    gold: 'bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-slate-950 font-bold shadow-lg shadow-yellow-500/20',
  };
  const s = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] ${v[variant]} ${s[size]} ${full ? 'w-full' : ''} ${className}`}
    >{children}</button>
  );
}

export function Input({
  label, value, onChange, type = 'text', placeholder, required, prefix, hint, min, max, step,
}: {
  label?: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; prefix?: string;
  hint?: string; min?: number; max?: number; step?: number;
}) {
  return (
    <label className="block">
      {label && (
        <div className="text-sm text-slate-300 mb-1.5 font-medium">
          {label} {required && <span className="text-emerald-400">*</span>}
        </div>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">{prefix}</span>
        )}
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          min={min} max={max} step={step}
          className={`w-full bg-slate-900/70 border border-white/[0.08] rounded-xl py-2.5 ${prefix ? 'pl-10' : 'pl-4'} pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 transition-all`}
        />
      </div>
      {hint && <div className="text-[11px] text-slate-500 mt-1">{hint}</div>}
    </label>
  );
}

export function Textarea({
  label, value, onChange, placeholder, rows = 3,
}: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <label className="block">
      {label && <div className="text-sm text-slate-300 mb-1.5 font-medium">{label}</div>}
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        className="w-full bg-slate-900/70 border border-white/[0.08] rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 transition-all"
      />
    </label>
  );
}

export function Stat({
  label, value, icon, accent, sub,
}: {
  label: string; value: string; icon?: string; accent?: 'emerald' | 'yellow' | 'blue' | 'purple'; sub?: string;
}) {
  const c = {
    emerald: 'from-emerald-500/15 to-emerald-500/0 border-emerald-500/20',
    yellow: 'from-yellow-500/15 to-yellow-500/0 border-yellow-500/20',
    blue: 'from-blue-500/15 to-blue-500/0 border-blue-500/20',
    purple: 'from-purple-500/15 to-purple-500/0 border-purple-500/20',
  };
  const tColor = {
    emerald: 'text-emerald-300',
    yellow: 'text-yellow-300',
    blue: 'text-blue-300',
    purple: 'text-purple-300',
  };
  const clr = accent ? c[accent] : 'from-white/5 to-white/0 border-white/[0.08]';
  const tc = accent ? tColor[accent] : 'text-white';
  return (
    <div className={`bg-gradient-to-br ${clr} border rounded-xl p-4 animate-fadeIn`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-medium">
        {icon && <span className="text-sm">{icon}</span>} {label}
      </div>
      <div className={`text-2xl font-black mt-1.5 ${tc}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export function Badge({
  children, color = 'slate',
}: {
  children: ReactNode; color?: 'slate' | 'emerald' | 'yellow' | 'red' | 'blue';
}) {
  const c = {
    slate: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    yellow: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',
    red: 'bg-red-500/15 text-red-300 border-red-500/20',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c[color]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, desc, action, actionLabel }: {
  icon: string; title: string; desc: string; action?: () => void; actionLabel?: string;
}) {
  return (
    <Card className="p-12 text-center animate-fadeIn">
      <div className="text-6xl mb-4 animate-float">{icon}</div>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">{desc}</p>
      {action && actionLabel && <Button size="lg" onClick={action}>{actionLabel}</Button>}
    </Card>
  );
}

export function ProgressBar({ value, max, className = '' }: { value: number; max: number; className?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={`h-2 bg-slate-800/80 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-yellow-400 transition-all duration-700 rounded-full"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
