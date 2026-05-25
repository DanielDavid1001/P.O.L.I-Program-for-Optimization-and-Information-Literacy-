import { useState, useEffect } from 'react';
import api from '../../lib/api';

export function PasswordReset({ darkMode }: { darkMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<'info' | 'success' | 'error'>('info');
  const [tokenInput, setTokenInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [requestingToken, setRequestingToken] = useState(false);

  useEffect(() => {
    (window as any).eedOpenPasswordReset = () => setOpen(true);
    const handler = () => setOpen(true);
    window.addEventListener('open-password-reset', handler as EventListener);

    return () => {
      window.removeEventListener('open-password-reset', handler as EventListener);
    };
  }, []);

  const requestReset = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setMessageKind('error');
      setMessage('Informe um email para enviar o token.');
      return;
    }

    try {
      setRequestingToken(true);
      await api.forgotPassword(normalizedEmail);
      setMessageKind('success');
      setMessage('Seu token de reset chegou.');
    } catch (err: any) {
      setMessageKind('error');
      setMessage(err?.message || 'Erro ao gerar token');
    } finally {
      setRequestingToken(false);
    }
  };

  const submitReset = async () => {
    try {
      const resp = await api.resetPassword({ email, token: tokenInput, password: newPassword, password_confirmation: newPasswordConfirm });
      setMessageKind('success');
      setMessage(resp?.message ?? 'Senha atualizada');
      setOpen(false);
    } catch (err: any) {
      setMessageKind('error');
      setMessage(err?.message || JSON.stringify(err));
    }
  };

  if (!open) return null;

  const inputClass = `w-full rounded-xl border px-3 py-2.5 outline-none transition ${
    darkMode
      ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:border-orange-400'
      : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:border-orange-500'
  }`;

  const infoClass = `rounded-xl border px-3 py-2 text-sm ${
    darkMode
      ? 'border-amber-700/50 bg-amber-950/40 text-amber-200'
      : 'border-amber-200 bg-amber-50 text-amber-800'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={`absolute inset-0 ${darkMode ? 'bg-black/60' : 'bg-slate-950/35'}`} onClick={() => setOpen(false)}></div>
      <div className={`z-60 w-full max-w-md rounded-2xl border p-6 shadow-2xl ${darkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
        <h3 className="mb-1 text-xl font-bold">Recuperar Senha</h3>
        <p className={`mb-4 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Informe seu email para gerar o token e depois redefina sua senha.
        </p>
        <div className="space-y-3.5">
          <div>
            <label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="seu@email.com" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={requestReset}
              disabled={requestingToken}
              className="flex-1 rounded-xl bg-orange-500 py-2.5 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {requestingToken ? 'Enviando...' : 'Enviar Token'}
            </button>
            <button
              type="button"
              onClick={() => { setMessage(null); setEmail(''); setTokenInput(''); setNewPassword(''); setNewPasswordConfirm(''); setOpen(false); }}
              className={`flex-1 rounded-xl py-2.5 font-semibold transition ${darkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
            >
              Fechar
            </button>
          </div>

          {message && (
            <div
              className={`${infoClass} ${
                messageKind === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : messageKind === 'error'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : ''
              }`}
            >
              {message}
            </div>
          )}

          <hr className={darkMode ? 'border-slate-700' : 'border-slate-200'} />

          <div>
            <label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Token</label>
            <input value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} className={inputClass} placeholder="Cole o token aqui" />
          </div>
          <div>
            <label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Nova Senha</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="Minimo 8 caracteres" />
          </div>
          <div>
            <label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Confirmar Senha</label>
            <input type="password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} className={inputClass} placeholder="Repita a senha" />
          </div>

          <div>
            <button
              type="button"
              onClick={submitReset}
              className="w-full rounded-xl bg-emerald-600 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
            >
              Redefinir Senha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordReset;
