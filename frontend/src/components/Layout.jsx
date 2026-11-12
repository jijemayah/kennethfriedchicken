import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';

/** The brand photo in a round frame with a red gradient ring. */
export function LogoMark({ size = 40, className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full bg-linear-to-br from-primary to-primary-dark p-[2px] shadow-md shadow-primary/30 ${className}`}
      style={{ width: size, height: size }}
    >
      <img src="/logo.png" alt="Kenneth Fried Chicken logo" className="h-full w-full rounded-full border-2 border-white bg-white object-cover object-top" />
    </span>
  );
}

export function Logo({ compact }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={44} />
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-[15px] font-bold">Kenneth Fried</p>
          <p className="font-display text-[15px] font-bold text-primary">Chicken</p>
        </div>
      )}
    </div>
  );
}

export function Layout({ pages, current, onNavigate, user, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (key) => {
    onNavigate(key);
    setMobileOpen(false);
  };

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-5">
        <Logo />
      </div>
      <ul className="flex-1 space-y-1 px-3">
        {pages.map(({ key, label, icon: Icon }) => {
          const active = key === current;
          return (
            <li key={key}>
              <button
                onClick={() => navigate(key)}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                  transition-all duration-200 cursor-pointer
                  ${active ? 'bg-linear-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/25' : 'text-muted hover:bg-page hover:text-ink'}`}
              >
                <Icon size={18} className={`transition-transform duration-200 ${active ? '' : 'group-hover:scale-110'}`} />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="m-3 rounded-xl bg-page p-3 text-xs text-muted">
        Signed in as <span className="font-semibold text-ink">{user.role === 'MANAGER' ? 'Manager' : 'Cashier'}</span>
      </div>
    </nav>
  );

  const title = pages.find((p) => p.key === current)?.label;

  return (
    <div className="min-h-screen lg:pl-64">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-linear-to-b from-white via-white to-primary/[0.05] lg:block">{sidebar}</aside>

      {/* mobile drawer */}
      <div className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-64 bg-white shadow-xl transition-transform duration-250 ease-out
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <button className="btn-ghost absolute right-2 top-4 p-2" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
          {sidebar}
        </aside>
      </div>

      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur no-print sm:px-6">
        <button className="btn-ghost p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <h2 className="font-display text-base font-semibold lg:hidden">{title}</h2>
        <div className="ml-auto">
          <UserMenu user={user} onLogout={onLogout} />
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] p-4 sm:p-6">
        {/* key forces a fresh entrance animation on every page change */}
        <div key={current} className="animate-page">{children}</div>
      </main>
    </div>
  );
}

/** Dropdown with a smooth open/close transition. */
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-page cursor-pointer"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold leading-tight">{user.fullName}</span>
          <span className="block text-xs text-muted">{user.role === 'MANAGER' ? 'Manager' : 'Cashier'}</span>
        </span>
        <ChevronDown size={16} className={`text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-line bg-white p-1.5 shadow-lg
          transition-all duration-150 ease-out
          ${open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}`}
      >
        <div className="px-3 py-2">
          <p className="text-sm font-semibold">{user.fullName}</p>
          <p className="text-xs text-muted">@{user.username}</p>
        </div>
        <div className="my-1 border-t border-line" />
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary transition hover:bg-primary/5 cursor-pointer"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );
}
