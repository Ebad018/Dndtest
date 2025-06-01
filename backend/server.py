from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Gemini API key
GEMINI_API_KEY = os.environ['GEMINI_API_KEY']

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# D&D Game Models
class Character(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    race: str
    character_class: str
    background: str
    level: int = 1
    hit_points: int = 10
    armor_class: int = 10
    strength: int = 10
    dexterity: int = 10
    constitution: int = 10
    intelligence: int = 10
    wisdom: int = 10
    charisma: int = 10
    gold: int = 100
    inventory: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CharacterCreate(BaseModel):
    name: str
    race: str
    character_class: str
    background: str

class GameState(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    character_id: str
    current_story: str
    story_history: List[str] = []
    current_location: str = ""
    choices_made: List[str] = []
    session_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class StoryChoice(BaseModel):
    choice_text: str

class StoryResponse(BaseModel):
    story_text: str
    choices: List[str]
    location: str
    combat_encounter: bool = False

# D&D Game data
RACES = ["Human", "Elf", "Dwarf", "Halfling", "Dragonborn", "Gnome", "Half-Elf", "Half-Orc", "Tiefling"]
CLASSES = ["Fighter", "Wizard", "Rogue", "Cleric", "Ranger", "Barbarian", "Bard", "Druid", "Monk", "Paladin", "Sorcerer", "Warlock"]
BACKGROUNDS = ["Acolyte", "Criminal", "Folk Hero", "Noble", "Sage", "Soldier", "Charlatan", "Entertainer", "Guild Artisan", "Hermit", "Outlander", "Sailor"]

# Initialize AI Story Generator
def create_story_chat(session_id: str):
    system_message = """You are a master Dungeon Master for a dark fantasy D&D campaign. Your role is to:

1. Create immersive, atmospheric dark fantasy stories with rich descriptions
2. Present exactly 3 meaningful choices after each story segment
3. Respond in this exact JSON format:
{
  "story_text": "Your atmospheric story description here...",
  "choices": ["Choice 1", "Choice 2", "Choice 3"],
  "location": "Current location name",
  "combat_encounter": false
}

IMPORTANT RULES:
- Keep stories between 3-5 sentences for good pacing
- Choices should be meaningful and lead to different outcomes
- Include dark fantasy elements: ancient evils, cursed artifacts, haunted places, moral dilemmas
- Make choices feel impactful - no meaningless options
- If combat occurs, set "combat_encounter": true
- Maintain continuity with previous story elements
- Each story segment should advance the narrative meaningfully

DARK FANTASY THEMES: corruption, ancient curses, moral ambiguity, supernatural horror, fallen kingdoms, necromancy, demonic influences, haunted locations, mysterious artifacts, tragic heroes."""

    chat = LlmChat(
        api_key=GEMINI_API_KEY,
        session_id=session_id,
        system_message=system_message
    ).with_model("gemini", "gemini-2.0-flash")
    
    return chat

# Character creation endpoints
@api_router.get("/characters/options")
async def get_character_options():
    return {
        "races": RACES,
        "classes": CLASSES,
        "backgrounds": BACKGROUNDS
    }

@api_router.post("/characters", response_model=Character)
async def create_character(character_data: CharacterCreate):
    # Calculate stats based on race and class
    base_stats = {
        "strength": 10, "dexterity": 10, "constitution": 10,
        "intelligence": 10, "wisdom": 10, "charisma": 10
    }
    
    # Simple stat bonuses based on race
    race_bonuses = {
        "Human": {"strength": 1, "dexterity": 1, "constitution": 1},
        "Elf": {"dexterity": 2, "intelligence": 1},
        "Dwarf": {"constitution": 2, "strength": 1},
        "Halfling": {"dexterity": 2, "charisma": 1},
        "Dragonborn": {"strength": 2, "charisma": 1},
        "Gnome": {"intelligence": 2, "constitution": 1},
        "Half-Elf": {"charisma": 2, "dexterity": 1},
        "Half-Orc": {"strength": 2, "constitution": 1},
        "Tiefling": {"charisma": 2, "intelligence": 1}
    }
    
    # Apply race bonuses
    if character_data.race in race_bonuses:
        for stat, bonus in race_bonuses[character_data.race].items():
            base_stats[stat] += bonus
    
    # Calculate HP and AC based on class
    class_hp = {
        "Fighter": 12, "Barbarian": 14, "Ranger": 10, "Paladin": 12,
        "Wizard": 6, "Sorcerer": 6, "Warlock": 8,
        "Rogue": 8, "Monk": 8, "Bard": 8,
        "Cleric": 8, "Druid": 8
    }
    
    hp = class_hp.get(character_data.character_class, 8) + (base_stats["constitution"] - 10) // 2
    ac = 10 + (base_stats["dexterity"] - 10) // 2
    
    character = Character(
        name=character_data.name,
        race=character_data.race,
        character_class=character_data.character_class,
        background=character_data.background,
        strength=base_stats["strength"],
        dexterity=base_stats["dexterity"],
        constitution=base_stats["constitution"],
        intelligence=base_stats["intelligence"],
        wisdom=base_stats["wisdom"],
        charisma=base_stats["charisma"],
        hit_points=hp,
        armor_class=ac,
        inventory=["Basic equipment", "Rations", "Backpack"]
    )
    
    await db.characters.insert_one(character.dict())
    return character

@api_router.get("/characters/{character_id}", response_model=Character)
async def get_character(character_id: str):
    character = await db.characters.find_one({"id": character_id})
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return Character(**character)

# Game story endpoints
@api_router.post("/story/start/{character_id}")
async def start_story(character_id: str):
    # Verify character exists
    character = await db.characters.find_one({"id": character_id})
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    character_obj = Character(**character)
    session_id = str(uuid.uuid4())
    
    # Create initial story prompt
    initial_prompt = f"""
    Start a dark fantasy D&D adventure for {character_obj.name}, a {character_obj.race} {character_obj.character_class} with a {character_obj.background} background.
    
    Begin the adventure in a appropriately dark and mysterious setting. Create an engaging opening scenario that sets the dark fantasy tone and presents the character with their first meaningful choice.
    """
    
    try:
        # Generate initial story
        chat = create_story_chat(session_id)
        user_message = UserMessage(text=initial_prompt)
        response = await chat.send_message(user_message)
        
        # Parse the JSON response (handle markdown wrapped JSON)
        import json
        import re
        
        # Try parsing directly first
        try:
            story_data = json.loads(response)
        except json.JSONDecodeError:
            # Look for JSON wrapped in markdown code blocks
            json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                story_data = json.loads(json_str)
            else:
                # Look for JSON anywhere in the response
                start = response.find('{')
                end = response.rfind('}') + 1
                if start != -1 and end != 0:
                    json_str = response[start:end]
                    story_data = json.loads(json_str)
                else:
                    raise HTTPException(status_code=500, detail="Could not parse JSON from AI response")
        
        # Create game state
        game_state = GameState(
            character_id=character_id,
            current_story=story_data["story_text"],
            story_history=[story_data["story_text"]],
            current_location=story_data["location"],
            session_id=session_id
        )
        
        await db.game_states.insert_one(game_state.dict())
        
        return {
            "session_id": session_id,
            "story": story_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating story: {str(e)}")

@api_router.post("/story/choice/{session_id}")
async def make_choice(session_id: str, choice: StoryChoice):
    # Find game state
    game_state_data = await db.game_states.find_one({"session_id": session_id})
    if not game_state_data:
        raise HTTPException(status_code=404, detail="Game session not found")
    
    game_state = GameState(**game_state_data)
    
    # Get character for context
    character = await db.characters.find_one({"id": game_state.character_id})
    character_obj = Character(**character)
    
    try:
        # Create story continuation prompt
        story_context = "\n".join(game_state.story_history[-3:])  # Last 3 story segments for context
        
        choice_prompt = f"""
        Continue the dark fantasy adventure for {character_obj.name}.
        
        RECENT STORY CONTEXT:
        {story_context}
        
        CURRENT LOCATION: {game_state.current_location}
        
        PLAYER'S CHOICE: {choice.choice_text}
        
        Based on this choice, continue the story with consequences and new developments. Present 3 new meaningful choices that advance the narrative.
        """
        
        # Generate story continuation
        chat = create_story_chat(session_id)
        user_message = UserMessage(text=choice_prompt)
        response = await chat.send_message(user_message)
        
        # Parse the JSON response (handle markdown wrapped JSON)
        import json
        import re
        
        # Try parsing directly first
        try:
            story_data = json.loads(response)
        except json.JSONDecodeError:
            # Look for JSON wrapped in markdown code blocks
            json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                story_data = json.loads(json_str)
            else:
                # Look for JSON anywhere in the response
                start = response.find('{')
                end = response.rfind('}') + 1
                if start != -1 and end != 0:
                    json_str = response[start:end]
                    story_data = json.loads(json_str)
                else:
                    raise HTTPException(status_code=500, detail="Could not parse JSON from AI response")
        
        # Update game state
        game_state.current_story = story_data["story_text"]
        game_state.story_history.append(story_data["story_text"])
        game_state.current_location = story_data["location"]
        game_state.choices_made.append(choice.choice_text)
        game_state.updated_at = datetime.utcnow()
        
        await db.game_states.update_one(
            {"session_id": session_id},
            {"$set": game_state.dict()}
        )
        
        return story_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating story: {str(e)}")

@api_router.get("/story/history/{session_id}")
async def get_story_history(session_id: str):
    game_state_data = await db.game_states.find_one({"session_id": session_id})
    if not game_state_data:
        raise HTTPException(status_code=404, detail="Game session not found")
    
    game_state = GameState(**game_state_data)
    return {
        "story_history": game_state.story_history,
        "choices_made": game_state.choices_made,
        "current_location": game_state.current_location
    }

# Basic health check
@api_router.get("/")
async def root():
    return {"message": "D&D Unlimited Choices Game API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
