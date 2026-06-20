import os
import json
import uuid
import time
import boto3
import requests
from groq import Groq
import google.generativeai as genai

# Inicialización de clientes
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

gemini_key = os.environ.get("GEMINI_API_KEY")
if gemini_key and gemini_key != 'tu_gemini_key':
    genai.configure(api_key=gemini_key)

openrouter_key = os.environ.get("OPENROUTER_API_KEY")

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
results_table = dynamodb.Table(os.environ.get("RESULTS_TABLE", "sanaflow-backend-results-dev"))

def call_groq(nota_clinica):
    chat_completion = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": "Eres un asistente de triaje experto. Devuelve estrictamente un JSON con 'sintomas_principales', 'nivel_urgencia' y 'especialidad_sugerida'."},
            {"role": "user", "content": nota_clinica}
        ],
        model="llama3-8b-8192",
        temperature=0.1,
        response_format={"type": "json_object"}
    )
    return json.loads(chat_completion.choices[0].message.content)

def call_gemini(nota_clinica):
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = f"Eres un asistente de triaje experto. Lee la nota clínica y devuelve estrictamente un JSON con las claves: 'sintomas_principales' (texto breve), 'nivel_urgencia' (Alta/Media/Baja), y 'especialidad_sugerida' (Especialidad médica). Nota: {nota_clinica}"
    response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
    return json.loads(response.text)

def call_openrouter(nota_clinica):
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {openrouter_key}"},
        json={
            "model": "meta-llama/llama-3-8b-instruct:free",
            "messages": [
                {"role": "system", "content": "Eres un asistente de triaje experto. Devuelve estrictamente un JSON con 'sintomas_principales', 'nivel_urgencia' y 'especialidad_sugerida'."},
                {"role": "user", "content": nota_clinica}
            ]
        }
    )
    response.raise_for_status()
    return json.loads(response.json()['choices'][0]['message']['content'])

def handler(event, context):
    print(f"Recibido lote de {len(event['Records'])} mensajes desde SQS.")
    
    for record in event['Records']:
        try:
            body = json.loads(record['body'])
            nota_clinica = body.get('nota', '')
            if not nota_clinica: continue

            print(f"Procesando nota: {nota_clinica[:50]}...")
            ia_response = None

            # 1. Intentar con GROQ
            try:
                print("Intentando con Groq...")
                ia_response = call_groq(nota_clinica)
            except Exception as e:
                print(f"[FALLO GROQ] Error: {e}")
                # 2. Respaldo: GEMINI
                try:
                    print("Activando respaldo: Gemini...")
                    ia_response = call_gemini(nota_clinica)
                except Exception as e2:
                    print(f"[FALLO GEMINI] Error: {e2}")
                    # 3. Respaldo Final: OPENROUTER
                    try:
                        print("Activando respaldo final: OpenRouter...")
                        ia_response = call_openrouter(nota_clinica)
                    except Exception as e3:
                        print(f"[FALLO OPENROUTER] Error: {e3}")
                        # 4. Todos los LLMs fallaron (Rate Limits masivos o Caída global) -> Devolver a SQS
                        print("[ALERTA RESILIENCIA] Todos los proveedores fallaron. Devolviendo mensaje a la cola SQS...")
                        raise Exception("Fallo masivo en proveedores LLM. Reintentando por SQS en 60s.")

            # --- GUARDADO EN DYNAMODB ---
            item_id = str(uuid.uuid4())
            results_table.put_item(
                Item={
                    'id': item_id,
                    'nota_original': nota_clinica,
                    'sintomas_principales': ia_response.get('sintomas_principales', ''),
                    'nivel_urgencia': ia_response.get('nivel_urgencia', 'Baja'),
                    'especialidad_sugerida': ia_response.get('especialidad_sugerida', 'Medicina General'),
                    'procesado_en': int(time.time()),
                    'estado': 'COMPLETADO'
                }
            )
            print(f"Nota {item_id} clasificada exitosamente.")

        except Exception as e:
            # Captura general para fallos masivos u otros errores (ej. parseo JSON de SQS)
            # Si el error vino del fallback masivo, se relanza para activar el retry de SQS.
            if "Fallo masivo en proveedores LLM" in str(e):
                raise e
            else:
                print(f"[ERROR] Ocurrió un error inesperado al procesar el registro: {e}")

    return {"statusCode": 200, "body": json.dumps({"message": "Lote procesado"})}
