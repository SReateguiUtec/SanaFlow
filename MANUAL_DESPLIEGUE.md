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

## Paso 4: Despliegue del Frontend
1. Regresa a la carpeta principal y entra al frontend:
   ```bash
   cd ../frontend
   ```
2. Configura las APIs del backend abriendo el archivo de configuración:
   ```bash
   nano src/lib/api.ts
   # Reemplaza la URL con tu HttpApiUrl
   ```
   *(Haz lo mismo para `src/lib/wsService.ts` con la URL de wss://)*

3. Instala las dependencias y arranca la aplicación. 
   > **Ojo:** En nuestro archivo `MV-Simple.yaml` dejamos abierto el **puerto 8000** y el puerto 80. Usaremos el puerto 8000 para correr Vite y hacerlo público a internet.
   ```bash
   npm install
   npm run dev -- --port 8000 --host 0.0.0.0
   ```

## Paso 5: Acceso Público
Abre tu navegador de internet y escribe la IP Pública de tu máquina virtual seguida del puerto 8000:
`http://TU_IP_PUBLICA:8000`

¡Listo! Tu plataforma SanaFlow está completamente operativa. Puedes registrarte, cargar tus archivos `.csv` o pegar notas clínicas, y verás cómo el sistema interactúa en tiempo real entre la Máquina Virtual, SQS, los LLMs y AWS Lambda.
