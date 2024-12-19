import requests
import json

def test_analyze_endpoint():
    url = "http://localhost:8000/api/analyze"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "text": "I'm feeling anxious about my future and need guidance on making important life decisions."
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("\nSuccessful Response:")
            print(json.dumps(response.json(), indent=2))
        else:
            print("\nError Response:")
            print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_analyze_endpoint()
