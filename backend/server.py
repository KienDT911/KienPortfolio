from flask import Flask, request, jsonify
from flask_cors import CORS
from ConversationIncluding import stream_graph_updates
import logging
import traceback

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Allow requests from frontend (adjust origin if needed)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "http://127.0.0.1:*"])

@app.route("/chat", methods=["POST"])
def chat():
    """Handle chat requests from the frontend."""
    try:
        logger.info("Received chat request")
        data = request.get_json()
        user_message = data.get("message", "")

        if not user_message:
            logger.warning("Empty message received")
            return jsonify({"error": "Message is required"}), 400

        logger.info(f"Processing message: {user_message[:50]}...")
        
        # Call the LangGraph chatbot logic
        reply = stream_graph_updates(user_message)
        logger.info(f"Generated reply: {reply[:100]}...")
        
        return jsonify({"reply": reply}), 200
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error processing chat: {error_msg}")
        logger.error(traceback.format_exc())
        return jsonify({"error": error_msg}), 500

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    logger.info("Health check received")
    return jsonify({"status": "ok", "message": "Backend is running"}), 200

if __name__ == "__main__":
    logger.info("Starting Flask server on http://127.0.0.1:5000")
    logger.info("Make sure ConversationIncluding.py is configured correctly")
    # Run Flask on port 5000
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
