import { useState } from 'react';
import { Lock, User, Drumstick, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';
import { Logo } from '../components/Layout';
import { Spinner } from '../components/ui';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onLogin(await api('/auth/login', { method: 'POST', body: { username, password } }));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-linear-to-br from-white via-page to-primary/[0.06] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-linear-to-br from-[#E8262D] via-primary to-primary-dark lg:flex lg:flex-col lg:justify-between lg:p-12 text-white">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-linear-to-br from-white/20 to-white/0" />
        <div className="absolute -bottom-32 -left-16 h-[28rem] w-[28rem] rounded-full bg-linear-to-tr from-black/25 to-transparent" />
        <div className="relative flex items-center gap-3">
          <span className="font-display text-xl font-bold">Kenneth Fried Chicken</span>
        </div>
        <div className="relative animate-rise">
          <div className="mb-8 flex items-center gap-4">
            <span className="inline-flex rounded-full bg-white/25 p-1.5 shadow-2xl shadow-black/30 backdrop-blur">
              <img src="/logo.png" alt="Kenneth Fried Chicken logo" className="h-28 w-28 rounded-full border-4 border-white bg-white object-cover object-top" />
            </span>
            <Drumstick size={40} className="opacity-80" />
          </div>
          <h1 className="max-w-lg font-display text-4xl font-extrabold leading-tight xl:text-5xl">
            Fried chicken ko hindi makenneth (makunat)
          </h1>
          <p className="mt-4 max-w-md text-white/80">Point-of-Sale System for Restaurant Staff and Managers</p>
        </div>
        <div />
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm animate-scale-in">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="font-display text-3xl font-bold">Welcome back</h2>
          <p className="mt-1 text-sm text-muted">Sign in with your employee account.</p>

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="label">Username</span>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className="input pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </label>
            <label className="block">
              <span className="label">Password</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className="input px-10"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-ink cursor-pointer"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-primary/5 px-3 py-2.5 text-sm text-primary animate-fade-in">{error}</p>
          )}

          <button className="btn-primary mt-6 w-full py-3" disabled={busy}>
            {busy && <Spinner />} {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="mt-8 rounded-xl border border-dashed border-line p-4 text-xs text-muted">
            <p className="mb-1 font-semibold text-ink">Demo accounts (sample data only)</p>
            <p>Manager: <code>kdrueco</code> · Cashier: <code>jesguerra</code></p>
            <p>Password for both: <code>WeLoveSirBernsSirBernsFanclub123</code></p>
          </div>
        </form>
      </div>
    </div>
  );
}
