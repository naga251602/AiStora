# AIStora

A self-hosted, privacy-first analytics platform for small business accountants and bookkeepers — query your QuickBooks, Xero, and Shopify exports in plain English. No SQL. No data team. No data ever sent to an AI.

---

## Demo

<p>
  <img src="./demo/demo.gif" width="800" height="800"/>
</p>

---

## The problem

Small accountants and bookkeepers can't upload sensitive client data to tools like ChatGPT, and can't afford a data team. They're stuck manually digging through CSV exports to answer routine financial questions.

AIStora fixes this — upload your CSV to your own server, ask in plain English, get your answer. The AI never sees your actual data.

---

## What makes it different from ChatGPT

Your data is stored on your own server. When you ask a question, the LLM only sees the schema — column names and types — never your actual rows. The query plan is generated from the schema alone and executed locally by our in-memory engine. We also built prompt guardrails to keep query generation predictable and safe against adversarial inputs.

---

## Under the hood

- Custom DataFrame engine — no Pandas, built from scratch
- Streaming CSV parser for large exports
- PostgreSQL for persistence and auth, engine handles compute
- Gemini generates query plans, engine executes them

---

## Tech stack

| Layer | Tools |
|---|---|
| Backend | Flask, SQLAlchemy, Gunicorn |
| Engine | Custom DataFrame + streaming CSV parser |
| Database | PostgreSQL |
| AI / LLM | Google Gemini |
| Frontend | Vanilla JS, Tailwind CSS |
| Infra | Docker, Docker Compose, GitHub Actions |

---

## Run it locally
```bash
git clone https://github.com/naga251602/AIStora.git
cd AIStora
cp .env.example .env   # add your Gemini API key
docker-compose up --build
# open http://localhost:5001
```

---

MIT License · DSCI 551 · Fall 2025 · USC
