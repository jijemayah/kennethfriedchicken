# Kenneth Fried Chicken (KFC) — POS System

College OOP project: React + Vite + Tailwind frontend, plain Java 21 backend (JDBC, no frameworks), Supabase PostgreSQL.

```
React (Vercel)  →  Java HTTP API (Render)  →  JDBC  →  Supabase PostgreSQL
```

## Live demo & login

**Website:** https://frontend-phi-pied-58.vercel.app

| Role | Username | Password | Can do |
|---|---|---|---|
| Manager | `kdrueco` | `WeLoveSirBernsSirBernsFanclub123` | Everything: POS, products, inventory, employees, dashboard, orders |
| Cashier | `jesguerra` | `WeLoveSirBernsSirBernsFanclub123` | POS checkout, dashboard, view inventory and orders |

These are demo accounts for a test website. The backend runs on Render's free plan, so the first load after a while can take 30–60 seconds while it wakes up.

Test card number for card payments: `4242 4242 4242 4242` (simulated, nothing is charged).

## Folder structure

```
database/   schema.sql (tables + constraints), seed.sql (sample data)
backend/    Java API  — src/main/java/com/kfc/pos/
  model/      Employee, Cashier, Manager, Product, Category, InventoryItem, Order, OrderItem, Customer, Validator
  payment/    Payment (abstract), CashPayment, GCashPayment, CardPayment, PaymentRecord
  table/      one class per database table (ProductTable, OrderTable, …) + CrudTable<T>; all SQL lives here
  service/    CheckoutService (transaction), AuthService, PasswordHasher
  http/       HTTP handlers + tiny JSON helper (no OOP rules here, just requests/responses)
frontend/   React app — src/pages (Login, Dashboard, POS, Products, Inventory, Orders, Employees)
```

## Where each OOP concept is

| Concept | Where | What to say in the defense |
|---|---|---|
| **Encapsulation** | `Product`, `Order`, `InventoryItem`, `Employee` | Fields are `private`. `Product.setPrice()` rejects negatives. `Order` has no setters for subtotal/VAT/total; they are recalculated in `addItem()`. `InventoryItem` stock only changes through `addStock()`/`removeStock()`, which never allow negative stock. |
| **Inheritance** | `Employee` → `Cashier`, `Manager` | Shared fields (name, username, password hash) are written once in `Employee`. Subclasses only define their role and permissions. |
| **Polymorphism** | `Payment` → `CashPayment`, `GCashPayment`, `CardPayment`; also `Employee.canManageProducts()` | `CheckoutService` holds a `Payment` variable and calls `payment.process()`. Java runs the cash, GCash, or card version at runtime. Permission checks call `user.canManageInventory()` without checking which subclass it is. |
| **Abstraction** | `abstract class Payment` | It declares `validate()`, `buildReference()`, `getDetails()` without code. Checkout uses the payment without knowing how each method is validated. |
| Generics | `CrudTable<T>`, `JsonMapper.list()` | One CRUD interface reused for `Category`, `Product`, `Employee`, `Customer`. |
| Regex | `Validator`, `GCashPayment`, `CardPayment` | Username, PH mobile number (`^09\d{9}$`), 16-digit card, card brand, masking `0917****567`. |

Checkout (`CheckoutService.checkout`) runs in **one database transaction**: lock stock → build order with database prices → process payment → insert order, items, payment → reduce stock → `commit()`. Any error → `rollback()`.

## Setup

### 1. Database (Supabase)
1. Create a Supabase project.
2. In **SQL Editor**, run `database/schema.sql`, then `database/seed.sql`.

The seed creates the two demo logins listed in [Live demo & login](#live-demo--login).

### 2. Backend
Copy `backend/.env.example` to `backend/.env` and fill in the **Session pooler** JDBC connection details from Supabase (Project Settings → Database).

```bash
cd backend
mvn package
java -jar target/kfc-pos.jar
```
No Maven installed? Copy the PostgreSQL driver jar (`postgresql-42.7.4.jar`, from `~/.m2` or Maven Central) to `backend/target/postgresql.jar`, then from `backend/`:

```bash
javac --release 21 -cp target/postgresql.jar -d target/classes $(find src -name "*.java")
```
```bash
java -cp "target/classes;target/postgresql.jar" com.kfc.pos.Main
```
(On macOS/Linux use `:` instead of `;` in the classpath.)

The API runs on `http://localhost:8080` (check `http://localhost:8080/api/health`).

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Set `VITE_API_URL` in `frontend/.env.local` if the API is not on `http://localhost:8080`.

## Deploy
- **Backend → Render:** New Web Service → this repo → Root directory `backend` → Runtime **Docker**. Add env vars `DB_URL`, `DB_USER`, `DB_PASSWORD`, `CORS_ORIGIN` (your Vercel URL). Health check path `/api/health`.
- **Frontend → Vercel:** Import repo → Root directory `frontend` → Framework Vite → env var `VITE_API_URL` = your Render URL.

Database credentials live only in backend environment variables, never in the frontend.
