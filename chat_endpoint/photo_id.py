import os
import base64
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()
client = OpenAI()

def identify_deee_from_local_file(image_path):
    """Loads a local file, converts it to base64, and passes it to gpt-4o vision"""
    if not os.path.exists(image_path):
        return f"Error: File not found at {image_path}"
        
    # Dynamically find extension to build the correct mime-type string
    ext = os.path.splitext(image_path)[1].lower().replace('.', '')
    media_type = f"image/{ext}" if ext in ['png', 'jpg', 'jpeg', 'webp'] else "image/jpeg"
    
    # Read file and convert to base64
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
    # Construct the data URI data blocks that OpenAI accepts
    data_uri = f"data:{media_type};base64,{encoded_string}"
    
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
                        "image_url": {
                            "url": data_uri
                        }
                    }
                ]
            }
        ]
    )
    return response.choices[0].message.content

# ==============================================================================
# HOUR 1-2 LOCAL FILE TEST RUNS
# ==============================================================================
if __name__ == "__main__":
    print("=" * 60)
    print("TESTING LOCAL VISION HANDLER: Base64 Pipeline")
    print("=" * 60)
    
    # Test 1: Testing your local fridge image
    print("\n[Test 1] Analyzing local 'test_fridge.jpg' (Should be YES/fridge):")
    fridge_output = identify_deee_from_local_file("../Hacaton/test/frigider.jpg")
    print(fridge_output)
    
    print("\n" + "-" * 40)
    
    # Test 2: Testing your local non-DEEE item
    print("[Test 2] Analyzing local 'frigider.jpg' (Should be NO):")
    chair_output = identify_deee_from_local_file("../Hacaton/test/fish.jpg")
    print(chair_output)
    
     # Test 3: Testing your non-DEEE item
    print("[Test 3] Analyzing local 'phone.jpg' (Should be Yes/phone):")
    chair_output = identify_deee_from_local_file("../Hacaton/test/phone.jpg")
    print(chair_output)