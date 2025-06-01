# 🧙‍♂️ D&D Unlimited Choices (Lite Version)

This project is a backend API for a text-driven Dungeons & Dragons experience. It allows players to create characters, persist their data, and prepare for AI-powered storytelling (coming soon). Built using **FastAPI** and **MongoDB**.

---

## 🚀 Features

- Character creation (race, class, background)
- Stat calculation based on race/class
- Persistent storage via MongoDB
- RESTful API with Swagger UI documentation
- AI storytelling modules (currently disabled)

---

## 📦 Tech Stack

- **Python 3.10+**
- **FastAPI**
- **MongoDB** (local or Atlas)
- **Motor** (async MongoDB driver)
- **Uvicorn** (ASGI server)
- **dotenv** for environment configuration

---

## 🔧 Local Setup (Windows Manual)

### ✅ Prerequisites

- Python installed (you can use portable Python too)
- MongoDB running locally (`mongod --dbpath your_path`)
- Git (for cloning)

---

### 📂 Folder Structure

Example:
H:
├── Dndtest-main
│ ├── backend
│ ├── frontend\ (optional)
└── New folder (3)\ ← Your portable Python folder

yaml
Copy
Edit

---

### ⚙️ Setup Instructions

1. **Navigate to backend folder**:
```bash
cd /d H:\Dndtest-main\Dndtest-main\backend
Create a virtual environment:

bash
Copy
Edit
"H:\New folder (3)\python.exe" -m venv venv
Activate the environment:

bash
Copy
Edit
venv\Scripts\activate
Install required packages:

bash
Copy
Edit
pip install fastapi uvicorn motor python-dotenv
Create .env file:
Create a file named .env in the backend folder and add:

env
Copy
Edit
MONGO_URL=mongodb://localhost:27017
DB_NAME=dnd
GEMINI_API_KEY=placeholder_key_for_future
Run the server:

bash
Copy
Edit
uvicorn server:app --reload
🧪 API Docs & Testing
After the server starts, go to:

📌 http://localhost:8000/docs

Use Swagger UI to test endpoints like:

/api/characters/options

/api/characters

/api/characters/{id}

🧠 AI Integration
The AI-powered story generation via LlmChat is currently disabled due to a missing private dependency. This will be re-enabled once the custom AI module is replaced with a public or open-source solution.

📜 License
MIT License © 2025 Ebad018
