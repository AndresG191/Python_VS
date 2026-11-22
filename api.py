from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
from mysql.connector import Error
from pydantic import BaseModel, Field

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
    sku: str = Field(min_length=1, max_length=40)
    nombre: str = Field(min_length=1, max_length=150)
    cantidad: int = Field(ge=0)
    ubicacion: str = Field(min_length=1, max_length=100)

class ActualizacionStock(BaseModel):
    cantidad: int = Field(ge=0)

class Empleado(BaseModel):
    numero_nomina: str = Field(min_length=1, max_length=30)
    nombre: str = Field(min_length=1, max_length=100)
    apaterno: str = Field(min_length=1, max_length=100)
    amaterno: str = Field(min_length=1, max_length=100)
    curp: str = Field(min_length=18, max_length=18)
    puesto: str = Field(min_length=1, max_length=100)
    departamento: str = Field(min_length=1, max_length=100)
    estatus: str = Field(min_length=1, max_length=50)
    telefono: str = Field(min_length=1, max_length=30)

class NumeroNomina(BaseModel):
    numero_nomina: str = Field(min_length=1, max_length=30)

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

@app.patch("/productos/{sku}/stock")
def actualizar_stock(sku: str, actualizacion: ActualizacionStock):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM productos WHERE sku = %s", (sku,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail=f"No existe un producto con SKU {sku}")
        cursor.execute(
            "UPDATE productos SET cantidad = %s WHERE sku = %s",
            (actualizacion.cantidad, sku),
        )
        conn.commit()
        return {"status": "success", "message": f"Stock de {sku} actualizado"}
    except Error as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.get("/empleados")
def listar_empleados():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM recursos_humanos ORDER BY nombre, apaterno, amaterno")
        return cursor.fetchall()
    finally:
        conn.close()

@app.post("/empleados")
def crear_empleado(empleado: Empleado):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = """INSERT INTO recursos_humanos
                   (numero_nomina, nombre, apaterno, amaterno, curp, puesto, departamento, estatus, telefono)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"""
        values = (
            empleado.numero_nomina.strip(), empleado.nombre.strip(), empleado.apaterno.strip(), empleado.amaterno.strip(),
            empleado.curp.strip().upper(), empleado.puesto.strip(), empleado.departamento.strip(),
            empleado.estatus.strip(), empleado.telefono.strip(),
        )
        cursor.execute(query, values)
        conn.commit()
        return {"status": "success", "message": "Empleado registrado"}
    except Error as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.patch("/empleados/{curp}/nomina")
def actualizar_nomina(curp: str, nomina: NumeroNomina):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM recursos_humanos WHERE curp = %s", (curp,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail=f"No existe un empleado con CURP {curp}")
        cursor.execute(
            "UPDATE recursos_humanos SET numero_nomina = %s WHERE curp = %s",
            (nomina.numero_nomina.strip(), curp),
        )
        conn.commit()
        return {"status": "success", "message": "Número de nómina actualizado"}
    except Error as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.get("/auditoria")
def listar_auditoria():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM auditoria_inventario ORDER BY fecha_cambio DESC")
        return cursor.fetchall()
    finally:
        conn.close()

# Para ejecutar: uvicorn api:app --reload
