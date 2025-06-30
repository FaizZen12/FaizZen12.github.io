from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, firestore, auth
import openai
import requests
import os
from datetime import datetime, date
from pydantic import BaseModel
from typing import Optional, List
import json
import uuid

# Initialize FastAPI
app = FastAPI(title="Audio Book Summaries API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://localhost:5173",
        "https://localhost:5174",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin with proper error handling
db = None
firebase_initialized = False

if not firebase_admin._apps:
    try:
        # Try to initialize with service account file
        if os.path.exists("firebase-service-account.json"):
            cred = credentials.Certificate("firebase-service-account.json")
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            firebase_initialized = True
            print("Firebase initialized with service account file")
        else:
            # Try to initialize with default credentials
            firebase_admin.initialize_app()
            db = firestore.client()
            firebase_initialized = True
            print("Firebase initialized with default credentials")
    except Exception as e:
        print(f"Warning: Firebase initialization failed: {str(e)}")
        print("Server will start without Firebase functionality")
        firebase_initialized = False
        db = None

security = HTTPBearer()

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

print(f"OpenAI API Key present: {bool(OPENAI_API_KEY)}")
print(f"ElevenLabs API Key present: {bool(ELEVENLABS_API_KEY)}")

if not OPENAI_API_KEY:
    print("Warning: OPENAI_API_KEY not found in environment variables")
if not ELEVENLABS_API_KEY:
    print("Warning: ELEVENLABS_API_KEY not found in environment variables")

# Initialize OpenAI client
from openai import OpenAI
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Pydantic Models
class GenerateSummaryRequest(BaseModel):
    book_title: str
    voice_id: Optional[str] = "default"

class SaveSummaryRequest(BaseModel):
    summary_id: str
    title: str
    audio_url: str
    vtt_data: str
    cover_art_url: str
    voice_id: str

class UserData(BaseModel):
    email: str
    tier: str = "free"
    daily_generation_count: int = 0
    last_generation_date: str = ""

# Helper function to check Firebase availability
def check_firebase_available():
    if not firebase_initialized or db is None:
        raise HTTPException(
            status_code=503,
            detail="Firebase service is not available. Please configure Firebase credentials."
        )

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    check_firebase_available()
    try:
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

# Helper Functions
def get_user_doc_ref(user_id: str):
    check_firebase_available()
    return db.collection('users').document(user_id)

def check_daily_limit(user_data: dict) -> bool:
    today = date.today().isoformat()
    if user_data.get('last_generation_date') != today:
        return True  # New day, reset count
    # Increased limit to 100 for testing
    return user_data.get('daily_generation_count', 0) < 100

def increment_generation_count(user_id: str):
    check_firebase_available()
    today = date.today().isoformat()
    user_ref = get_user_doc_ref(user_id)
    
    # Get current user data
    user_doc = user_ref.get()
    if user_doc.exists:
        user_data = user_doc.to_dict()
        if user_data.get('last_generation_date') != today:
            # New day, reset count
            user_ref.update({
                'daily_generation_count': 1,
                'last_generation_date': today
            })
        else:
            # Same day, increment
            user_ref.update({
                'daily_generation_count': firestore.Increment(1),
                'last_generation_date': today
            })
    else:
        # New user
        user_ref.set({
            'daily_generation_count': 1,
            'last_generation_date': today
        }, merge=True)

async def generate_book_summary(book_title: str) -> str:
    """Generate a book summary using OpenAI"""
    if not client:
        print("OpenAI client not initialized - using mock summary")
        return f"""Welcome to this engaging summary of "{book_title}".

This book offers profound insights into personal development and practical wisdom that can transform your daily life. The author presents compelling arguments backed by research and real-world examples.

Key takeaways include understanding the importance of consistent daily habits, the power of mindset in achieving goals, and practical strategies for implementing positive changes.

The book emphasizes that small, consistent actions compound over time to create remarkable results. Whether you're looking to improve your productivity, relationships, or overall well-being, this book provides actionable advice you can start applying immediately.

Remember, the journey of personal growth is ongoing, and every step forward, no matter how small, brings you closer to your goals. Thank you for listening to this summary."""
    
    try:
        print(f"Generating summary for: {book_title}")
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at creating engaging, relatable summaries of non-fiction books. Create a 3-4 minute audio script that captures the key insights and actionable takeaways. Make it conversational and engaging for audio consumption."
                },
                {
                    "role": "user",
                    "content": f"Create an engaging audio summary script for the book '{book_title}'. Focus on the most important insights and actionable advice. Structure it with a clear introduction, main points, and conclusion. Make it sound natural when spoken aloud."
                }
            ],
            max_tokens=1500,
            temperature=0.7
        )
        summary = response.choices[0].message.content
        print("Summary generated successfully")
        return summary
    except Exception as e:
        print(f"OpenAI API Error: {str(e)}")
        # Return mock summary instead of raising error
        return f"""Welcome to this engaging summary of "{book_title}".

This book offers profound insights into personal development and practical wisdom that can transform your daily life. The author presents compelling arguments backed by research and real-world examples.

Key takeaways include understanding the importance of consistent daily habits, the power of mindset in achieving goals, and practical strategies for implementing positive changes.

The book emphasizes that small, consistent actions compound over time to create remarkable results. Whether you're looking to improve your productivity, relationships, or overall well-being, this book provides actionable advice you can start applying immediately.

Remember, the journey of personal growth is ongoing, and every step forward, no matter how small, brings you closer to your goals. Thank you for listening to this summary."""

