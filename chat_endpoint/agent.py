import os
import json
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

# Initialize the OpenAI client (automatically detects OPENAI_API_KEY from os.environ)
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

# Reformatted schemas to fit OpenAI's function definitions structure
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_offers",
            "description": "Find available collection offers from companies for a given DEEE type and location. Returns a ranked list of offers with company name, voucher value, rating, pickup method, and earliest pickup date.",
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

# Mock tool responses
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

def chat(user_message):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message}
    ]
    
    while True:
        # Changed to gpt-4o as it supports powerful tool calling and mimics Sonnet tier capabilities 
        response = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1024,
            tools=TOOLS,
            messages=messages
        )
        
        response_message = response.choices[0].message
        
        # Check if OpenAI wants to use a tool / function
        if response_message.tool_calls:
            # Append the assistant's decision to call a tool back into the array history
            messages.append(response_message)
            
            # Process all requested tool calls (OpenAI can call multiple simultaneously)
            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                
                print(f"  [Tool call: {function_name}({function_args})]")
                
                tool_result = handle_tool_call(function_name, function_args)
                
                # Append tool response using OpenAI's 'tool' role format
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": function_name,
                    "content": tool_result
                })
        else:
            # Final text response
            text = response_message.content
            print(f"\nAssistant: {text}\n")
            return text

# Test scenarios
print("=" * 60)
print("TEST 1: What to do with old fridge")
print("=" * 60)
chat("Am un frigider vechi, ce pot face cu el?")