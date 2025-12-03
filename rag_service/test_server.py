import requests
import json

# URL of the FastAPI server
url = "http://localhost:8000/chat"

# Test Payload
payload = {
    "message": "ايه هي اماكن الغوص عندكم",
    "history": []
}

print(f"Sending request to {url}...")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(url, json=payload)
    response.raise_for_status()
    
    print("\n✅ Success!")
    print("Response:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

except requests.exceptions.ConnectionError:
    print("\n❌ Error: Could not connect to the server.")
    print("Make sure the server is running: python main.py")
except Exception as e:
    print(f"\n❌ Error: {e}")
    if 'response' in locals():
        print(f"Status Code: {response.status_code}")
        print(f"Response Text: {response.text}")
