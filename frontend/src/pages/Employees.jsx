import { useState } from 'react';
import { Plus, Pencil, ShieldCheck, UserRound, Power } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { Modal, PageHeader, TableSkeleton, ErrorBox, Field, Spinner } from '../components/ui';
import { useApi } from '../utils';

const EMPTY = { firstName: '', lastName: '', username: '', role: 'CASHIER', password: '', active: true };

export default function Employees({ user }) {
  const toast = useToast();
  const employees = useApi('/employees');
  const [editing, setEditing] = useState(null);

  const toggleActive = async (e) => {
    try {
      await api(`/employees/${e.id}`, { method: 'PUT', body: { ...e, active: !e.active } });
      toast.success(`${e.fullName} ${e.active ? 'deactivated' : 'activated'}`);
      employees.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <PageHeader title="Employees" subtitle="Cashiers process sales. Managers also manage products, stock, and staff.">
        <button className="btn-primary" onClick={() => setEditing({ ...EMPTY })}><Plus size={16} /> Add employee</button>
      </PageHeader>

      <div className="card overflow-hidden">
        {employees.error ? (
          <div className="p-4"><ErrorBox message={employees.error} onRetry={employees.reload} /></div>
        ) : employees.loading && !employees.data ? (
          <TableSkeleton rows={3} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-page/60">
                <tr><th className="th">Name</th><th className="th">Username</th><th className="th">Role</th><th className="th">Permissions</th><th className="th">Status</th><th className="th" /></tr>
              </thead>
              <tbody>
                {employees.data.map((e) => (
                  <tr key={e.id} className="border-t border-line transition-colors hover:bg-page/60">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {e.firstName[0]}{e.lastName[0]}
                        </span>
                        <span className="font-semibold">{e.fullName}{e.id === user.id && <span className="ml-2 text-xs text-muted">(you)</span>}</span>
                      </div>
                    </td>
                    <td className="td text-muted">@{e.username}</td>
                    <td className="td">
                      <span className={`badge ${e.role === 'MANAGER' ? 'bg-primary text-white' : 'bg-page text-ink'}`}>
                        {e.role === 'MANAGER' ? <ShieldCheck size={12} /> : <UserRound size={12} />}
                        {e.role === 'MANAGER' ? 'Manager' : 'Cashier'}
                      </span>
                    </td>
                    <td className="td text-xs text-muted">
                      {[e.canProcessSales && 'Sales', e.canManageProducts && 'Products', e.canManageInventory && 'Inventory', e.canManageEmployees && 'Staff'].filter(Boolean).join(' · ') || 'None'}
                    </td>
                    <td className="td">
                      <span className={`badge ${e.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-muted'}`}>{e.active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost p-2" onClick={() => setEditing({ ...e, password: '' })} aria-label="Edit"><Pencil size={15} /></button>
                        {e.id !== user.id && (
                          <button className="btn-ghost p-2" onClick={() => toggleActive(e)} aria-label={e.active ? 'Deactivate' : 'Activate'} title={e.active ? 'Deactivate' : 'Activate'}>
                            <Power size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EmployeeForm employee={editing} isSelf={editing?.id === user.id} onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); employees.reload(); toast.success('Employee saved'); }} />
    </div>
  );
}

function EmployeeForm({ employee, isSelf, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [last, setLast] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (employee && employee !== last) {
    setLast(employee);
    setForm({ ...EMPTY, ...employee });
    setError('');
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (form.id) await api(`/employees/${form.id}`, { method: 'PUT', body: form });
      else await api('/employees', { method: 'POST', body: form });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(employee)}
      onClose={onClose}
      title={form.id ? 'Edit employee' : 'Add employee'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" form="employee-form" disabled={busy}>{busy && <Spinner />} Save</button>
        </>
      }
    >
      <form id="employee-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="First name"><input className="input" value={form.firstName} onChange={set('firstName')} required /></Field>
        <Field label="Last name"><input className="input" value={form.lastName} onChange={set('lastName')} required /></Field>
        <Field label="Username"><input className="input" value={form.username} onChange={set('username')} pattern="[a-z0-9._]{4,20}" title="4-20 lowercase letters, numbers, dot or underscore" required /></Field>
        <Field label="Role">
          <select className="input" value={form.role} onChange={set('role')} disabled={isSelf}>
            <option value="CASHIER">Cashier</option>
            <option value="MANAGER">Manager</option>
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label={form.id ? 'New password (leave blank to keep)' : 'Password'}>
            <input className="input" type="password" value={form.password} onChange={set('password')} required={!form.id} autoComplete="new-password" />
          </Field>
          <p className="mt-1 text-xs text-muted">At least 8 characters with a letter and a number.</p>
        </div>
        {error && <p className="sm:col-span-2 rounded-xl bg-primary/5 px-3 py-2.5 text-sm text-primary">{error}</p>}
      </form>
    </Modal>
  );
}
