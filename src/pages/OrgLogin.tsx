import { useState } from 'react';
import { Button, Card, Input } from '../components/Layout';
import { navigate } from '../lib/router';
import { getOrgSession, orgLogin, orgRequestPasswordReset, orgResetPassword } from '../lib/storage';
import { toast } from '../lib/toast';

type View = 'login' | 'forgot' | 'reset';

export function OrgLogin() {
  const existing = getOrgSession();
  if (existing) { navigate('/organizador/dashboard'); return null; }

  const [view, setView] = useState<View>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // Recuperação de senha
  const [fpEmail, setFpEmail] = useState('');
  const [fpResult, setFpResult] = useState<ReturnType<typeof orgRequestPasswordReset> | null>(null);
  const [fpNewPw, setFpNewPw] = useState('');
  const [fpNewPw2, setFpNewPw2] = useState('');

  /* ─── Login / Signup ─── */
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !pw) { toast.warning('Preencha e-mail e senha.'); return; }
    if (!isLogin) {
      if (!name.trim()) { toast.warning('Nome obrigatório'); return; }
      if (pw.length < 4) { toast.warning('Senha', 'Mínimo 4 caracteres.'); return; }
      if (pw !== pw2) { toast.warning('As senhas não conferem.'); return; }
    }
    try {
      orgLogin(isLogin ? email.split('@')[0] : name, email, pw);
      toast.success(isLogin ? 'Login realizado!' : 'Conta criada!', 'Bem-vindo ao painel.');
      navigate('/organizador/dashboard');
    } catch (err) {
      toast.error('Erro', (err as Error).message);
    }
  }

  /* ─── Solicitar reset ─── */
  function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    if (!fpEmail.trim()) { toast.warning('Informe seu e-mail.'); return; }
    const result = orgRequestPasswordReset(fpEmail);
    setFpResult(result);
    if (result.ok) setView('reset');
    else toast.error('Não encontrado', result.message);
  }

  /* ─── Definir nova senha ─── */
  function handleResetPw(e: React.FormEvent) {
    e.preventDefault();
    if (fpNewPw.length < 4) { toast.warning('Senha', 'Mínimo 4 caracteres.'); return; }
    if (fpNewPw !== fpNewPw2) { toast.warning('As senhas não conferem.'); return; }
    orgResetPassword(fpEmail, fpNewPw);
    toast.success('Senha redefinida!', 'Faça login com sua nova senha.');
    setView('login');
    setFpEmail(''); setFpNewPw(''); setFpNewPw2(''); setFpResult(null);
  }

  /* ═══ VIEW: FORGOT PASSWORD ═══ */
  if (view === 'forgot') {
    return (
      <div className="max-w-md mx-auto animate-fadeInUp pt-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-black">Recuperar senha</h1>
          <p className="text-slate-400 text-sm mt-2">Informe o e-mail da sua conta de organizador.</p>
        </div>
        <Card className="p-6">
          <form onSubmit={handleRequestReset} className="space-y-4">
            <Input label="E-mail cadastrado" type="email" value={fpEmail}
              onChange={setFpEmail} required placeholder="seu@email.com" />
            <Button type="submit" size="lg" full>📨 Enviar nova senha</Button>
          </form>
          <button onClick={() => setView('login')}
            className="mt-4 text-sm text-indigo-400 hover:underline block text-center w-full">
            ← Voltar ao login
          </button>
        </Card>
      </div>
    );
  }

  /* ═══ VIEW: RESET PASSWORD ═══ */
  if (view === 'reset' && fpResult) {
    return (
      <div className="max-w-md mx-auto animate-fadeInUp pt-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📬</div>
          <h1 className="text-2xl font-black">Redefinir senha</h1>
          <p className="text-slate-400 text-sm mt-2">{fpResult.message}</p>
          {fpResult.tempPassword && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mt-4 text-sm text-yellow-200">
              📧 Sua nova senha temporária é: <strong className="text-white font-mono">{fpResult.tempPassword}</strong>
              <div className="text-xs text-yellow-200/60 mt-1">
                (Na versão demo é exibida aqui. Em produção, chega por e-mail.)
              </div>
            </div>
          )}
        </div>
        <Card className="p-6">
          <form onSubmit={handleResetPw} className="space-y-4">
            <Input label="Nova senha" type="password" value={fpNewPw}
              onChange={setFpNewPw} required placeholder="••••••" />
            <Input label="Confirmar nova senha" type="password" value={fpNewPw2}
              onChange={setFpNewPw2} required placeholder="••••••" />
            <Button type="submit" size="lg" full>💾 Salvar nova senha</Button>
          </form>
          <button onClick={() => { setView('login'); setFpResult(null); }}
            className="mt-4 text-sm text-indigo-400 hover:underline block text-center w-full">
            Ir para o login
          </button>
        </Card>
      </div>
    );
  }

  /* ═══ VIEW: LOGIN / SIGNUP (default) ═══ */
  return (
    <div className="max-w-md mx-auto animate-fadeInUp pt-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-4xl mx-auto mb-4 shadow-xl shadow-indigo-500/20">
          📊
        </div>
        <h1 className="text-3xl font-black">Portal do Organizador</h1>
        <p className="text-slate-400 mt-2 text-sm">
          {isLogin ? 'Entre na sua conta para gerenciar seus bolões.' : 'Crie sua conta de organizador.'}
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleLogin} className="space-y-4">
          {!isLogin && (
            <Input label="Seu nome" value={name} onChange={setName} required placeholder="João da Silva" />
          )}
          <Input label="E-mail" type="email" value={email} onChange={setEmail}
            required placeholder="seu@email.com" hint="Será usado como login." />
          <Input label="Senha" type="password" value={pw} onChange={setPw}
            required placeholder="••••••" />
          {!isLogin && (
            <Input label="Confirmar senha" type="password" value={pw2} onChange={setPw2}
              required placeholder="••••••" />
          )}
          <Button type="submit" size="lg" full variant="primary">
            {isLogin ? '🔓 Entrar' : '🚀 Criar conta'}
          </Button>
        </form>

        <div className="mt-4 flex justify-between items-center">
          <button onClick={() => setIsLogin(v => !v)}
            className="text-sm text-indigo-400 hover:underline">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
          </button>
          {isLogin && (
            <button onClick={() => setView('forgot')}
              className="text-sm text-slate-400 hover:text-white hover:underline">
              Esqueci a senha
            </button>
          )}
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
          Crie sua conta ou faça login com e-mail e senha.
        </div>
      </Card>

      <p className="text-center text-xs text-slate-500 mt-6">
        É participante de um bolão?{' '}
        <button onClick={() => navigate('/perfil')} className="text-emerald-400 underline">Acesse seu perfil</button>
      </p>
    </div>
  );
}
