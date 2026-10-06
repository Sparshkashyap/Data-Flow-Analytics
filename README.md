# Data Ingestion & Analytics Dashboard

A full-stack JavaScript/React analytics application that ingests JSON, CSV, and XML data, normalizes and joins the datasets, computes business metrics, and exposes the results through a dashboard and REST APIs.

## Features

- JSON order ingestion with nested customer and item flattening
- CSV product ingestion by header name
- XML shipment ingestion with safe parsing and validation
- Data quality tracking, missing-value detection, and unmatched records
- Relational joins across orders, products, and shipments
- Aggregated analytics for revenue, category, product, customer, and shipment-delay metrics
- External country lookup via REST Countries API
- External currency conversion via a configurable exchange-rate provider
- Modern React + TypeScript dashboard with filters, pagination, tables, and charts
- Focused backend tests covering parsing, joins, analytics, validation, and API smoke checks

## Architecture

- Backend: Node.js + Express + JavaScript
- Frontend: React + TypeScript + Vite + Recharts
- Data layer: in-memory repository abstraction ready for SQLite/PostgreSQL later
- External APIs: REST Countries API and exchange-rate API

## Folder structure

- backend/
- frontend/
- data/
- README.md
- .gitignore
- package.json

## Setup

1. Create environment files:
   - backend/.env (copy from backend/.env.example)
   - frontend/.env (optional for API base URL)
2. Install dependencies:
   - cd backend && npm install
   - cd frontend && npm install
3. Start backend:
   - cd backend && npm run dev
4. Start frontend:
   - cd frontend && npm run dev

## Environment variables

Backend environment variables are defined in backend/.env.example.

Important values:

- PORT
- NODE_ENV
- FRONTEND_URL
- UPLOAD_MAX_SIZE_MB
- REST_COUNTRIES_API_KEY
- CURRENCY_API_KEY
- CURRENCY_API_BASE_URL

## Backend run

```bash
cd backend
npm install
npm run dev
```

## Frontend run

```bash
cd frontend
npm install
npm run dev
```

## API endpoints

### Ingestion

- POST /api/ingest/json
- POST /api/ingest/csv
- POST /api/ingest/xml

### Analytics

- GET /api/analytics/summary
- GET /api/analytics/revenue
- GET /api/analytics/orders
- GET /api/analytics/categories
- GET /api/analytics/products

### Data access

- GET /api/orders
- GET /api/orders/:orderId
- GET /api/products
- GET /api/shipments
- GET /api/data-quality

### External data

- GET /api/countries
- GET /api/countries/:code
- GET /api/currency/convert

## Data processing pipeline

1. Parse source files using dedicated parser modules.
2. Normalize nested JSON and CSV records into canonical structures.
3. Parse XML shipments safely and flatten records when possible.
4. Join order items with product metadata.
5. Attach shipment metadata to matching orders.
6. Compute data-quality metrics and audit unmatched records.
7. Aggregate analytics for the dashboard and API consumers.

## External APIs

- REST Countries API for country and currency reference data
- Exchange-rate API for live currency conversion

Both are invoked from the backend only.

## Testing

```bash
cd backend
npm test
```

## Sample expectations

For the provided datasets, the backend calculates:

- Orders: 2
- Revenue: 2800
- Items sold: 6
- Average order value: 1400

## Troubleshooting

- If shipment XML is missing, the application shows a clear validation message rather than inventing records.
- API errors are surfaced with consistent success/error envelopes.
- Frontend errors show readable user messages for country and currency failures.
