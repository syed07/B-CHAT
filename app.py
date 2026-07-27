import os
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from groq import Groq

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

MODEL = "llama-3.3-70b-versatile"
SYSTEM_PROMPT = """
You are B-Chat, a premium AI assistant created by Syed Shifat Bukhari, the founder of Bukhari Studios.
"""

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/chat", methods=["POST", "OPTIONS"], strict_slashes=False)
def chat():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        body = request.get_json(silent=True)
        if not body or not body.get("messages"):
            return jsonify({"error": "Messages missing"}), 400

        if not client:
            return jsonify({"error": "Groq API key missing in .env"}), 500

        response = client.chat.completions.create(
            model=MODEL,
            temperature=0.7,
            messages=[{"role": "system", "content": SYSTEM_PROMPT}, *body.get("messages")]
        )

        return jsonify({"text": response.choices[0].message.content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)