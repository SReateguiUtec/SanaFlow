import os
import json
import uuid
import time
import boto3
import requests
from groq import Groq

# Inicialización de clientes
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

openrouter_key = os.environ.get("OPENROUTER_API_KEY")

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
results_table = dynamodb.Table(os.environ.get("RESULTS_TABLE", "sanaflow-backend-results-dev"))
connections_table = dynamodb.Table(os.environ.get("CONNECTIONS_TABLE", "sanaflow-backend-connections-dev"))

# URL del WebSocket API Gateway (inyectada como variable de entorno por serverless.yml)
WS_ENDPOINT = os.environ.get("WS_ENDPOINT", "")

def call_groq(nota_clinica):
    chat_completion = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": "Eres un asistente de triaje experto. Devuelve estrictamente un JSON con 'sintomas_principales', 'nivel_urgencia' y 'especialidad_sugerida'."},
            {"role": "user", "content": nota_clinica}
        ],
        model="llama-3.1-8b-instant",
        temperature=0.1,
        response_format={"type": "json_object"}
    )
    return json.loads(chat_completion.choices[0].message.content)



def call_openrouter(nota_clinica):
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {openrouter_key}"},
        json={
            "model": "openrouter/auto",
            "messages": [
                {"role": "system", "content": "Eres un asistente de triaje experto. Devuelve estrictamente un JSON con 'sintomas_principales', 'nivel_urgencia' y 'especialidad_sugerida'."},
                {"role": "user", "content": nota_clinica}
            ]
        }
    )
    response.raise_for_status()
    return json.loads(response.json()['choices'][0]['message']['content'])

def broadcast_result(result_item: dict):
    """
    Envía el resultado de triaje a TODOS los clientes conectados via WebSocket.
    Si una conexión ya no existe (el browser se cerró), la elimina de DynamoDB.
    """
    if not WS_ENDPOINT:
        print("[WS] WS_ENDPOINT no configurado, omitiendo broadcast.")
        return

    # Crear el cliente de API Gateway Management con la URL del WebSocket
    apigw = boto3.client(
        'apigatewaymanagementapi',
        endpoint_url=WS_ENDPOINT,
        region_name='us-east-1'
    )

    # Obtener todas las conexiones activas
    response = connections_table.scan(ProjectionExpression='connectionId')
    connections = response.get('Items', [])

    if not connections:
        print("[WS] No hay conexiones activas para notificar.")
        return

    payload = json.dumps({
        "tipo": "RESULTADO_TRIAJE",
        "data": result_item
    }).encode('utf-8')

    stale_connections = []

    for conn in connections:
        connection_id = conn['connectionId']
        try:
            apigw.post_to_connection(
                ConnectionId=connection_id,
                Data=payload
            )
            print(f"[WS] Push enviado a: {connection_id}")
        except apigw.exceptions.GoneException:
            # La conexión ya no existe (browser cerrado sin DISCONNECT limpio)
            print(f"[WS] Conexión stale detectada, eliminando: {connection_id}")
            stale_connections.append(connection_id)
        except Exception as e:
            print(f"[WS] Error enviando a {connection_id}: {e}")

    # Limpiar conexiones muertas
    for cid in stale_connections:
        connections_table.delete_item(Key={'connectionId': cid})



def handler(event, context):
    print(f"Recibido lote de {len(event['Records'])} mensajes desde SQS.")
    
    for record in event['Records']:
        try:
            body = json.loads(record['body'])
            nota_clinica = body.get('nota', '')
            batch_id = body.get('batch_id', 'sin-batch')   # ID del lote CSV completo
            nota_index = body.get('nota_index', 0)            # Posición dentro del lote

            if not nota_clinica: continue

            print(f"Procesando nota: {nota_clinica[:50]}...")
            ia_response = None

            # 1. Intentar con GROQ
            try:
                print("Intentando con Groq...")
                ia_response = call_groq(nota_clinica)
            except Exception as e:
                print(f"[FALLO GROQ] Error: {e}")
                # 2. Respaldo Final: OPENROUTER
                try:
                    print("Activando respaldo final: OpenRouter...")
                    ia_response = call_openrouter(nota_clinica)
                except Exception as e2:
                    print(f"[FALLO OPENROUTER] Error: {e2}")
                    # 3. Todos los LLMs fallaron (Rate Limits masivos o Caída global) -> Devolver a SQS
                    print("[ALERTA RESILIENCIA] Todos los proveedores fallaron. Devolviendo mensaje a la cola SQS...")
                    raise Exception("Fallo masivo en proveedores LLM. Reintentando por SQS en 60s.")

            # --- GUARDADO EN DYNAMODB ---
            item_id = str(uuid.uuid4())
            result_item = {
                'id':                   item_id,
                'batch_id':             batch_id,
                'nota_index':           nota_index,
                'nota_original':        nota_clinica,
                'sintomas_principales': ia_response.get('sintomas_principales', ''),
                'nivel_urgencia':       ia_response.get('nivel_urgencia', 'Baja'),
                'especialidad_sugerida':ia_response.get('especialidad_sugerida', 'Medicina General'),
                'procesado_en':         int(time.time()),
                'estado':               'COMPLETADO'
            }
            results_table.put_item(Item=result_item)
            print(f"Nota {item_id} clasificada exitosamente con urgencia: {result_item['nivel_urgencia']}")

            # --- Notificar al Frontend en tiempo real via WebSocket ---
            broadcast_result(result_item)
            
        except Exception as e:
            if "Fallo masivo en proveedores LLM" in str(e):
                raise e  # Re-lanzar para que SQS reencole automáticamente
            else:
                print(f"[ERROR INESPERADO] {e}")

    return {"statusCode": 200, "body": json.dumps({"message": "Lote procesado"})}
