from fastapi import FastAPI, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from supabase import create_client, Client
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
from urllib.parse import urlencode
from openai import AsyncOpenAI
from config import Config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# OAuth2 Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Configure OpenAI
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    logger.error("OpenAI API key not found in environment variables")
    raise ValueError("OpenAI API key not found")

# Supabase setup
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

client = AsyncOpenAI(api_key=api_key)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: str
    oauth_provider: Optional[str] = None
    oauth_id: Optional[str] = None

class UserInDB(User):
    hashed_password: Optional[str] = None

class UserCreate(User):
    password: Optional[str] = None

class SocialAuthResponse(BaseModel):
    access_token: str
    user: User

class InputAnalysis(BaseModel):
    keywords: List[str]
    sentiment: str
    context: str
    potential_themes: List[str]

class VerseApplication(BaseModel):
    verse: str
    verse_text: str
    relevance_rationale: str
    application: str

class TextRequest(BaseModel):
    text: str

class PasswordReset(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class QuestionRequest(BaseModel):
    question: str

# OAuth functions
async def verify_google_token(token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Google token")
        return response.json()

async def verify_facebook_token(token: str) -> dict:
    async with httpx.AsyncClient() as client:
        # Get user info from Facebook
        try:
            response = await client.get(
                f"https://graph.facebook.com/me",
                params={
                    "fields": "id,name,email",
                    "access_token": token
                }
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Facebook verification error: {e}")
            raise HTTPException(
                status_code=401,
                detail=f"Failed to verify Facebook token: {str(e)}"
            )

async def get_or_create_social_user(email: str, oauth_id: str, oauth_provider: str) -> User:
    try:
        response = supabase.table('users').select("*").eq('oauth_id', oauth_id).execute()
        if response.data:
            user_data = response.data[0]
            return UserInDB(**user_data)
    except Exception as e:
        print(f"Error getting user: {e}")
    
    # Create new user if not exists
    username = f"{oauth_provider}_{oauth_id}"
    try:
        user_data = {
            "username": username,
            "email": email,
            "oauth_provider": oauth_provider,
            "oauth_id": oauth_id
        }
        response = supabase.table('users').insert(user_data).execute()
        
        if response.data:
            return UserInDB(**user_data)
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to create user"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

# Social login endpoints
@app.post("/auth/google", response_model=SocialAuthResponse)
async def google_auth(request: Request):
    try:
        body = await request.json()
        token = body.get("token")
        if not token:
            raise HTTPException(status_code=400, detail="Token is required")
        
        user_info = await verify_google_token(token)
        user = await get_or_create_social_user(
            email=user_info["email"],
            oauth_id=user_info["sub"],
            oauth_provider="google"
        )
        
        access_token = create_access_token(data={"sub": user.username})
        return SocialAuthResponse(access_token=access_token, user=user)
    except Exception as e:
        logger.error(f"Google auth error: {str(e)}")
        raise HTTPException(status_code=400, detail="Google authentication failed")

@app.post("/auth/facebook", response_model=SocialAuthResponse)
async def facebook_auth(request: Request):
    try:
        body = await request.json()
        token = body.get("token")
        if not token:
            raise HTTPException(status_code=400, detail="Token is required")
        
        user_info = await verify_facebook_token(token)
        user = await get_or_create_social_user(
            email=user_info.get("email", f"{user_info['id']}@facebook.com"),
            oauth_id=user_info["id"],
            oauth_provider="facebook"
        )
        
        access_token = create_access_token(data={"sub": user.username})
        return SocialAuthResponse(access_token=access_token, user=user)
    except Exception as e:
        logger.error(f"Facebook auth error: {str(e)}")
        raise HTTPException(status_code=400, detail="Facebook authentication failed")

# OAuth configuration endpoints
@app.get("/auth/google/config")
async def google_config():
    return {
        "clientId": GOOGLE_CLIENT_ID,
        "redirectUri": f"{FRONTEND_URL}/auth/google/callback"
    }

@app.get("/auth/facebook/config")
async def facebook_config():
    return {
        "appId": FACEBOOK_APP_ID,
        "redirectUri": f"{FRONTEND_URL}/auth/facebook/callback"
    }

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(username: str):
    try:
        response = supabase.table('users').select("*").eq('username', username).execute()
        if response.data:
            user_data = response.data[0]
            return UserInDB(**user_data)
    except Exception as e:
        print(f"Error getting user: {e}")
    return None

async def authenticate_user(username: str, password: str):
    user = await get_user(username)
    if not user:
        return False
    if not user.hashed_password:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = await get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# Auth endpoints
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register", response_model=User)
async def register_user(user: UserCreate):
    try:
        response = supabase.table('users').select("*").eq('username', user.username).execute()
        if response.data:
            raise HTTPException(
                status_code=400,
                detail="Username already registered"
            )
        
        response = supabase.table('users').select("*").eq('email', user.email).execute()
        if response.data:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        hashed_password = get_password_hash(user.password)
        user_data = {
            "username": user.username,
            "email": user.email,
            "hashed_password": hashed_password
        }
        response = supabase.table('users').insert(user_data).execute()
        
        if response.data:
            return User(username=user.username, email=user.email)
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to create user"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

# Protected route example
@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Password reset endpoints
@app.post("/reset-password")
async def request_password_reset(reset_request: PasswordReset):
    user = await get_user_by_email(reset_request.email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="No user found with this email address"
        )
    
    # Generate reset token
    reset_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=15)
    )
    
    # In a real application, you would send this token via email
    # For now, we'll just return it in the response
    return {
        "message": "Password reset instructions sent",
        "debug_token": reset_token  # Remove this in production
    }

@app.post("/reset-password/confirm")
async def confirm_password_reset(reset_confirm: PasswordResetConfirm):
    try:
        # Verify the token
        payload = jwt.decode(reset_confirm.token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid reset token"
            )
    except JWTError:
        raise HTTPException(
            status_code=400,
            detail="Invalid reset token"
        )
    
    # Update the user's password
    user = await get_user(username)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Hash the new password and update in database
    hashed_password = get_password_hash(reset_confirm.new_password)
    try:
        response = supabase.table('users').update({"hashed_password": hashed_password}).eq('username', username).execute()
        if response.data:
            return {"message": "Password has been reset successfully"}
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to update user password"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

# Helper function to get user by email
async def get_user_by_email(email: str):
    try:
        response = supabase.table('users').select("*").eq('email', email).execute()
        if response.data:
            user_data = response.data[0]
            return UserInDB(**user_data)
    except Exception as e:
        print(f"Error getting user by email: {e}")
    return None

# Keep your existing models
async def analyze_input(text: str) -> InputAnalysis:
    try:
        logger.info(f"Generating input analysis for text: {text[:100]}...")
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at analyzing human emotions and situations to identify relevant biblical themes and keywords. Respond in JSON format with the following structure: {\"keywords\": [], \"sentiment\": \"\", \"context\": \"\", \"potential_themes\": []}"
                },
                {
                    "role": "user",
                    "content": f"Analyze this text and extract: keywords, sentiment, context, and potential biblical themes: {text}"
                }
            ]
        )
        
        # Parse the AI response
        import json
        analysis_data = json.loads(response.choices[0].message.content)
        logger.info("Successfully generated input analysis")
        return InputAnalysis(
            keywords=analysis_data["keywords"],
            sentiment=analysis_data["sentiment"],
            context=analysis_data["context"],
            potential_themes=analysis_data["potential_themes"]
        )
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing AI response: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing AI response")
    except Exception as e:
        logger.error(f"Error generating input analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_verse_application(analysis: InputAnalysis) -> VerseApplication:
    try:
        logger.info(f"Generating verse application for analysis: {analysis}...")
        themes_str = ", ".join(analysis.potential_themes)
        keywords_str = ", ".join(analysis.keywords)
        
        # Get a single most relevant verse
        logger.info("Requesting most relevant verse...")
        verse_response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at finding the most relevant Bible verse for specific situations. Return a JSON response with a single verse that best matches the context. Format: {\"verse\": {\"reference\": \"Book Chapter:Verse\", \"text\": \"verse text\", \"relevance_score\": \"1-10 score explaining how relevant this verse is\", \"reason\": \"detailed explanation of why this verse is most relevant\"}}"
                },
                {
                    "role": "user",
                    "content": f"Find the single most relevant Bible verse for someone who is feeling {analysis.sentiment} in the context of {analysis.context}. Consider these themes: {themes_str} and keywords: {keywords_str}. Explain why this verse is particularly relevant to their situation."
                }
            ]
        )
        
        import json
        verse_data = json.loads(verse_response.choices[0].message.content)
        selected_verse = verse_data["verse"]
        logger.info(f"Selected verse: {selected_verse['reference']} (Relevance: {selected_verse['relevance_score']}/10)")
        
        # Get specific application for the verse
        logger.info("Generating concise application summary...")
        application_response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at explaining how to apply Bible verses to modern situations. Provide a concise summary in no more than 3 sentences. Respond in JSON format: {\"application\": \"Brief 1-3 sentence summary of how to apply this verse\"}"
                },
                {
                    "role": "user",
                    "content": f"In 1-3 sentences, summarize how to apply {selected_verse['reference']} for someone who is feeling {analysis.sentiment} in the context of {analysis.context}."
                }
            ]
        )
        
        application_data = json.loads(application_response.choices[0].message.content)
        logger.info(f"Generated application for verse {selected_verse['reference']}")
        
        verse_app = VerseApplication(
            verse=selected_verse["reference"],
            verse_text=selected_verse["text"],
            relevance_rationale=selected_verse["reason"],
            application=application_data["application"]
        )
        
        logger.info(f"Returning verse application with verse: {verse_app.verse}")
        return verse_app
        
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing AI response: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing AI response")
    except Exception as e:
        logger.error(f"Error generating verse application: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/get_verse")
async def get_verse(request: QuestionRequest):
    try:
        # Log the incoming request
        logger.info(f"Received question: {request.question}")
        
        # Analyze the input
        analysis = await analyze_input(request.question)
        logger.info(f"Analysis completed: {analysis}")
        
        # Get verse application
        result = await get_verse_application(analysis)
        logger.info(f"Verse application completed: {result}")
        
        return {
            "verse": result.verse_text,
            "reference": result.verse,
            "relevance": result.relevance_rationale,
            "explanation": result.application
        }
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze", dependencies=[Depends(get_current_user)])
async def analyze_text(request: TextRequest):
    try:
        logger.info(f"Received analysis request with text: {request.text[:100]}...")
        
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
            
        analysis = await analyze_input(request.text)
        logger.info("Successfully generated input analysis")
        
        verse_app = await get_verse_application(analysis)
        logger.info("Successfully generated verse application")
        
        # Convert to JSON-safe format
        response_data = jsonable_encoder(verse_app)
        return JSONResponse(content=response_data)
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Bible Verse API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
