import os
import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb      = boto3.resource('dynamodb', region_name='us-east-1')
results_table = dynamodb.Table(os.environ.get("RESULTS_TABLE", "sanaflow-backend-results-dev"))

import decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def create_response(status_code: int, body: dict):
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin":      "*",
            "Access-Control-Allow-Credentials": "true",
            "Content-Type":                     "application/json"
        },
        "body": json.dumps(body, cls=DecimalEncoder)
    }

def handler(event, context):
    """
    Devuelve todos los resultados de triaje almacenados en DynamoDB.
    Opcional: filtrar por batch_id via query param ?batch_id=xxx
    """
    try:
        params   = event.get('queryStringParameters') or {}
        limit = int(params.get('limit', 10))
        last_key = params.get('last_key')
        batch_id = params.get('batch_id')

        scan_kwargs = {'Limit': limit}
        if batch_id:
            scan_kwargs['FilterExpression'] = boto3.dynamodb.conditions.Attr('batch_id').eq(batch_id)
            
        if last_key:
            import base64
            # Decodificar el last_key (en base64 JSON string)
            decoded_key = json.loads(base64.b64decode(last_key).decode('utf-8'))
            # Si procesado_en es parte de la key, lo convertimos a Decimal para boto3
            if 'procesado_en' in decoded_key:
                decoded_key['procesado_en'] = decimal.Decimal(str(decoded_key['procesado_en']))
            scan_kwargs['ExclusiveStartKey'] = decoded_key

        response = results_table.scan(**scan_kwargs)

        items = response.get('Items', [])
        
        # Codificamos LastEvaluatedKey para devolverlo al cliente
        returned_last_key = None
        if 'LastEvaluatedKey' in response:
            lek = response['LastEvaluatedKey']
            # Convertir Decimals a tipos nativos para serializar a JSON
            safe_lek = {k: (int(v) if v % 1 == 0 else float(v)) if isinstance(v, decimal.Decimal) else v for k, v in lek.items()}
            returned_last_key = base64.b64encode(json.dumps(safe_lek).encode('utf-8')).decode('utf-8')

        # Ordenar por procesado_en DESCENDENTE (los más recientes primero) si se puede
        items.sort(key=lambda x: int(x.get('procesado_en', 0)), reverse=True)

        return create_response(200, {
            "resultados": items,
            "last_key": returned_last_key,
            "total": len(items)
        })

    except Exception as e:
        print(f"[ERROR] {e}")
        return create_response(500, {"message": "Error interno del servidor."})
