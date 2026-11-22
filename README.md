# Inventario logístico

Panel web en React para consultar el inventario y API REST en FastAPI conectada a MySQL.

## Requisitos

- Python y Node.js/npm
- MySQL con la base `inventario_logistico` y las tablas `productos`, `recursos_humanos` y `auditoria_inventario`. Los campos utilizados para personal son `numero_nomina`, `nombre`, `apaterno`, `amaterno`, `curp`, `puesto`, `departamento`, `estatus` y `telefono`; la auditoría utiliza `fecha_cambio`, `id_producto`, `operacion`, `cantidad_anterior` y `cantidad_nueva`.

## Instalación y ejecución

1. Instala las dependencias web: `npm install`.
2. Instala las dependencias Python: `pip install -r requirements.txt`.
3. Inicia la API en una terminal: `uvicorn api:app --reload`.
4. Inicia React en otra terminal: `npm run dev`.
5. Abre `http://localhost:3000`.

Vite reenvía las solicitudes `/api` al servidor FastAPI en `http://127.0.0.1:8000`. La API conserva la configuración de conexión MySQL existente en `api.py`.

## Funciones

- Consulta de productos y existencias desde MySQL.
- Indicadores de productos registrados, unidades totales y artículos con stock bajo.
- Búsqueda por SKU, nombre o ubicación.
- Alta de productos y actualización de existencias.
- Directorio y alta de empleados de recursos humanos.
- Consulta del historial de auditoría del inventario.
- El registro de auditoría depende del trigger de MySQL descrito en el proyecto.
- Adaptación a pantallas móviles.
