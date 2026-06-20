import os
import json
import hashlib
import binascii
import datetime
import boto3
import jwt

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
users_table = dynamodb.Table(os.environ.get("USERS_TABLE", "sanaflow-backend-users-dev"))
JWT_SECRET = os.environ.get("JWT_SECRET", "SanaFlowSuperSecretKey2026!")

def hash_password(password: str) -> str:
    """Hashea la contraseña usando PBKDF2 (nativo de Python) para evitar dependencias C++ como bcrypt."""
    salt = hashlib.sha256(os.environ.get("JWT_SECRET", "").encode('utf-8')).digest()
    pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return binascii.hexlify(pwdhash).decode('ascii')

def verify_password(stored_password: str, provided_password: str) -> bool:
    """Verifica la contraseña hasheada."""
    return stored_password == hash_password(provided_password)

def create_response(status_code: int, body: dict):
    """Crea una respuesta HTTP Api Gateway."""
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": True,
            "Content-Type": "application/json"
        },
        "body": json.dumps(body)
    }

def register(event, context):
    """Endpoint de registro de usuario."""
    try:
        body = json.loads(event.get('body', '{}'))
        email = body.get('email')
        password = body.get('password')
        name = body.get('name', 'Usuario Clínico')

        if not email or not password:
            return create_response(400, {"message": "Email y contraseña son obligatorios."})

        # Comprobar si ya existe
        response = users_table.get_item(Key={'email': email})
        if 'Item' in response:
            return create_response(400, {"message": "El usuario ya existe."})

        # Guardar en DynamoDB
        hashed_pw = hash_password(password)
        users_table.put_item(
            Item={
                'email': email,
                'name': name,
                'password': hashed_pw,
                'created_at': datetime.datetime.utcnow().isoformat()
            }
        )

        return create_response(201, {"message": "Usuario registrado exitosamente."})

    except Exception as e:
        print(e)
        return create_response(500, {"message": "Error interno del servidor."})

def login(event, context):
    """Endpoint de login de usuario que devuelve JWT."""
    try:
        body = json.loads(event.get('body', '{}'))
        email = body.get('email')
        password = body.get('password')

        if not email or not password:
            return create_response(400, {"message": "Email y contraseña son obligatorios."})

        # Buscar usuario
        response = users_table.get_item(Key={'email': email})
        if 'Item' not in response:
            return create_response(401, {"message": "Credenciales inválidas."})

        user = response['Item']

        # Verificar contraseña
        if not verify_password(user['password'], password):
            return create_response(401, {"message": "Credenciales inválidas."})

        # Generar JWT Token
        payload = {
            'email': email,
            'name': user.get('name'),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24) # Expira en 1 día
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')

        return create_response(200, {
            "message": "Login exitoso",
            "token": token,
            "user": {
                "email": email,
                "name": user.get('name')
            }
        })

    except Exception as e:
        print(e)
        return create_response(500, {"message": "Error interno del servidor."})
