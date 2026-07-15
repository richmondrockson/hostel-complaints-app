# Hostel Complaint Management System
 
A full-stack web app that lets hostel residents submit and track maintenance/service complaints, and gives admins a real-time dashboard to manage, filter, and resolve them.
 
Built to replace informal complaint channels (WhatsApp messages, paper forms) with a transparent system where residents can see the status of their own complaints and admins can triage everything in one place.
 
**Live app:** [https://kaleidoscopic-cajeta-b0ee35.netlify.app](https://kaleidoscopic-cajeta-b0ee35.netlify.app)
 
 
## Tech Stack
 
**Frontend:** React 19 (Vite), React Router, Firebase Auth SDK
**Backend:** Node.js, Express 5
**Database & Auth:** Firebase (Firestore, Authentication, Admin SDK)
**Deployment:** Netlify (client), Render (server)
 
## Features
 
- **Resident accounts** — sign up and log in via Firebase Authentication
- **Submit complaints** — title, room number, category, and description, with basic validation
- **Track status in real time** — residents see their own complaints update live (`open` → `in-progress` → `resolved`) via Firestore's `onSnapshot` listeners, no page refresh needed
- **Admin dashboard** — view all complaints across the hostel, filter by status or category, and resolve or annotate them with notes
- **Role-based access control** — a custom Firebase Auth claim (`role: admin`) gates admin-only routes; residents can only view/manage their own complaints, enforced both on the client and at the API level
- **Secure API** — every request is authenticated via a Firebase ID token passed as a Bearer token and verified server-side before touching the database
## How authentication and authorization work
 
1. On login, the client gets a Firebase ID token from Firebase Auth.
2. Every API request attaches that token as `Authorization: Bearer <token>`.
3. A `verifyToken` middleware on the server validates the token against Firebase Admin SDK before any route logic runs.
4. Admin-only routes (viewing all complaints, updating status, deleting) additionally pass through a `verifyAdmin` middleware, which checks for a custom `admin` claim set on the user's Firebase Auth record.
5. Even at the data layer, a resident's own complaint fetch is scoped to `studentId`, so one resident can never read another's complaint by guessing an ID.
## API Reference
 
All routes are prefixed with `/api/complaints`. All routes require a valid Bearer token; routes marked **(admin)** additionally require the admin custom claim.
 
| Method | Route | Description |
|---|---|---|
| `POST` | `/` | Submit a new complaint |
| `GET` | `/` | Get the logged-in resident's own complaints |
| `GET` | `/complaints` | Get all complaints, optionally filtered by `status` or `category` **(admin)** |
| `GET` | `/:id` | Get a single complaint by ID (only if it belongs to the requester) |
| `PATCH` | `/:id` | Update a complaint's status/add an admin note **(admin)** |
| `DELETE` | `/:id` | Soft-delete then remove a complaint **(admin)** |
 
## Running locally
 
### Prerequisites
- Node.js 18+
- A Firebase project with Authentication and Firestore enabled
### Client
```bash
cd client
npm install
npm run dev
```
 
Create a `client/.env` with your Firebase project's API key and project ID:
```
VITE_API_KEY=
VITE_PROJECT_ID=
```
 
> These two values are safe to expose in a built app — Firebase's client-side config identifies your project but doesn't grant privileged access on its own; actual data access is controlled by Firestore Security Rules. The remaining config values (`authDomain`, `storageBucket`, `messagingSenderId`, `appId`) are set directly in `client/src/firebase.js`.
 
### Server
```bash
cd server
npm install
npm run dev
```
 
Create a `server/.env` with your Firebase Admin SDK credentials (from Firebase Console → Project Settings → Service Accounts → Generate new private key):
```
PORT=5000
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```
 
> Never commit either `.env` file or a service account JSON key. Both are covered by `.gitignore` in this repo.
 
## What I built
 
This was my most sustained solo project — I designed and built both the frontend and backend from scratch, including:
- All six complaint API routes, tested end-to-end with Postman before wiring up the frontend
- The full JWT/Bearer token auth flow, including writing the token-verification and admin-role-checking middleware myself
- A real-time dashboard using Firestore's `onSnapshot` listeners instead of polling, so admins see new complaints appear live
- Firestore composite indexes to support filtering by status and category efficiently
- Deployment and CORS configuration across two separate hosts (Netlify for the client, Render for the server)
