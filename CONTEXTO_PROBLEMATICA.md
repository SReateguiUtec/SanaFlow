# Contexto de la Problemática y Justificación del Proyecto: SanaFlow

## 1. El Problema Real
Los servicios de urgencias en los sistemas de salud a nivel global enfrentan una crisis constante de **saturación y cuellos de botella**. Cuando los pacientes ingresan a un hospital, sus síntomas y notas clínicas iniciales son evaluados manualmente por el personal de recepción o enfermería de triaje. 

Este proceso manual presenta tres problemas críticos:
1. **Demoras Fatales:** La lectura, comprensión y clasificación de decenas de notas clínicas toma demasiado tiempo, retrasando la atención de pacientes que podrían tener condiciones de riesgo vital inminente.
2. **Sesgo y Fatiga Humana:** Durante turnos largos o situaciones de emergencia masiva (accidentes, epidemias), el personal sufre de fatiga cognitiva, lo que aumenta drásticamente la probabilidad de clasificar mal la urgencia de un paciente (infraclasificación).
3. **Falta de Estandarización:** Diferentes profesionales pueden interpretar los mismos síntomas de manera distinta, derivando a los pacientes a especialidades incorrectas, lo que desperdicia el tiempo de los médicos especialistas.

## 2. Solución Propuesta (SanaFlow)
SanaFlow es una plataforma Cloud-Native (Serverless) impulsada por Inteligencia Artificial (LLMs) diseñada para automatizar el proceso de triaje. Actúa como un motor de ingesta masiva que analiza texto no estructurado (notas clínicas), extrae los síntomas clave, determina el nivel de urgencia estandarizado y sugiere la especialidad médica adecuada en tiempo real.

## 3. Casos de Uso Principales

### Caso de Uso 1: Ingesta Masiva de Pacientes Derivados (Batch Processing)
- **Actor:** Administrador del Hospital o Jefatura de Urgencias.
- **Escenario:** Un hospital de menor complejidad deriva a 50 pacientes hacia un hospital principal, enviando un archivo `.csv` con sus notas de traslado. 
- **Acción:** El administrador sube el CSV a SanaFlow. La arquitectura asíncrona de AWS (SQS + Lambdas) procesa de forma distribuida las 50 historias clínicas simultáneamente usando Inteligencia Artificial (ej. modelo Mixtral o Llama 3) sin saturar la red ni la plataforma.
- **Resultado:** En cuestión de segundos, el tablero se actualiza en tiempo real mostrando qué pacientes de esos 50 deben ser ingresados directamente a la Unidad de Cuidados Intensivos (Alta Urgencia).

### Caso de Uso 2: Triaje Rápido en Recepción
- **Actor:** Enfermero(a) de Triaje o Recepcionista.
- **Escenario:** Llega un paciente a emergencias y el enfermero toma nota rápida de sus síntomas (ej. "Paciente refiere dolor punzante en el pecho con irradiación al brazo izquierdo y sudoración").
- **Acción:** El enfermero pega este texto en la pestaña "Pegar Texto" del Dashboard.
- **Resultado:** La IA procesa la nota instantáneamente y alerta en la pantalla que es un caso de "Urgencia Alta" para la especialidad de "Cardiología", garantizando atención prioritaria antes de que el paciente sufra un infarto en la sala de espera.

### Caso de Uso 3: Soporte Diagnóstico Continuo (Chatbot Copilot)
- **Actor:** Médico Especialista.
- **Escenario:** El médico está revisando los resultados del triaje y tiene dudas sobre protocolos recientes o quiere hacer preguntas de seguimiento sobre los síntomas extraídos.
- **Acción:** Abre el Chatbot asistente integrado en la plataforma.
- **Resultado:** Obtiene respuestas inmediatas basadas en el poder del motor de IA seleccionado, optimizando su tiempo de resolución diagnóstica.

## 4. Impacto Esperado
La implementación de SanaFlow genera un triple impacto en la institución de salud:

1. **Impacto Clínico (Salva Vidas):** Al reducir el tiempo de identificación de pacientes críticos de minutos a milisegundos, se acelera el "tiempo de puerta-aguja" o "puerta-balón" en emergencias, reduciendo la mortalidad.
2. **Impacto Operativo (Eficiencia):** Libera al personal de enfermería de la carga administrativa de leer y clasificar expedientes de forma manual, permitiéndoles dedicarse enteramente a la atención clínica directa. El enrutamiento automático a la especialidad correcta elimina interconsultas innecesarias.
3. **Impacto Tecnológico (Resiliencia Cloud):** Gracias a su arquitectura Serverless en AWS (API Gateway, SQS, Lambda, DynamoDB), la plataforma garantiza alta disponibilidad. Puede manejar desde 1 paciente hasta eventos de ingresos masivos (desastres naturales) escalando automáticamente su infraestructura y gestionando límites de peticiones (Rate Limits) mediante colas asíncronas y reintentos, evitando cualquier caída del sistema.
