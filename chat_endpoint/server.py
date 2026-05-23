import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from chat_endpoint.agent_live import unified_agent_chat

app = Flask(__name__)
# Enable CORS so your frontend application can talk to this server across different ports
CORS(app)

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "e-Return AI Agent backend is running online"}), 200

@app.route("/api/chat", methods=["POST"])
def chat_endpoint():
    """
    Expects JSON payload with:
    - chat_history: Array of previous messages
    - fresh_text: (Optional) The current text input from the user
    - fresh_image_base64: (Optional) Base64 encoded string of an uploaded image
    """
    data = request.get_json() or {}
    
    chat_history = data.get("chat_history", [])
    fresh_text = data.get("fresh_text", None)
    fresh_image_base64 = data.get("fresh_image_base64", None)
    media_type = data.get("media_type", "image/jpeg")
    
    # Validation boundary
    if not fresh_text and not fresh_image_base64:
        return jsonify({"error": "Missing payload data. Provide 'fresh_text' or 'fresh_image_base64'."}), 400
        
    try:
        print(f"\n[API Hit] Processing turn. History length: {len(chat_history)}")
        
        # Execute your working core engine
        ai_response, history_entry = unified_agent_chat(
            chat_history=chat_history,
            fresh_text=fresh_text,
            fresh_image_base64=fresh_image_base64,
            media_type=media_type
        )
        
        # Return the textual answer along with the fresh history token
        return jsonify({
            "response": ai_response,
            "new_history_node": history_entry
        }), 200
        
    except Exception as e:
        print(f"[API System Error Exception]: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Run server locally on port 5000
    app.run(host="0.0.0.0", port=5000, debug=True)