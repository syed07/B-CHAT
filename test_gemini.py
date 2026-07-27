import os
from dotenv import load_dotenv
from google import genai

load_dotenv()


API_KEY = os.getenv("GEMINI_API_KEY")

print("API KEY FOUND:", bool(API_KEY))


client = genai.Client(
    api_key=API_KEY
)


try:

    response = client.models.generate_content(

        model="gemini-2.0-flash",

        contents="Say hello in one sentence"

    )


    print("GEMINI RESPONSE:")
    print(response.text)


except Exception as e:

    print("ERROR:")
    print(e)