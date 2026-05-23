import os
import json
import base64
from dotenv import load_dotenv
from openai import OpenAI

# Load variables from .env
load_dotenv()
client = OpenAI()

SYSTEM_PROMPT = """You are the e-Return Assistant, an AI agent that helps Romanian citizens recycle electronic waste (WEEE/DEEE). You speak Romanian, are friendly and clear.

You can:
1) Identify whether an object is DEEE (fridges, TVs, laptops, phones, printers, light bulbs, batteries = YES; furniture, clothes, food = NO)
2) Search available collection offers using the search_offers tool — this returns competing offers from different companies with different voucher values, ratings, and pickup options. Present them as a comparison so the citizen can choose.
3) Find drop-off collection points using search_collection_points
4) Explain the process: select DEEE type → see offers from multiple companies → pick the best one → collector comes → get voucher
5) Show eco-impact (1kg DEEE recycled = ~2.5kg CO2 avoided)

Key legislation: OUG 5/2015, Directive 2012/19/EU, target 4kg/person/year, Romania currently at ~2.8kg.
Do not invent data. If you don't know, say so.
When you find offers, present them clearly comparing voucher value, rating, pickup speed, and method so the citizen can make an informed choice."""

# Tools schema array built for OpenAI function schemas
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_offers",
            "description": "Find available collection offers from companies for a given DEEE type and location. Returns a ranked list of offers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "deee_type": {"type": "string", "enum": ["fridge", "phone", "laptop", "TV", "printer", "other"]},
                    "county": {"type": "string"}
                },
                "required": ["deee_type", "county"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_collection_points",
            "description": "Find nearest drop-off DEEE collection points",
            "parameters": {
                "type": "object",
                "properties": {
                    "lat": {"type": "number"},
                    "lng": {"type": "number"},
                    "deee_type": {"type": "string"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_stats",
            "description": "Get user recycling statistics",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"}
                }
            }
        }
    }
]

# Mock tool response engine
def handle_tool_call(name, input_data):
    if name == "search_offers":
        return json.dumps([
            {"company": "EcoCollect", "voucher_lei": 160, "rating": 4.2, "pickup": "home + dropoff", "earliest": "tomorrow"},
            {"company": "GreenTech", "voucher_lei": 140, "rating": 4.8, "pickup": "home only", "earliest": "today"},
            {"company": "RecyclaPro", "voucher_lei": 120, "rating": 4.9, "pickup": "dropoff only", "earliest": "in 2 days"},
            {"company": "SmartWaste", "voucher_lei": 180, "rating": 3.8, "pickup": "home + dropoff", "earliest": "in 2 days"},
        ])
    elif name == "search_collection_points":
        return json.dumps([
            {"name": "EcoCollect - Centru", "address": "Str. Horea 15, Satu Mare", "distance_km": 1.2},
            {"name": "RecyclaPro - Mall", "address": "Aushan Satu Mare", "distance_km": 2.1},
        ])
    elif name == "get_user_stats":
        return json.dumps({"total_kg": 23.5, "co2_avoided_kg": 58.7, "vouchers_earned": 3, "total_lei": 290})
    return "{}"


# --- ENGINE FUNCTION 1: TEXT CHAT LOOP WITH TOOLS ---
def process_text_chat(user_message, history=None):
    """Handles deep conversation loop, state updates, and autonomous tool usage"""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_message})
    
    while True:
        response = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1024,
            tools=TOOLS,
            messages=messages
        )
        response_message = response.choices[0].message
        
        if response_message.tool_calls:
            messages.append(response_message)
            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                
                print(f"  [Tool execute: {function_name}({function_args})]")
                tool_result = handle_tool_call(function_name, function_args)
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": function_name,
                    "content": tool_result
                })
        else:
            return response_message.content


# --- ENGINE FUNCTION 2: PHOTO BASE64 IDENTIFIER ---
def process_photo_upload(base64_data, media_type="image/jpeg"):
    """Accepts raw base64 data strings sent from frontend, processes via vision layer"""
    data_uri = f"data:{media_type};base64,{base64_data}"
    
    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=512,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text", 
                        "text": "Identify this object. Is it DEEE (electronic waste)? What category (fridge, phone, laptop, TV, printer, other)? Estimate a recycling voucher value in Romanian lei. Reply in Romanian, be concise."
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": data_uri}
                    }
                ]
            }
        ]
    )
    return response.choices[0].message.content


# ==============================================================================
# INTEGRATION VALIDATION RUNS
# ==============================================================================
if __name__ == "__main__":
    print("=" * 60)
    print("INTEGRATED CHAT & VISION TEST RUNS")
    print("=" * 60)
    
    # Test A: Text execution forcing tool calling
    print("\n[Test A] Executing Text Chat with contextual data (Forces tool invocation):")
    text_res = process_text_chat("Am un laptop vechi în Satu Mare. Ce oferte am?")
    print(f"Assistant Response:\n{text_res}")
    
    print("\n" + "-"*40)
    
    # Test B: Vision execution reading your local fridge file
    print("[Test B] Executing Vision processing pipeline from local file data:")
    if os.path.exists("../Hacaton/test/frigider.jpg"):
        with open("../Hacaton/test/frigider.jpg", "rb") as f:
            b64_string = base64.b64encode(f.read()).decode('utf-8')
        vision_res = process_photo_upload(b64_string, "image/jpeg")
        print(f"Vision Response:\n{vision_res}")
    else:
        print("Skipping Vision run: 'test_fridge.jpg' not found in this folder path.")