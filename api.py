from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
from mysql.connector import Error
from pydantic import BaseModel

app = FastAPI(title="API ERP")
origins = ["http://localhost:3000"]

# Configuración de CORS (Permite que React se comunique con Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins= origins,
    allow_credentials = True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo de datos para las peticiones
class Producto(BaseModel):
    sku: str
    nombre: str
    cantidad: int
    ubicacion: str

def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='Gatogato191', 
        database='inventario_logistico',
        port='3306'
    )

@app.get("/productos")
def listar_productos():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM productos")
        return cursor.fetchall()
    finally:
        conn.close()

@app.post("/productos")
def crear_producto(p: Producto):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = "INSERT INTO productos (sku, nombre, cantidad, ubicacion) VALUES (%s, %s, %s, %s)"
        cursor.execute(query, (p.sku, p.nombre, p.cantidad, p.ubicacion))
        conn.commit()
        return {"status": "success", "message": f"Producto {p.sku} registrado"}
    except Error as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

# Para ejecutar: uvicorn api_logistica:app --reload