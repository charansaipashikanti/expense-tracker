<<<<<<< HEAD
# expense-tracker
to track every day expenses
=======
# 🏠 RoomSplit — Room Expense Tracker

A production-ready Splitwise-style SaaS application for roommates, shared apartments, friends sharing expenses, and family groups. Track shared expenses, split bills fairly, and settle up easily.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

---

## ✨ Features

### Core Features
- **Multi-group Support** — Create and manage multiple expense groups
- **4 Split Types** — Equal, Percentage, Quantity, Exact amount splits
- **Balance Engine** — Real-time Splitwise-style balance calculations
- **Smart Settlements** — Minimum transaction algorithm to settle debts
- **Carry Forward** — Automatic balance carry-forward across months
- **Monthly Rent** — Configure and auto-split rent among members
- **Budgets** — Category-wise monthly budgets with alerts

### User Management
- **JWT Authentication** — Access + Refresh token with rotation
- **Role-Based Access** — Super Admin, Group Admin, Member
- **Invite System** — Email and link-based invitations

### Analytics & Reports
- **Dashboard** — Cards, charts (Recharts), and AI-style insights
- **Monthly Reports** — Expenses, settlements, activity logs
- **Category Breakdown** — Pie charts for spending categories
- **Budget Utilization** — Track spending vs budget with alerts

### Other Features
- **Receipt Upload** — JPG, PNG, PDF via Cloudinary
- **Notifications** — In-app notification system
- **Activity Timeline** — Full audit trail
- **Dark/Light Mode** — System preference detection
- **Mobile Responsive** — Mobile-first design
- **Recurring Expenses** — Auto-create monthly entries

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI Framework |
| Vite | Build Tool |
| TypeScript | Type Safety |
| Tailwind CSS v4 | Styling |
| React Router v7 | Routing |
| TanStack React Query | Server State |
| React Hook Form + Zod | Forms & Validation |
| Recharts | Charts |
| Framer Motion | Animations |
| Lucide React | Icons |
| Sonner | Toast Notifications |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | API Server |
| TypeScript | Type Safety |
| MongoDB + Mongoose | Database |
| JWT + bcrypt | Authentication |
| Zod | Validation |
| Cloudinary + Multer | File Uploads |
| Nodemailer | Email |
| express-rate-limit | Rate Limiting |
| Helmet + CORS | Security |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm 9+

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/room-expense-tracker.git
cd room-expense-tracker
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
```

### 3. Seed Database (Optional)

```bash
npm run seed --workspace=server
```

This creates sample users:
| User | Email | Password |
|------|-------|----------|
| Super Admin | admin@roomexpense.app | Admin@123456 |
| Charan | charan@example.com | password123 |
| Rahul | rahul@example.com | password123 |
| Kiran | kiran@example.com | password123 |

### 4. Start Development

```bash
# Start both frontend and backend
npm run dev

# Or separately:
npm run dev:server   # Backend on http://localhost:5000
npm run dev:client   # Frontend on http://localhost:5173
```

---

## 📁 Project Structure

```
room-expense-tracker/
├── client/                        # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/layout/     # AppLayout, ProtectedRoute
│   │   ├── features/auth/         # Auth context, hooks
│   │   ├── lib/                   # API client, utilities
│   │   ├── pages/                 # Route-level pages
│   │   └── types/                 # TypeScript interfaces
│   └── index.html
│
├── server/                        # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── config/                # DB, env, Cloudinary
│   │   ├── controllers/           # Route handlers
│   │   ├── middleware/            # Auth, RBAC, validation
│   │   ├── models/                # Mongoose schemas (12 models)
│   │   ├── routes/                # Express routes
│   │   ├── services/              # Business logic
│   │   ├── utils/                 # Helpers, errors, constants
│   │   └── validators/            # Zod schemas
│   └── seed/                      # Database seed script
│
├── .github/workflows/             # CI/CD
└── .env.example                   # Environment template
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/profile` | Get profile |
| PATCH | `/api/auth/profile` | Update profile |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/groups` | Create group |
| GET | `/api/groups` | My groups |
| GET | `/api/groups/:id` | Group detail |
| POST | `/api/groups/:id/members` | Add member |
| POST | `/api/groups/:id/invite` | Send invitation |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses/group/:id` | List expenses |
| GET | `/api/expenses/group/:id/balances` | Get balances |
| GET | `/api/expenses/group/:id/settlement-suggestions` | Smart settlements |

### Settlements
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/settlements` | Record settlement |
| GET | `/api/settlements/group/:id` | List settlements |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/group/:id/stats` | Dashboard stats |
| GET | `/api/analytics/group/:id/trend` | Monthly trend |
| GET | `/api/analytics/group/:id/categories` | Category breakdown |
| GET | `/api/analytics/group/:id/insights` | AI insights |

---

## 🚢 Deployment

### Frontend → Vercel
1. Connect GitHub repo to Vercel
2. Set root directory to `client`
3. Add environment variable: `VITE_API_URL`

### Backend → Render
1. Connect GitHub repo to Render
2. Set root directory to `server`
3. Build command: `npm ci && npm run build`
4. Start command: `node dist/server.js`
5. Add all environment variables from `.env.example`

### Database → MongoDB Atlas
1. Create a free M0 cluster
2. Create a database user
3. Whitelist IP addresses (0.0.0.0/0 for Render)
4. Copy connection string to `MONGODB_URI`

---

## 📄 License

MIT License — feel free to use this for your own projects.
>>>>>>> 4a69c76 (feat: initial commit with mobile layout optimizations, scroll-to-top navigation, and dropdown hover styling)
