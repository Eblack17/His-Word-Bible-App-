from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
from dotenv import load_dotenv
import asyncio
from fastapi.middleware.cors import CORSMiddleware
import logging
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import httpx
import json
from openai import AsyncOpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure OpenAI
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    logger.error("OpenAI API key not found in environment variables")
    raise ValueError("OpenAI API key not found")

client = AsyncOpenAI(api_key=api_key)

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

class QuestionRequest(BaseModel):
    question: str
    userId: Optional[str] = None

class BibleResponse(BaseModel):
    verse: str
    reference: str
    relevance: str
    explanation: str

@app.get("/")
async def root():
    return {"message": "Bible Verse API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

async def analyze_input(text: str) -> str:
    try:
        prompt = f"""Analyze the following question or statement and identify:
        1. The main theme or topic
        2. The emotional context or situation
        3. The type of guidance needed
        4. Any specific Bible verses or books mentioned

        Text: {text}

        Provide the analysis in a structured format."""

        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error in analyze_input: {str(e)}")
        raise

async def get_verse_application(analysis: str) -> Dict:
    try:
        prompt = f"""Based on this analysis:
        {analysis}

        Please provide a response in the following exact JSON format:
        {{
            "verse": "The Bible verse text",
            "reference": "Book Chapter:Verse",
            "relevance": "Why this verse is relevant",
            "explanation": "Practical application and guidance"
        }}

        Make sure to:
        1. Include a relevant Bible verse
        2. Provide the exact verse reference
        3. Explain why this verse applies
        4. Give practical guidance based on the verse"""

        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that provides Bible verses and guidance in JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        logger.info(f"Raw OpenAI response: {content}")
        
        try:
            parsed_response = json.loads(content)
            # Validate the response structure
            required_fields = ['verse', 'reference', 'relevance', 'explanation']
            if not all(field in parsed_response for field in required_fields):
                logger.error(f"Missing required fields in response: {parsed_response}")
                raise ValueError("Response missing required fields")
                
            return parsed_response
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            raise ValueError("Invalid JSON response from OpenAI")
            
    except Exception as e:
        logger.error(f"Error in get_verse_application: {str(e)}")
        raise

@app.post("/generate")
async def generate_response(request: QuestionRequest) -> Dict:
    try:
        # Log the incoming request
        logger.info(f"Received question: {request.question}")
        
        # Get the analysis
        analysis = await analyze_input(request.question)
        logger.info(f"Analysis completed: {analysis}")
        
        # Get the verse application
        response = await get_verse_application(analysis)
        logger.info(f"Generated response: {response}")
        
        # Ensure response has the correct structure
        if not isinstance(response, dict) or not all(key in response for key in ['verse', 'reference', 'relevance', 'explanation']):
            logger.error(f"Invalid response structure: {response}")
            raise HTTPException(status_code=500, detail="Invalid response structure from AI model")
        
        result = {"response": response}
        logger.info(f"Sending final response: {result}")
        
        # Return the response with CORS headers
        return JSONResponse(
            content=result,
            headers={
                "Access-Control-Allow-Origin": "http://localhost:3000",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        )
    except Exception as e:
        logger.error(f"Error in generate_response: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
