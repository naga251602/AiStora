# AIStora

AIStora is an end-to-end AI analytics platform powered by a custom in-memory data engine and a natural-language query layer. It enables users to upload CSV files, explore them using SQL-like logic, and generate visual insights simply by chatting with an AI assistant.

Built with Flask, PostgreSQL, Docker, and a lightweight custom engine, AIStora performs fast projections, filters, joins, and aggregations without relying on Pandas. Gemini AI converts natural-language questions into executable data operations.

---

## 🎥 Demo

A short walkthrough demonstrating:
- CSV upload and logical database creation  
- Natural-language query execution  
- AI-generated query plans  
- Real-time tables and visualizations  

▶️ **Play the demo video:**  
![AIStora Demo](./demo/demo.gif)


GitHub will render the video inline using the built-in player.

---

## Features

**AI-Driven Data Exploration**  
Ask questions in plain English and let the system translate them into executable data operations.

**Custom In-Memory Engine**  
A lightweight engine optimized for speed, supporting:
- Column projection and row filtering  
- Grouping and aggregation  
- Inner joins and type inference  
- Streaming CSV parsing for large datasets  

**Instant Visualizations**  
Generate tables, counts, bar charts, and line plots in real time.

**Secure Authentication**  
User registration, login, and session-based access control.

**Logical Databases**  
Isolated workspaces with support for multiple CSVs per database.

**Zero Pandas Dependency**  
All data logic is implemented natively.

---

## Tech Stack

**Backend:** Flask, SQLAlchemy, Gunicorn  
**Database:** PostgreSQL  
**Engine:** Custom DataFrame implementation with streaming CSV parser  
**AI / LLM:** Google Gemini  
**Frontend:** Vanilla JavaScript, Tailwind CSS, HTML templates  
**Infrastructure:** Docker, Docker Compose  
**CI/CD:** GitHub Actions

---

## Architecture

```mermaid
graph TD
    User[User] -->|Browser / Chat| UI[Frontend UI]
    UI -->|HTTP Requests| API[Flask Backend]
    API -->|Auth| DB[(PostgreSQL)]
    API -->|Natural Language Query| LLM[Gemini AI]
    LLM -->|Query Plan| Engine[Custom Data Engine]
    Engine -->|Read| CSV[CSV Files]
    Engine -->|Results| API
````

---

## Installation & Setup

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

Add your Gemini API key and other configuration values.

### 3. Run with Docker

```bash
docker-compose up --build
```

Run in detached mode:

```bash
docker-compose up --build -d
```

### 4. Access the Application

```
http://localhost:5001
```

Stop the application:

```bash
docker-compose down
```

---

## Development Workflow

### Directory Structure

```
/engine         # Custom DataFrame and parser logic
/services       # LLM integration and chart generation
/routes         # Blueprints for auth, chat, and data operations
/templates      # Jinja2 HTML templates
/static         # JavaScript and Tailwind CSS
/tests          # Pytest suite
```

### Running Tests

```bash
docker-compose exec web pytest
```

---

## Why This Project Matters

**Custom Compute Engine**
Demonstrates strong understanding of data structures, parsing, and query execution.

**System Design**
Integrates AI, persistent storage, and in-memory computation in a Dockerized architecture.

**Modularity**
Clear separation between the data engine, web layer, and AI services.

---

## License

MIT License
