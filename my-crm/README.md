# Northstar CRM

Northstar CRM is a full-stack lead management system built for the take-home assessment in this repository. It uses Next.js for the frontend, a Node.js + Express API written in `.js` files, and MongoDB for persistent CRM data.

## Overview

The app is designed to feel like a real sales CRM rather than a demo. The landing page includes a polished hero section, animated UI details, and a top-right sign-in button. Authenticated users get a dashboard with lead CRUD, lead notes, search, filtering, and dashboard metrics backed by MongoDB.

## Tech Stack

- Frontend: Next.js 16, React 19, Tailwind CSS 4
- Backend: Node.js, Express, JWT, bcryptjs
- Database: MongoDB with Mongoose
- Validation/build: ESLint, Next.js production build

## Features Implemented

- Professional CRM landing page with animated product-style UI
- Sign in and sign up flows with redirects to the dashboard
- Server-protected dashboard route
- Create, view, edit, and delete leads
- Update lead status and assigned salesperson
- Add notes to each lead
- Dashboard metrics for total, new, qualified, won, lost, estimated value, and won value
- Search by lead name, company name, or email
- Filter by status, lead source, and assigned salesperson
- Persistent user and CRM data stored in MongoDB

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root based on `.env.example`.

3. Start the app:

```bash
npm run dev
```

The frontend runs on `http://localhost:3000` and the backend API runs on `http://localhost:4000`.

## Environment Variables

Required variables:

```bash
MONGODB_URI=your-mongodb-connection-string
MONGODB_DB=northstar_crm
JWT_SECRET=your-long-random-secret
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
PORT=4000
SEED_DEFAULT_USER=true
```

## Test Login Credentials

If the database is empty on first run, the server seeds a default test user:

- Email: `admin@example.com`
- Password: `password123`

You can also create your own account from the sign-up form. New users are saved to MongoDB and redirected to their personal dashboard.

## Database Setup

Use any MongoDB database you control, including local MongoDB or MongoDB Atlas. Create a database connection string and place it in `MONGODB_URI`. The app uses Mongoose collections for users and leads, and each lead stores embedded notes.

## Known Limitations

- Authentication is cookie-assisted and JWT-based, but it is still a take-home style implementation rather than a production identity system.
- The CRM is scoped to a single user account at a time, which keeps the demo clean but does not yet include team roles or cross-user permissions.
- There is no drag-and-drop pipeline board yet; lead status is updated from the edit form.

## Reflection

I built the app around the assessment goals first: real persistence, real authentication, CRUD, notes, filtering, and a dashboard with useful sales metrics. I also aimed to make the UI feel like a real SaaS product instead of a scaffold by adding a stronger visual direction, animated background treatment, and a more intentional home page and auth flow.

## Demo Checklist

For the required video, show:

1. The landing page and sign-in button.
2. Sign up flow and redirect to the dashboard.
3. Creating a lead.
4. Editing a lead and changing its status.
5. Adding notes.
6. Searching and filtering the lead list.
7. A brief explanation of the backend and MongoDB collections.
