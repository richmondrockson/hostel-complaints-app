Hostel Complaint Management System

A full-stack web app that lets hostel residents submit and track maintenance/service complaints, and gives admins a real-time dashboard to manage, filter, and resolve them.

Built to replace informal complaint channels (WhatsApp messages, paper forms) with a transparent system where residents can see the status of their own complaints and admins can triage everything in one place.

Live app: https://kaleidoscopic-cajeta-b0ee35.netlify.app

Tech Stack

Frontend: React 19 (Vite), React Router, Firebase Auth SDK
Backend: Node.js, Express 5
Database & Auth: Firebase (Firestore, Authentication, Admin SDK)
Deployment: Netlify (client), Render (server)

Features

Resident accounts — sign up and log in via Firebase Authentication
Submit complaints — title, room number, category, and description, with basic validation
Track status in real time — residents see their own complaints update live (open → in-progress → resolved) via Firestore's onSnapshot listeners, no page refresh needed
Admin dashboard — view all complaints across the hostel, filter by status or category, and resolve or annotate them with notes
Role-based access control — a custom Firebase Auth claim (role: admin) gates admin-only routes; residents can only view/manage their own complaints, enforced both on the client and at the API level
Secure API — every request is authenticated via a Firebase ID token passed as a Bearer token and verified server-side before touching the database


How authentication and authorization work

On login, the client gets a Firebase ID token from Firebase Auth.
Every API request attaches that token as Authorization: Bearer <token>.
A verifyToken middleware on the server validates the token against Firebase Admin SDK before any route logic runs.
Admin-only routes (viewing all complaints, updating status, deleting) additionally pass through a verifyAdmin middleware, which checks for a custom admin claim set on the user's Firebase Auth record.
Even at the data layer, a resident's own complaint fetch is scoped to studentId, so one resident can never read another's complaint by guessing an ID.


API Reference

All routes are prefixed with /api/complaints. All routes require a valid Bearer token; routes marked (admin) additionally require the admin custom claim.

MethodRouteDescriptionPOST/Submit a new complaintGET/Get the logged-in resident's own complaintsGET/complaintsGet all complaints, optionally filtered by status or category (admin)GET/:idGet a single complaint by ID (only if it belongs to the requester)PATCH/:idUpdate a complaint's status/add an admin note (admin)DELETE/:idSoft-delete then remove a complaint (admin)

Running locally

Prerequisites

Node.js 18+
A Firebase project with Authentication and Firestore enabled


Client

bashcd client
npm install
npm run dev

Create a client/.env with your Firebase client config:

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

Server

bashcd server
npm install
npm run dev

Create a server/.env with your Firebase Admin SDK credentials (from Firebase Console → Project Settings → Service Accounts → Generate new private key):

PORT=5000
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=


Never commit either .env file or a service account JSON key. Both are covered by .gitignore in this repo.



What I built

This was my most sustained solo project — I designed and built both the frontend and backend from scratch, including:

All six complaint API routes, tested end-to-end with Postman before wiring up the frontend
The full JWT/Bearer token auth flow, including writing the token-verification and admin-role-checking middleware myself
A real-time dashboard using Firestore's onSnapshot listeners instead of polling, so admins see new complaints appear live
Firestore composite indexes to support filtering by status and category efficiently
Deployment and CORS configuration across two separate hosts (Netlify for the client, Render for the server)


