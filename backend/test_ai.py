import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
from dotenv import load_dotenv
import json

async def test_gemini():
    load_dotenv()
    GEMINI_API_KEY = os.environ['GEMINI_API_KEY']
    
    system_message = """You are a master Dungeon Master. Create a JSON response in this exact format:
{
  "story_text": "Your story here",
  "choices": ["Choice 1", "Choice 2", "Choice 3"],
  "location": "Location name",
  "combat_encounter": false
}"""
    
    chat = LlmChat(
        api_key=GEMINI_API_KEY,
        session_id='test123',
        system_message=system_message
    ).with_model('gemini', 'gemini-2.0-flash')
    
    try:
        response = await chat.send_message(UserMessage(text='Start a dark fantasy adventure'))
        print('Raw response:', response)
        
        # Try to parse as JSON
        try:
            parsed = json.loads(response)
            print('Parsed JSON:', parsed)
        except json.JSONDecodeError as e:
            print('JSON parse error:', e)
            print('Trying to extract JSON from response...')
            
            # Look for JSON in the response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                parsed = json.loads(json_str)
                print('Extracted JSON:', parsed)
            
    except Exception as e:
        print('Error:', e)

if __name__ == "__main__":
    asyncio.run(test_gemini())