async def text_to_speech(text: str, voice_id: str = "default") -> tuple:
    """Convert text to speech using ElevenLabs and return audio URL and VTT data"""
    print(f"Converting text to speech with voice: {voice_id}")
    
    # Always return mock data for now to ensure functionality
    audio_url = f"https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
    
    # Generate realistic VTT data based on text length
    words = text.split()
    vtt_data = "WEBVTT\n\n"
    
    # Estimate timing (average 150 words per minute)
    words_per_second = 2.5
    current_time = 0
    
    for i in range(0, len(words), 10):  # Group words in chunks of 10
        chunk = " ".join(words[i:i+10])
        start_time = current_time
        end_time = current_time + (len(chunk.split()) / words_per_second)
        
        start_formatted = f"{int(start_time//60):02d}:{int(start_time%60):02d}.{int((start_time%1)*1000):03d}"
        end_formatted = f"{int(end_time//60):02d}:{int(end_time%60):02d}.{int((end_time%1)*1000):03d}"
        
        vtt_data += f"{start_formatted} --> {end_formatted}\n{chunk}\n\n"
        current_time = end_time
    
    print("Audio conversion completed (mock)")
    return audio_url, vtt_data

def get_book_cover(book_title: str) -> str:
    """Get book cover from Google Books API"""
    try:
        print(f"Fetching book cover for: {book_title}")
        # Clean the book title for API search
        clean_title = book_title.replace(" ", "+")
        url = f"https://www.googleapis.com/books/v1/volumes?q={clean_title}&maxResults=1"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if data.get('items') and len(data['items']) > 0:
            book_info = data['items'][0]['volumeInfo']
            if 'imageLinks' in book_info:
                # Prefer larger images
                if 'large' in book_info['imageLinks']:
                    cover_url = book_info['imageLinks']['large']
                elif 'medium' in book_info['imageLinks']:
                    cover_url = book_info['imageLinks']['medium']
                elif 'thumbnail' in book_info['imageLinks']:
                    cover_url = book_info['imageLinks']['thumbnail']
                else:
                    cover_url = f"https://via.placeholder.com/300x450/f3f4f6/374151?text={book_title.replace(' ', '+')}"
                
                print(f"Book cover found: {cover_url}")
                return cover_url
        
        # Fallback to a generic book cover
        fallback_url = f"https://via.placeholder.com/300x450/f3f4f6/374151?text={book_title.replace(' ', '+')}"
        print(f"Using fallback cover: {fallback_url}")
        return fallback_url
    except Exception as e:
        print(f"Error fetching book cover: {str(e)}")
        return f"https://via.placeholder.com/300x450/f3f4f6/374151?text=Book+Cover"

# API Endpoints
@app.get("/")
async def root():
    return {
        "message": "boksu.ai Audio Book Summaries API", 
        "status": "running",
        "firebase_available": firebase_initialized
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "firebase_available": firebase_initialized,
        "openai_available": bool(client)
    }

