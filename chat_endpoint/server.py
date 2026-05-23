import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Ensure variables are fully injected before executing agent logic
load_dotenv()

from chat_endpoint.agent_live import unified_agent_chat

app = Flask(__name__)
CORS(app)

# --- PROTECTION THRESHOLDS ---
MAX_IMAGE_SIZE_BYTES = 50 * 1024 * 1024  # 5 MB threshold limit
MAX_TEXT_CHAR_LENGTH = 1000             # Maximum allowed character count per prompt

def estimate_base64_size(b64_string):
    """Calculates approximate file size of a base64 payload in bytes"""
    if not b64_string:
        return 0
    # Strip padding characters to evaluate correct string length
    clean_string = b64_string.rstrip("=")
    return int(len(clean_string) * 0.75)

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "e-Return AI Agent backend is running online"}), 200

@app.route("/api/chat", methods=["POST"])
def chat_endpoint():
    data = request.get_json() or {}

    # Support standard Flask layouts and legacy n8n-style frontend entries
    chat_history = data.get("chat_history") or data.get("history") or []
    fresh_text = data.get("fresh_text") or data.get("message") or None
    fresh_image_base64 = data.get("fresh_image_base64", None)
    media_type = data.get("media_type", "image/jpeg")
    
    # 1. Validation: Empty payload protection
    if not fresh_text and not fresh_image_base64:
        return jsonify({"error": "Missing payload data. Provide 'fresh_text' or 'fresh_image_base64'."}), 400
        
    # 2. Safety Boundary: Text Spam Limitation
    if fresh_text and len(fresh_text) > MAX_TEXT_CHAR_LENGTH:
        return jsonify({
            "error": f"Prompt length exceeds safety threshold limit of {MAX_TEXT_CHAR_LENGTH} characters."
        }), 413
        
    # 3. Safety Boundary: File Size Validation 
    if fresh_image_base64:
        calculated_bytes = estimate_base64_size(fresh_image_base64)
        if calculated_bytes > MAX_IMAGE_SIZE_BYTES:
            return jsonify({
                "error": f"Payload image rejected. Base64 file size (~{calculated_bytes / (1024*1024):.2f}MB) exceeds the 5MB ceiling safety limit."
            }), 413
        
    try:
        print(f"\n[API Hit] Processing turn. Incoming History length: {len(chat_history)}")
        
        # Execute guarded core conversational engine
        ai_response, history_entry = unified_agent_chat(
            chat_history=chat_history,
            fresh_text=fresh_text,
            fresh_image_base64=fresh_image_base64,
            media_type=media_type
        )
        
        return jsonify({
            "response": ai_response,
            "new_history_node": history_entry
        }), 200
        
    except Exception as e:
        print(f"[API System Error Exception]: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)