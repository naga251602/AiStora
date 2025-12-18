AIStora 🚀

AIStora is an end-to-end AI analytics platform powered by a custom in-memory data engine and a natural-language query layer. It allows users to upload CSV files, explore them with relational logic, and generate visual insights simply by chatting with an AI assistant.

Built with Flask, PostgreSQL, and Docker, AIStora performs fast projections, filters, joins, and aggregates without relying on Pandas. Gemini AI drives the natural-language processing that converts user questions into executable Python expressions using our proprietary DataFrame API.

✨ Intelligent Output Showcase

AiStora translates natural language into optimized DataFrame logic across three primary output formats.

🎬 Project Demo

View the full system interaction in action:

<p align="center">
<video src="./demo/demo.MOV" width="100%" controls autoplay loop muted>
Your browser does not support the video tag.
</video>
</p>

1️⃣ Number Output

Instant aggregation for specific counts, sums, and averages.

Query: "What's the total revenue for this quarter?"
Logic: orders.aggregate(orders.groupby("quarter"), {"amount": "sum"})

2️⃣ Table Output

Detailed relational breakdowns with automated code generation and CSV export.

Query: "Show me the top 3 regions by revenue."
Logic: sales.aggregate(sales.groupby("region"), {"revenue": "sum"}).top_k_by("revenue", 3)

3️⃣ Chart Output

Visual trend analysis with automatic high-resolution expansion for deep insights.

Query: "Visualize the regional revenue distribution."
Logic: sales.aggregate(sales.groupby("region"), {"revenue": "sum"})

🛠 Features

AI-Driven Data Exploration: Ask questions in plain English. AIStora translates them into valid engine operations using a strict "No-Loops" Python expression policy.

Custom In-Memory Engine: A lightweight data engine designed for speed, supporting column projection, row filtering, grouping, aggregation, inner joins, and type inference.

Instant Visualizations: Generate real-time bar charts and metrics with "Click-to-Expand" high-res modals.

Zero Pandas Dependency: All data logic is implemented natively to demonstrate system-level engineering.

Secure Architecture: Full authentication and isolated logical databases per user workspace.

🏗 Tech Stack

Layer

Technology

Backend

Flask, SQLAlchemy, Gunicorn

Database

PostgreSQL

Engine

Custom DataFrame Implementation + Streaming Parser

AI/LLM

Google Gemini (Query Plan Translation)

Frontend

Vanilla JS, Tailwind CSS, HTML Templates, Chart.js

Infrastructure

Docker, Docker Compose

📐 Architecture

graph TD
    User[User] -->|Browser/Chat| UI[Frontend UI]
    UI -->|HTTP Requests| API[Flask Backend]
    API -->|Auth| DB[(PostgreSQL)]
    API -->|Natural Language| LLM[Gemini AI]
    LLM -->|Query Plan| Engine[Custom Data Engine]
    Engine -->|Read| CSV[CSV Files]
    Engine -->|Results| API


🚀 Installation & Setup

Prerequisites

Docker Desktop

Git

Google Gemini API Key

1. Clone & Configure

git clone [https://github.com/naga251602/AIStora.git](https://github.com/naga251602/AIStora.git)
cd AIStora
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY


2. Run with Docker

docker-compose up --build


3. Access

Visit http://localhost:5001

💡 Why This Project Matters

AIStora demonstrates advanced system-level engineering:

Custom Compute Engine: Building a DataFrame engine from scratch requires deep knowledge of data structures and algorithmic complexity.

System Design: Orchestrating AI services, persistent storage, and ephemeral in-memory processing in a containerized environment.

Interface Design: Bridging complex data outputs with a clean, conversational UX.

📄 License

MIT License — © 2025 AiStora Platform.