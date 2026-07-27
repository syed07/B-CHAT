from dotenv import load_dotenv
import os

print("Current folder:")
print(os.getcwd())

print("\nFiles here:")
print(os.listdir())


from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")


print("\nGROQ KEY:")
print(os.getenv("GROQ_API_KEY"))