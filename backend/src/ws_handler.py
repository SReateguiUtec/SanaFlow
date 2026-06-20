import os
import json
import boto3
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
connections_table = dynamodb.Table(os.environ.get("CONNECTIONS_TABLE", "sanaflow-backend-connections-dev"))


def connect(event, context):
    """
    Se ejecuta cuando el Frontend abre la conexión WebSocket.
    Guarda el connectionId en DynamoDB para poder enviarle mensajes después.
    """
    connection_id = event['requestContext']['connectionId']
    
    connections_table.put_item(
        Item={
            'connectionId': connection_id,
            'connectedAt': datetime.now(timezone.utc).isoformat()
        }
    )
    
    print(f"[WS CONNECT] Nueva conexión: {connection_id}")
    return {"statusCode": 200, "body": "Conectado a SanaFlow."}


def disconnect(event, context):
    """
    Se ejecuta cuando el Frontend cierra la conexión (o se cae).
    Limpia el connectionId de DynamoDB para no acumular basura.
    """
    connection_id = event['requestContext']['connectionId']
    
    connections_table.delete_item(Key={'connectionId': connection_id})
    
    print(f"[WS DISCONNECT] Conexión cerrada: {connection_id}")
    return {"statusCode": 200, "body": "Desconectado."}


def default(event, context):
    """
    Ruta por defecto para mensajes WebSocket no reconocidos.
    """
    return {"statusCode": 200, "body": "Mensaje recibido."}
