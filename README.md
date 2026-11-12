# Kenneth Fried Chicken (KFC) — POS System

College OOP project: React + Vite + Tailwind frontend, plain Java 21 backend (JDBC, no frameworks), Supabase PostgreSQL.

```
React (Vercel)  →  Java HTTP API (Render)  →  JDBC  →  Supabase PostgreSQL
```

## Folder structure

```
database/   schema.sql (tables + constraints), seed.sql (sample data)
backend/    Java API  — src/main/java/com/kfc/pos/
  model/      Employee, Cashier, Manager, Product, Category, InventoryItem, Order, OrderItem, Customer, Validator
  payment/    Payment (abstract), CashPayment, GCashPayment, CardPayment, PaymentRecord
  dao/        CrudDao<T> + JDBC classes (all SQL lives here)
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
| Generics | `CrudDao<T>`, `JsonMapper.list()` | One CRUD interface reused for `Category`, `Product`, `Employee`, `Customer`. |
| Regex | `Validator`, `GCashPayment`, `CardPayment` | Username, PH mobile number (`^09\d{9}$`), 16-digit card, card brand, masking `0917****567`. |

Checkout (`CheckoutService.checkout`) runs in **one database transaction**: lock stock → build order with database prices → process payment → insert order, items, payment → reduce stock → `commit()`. Any error → `rollback()`.

## Setup

### 1. Database (Supabase)
1. Create a Supabase project.
2. In **SQL Editor**, run `database/schema.sql`, then `database/seed.sql`.

Demo logins (sample data only): Manager `kdrueco`, Cashier `jesguerra`, password `ChangeMe123` for both. Change them after deploying.

### 2. Backend
Copy `backend/.env.example` to `backend/.env` and fill in the **Session pooler** JDBC connection details from Supabase (Project Settings → Database).

```bash
cd backend
mvn package
java -jar target/kfc-pos.jar
```
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