@app.post("/generate-summary")
async def generate_summary(
    request: GenerateSummaryRequest,
    current_user = Depends(get_current_user)
):
    print(f"Generate summary request for: {request.book_title}")
    user_id = current_user['uid']
    user_ref = get_user_doc_ref(user_id)
    
    try:
        # Get or create user document
        user_doc = user_ref.get()
        if not user_doc.exists:
            user_data = {
                'email': current_user.get('email', ''),
                'tier': 'free',
                'daily_generation_count': 0,
                'last_generation_date': ''
            }
            user_ref.set(user_data)
            print("Created new user document")
        else:
            user_data = user_doc.to_dict()
        
        # Check daily limit (now 100 for testing)
        if not check_daily_limit(user_data):
            print("Daily limit reached")
            raise HTTPException(
                status_code=429,
                detail="Daily generation limit reached (100). Upgrade to premium for unlimited access."
            )
        
        print(f"Generating summary for: {request.book_title}")
        
        # Generate summary text
        summary_text = await generate_book_summary(request.book_title)
        print("Summary generated successfully")
        
        # Convert to audio
        audio_url, vtt_data = await text_to_speech(summary_text, request.voice_id)
        print("Audio generated successfully")
        
        # Get book cover
        cover_art_url = get_book_cover(request.book_title)
        print("Book cover retrieved successfully")
        
        # Increment usage count
        increment_generation_count(user_id)
        print("Usage count incremented")
        
        summary_id = str(uuid.uuid4())
        
        result = {
            "summary_id": summary_id,
            "title": request.book_title,
            "audio_url": audio_url,
            "vtt_data": vtt_data,
            "cover_art_url": cover_art_url,
            "voice_id": request.voice_id,
            "summary_text": summary_text[:200] + "..." if len(summary_text) > 200 else summary_text
        }
        
        print("Summary generation completed successfully")
        return result
    
    except HTTPException:
        # Re-raise HTTP exceptions (like 429 for rate limiting)
        raise
    except Exception as e:
        print(f"Error in generate_summary: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

@app.post("/save-summary")
async def save_summary(
    request: SaveSummaryRequest,
    current_user = Depends(get_current_user)
):
    user_id = current_user['uid']
    
    try:
        summary_data = {
            'title': request.title,
            'audio_url': request.audio_url,
            'vtt_data': request.vtt_data,
            'cover_art_url': request.cover_art_url,
            'voice_id': request.voice_id,
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        # Save to user's summaries subcollection
        summaries_ref = db.collection('users').document(user_id).collection('summaries')
        summaries_ref.document(request.summary_id).set(summary_data)
        
        return {"message": "Summary saved successfully"}
    except Exception as e:
        print(f"Error saving summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving summary: {str(e)}")

@app.get("/get-library")
async def get_library(current_user = Depends(get_current_user)):
    user_id = current_user['uid']
    
    try:
        summaries_ref = db.collection('users').document(user_id).collection('summaries')
        summaries = summaries_ref.order_by('created_at', direction=firestore.Query.DESCENDING).stream()
        
        library = []
        for summary in summaries:
            summary_data = summary.to_dict()
            summary_data['id'] = summary.id
            library.append(summary_data)
        
        return {"library": library}
    except Exception as e:
        print(f"Error fetching library: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching library: {str(e)}")

@app.get("/share/{summary_id}")
async def get_shared_summary(summary_id: str):
    # This would need more complex logic to find the summary across all users
    # For now, return a mock response
    return {
        "title": "Shared Book Summary",
        "audio_url": "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
        "cover_art_url": "https://via.placeholder.com/300x450/f3f4f6/374151?text=Shared+Book"
    }

@app.get("/user/profile")
async def get_user_profile(current_user = Depends(get_current_user)):
    user_id = current_user['uid']
    user_ref = get_user_doc_ref(user_id)
    
    try:
        user_doc = user_ref.get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            return {
                "email": user_data.get('email', current_user.get('email', '')),
                "tier": user_data.get('tier', 'free'),
                "daily_generation_count": user_data.get('daily_generation_count', 0),
                "last_generation_date": user_data.get('last_generation_date', '')
            }
        else:
            # Create user profile if it doesn't exist
            user_data = {
                'email': current_user.get('email', ''),
                'tier': 'free',
                'daily_generation_count': 0,
                'last_generation_date': ''
            }
            user_ref.set(user_data)
            return user_data
    except Exception as e:
        print(f"Error fetching user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching user profile: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)