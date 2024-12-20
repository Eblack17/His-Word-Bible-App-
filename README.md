# Bible Verse Application

A mobile application that provides relevant Bible verses based on user input, built with React Native and FastAPI.

## Project Structure

```
bible_verse_app/
├── backend/
│   ├── app.py
│   └── requirements.txt
└── frontend/
    ├── App.tsx
    └── package.json
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment and activate it:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the backend directory with your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

4. Start the backend server:
```bash
uvicorn app:app --reload
```

### Frontend Setup

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

3. Use Expo Go app on your mobile device to scan the QR code and run the application.

## Features

- Modern, Material Design-inspired UI
- Real-time Bible verse suggestions
- Detailed verse applications and explanations
- Mobile-optimized experience
- Secure API communication

## Development

- Backend: FastAPI with Python
- Frontend: React Native with TypeScript
- UI Components: React Native Paper
- State Management: React Hooks
- API Communication: Axios

## Notes

- Make sure both backend and frontend servers are running
- Ensure your mobile device is on the same network as your development machine
- The backend server runs on `localhost:8000`
#   h i s w o r d  
 