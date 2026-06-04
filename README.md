# 🚂 Smart Train Monitoring & Alert System

A full-stack, real-time IoT train monitoring platform built with **Django + React**. Monitors 5 Indian express trains with live sensor data, GPS tracking, intelligent alerts, and analytics.

![Dashboard Preview](docs/preview.png)

## 🌟 Features

| Feature | Description |
|---|---|
| 🔐 **Auth** | JWT login, role-based access (Admin, Operator, Maintenance) |
| 📡 **Real-Time** | WebSocket broadcasts live sensor data every 3 seconds |
| 🗺️ **Live Map** | Leaflet.js dark map with live GPS markers & route lines |
| 📊 **Analytics** | ApexCharts time-series for temp, pressure, humidity, vibration |
| 🚨 **Alerts** | Auto-generated when sensors exceed thresholds, 4 severity levels |
| 📄 **Reports** | PDF & Excel export (daily / weekly / monthly) |
| 🤖 **IoT Simulator** | Celery task generates realistic data for 5 Indian trains |
| 🌐 **Geofencing** | Route monitoring with deviation alerts |

## 🏗️ Tech Stack

**Frontend**: React 18 + Vite + Tailwind CSS v3 + ApexCharts + Leaflet.js + Zustand + React Query

**Backend**: Django 4.2 + DRF + Django Channels + Celery

**Database**: PostgreSQL + Redis

**Deployment**: Docker Compose / Vercel + Render + Neon

## 🚂 Demo Trains

| ID | Name | Route |
|---|---|---|
| TN-001 | Rajdhani Express | Mumbai CST → New Delhi |
| TN-002 | Chennai Express | Mumbai LTT → Chennai Central |
| TN-003 | Deccan Queen | Pune → Mumbai CST |
| TN-004 | Shatabdi Express | Bangalore → Chennai Central |
| TN-005 | Duronto Express | Kolkata → New Delhi |

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@trainmonitor.com | Admin@123 |
| Operator | operator@trainmonitor.com | Operator@123 |
| Maintenance | maintenance@trainmonitor.com | Maint@123 |

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15
- Redis 7

### 1. Clone & Setup Backend

```powershell
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file
copy .env.example .env   # Edit DB credentials if needed

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Seed demo data
python manage.py seed_demo_data

# Start Django server (ASGI via daphne)
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### 2. Start Celery (new terminal)

```powershell
cd backend
.\venv\Scripts\activate
celery -A config.celery worker --loglevel=info -P solo
```

### 3. Start Celery Beat (new terminal)

```powershell
cd backend
.\venv\Scripts\activate
celery -A config.celery beat --loglevel=info
```

### 4. Setup & Start Frontend

```powershell
cd frontend
npm install
npm run dev
```

### 5. Open Browser
Visit: [http://localhost:5173](http://localhost:5173)

## 🐳 Docker Compose (Full Stack)

```bash
# Copy env
copy .env.example .env

# Start everything
docker-compose up -d

# View logs
docker-compose logs -f
```

Services:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Django Admin: http://localhost:8000/admin
- Postgres: localhost:5432
- Redis: localhost:6379

## 📡 API Reference

### Auth
```
POST /api/auth/login/       → { access, refresh, user }
POST /api/auth/register/    → create account
POST /api/auth/refresh/     → refresh token
GET  /api/auth/me/          → current user
```

### Trains
```
GET  /api/trains/           → list all trains
POST /api/trains/           → create train (Admin)
GET  /api/trains/{id}/      → train detail
```

### Sensors
```
GET /api/sensors/latest/    → latest reading per train
GET /api/sensors/stats/     → aggregated stats
GET /api/sensors/chart/     → time-series data (filters: train_id, hours, sensor)
GET /api/sensors/           → paginated sensor history
```

### Alerts
```
GET  /api/alerts/           → paginated alerts (filters: severity, train_id, is_resolved)
GET  /api/alerts/stats/     → alert counts by severity
POST /api/alerts/{id}/acknowledge/
POST /api/alerts/{id}/resolve/
```

### GPS
```
GET /api/gps/latest/          → latest GPS per train
GET /api/gps/history/{id}/    → GPS history for a train
```

### Reports
```
GET /api/reports/generate/?type=daily&format=pdf&date=2024-01-15
```

### WebSocket Channels
```
ws://localhost:8000/ws/sensors/  → live sensor_update messages
ws://localhost:8000/ws/alerts/   → live new_alert messages
```

## 🚨 Alert Thresholds

| Sensor | Medium | High | Critical |
|---|---|---|---|
| Temperature | > 70°C | > 80°C | > 100°C |
| Pressure | > 130 PSI | > 150 PSI | > 200 PSI |
| Vibration | > 5 mm/s | > 7 mm/s | > 12 mm/s |
| Smoke | > 30 ppm | > 50 ppm | > 100 ppm |

## 📁 Project Structure

```
monitoring-system/
├── backend/
│   ├── config/          # Django settings, ASGI, Celery
│   ├── apps/
│   │   ├── users/       # Auth + JWT + role management
│   │   ├── trains/      # Train CRUD
│   │   ├── sensors/     # IoT data, WebSocket, simulator
│   │   ├── alerts/      # Alert engine + notifications
│   │   ├── geofencing/  # Route monitoring
│   │   └── reports/     # PDF + Excel export
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/       # Dashboard, Analytics, Map, Alerts, Reports, ...
│       ├── components/  # Sidebar, Navbar, StatCard, SeverityBadge, ...
│       ├── store/       # Zustand (auth + live data)
│       ├── hooks/       # WebSocket hooks
│       └── api/         # Axios API clients
├── docker-compose.yml
└── .env.example
```

## ☁️ Cloud Deployment

### Frontend → Vercel
```bash
cd frontend && npm run build
# Deploy dist/ to Vercel
```

### Backend → Render
- Set environment variables for DB_HOST, REDIS_URL, etc.
- Build command: `pip install -r requirements.txt`
- Start command: `daphne -b 0.0.0.0 -p $PORT config.asgi:application`

### Database → Neon PostgreSQL
- Create a Neon project and set DB_* env vars

### Redis → Upstash
- Create an Upstash Redis instance and set REDIS_URL
