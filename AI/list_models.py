import requests
import os

API_KEY = "AIzaSyALiRIWmF5OE2A_i_Aep7jadOjB3_lLTN8"
URL = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

try:
    response = requests.get(URL)
    data = response.json()
    if "models" in data:
        print("Available Models:")
        for m in data["models"]:
            if "generateContent" in m["supportedGenerationMethods"]:
                print(f"- {m['name']}")
    else:
        print("Error:", data)
except Exception as e:
    print("Exception:", e)
