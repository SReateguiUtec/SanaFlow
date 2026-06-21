import os
import json
import requests

openrouter_key = os.environ.get("OPENROUTER_API_KEY")

def handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        messages = body.get("messages", [])
        
        if not messages:
            return {
                "statusCode": 400,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "No messages provided"})
            }
            
        # Llamar a OpenRouter usando la clave secreta del backend
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {openrouter_key}",
                "HTTP-Referer": "https://sanaflow.ai", # Opcional
                "X-Title": "SanaFlow Copilot" # Opcional
            },
            json={
                "model": "openrouter/auto",
                "messages": messages,
                "temperature": 0.5,
                "max_tokens": 1024
            }
        )
        
        response.raise_for_status()
        data = response.json()
        
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps(data)
        }
        
    except Exception as e:
        print(f"Error in chat_handler: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(e)})
        }
