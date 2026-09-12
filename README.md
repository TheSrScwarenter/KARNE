# KARNE

AI-powered YKS coaching & tracking system — personalized study plans, progress tracking, simulated exams, and data-driven insights to help students prepare more effectively for the Turkish university entrance exams (YKS).

## Table of Contents
- [What is KARNE?](#what-is-karne)
- [Why KARNE?](#why-karne)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure & Architecture](#project-structure--architecture)
- [Quick Start](#quick-start)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Run](#run)
- [How It Works (High Level)](#how-it-works-high-level)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security & Privacy](#security--privacy)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## What is KARNE?
KARNE is a web application designed to help students preparing for YKS (Yükseköğretim Kurumları Sınavı) through AI-assisted coaching. The system collects a student's profile, performance history and objectives, then uses AI and analytics to generate personalized study plans, recommend practice questions, run exam simulations, and visualize progress — all aimed at improving study efficiency and outcomes.

Project description: "yapay zeka destekli yks koçluk&takip sistemi" — the project focuses on AI-powered coaching and tracking tailored for YKS preparation.

## Why KARNE?
Traditional study plans are often generic and fail to adapt to individual strengths, weaknesses, or changing schedules. KARNE aims to:
- Provide dynamic, personalized plans that adapt as the student improves.
- Detect weak topics and re-prioritize study focus automatically.
- Reduce friction in planning and tracking, so students can spend more time studying and less time organizing.
- Offer actionable insights to students and coaches via clear visualizations and automated recommendations.

## Key Features
- Personalized study plan generation based on goals, past performance, and available time.
- Scheduled study sessions and reminders (daily/weekly).
- Timed full/sectional exam simulations mimicking YKS conditions.
- Automatic strength/weakness detection per subject and topic.
- AI-powered question recommendations and answer explanations.
- Progress dashboards with charts and historical comparisons.
- Coach mode for mentors: assign plans, review student progress, leave feedback.
- Exportable reports (PDF / CSV) for parents, coaches, or student records.
- Role-based access control (student, coach, admin).
- Integrations: notification services (email/push), calendar sync, and optional third-party AI providers.

## Technology Stack
(Adjust to actual project choices — the repository is TypeScript-heavy)
- Language: TypeScript
- Backend: Node.js (Express / NestJS / similar)
- Frontend: React / Next.js (TypeScript)
- Database: PostgreSQL or MongoDB
- ORM: Prisma / TypeORM / Mongoose
- Caching / Queues: Redis
- AI / LLM: OpenAI or compatible models (via API)
- Containerization: Docker & Docker Compose
- CI/CD: GitHub Actions (recommended)
- Testing: Jest / Vitest + React Testing Library

## Project Structure & Architecture (example)
- /apps
  - /api — backend service (REST / GraphQL)
  - /web — frontend (SPA / SSR)
- /packages — shared libs (types, utils, ui)
- /infra — Docker, deployment manifests, infra-as-code
- /scripts — helper scripts (seed, migrations, tests)

The backend exposes authenticated APIs for planning, exams, user management, and analytics. The AI engine is used as a service: requests are sanitized/limited and only necessary data is sent to third-party models.

## Quick Start

### Requirements
- Node.js 18+ and npm or Yarn
- Docker (optional, recommended for dev)
- PostgreSQL or MongoDB instance (local or cloud)

### Installation
1. Clone the repository:
   git clone https://github.com/TheSrScwarenter/KARNE.git
2. Enter the project:
   cd KARNE
3. Install dependencies:
   npm install
   or
   yarn install

### Environment Variables
Create a `.env` (or `.env.local` for frontend) with at least:

```
# App
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgres://user:password@localhost:5432/karne_db

# Auth
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# AI Provider
OPENAI_API_KEY=sk-...

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Email / Notifications
SMTP_HOST=smtp.example.com
SMTP_USER=...
SMTP_PASS=...
```

Adjust values for your environment. If the repo includes `.env.example`, copy that as a starting point.

### Run
Development:

npm run dev
or

yarn dev

Build & run production:

npm run build
npm start

(Confirm script names in package.json and update README if they differ.)

## How It Works (High Level)
1. Registration & Profile: Student enters study hours, target score/majors, and baseline test results.
2. Assessment: The system analyzes past tests to identify strengths and weaknesses.
3. Plan Generation: AI + heuristic rules produce a prioritized, time-bound study plan.
4. Execution: Student follows assigned sessions, completes questions and simulated exams.
5. Feedback Loop: Results are re-ingested and the plan is updated automatically to focus on weaknesses.
6. Reporting: Dashboards and reports show progress trends and forecasts.

## Development
- Coding standards: TypeScript strict mode, ESLint, Prettier.
- Branching: feature/*, fix/*, chore/*.
- Commit messages: Conventional Commits recommended.
- Local development: use Docker Compose (if provided) or run services locally.
- Add comprehensive tests for new features (unit + integration).

## Testing
- Unit tests: jest/vitest
- Integration tests: use a test database or test containers
- End-to-end: Playwright / Cypress (optional)

Run tests:
npm test
or
yarn test

## Deployment
- Containerize services with Docker.
- Use CI (GitHub Actions) to run tests, build images, and deploy.
- Frontend can be deployed to Vercel/Netlify; backend to Heroku/DigitalOcean/AWS/GCP.
- Store secrets in environment-specific secret managers (GitHub Secrets, AWS Secrets Manager, etc.)

## Security & Privacy
- Student data is sensitive. Encrypt data at rest where necessary and use TLS in transit.
- Minimize PII sent to third-party AI APIs; anonymize or aggregate where possible and obtain user consent.
- Implement rate limits and input validation for all endpoints.
- Regularly rotate secrets and audit access logs.

## Contributing
Contributions are welcome:
1. Fork the repo.
2. Create a branch: git checkout -b feature/your-feature
3. Make changes, include tests and documentation.
4. Push and open a Pull Request describing changes and how to test them.

Please follow code style and include tests for new behavior.

## License
Check the LICENSE file in the repository. If none exists, consider adding an open-source license such as MIT.

## Contact
Project owner: TheSrScwarenter
Repository: https://github.com/TheSrScwarenter/KARNE

Thank you — contributions, bug reports and feature requests are appreciated.
