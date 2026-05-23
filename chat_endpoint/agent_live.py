import os
import json
import base64
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client

# ==============================================================================
# 1. INITIALIZATION & CONFIGURATION
# ==============================================================================
load_dotenv()

# Ensure we throw a clean error if keys are missing from .env
openai_key = os.getenv("OPENAI_API_KEY")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not openai_key or not supabase_url or not supabase_key:
    raise ValueError("Missing credentials! Ensure OPENAI_API_KEY, SUPABASE_URL, and SUPABASE_KEY are in your .env file.")

openai_client = OpenAI(api_key=openai_key)
supabase_client: Client = create_client(supabase_url, supabase_key)

# ==============================================================================
# 2. SYSTEM CORE PROMPT & AI TOOLS SPECIFICATION
# ==============================================================================
SYSTEM_PROMPT = """You are the e-Return Assistant, an AI agent that helps Romanian citizens recycle electronic waste (WEEE/DEEE). You speak Romanian, are friendly, clear, and professional.

You have the capability to:
1) Identify whether an object in a picture is DEEE (fridges, TVs, laptops, phones, printers, light bulbs, batteries = YES; furniture, clothes, food = NO).
2) Search active collection offers using the search_offers tool. This pulls competing offers from different collectors. You must present these offers clearly to help the citizen compare.
3) Explain the logistics process: identify item -> view company incentives -> select favorite -> arrange pickup or drop-off -> receive active voucher code.

Key legislation context: OUG 5/2015, Directive 2012/19/EU. Eco impact: 1kg DEEE recycled avoids ~2.5kg CO2.
Never make up values. If no collectors service an area or offer a voucher for an item type, explain that nicely based on the empty tool data returned."""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_offers",
            "description": "Find available collection offers from companies for a given DEEE type and Romanian county.",
            "parameters": {
                "type": "object",
                "properties": {
                    "deee_type": {"type": "string", "enum": ["fridge", "phone", "laptop", "TV", "other"]},
                    "county": {"type": "string", "description": "The Romanian county name, e.g., 'Satu Mare', 'Cluj', 'Bihor'"}
                },
                "required": ["deee_type", "county"]
            }
        }
    }
]

# ==============================================================================
# 3. LIVE RELATIONAL DATABASE TOOL HANDLER
# ==============================================================================
def handle_live_tool_call(name, input_data):
    """
    Queries P2's deployed schema tables exactly as they are configured in Supabase.
    Performs an implicit join between collector_offers and collectors, then
    filters matching service areas from the Postgres text[] array field.
    """
    if name == "search_offers":
        deee_type = input_data.get("deee_type")
        county = input_data.get("county")
        
        print(f"  [DB Query] Scanning collector_offers for deee_type='{deee_type}' servicing county='{county}'...")
        
        try:
            # Select all matching offer rows and embed parent collector record properties
            response = supabase_client.table("collector_offers")\
                .select("*, collectors(*)")\
                .eq("deee_type", deee_type)\
                .execute()
                
            cleaned_offers = []
            
            # Loop over matches and evaluate P2's exact text[] array field
            for row in response.data:
                collector_data = row.get("collectors")
                
                if collector_data and collector_data.get("service_area_counties"):
                    counties_list = collector_data["service_area_counties"]
                    
                    # If the array contains the targeted user county string
                    if county in counties_list:
                        offer_info = {
                            "company_name": collector_data.get("company_name"),
                            "rating": float(collector_data.get("rating", 4.0)),
                            "pickup_methods": collector_data.get("pickup_methods"),
                            "deee_type": row.get("deee_type"),
                            "voucher_value_lei": row.get("voucher_value_lei"),
                            "earliest_pickup_days": row.get("earliest_pickup_days"),
                            "accepts_home_pickup": row.get("accepts_home_pickup")
                        }
                        cleaned_offers.append(offer_info)
            
            print(f"  [DB Success] Found {len(cleaned_offers)} active records matched to {county}.")
            return json.dumps(cleaned_offers)
            
        except Exception as e:
            print(f"  [DB Error Exception raised querying P2's schema: {e}]")
            return "[]"
            
    return "{}"

# ==============================================================================
# 4. UNIFIED CONVERSATIONAL MEMORY PIPELINE
# ==============================================================================
def unified_agent_chat(chat_history, fresh_text=None, fresh_image_base64=None, media_type="image/jpeg"):
    """
    Accepts an ongoing chat history list. Appends current input tokens (text, multi-modal images, 
    or both), executes any necessary agent function routing loops, and returns the response.
    """
    # Initialize messages frame with base context
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(chat_history)
    
    # Construct structured modern OpenAI input blocks
    content_payload = []
    
    if fresh_text:
        content_payload.append({"type": "text", "text": fresh_text})
        
    if fresh_image_base64:
        data_uri = f"data:{media_type};base64,{fresh_image_base64}"
        content_payload.append({
            "type": "image_url",
            "image_url": {"url": data_uri}
        })
        
    if content_payload:
        messages.append({"role": "user", "content": content_payload})
        
    # Execution run loop to allow model tool chains to fully compute
    while True:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1024,
            tools=TOOLS,
            messages=messages
        )
        response_message = response.choices[0].message
        
        if response_message.tool_calls:
            # AI decided it needs to fetch context rows from Supabase
            messages.append(response_message)
            
            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                
                tool_result = handle_live_tool_call(function_name, function_args)
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": function_name,
                    "content": tool_result
                })
        else:
            # Standard conversational text returned, loop successfully finished
            history_entry = {"role": "assistant", "content": response_message.content}
            return response_message.content, history_entry

# ==============================================================================
# 5. LOCAL RUNTIME VALIDATION
# ==============================================================================
if __name__ == "__main__":
    print("=" * 60)
    print("RUNNING PIPELINE: CONVERGED LIVE AGENT DEMO STATE")
    print("=" * 60)
    
    # This list preserves conversational state between distinct prompt triggers
    session_history = []
    
    # TRACK 1: Vision Multi-Modal Identification
    print("\n[Turn 1] Simulating user image upload (test_fridge.jpg)...")
    if os.path.exists("../Hacaton/test/frigider.jpg"):
        with open("../Hacaton/test/frigider.jpg", "rb") as image_file:
            base64_encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            
        reply_1, history_node_1 = unified_agent_chat(
            session_history, 
            fresh_text="Ce obiect este în imagine? Este deșeu electronic (DEEE)?",
            fresh_image_base64=base64_encoded_string
        )
        
        # Append the exchange turns to preserve memory context
        session_history.append({"role": "user", "content": "Uploaded test_fridge.jpg image content."})
        session_history.append(history_node_1)
        
        print(f"\nAI Response 1:\n{reply_1}")
    else:
        print("  [Notice] 'test_fridge.jpg' file not detected locally in directory. Skipping Turn 1.")
    
    # TRACK 2: Conversational Follow-Up Triggering Automated DB Query Tool
    print("\n" + "-" * 50)
    print("[Turn 2] Simulating user contextual follow-up request...")
    
    # Notice we don't repeat the word 'fridge' here. 
    # Because of memory context, the AI knows what item we're talking about!
    user_follow_up = "Perfect, vreau să îl reciclez în Satu Mare. Ce oferte am?"
    print(f"User: {user_follow_up}")
    
    reply_2, history_node_2 = unified_agent_chat(
        session_history, 
        fresh_text=user_follow_up
    )
    session_history.append({"role": "user", "content": user_follow_up})
    session_history.append(history_node_2)
    
    print(f"\nAI Response 2:\n{reply_2}")
    print("=" * 60)