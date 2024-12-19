from typing import Optional, List, Dict, Any
from database import get_db

supabase = get_db()

async def create_user(email: str, hashed_password: str) -> Dict[str, Any]:
    """Create a new user in the database."""
    try:
        response = supabase.table('users').insert({
            'email': email,
            'password': hashed_password
        }).execute()
        return response.data[0]
    except Exception as e:
        raise Exception(f"Error creating user: {str(e)}")

async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email."""
    try:
        response = supabase.table('users').select('*').eq('email', email).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        raise Exception(f"Error getting user: {str(e)}")

async def save_verse(user_id: str, verse_text: str, reference: str) -> Dict[str, Any]:
    """Save a verse to the database."""
    try:
        response = supabase.table('verses').insert({
            'user_id': user_id,
            'verse_text': verse_text,
            'reference': reference
        }).execute()
        return response.data[0]
    except Exception as e:
        raise Exception(f"Error saving verse: {str(e)}")

async def get_user_verses(user_id: str) -> List[Dict[str, Any]]:
    """Get all verses for a user."""
    try:
        response = supabase.table('verses').select('*').eq('user_id', user_id).execute()
        return response.data
    except Exception as e:
        raise Exception(f"Error getting verses: {str(e)}")

async def update_password(user_id: str, new_password: str) -> Dict[str, Any]:
    """Update user's password."""
    try:
        response = supabase.table('users').update({
            'password': new_password
        }).eq('id', user_id).execute()
        return response.data[0]
    except Exception as e:
        raise Exception(f"Error updating password: {str(e)}")
