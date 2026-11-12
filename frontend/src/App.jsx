import { useEffect, useState } from 'react';
import { LayoutDashboard, ShoppingCart, UtensilsCrossed, Boxes, ReceiptText, Users } from 'lucide-react';
import { api, hasToken, setToken, setUnauthorizedHandler } from './api';
import { Layout, Logo } from './components/Layout';
import { Spinner } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Employees from './pages/Employees';

// "allowed" uses the permission flags the backend computes from Cashier/Manager.
const PAGES = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: Dashboard, allowed: () => true },
  { key: 'pos', label: 'Point of Sale', icon: ShoppingCart, component: POS, allowed: (u) => u.canProcessSales },
  { key: 'products', label: 'Products', icon: UtensilsCrossed, component: Products, allowed: (u) => u.canManageProducts },
  { key: 'inventory', label: 'Inventory', icon: Boxes, component: Inventory, allowed: () => true },
  { key: 'orders', label: 'Order History', icon: ReceiptText, component: Orders, allowed: () => true },
  { key: 'employees', label: 'Employees', icon: Users, component: Employees, allowed: (u) => u.canManageEmployees },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(hasToken());
  const [page, setPage] = useState('pos');

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });
    if (!hasToken()) return;
    api('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = ({ token, employee }) => {
    setToken(token);
    setUser(employee);
    setPage(employee.role === 'MANAGER' ? 'dashboard' : 'pos');
  };

  const handleLogout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* logging out locally is enough */
    }
    setToken(null);
    setUser(null);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 animate-fade-in">
        <Logo />
        <Spinner size={22} />
      </div>
    );
  }

  if (!user) return <Login onLogin={handleLogin} />;

  const pages = PAGES.filter((p) => p.allowed(user));
  const current = pages.find((p) => p.key === page) || pages[0];
  const Page = current.component;

  return (
    <Layout pages={pages} current={current.key} onNavigate={setPage} user={user} onLogout={handleLogout}>
      <Page user={user} />
    </Layout>
  );
}
