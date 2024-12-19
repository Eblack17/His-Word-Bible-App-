import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    PORT = int(os.getenv('PORT', 8000))
    HOST = os.getenv('HOST', '0.0.0.0')
