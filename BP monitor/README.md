# 🩺 Blood Pressure Monitor

A full-stack app to record and visualise blood pressure readings and pulse.

**Tech Stack:** React (Vite) · Node.js / Express · PostgreSQL (Docker)

---

## Quick Start

### 1. Start PostgreSQL (Docker)

```bash
docker compose up -d
```

### 2. Install & run the server

```bash
cd server
npm install
npm run migrate   # creates the bp_readings table
npm run dev        # starts API on http://localhost:4000
```

### 3. Install & run the client

```bash
cd client
npm install
npm run dev        # starts React on http://localhost:5173
```

Open **http://localhost:5173** in your browser — done!

---

## API Endpoints

| Method | Path               | Description          |
|--------|--------------------|----------------------|
| GET    | /api/readings      | List all readings    |
| POST   | /api/readings      | Create a new reading |
| DELETE  | /api/readings/:id  | Delete a reading     |

## BP Categories

| Category       | Systolic     | Diastolic    |
|----------------|-------------|-------------|
| Normal         | < 120       | < 80        |
| Elevated       | 120–129     | < 80        |
| High – Stage 1 | 130–139     | 80–89       |
| High – Stage 2 | ≥ 140       | ≥ 90        |

