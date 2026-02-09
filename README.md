# Niet-Ban-OS (Spiritual Management System)

🙏 **A SaaS Platform for Temple Management & Online Practice Gamification**

## Tech Stack
- **Framework**: [NestJS](https://nestjs.com/) (Modular Architecture)
- **Language**: TypeScript
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Caching/Queue**: Redis + [BullMQ](https://docs.bullmq.io/)
- **Real-time**: [Socket.io](https://socket.io/)
- **Containerization**: Docker
- **Validation**: `class-validator` & `class-transformer`

## Folder Structure
The project follows a **Modular Architecture**. Each feature is encapsulated in its own directory under `src/modules`.

```text
src/
├── common/             # Global filters, interceptors, pipes
├── database/           # Database module & Prisma service
├── queue/              # Queue configuration
├── modules/            # Feature modules
│   ├── practice/       # Practice & Gamification logic
│   │   ├── dto/        # Data Transfer Objects
│   │   ├── entities/   # Database Entities
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── gateways/   # Socket.io Gateways
│   │   └── practice.module.ts
│   └── temple/         # Temple management
│       ├── ...
└── app.module.ts       # Root module
```

## Setup & Running

### 1. Requirements
- Node.js (v20+)
- Docker & Docker Compose
- NPM

### 2. Installation
```bash
npm install
```

### 3. Database & Cache (Docker)
```bash
docker-compose up -d
```

### 4. Prisma Setup
```bash
npx prisma generate
```

### 5. Running the App
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Tone & Philosophy
- **Serious Backend**: Clean code, SOLID principles, and high performance.
- **Gamified Frontend**: Engagement-driven features for spiritual practice (Karma points, Leveling, Zen sessions).

---
*Namo Buddhaya!*
