from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from ConversationIncluding import stream_graph_updates
import logging
import traceback

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Serve frontend static files
app = Flask(__name__, static_folder='../frontend', static_url_path='/')

# Allow requests from frontend (adjust origin via env FRONTEND_ORIGIN)
# For separate frontend deployment, set this to the frontend domain on Render
frontend_origin = os.getenv("FRONTEND_ORIGIN", "https://kienportfolio-frontend.onrender.com")
CORS(app, origins=frontend_origin)

@app.route("/chat", methods=["POST"])
def chat():
    """Handle chat requests from the frontend."""
    try:
        logger.info("Received chat request")
        data = request.get_json()
        user_message = data.get("message", "")
        session_id = data.get("session_id", "default")

        if not user_message:
            logger.warning("Empty message received")
            return jsonify({"error": "Message is required"}), 400

        logger.info(f"Processing message: {user_message[:50]}... [session: {session_id}]")
        
        # Call the LangGraph chatbot logic with session_id
        reply = stream_graph_updates(user_message, session_id)
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

@app.route('/')
def serve_index():
    """Serve frontend index.html."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS, images)."""
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    logger.info(f"Starting Flask server on port {port}")
    logger.info("Make sure ConversationIncluding.py is configured correctly")
    # Run Flask on dynamic port (for Render) or 5000 locally
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)
