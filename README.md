# AI Fitness Chatbot Web Application

## Overview
This project is a full-stack AI-powered fitness web application designed to provide users with personalised workout plans, diet recommendations, and general health guidance. The system integrates an AI chatbot to enhance user interaction while maintaining clear boundaries around medical advice.

The application was developed as part of an Honours Project and focuses on usability, safety, and practical deployment.

---

## Features

- AI chatbot for fitness and lifestyle guidance
- Personalised workout planner
- Diet planning interface with meal suggestions
- User authentication system
- Admin account functionality
- Responsive web interface
- Safety-focused responses (non-medical disclaimer included)

---

## Tech Stack

**Frontend:**
- React.js

**Backend:**
- Node.js
- Express.js

**Database:**
- SQLite (better-sqlite3)

**Deployment:**
- Vercel (Frontend)
- Render (Backend)

---

## Live Application

Frontend:  
👉 https://fitpal-honours-project.vercel.app

Backend API:  
👉 https://fitpal-honours-project.onrender.com

---

## Test Account

To assist with evaluation, a test account is provided:
Email: testbrady11@gmail.com
Password: password1

## Admin Account

Email: admin@gmail.com
Password: password

## Installation & Setup (Local)

### 1. Clone the repository

git clone (https://github.com/lukebrady11/fitpal_honours_project)
cd fitpal_honours_project

## Backend Setup 
cd backend
npm install
npm start

### Frontend Setup
cd frontend
npm install
npm start

### Environment Variables 
PORT=5173

## Project Structure
/frontend        → React frontend
/backend         → Express backend API
/database        → SQLite database and schema
/routes          → API route handlers
/components      → UI components

## Safety & Ethical Considerations
The chatbot is designed to provide general lifestyle advice only
It explicitly states that it does not replace professional medical guidance
Safety checks are implemented before generating responses
User expectations are managed through clear system messaging

## Limitations
AI responses are not always fully context-aware
The system does not provide medical or clinical advice
Limited dataset and rule-based safeguards
Small-scale user testing sample
Future Improvements
Expanded user personalisation
Integration with real fitness APIs
Improved AI response accuracy
Larger-scale user testing
Enhanced security features


## Author
Luke Brady
BSc Honours Project – 2026
