# PROGRESS

_Last updated: 2026-11-13_

## Completed
- **Database:** normalized schema (employee, customer, category, product, inventory, orders, order_item, payment) with PK/FK, CHECK and UNIQUE constraints, NUMERIC money, indexes, RLS enabled. Seed data: 2 employees (John Kenneth Drueco – Manager, Jeremiah Joshua Esguerra – Cashier), 5 customers (Euwan Cuesta, Sean Gener, Sebastian Cuvin, Jose Andre Evangelista, Jake Andrei De Vera), 7 categories, 25 products, inventory, 27 orders across the last 7 days with items and payments (totals computed from items).
- **Backend (Java 21, JDBC, built-in HttpServer):** OOP model (encapsulation, Employee→Cashier/Manager inheritance, abstract Payment with Cash/GCash/Card polymorphism), generic `CrudDao<T>`, regex validation, PBKDF2 password hashing, token sessions, role checks, transactional checkout with row locks and rollback, dashboard reports, order search.
- **Frontend (React/Vite/Tailwind/Lucide):** Login, Dashboard, POS (search, categories, cart, quantities, VAT, Cash/GCash/Card payment modal), Products + Categories CRUD, Inventory (stock in/out, reorder level), Order History (filters, receipt), Employees (add/edit/deactivate), printable receipts. Animations: button feedback, card hover lift, page transitions, modal scale/fade in/out, dropdown, toasts, skeletons, cart add/remove, dashboard entrance and chart growth.
- **Tested:** backend compiles (`javac --release 21`); OOP smoke test passed (totals, VAT, change, GCash/card regex + Luhn rejection, stock overdraw rejection, role permissions, JSON round-trip); API boots, health/CORS/401 behave correctly; frontend production build passes; login page renders.

- **Update 2:** stock can be edited from the Products form ("Stock on hand") and from Inventory → Edit stock (Stock in / Stock out / Set count). `PUT /api/inventory/{id}` accepts an exact `quantity`; the difference still goes through `InventoryItem.addStock/removeStock`. Brand photo used as logo (sidebar, login, receipt, favicon). Gradient backgrounds, buttons, nav, and charts.

## Known issues / not yet verified
- Tested end-to-end against Supabase on 2026-11-13: 30/30 API checks passed (login, CRUD, stock edits, permissions, all checkout validations, rollback, order search). One real test order (OR-000028, Euwan Cuesta, cash ₱272.16) was created.
- Maven is not installed on this machine; the backend was compiled with `javac`. `mvn package` runs inside the Dockerfile on Render.
- Sessions are kept in memory, so everyone is logged out when the backend restarts (acceptable for the demo).
- Order voiding/refunds are not implemented (`orders.status` and `payment.status` columns are ready for it).

## Next steps
1. Click through every page in the browser once more before the defense.
2. Deploy backend to Render (Docker) and frontend to Vercel; set `CORS_ORIGIN` and `VITE_API_URL`.
3. Optional: void order (manager) that restores stock, CSV export of sales.
