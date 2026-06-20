import os
import json
import uuid
import csv
import io
import boto3

sqs    = boto3.client('sqs',    region_name='us-east-1')
s3     = boto3.client('s3',     region_name='us-east-1')

QUEUE_URL = os.environ.get("QUEUE_URL", "")


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
    Recibe un JSON con una lista de notas clínicas desde el Frontend
    y las encola en SQS una por una para que triage_worker las procese.

    Body esperado:
    {
        "notas": ["Paciente con fiebre...", "Dolor torácico..."]
    }
    """
    try:
        body  = json.loads(event.get('body', '{}'))
        notas = body.get('notas', [])

        if not notas or not isinstance(notas, list):
            return create_response(400, {"message": "Se requiere una lista 'notas' con al menos una nota clínica."})

        if len(notas) > 100:
            return create_response(400, {"message": "Máximo 100 notas por lote."})

        batch_id = str(uuid.uuid4())  # ID único para todo este lote CSV
        print(f"[UPLOAD] Nuevo lote {batch_id} con {len(notas)} notas.")

        # SQS permite send_message_batch de hasta 10 mensajes por llamada
        # Dividimos en chunks de 10
        def chunks(lst, n):
            for i in range(0, len(lst), n):
                yield lst[i:i + n]

        total_encoladas = 0

        for chunk in chunks(list(enumerate(notas)), 10):
            entries = []
            for idx, nota in chunk:
                entries.append({
                    'Id':           str(idx),           # ID único dentro del batch SQS (no el batch_id nuestro)
                    'MessageBody':  json.dumps({
                        'nota':       nota.strip(),
                        'batch_id':   batch_id,
                        'nota_index': idx
                    })
                })

            response = sqs.send_message_batch(
                QueueUrl=QUEUE_URL,
                Entries=entries
            )

            failed = response.get('Failed', [])
            if failed:
                print(f"[UPLOAD] Falló el encolado de {len(failed)} mensajes: {failed}")

            total_encoladas += len(response.get('Successful', []))

        print(f"[UPLOAD] {total_encoladas}/{len(notas)} notas encoladas exitosamente. Lote: {batch_id}")

        return create_response(200, {
            "message":         f"{total_encoladas} notas encoladas para triaje.",
            "batch_id":        batch_id,
            "total_encoladas": total_encoladas
        })

    except Exception as e:
        print(f"[ERROR] {e}")
        return create_response(500, {"message": "Error interno del servidor."})
