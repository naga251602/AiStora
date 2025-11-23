````markdown
# AIStora

AIStora is an end-to-end AI analytics platform powered by a custom in-memory data engine and a natural-language query layer. It lets users upload CSV files, explore them with SQL-like logic, and generate visual insights simply by chatting with an AI assistant.

Built with Flask, PostgreSQL, Docker, and a lightweight custom engine, AIStora performs fast projections, filters, joins, and aggregates without relying on Pandas. Gemini AI drives the natural-language processing that converts user questions into executable data operations.

---

## Features

**AI-Driven Data Exploration**  
Ask questions in plain English (“show me sales trends for Q3”). AIStora translates them into valid engine operations.

**Custom In-Memory Engine**  
A lightweight data engine designed for speed, with support for:
- Column projection and row filtering  
- Grouping and aggregation  
- Inner joins and type inference  
- Streaming CSV parsing

**Instant Visualizations**  
Generate counts, tables, bar charts, and line plots in real time.

**Secure Authentication**  
Full login, registration, and session-based access control.

**Logical Databases**  
Users can create isolated databases and upload multiple CSVs per workspace.

**Zero Pandas Dependency**  
All data logic is implemented natively.

---

## Tech Stack

**Backend:** Flask, SQLAlchemy, Gunicorn  
**Database:** PostgreSQL  
**Engine:** Custom DataFrame implementation + streaming CSV parser  
**AI/LLM:** Google Gemini  
**Frontend:** Vanilla JS, Tailwind CSS, HTML Templates  
**Infrastructure:** Docker, Docker Compose  
**CI/CD:** GitHub Actions

---

## Architecture

```mermaid
graph TD
    User[User] -->|Browser/Chat| UI[Frontend UI]
    UI -->|HTTP Requests| API[Flask Backend]
    API -->|Auth| DB[(PostgreSQL)]
    API -->|Natural Language| LLM[Gemini AI]
    LLM -->|Query Plan| Engine[Custom Data Engine]
    Engine -->|Read| CSV[CSV Files]
    Engine -->|Results| API
````

---

## Installation & Setup

The simplest way to run AIStora is through Docker, which handles all dependencies automatically.

### Prerequisites

* Docker Desktop
* Git
* Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/naga251602/AIStora.git
cd AIStora
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Open the `.env` file and add your Gemini API key and other config values.

### 3. Run with Docker

```bash
docker-compose up --build
```

To run in detached mode:

```bash
docker-compose up --build -d
```

### 4. Access the Application

Visit:

```
http://localhost:5001
```

### Stopping the Application

```bash
docker-compose down
```

---

## Development Workflow

### Directory Structure

```
/engine         # Custom DataFrame & Parser logic
/services       # LLM integration and chart generation
/routes         # Blueprints for auth, chat, and data operations
/templates      # Jinja2 HTML templates
/static         # JS scripts and Tailwind CSS
/tests          # Pytest suite
```

### Running Tests

```bash
docker-compose exec web pytest
```

---

## Why This Project Matters

AIStora demonstrates system-level engineering skills:

**Custom Compute Engine**
Building a DataFrame engine from scratch shows strong knowledge of data structures and algorithms.

**System Design**
Bridging AI, database persistence, and in-memory processing in a Dockerized environment.

**Modularity**
Clear separation between data engine, web layer, and AI service.

---

## License

MIT License
