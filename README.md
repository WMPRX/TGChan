# TGChan — Telegram Channel & Group Directory

Next.js 16 tabanlı, çok dilli Telegram kanal ve grup dizini uygulaması.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Standalone Output)
- **Runtime**: Bun
- **Database**: SQLite (Prisma ORM)
- **UI**: shadcn/ui + Tailwind CSS 4
- **Auth**: next-auth
- **i18n**: next-intl (10 dil desteği)
- **Deployment**: Docker + Coolify

## Quick Start (Local)

```bash
# Install dependencies
bun install

# Generate Prisma client
bunx prisma generate

# Setup database
bunx prisma db push

# Seed initial data (categories, plans, admin user)
bun run db:seed  # or: bunx prisma db seed

# Development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default Admin Login**: `admin@tgdir.com` / `admin123456`

## Docker Deployment

### Build & Run

```bash
docker compose up -d --build
```

The application will be available at `http://localhost:3000`.

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLite database path | `file:/app/data/custom.db` |
| `NEXTAUTH_SECRET` | Secret key for next-auth | *(required)* |
| `NEXTAUTH_URL` | Public URL of your app | `http://localhost:3000` |

## Coolify Deployment

### Step 1: Add New Resource

1. Coolify dashboard'da projenize gidin
2. **"New Resource"** → **"Application"** seçin
3. **"Public Repository"** veya **"GitHub App"** seçin

### Step 2: Connect Repository

- **Repository URL**: `https://github.com/WMPRX/TGChan`
- **Branch**: `main`

### Step 3: Configure Build Settings

- **Build Pack**: `Nixpacks` veya `Docker`
- **Dockerfile Location**: `/Dockerfile` (Docker seçerseniz)

### Step 4: Set Environment Variables

Coolify'da **Environment** sekmesine şu değişkenleri ekleyin:

```
DATABASE_URL=file:/app/data/custom.db
NEXTAUTH_SECRET=<güçlü-bir-secret-oluşturun>
NEXTAUTH_URL=https://sizin-domain.com
```

`NEXTAUTH_SECRET` oluşturmak için:
```bash
openssl rand -base64 32
```

### Step 5: Configure Persistent Storage

SQLite veritabanının kalıcı olması için volume ekleyin:

- **Mount Path**: `/app/data`
- **Type**: Volume veya Bind Mount

### Step 6: Port Configuration

- **Container Port**: `3000`
- Coolify otomatik olarak reverse proxy yapacaktır

### Step 7: Deploy

**"Deploy"** butonuna tıklayın. İlk deployment Docker image build edeceği için 2-5 dakika sürebilir.

### Health Check

Uygulama şu endpoint'te health check yapabilir:
```
GET /api/categories
```

## Project Structure

```
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes (auth, admin, channels, etc.)
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── admin/        # Admin panel components
│   │   ├── auth/         # Authentication modals
│   │   ├── channel/      # Channel detail components
│   │   ├── home/         # Home page sections
│   │   ├── layout/       # Header, Footer
│   │   ├── ui/           # shadcn/ui components
│   │   └── views/        # Page views
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities, DB, i18n, store
├── prisma/
│   └── schema.prisma     # Database schema
├── scripts/
│   └── seed.js           # Database seeder
├── Dockerfile            # Multi-stage Docker build
├── docker-compose.yml    # Docker Compose config
└── .env.example          # Environment template
```

## Supported Languages

TR, EN, RU, ZH, ID, VI, ES, AR, DE, FR
