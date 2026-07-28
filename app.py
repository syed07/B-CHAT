import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from groq import Groq


BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")


app = Flask(__name__)
CORS(app)


GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


MODEL = "llama-3.3-70b-versatile"


SYSTEM_PROMPT = """
You are B-Chat, a premium AI assistant created by Syed Shifat Bukhari.
Answer users normally and helpfully.
The list of messages you receive already contains the complete conversation history for the current chat.

Always use that history to answer.

Never say:
"I don't remember previous conversations."
"This is the beginning of our conversation."
"I cannot recall previous chats."

Treat every request as a continuation of the supplied conversation unless the user starts a new chat.

If earlier messages contain relevant information, refer to them naturally.
"""


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():

    try:

        data = request.get_json()

        messages = data.get("messages")

        if not messages:
            return jsonify({"error":"No messages"}),400


        if not client:
            return jsonify({"error":"Missing Groq API key"}),500


        response = client.chat.completions.create(

            model=MODEL,

            messages=[
                {
                    "role":"system",
                    "content":SYSTEM_PROMPT
                },
                *messages
            ]

        )


        return jsonify({

            "text":
            response.choices[0].message.content

        })


    except Exception as e:

        return jsonify({

            "error":str(e)

        }),500



if __name__ == "__main__":

    app.run(

        debug=True,

        host="0.0.0.0",

        port=5000

    )