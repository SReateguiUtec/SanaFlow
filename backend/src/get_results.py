import os
import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb      = boto3.resource('dynamodb', region_name='us-east-1')
results_table = dynamodb.Table(os.environ.get("RESULTS_TABLE", "sanaflow-backend-results-dev"))


def create_response(status_code: int, body: dict):
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin":      "*",
            "Access-Control-Allow-Credentials": "true",
            "Content-Type":                     "application/json"
        },
        "body": json.dumps(body)
    }


def handler(event, context):
    """
    Devuelve todos los resultados de triaje almacenados en DynamoDB.
    Opcional: filtrar por batch_id via query param ?batch_id=xxx
    """
    try:
        params   = event.get('queryStringParameters') or {}
        batch_id = params.get('batch_id')

        if batch_id:
            # Escanear filtrando por batch_id (en producción usaría un GSI)
            response = results_table.scan(
                FilterExpression=boto3.dynamodb.conditions.Attr('batch_id').eq(batch_id)
            )
        else:
            response = results_table.scan()

        items = response.get('Items', [])

        # Ordenar por nota_index para mostrar en el orden original del CSV
        items.sort(key=lambda x: int(x.get('nota_index', 0)))

        return create_response(200, {
            "resultados": items,
            "total":      len(items)
        })

    except Exception as e:
        print(f"[ERROR] {e}")
        return create_response(500, {"message": "Error interno del servidor."})
