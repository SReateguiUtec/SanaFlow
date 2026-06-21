# Manual de Despliegue - SanaFlow

Este manual detalla paso a paso cómo crear el entorno completo en AWS usando una Máquina Virtual EC2 dedicada. Al finalizar, la arquitectura del backend estará completamente operativa como entorno Serverless, y el frontend estará alojado de forma pública en dicha máquina.

## Paso 1: Aprovisionar la Máquina Virtual (EC2)
Para garantizar un entorno estandarizado y evitar problemas de compatibilidad locales, utilizaremos una plantilla de infraestructura en AWS.

1. Ingresa a tu cuenta de AWS Console y dirígete al servicio **CloudFormation**.
2. Haz clic en **Create stack** (Crear pila) > "With new resources (standard)".
3. Selecciona **Upload a template file** y sube el archivo `MV-Simple.yaml` incluido en la raíz de este proyecto.
4. Asígnale un nombre a la pila (ej. `SanaFlow-VM`) y avanza hasta crearla.
5. Una vez que el estado sea `CREATE_COMPLETE`, ve a la pestaña **Outputs** de CloudFormation y copia la **IP Pública** de tu nueva instancia.

## Paso 2: Clonar el Proyecto
Descarga el código fuente del proyecto dentro de tu máquina virtual:
```bash
git clone <TU_REPOSITORIO_DE_SANAFLOW>
cd SanaFlow
```

## Paso 3: Despliegue del Backend Serverless
El backend creará automáticamente las bases de datos (DynamoDB), colas (SQS) y APIs en AWS.

1. Navega a la carpeta del backend e instala las dependencias:
   ```bash
   cd backend
   npm install
   ```
2. Crea el archivo de variables de entorno `.env`:
   ```bash
   nano .env
   ```
   Y pega tus claves (puedes usar `CTRL+O` para guardar y `CTRL+X` para salir):
   ```env
   GROQ_API_KEY="tu_clave_de_groq_aqui"
   GEMINI_API_KEY="tu_clave_de_gemini_aqui"
   OPENROUTER_API_KEY="tu_clave_de_openrouter_aqui"
   JWT_SECRET="SanaFlowSuperSecretKey2026!"
   ```
3. Ejecuta el despliegue a la nube:
   ```bash
   sls deploy
   ```
> **IMPORTANTE:** Al finalizar, copia las rutas `HttpApiUrl` (empieza con https://) y el de WebSockets (`wss://`) que aparecerán en color verde en la terminal.

## Paso 4: Despliegue del Frontend (AWS Amplify)
AWS Amplify tiene soporte nativo para proyectos Monorepo, por lo que puedes desplegar el frontend directamente desde este mismo repositorio sin tener que separarlo.

1. Ve a la consola de **AWS Amplify** en tu cuenta de AWS.
2. Selecciona **"Create app"** y luego elige GitHub (o donde tengas alojado tu código).
3. Selecciona tu repositorio `SanaFlow` y la rama `main`.
4. **Configuración del Monorepo:** En la parte inferior, marca la casilla que dice *"Connecting a monorepo? Pick a folder"* y escribe **`frontend`** como el directorio raíz.
5. **Variables de Entorno:** Despliega "Advanced Settings" y añade las dos variables que obtuviste en el Paso 3:
   - `VITE_API_URL` con tu enlace `https://...`
   - `VITE_WS_URL` con tu enlace `wss://...`
6. Dale a **Save and Deploy**. Amplify detectará automáticamente que es un proyecto Vite/React, lo construirá y te dará una URL pública.

## Paso 5: Acceso Público
Ingresa a la URL `.amplifyapp.com` que te generó AWS Amplify.

¡Listo! Tu plataforma SanaFlow está completamente operativa. Puedes registrarte, cargar el archivo `pacientes_presentacion.csv`, y verás cómo el sistema interactúa en tiempo real entre AWS Amplify (Frontend), SQS, los LLMs y AWS Lambda.
