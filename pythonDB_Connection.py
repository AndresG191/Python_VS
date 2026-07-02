import os

import mysql.connector
from mysql.connector import Error

def conectar_db():
    """Establece la conexión con MySQL utilizando la configuración del usuario."""
    try:
        conexion = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            port=os.getenv("DB_PORT")
        )
        if conexion.is_connected():
            return conexion
    except Error as e:
        print(f"❌ Error crítico de conexión: {e}")
        return None

def registrar_producto(sku, nombre, cantidad, ubicacion):
    """Inserta un nuevo producto. El Trigger de MySQL se encargará de la auditoría."""
    conn = conectar_db()
    if not conn: return
    try:
        cursor = conn.cursor()
        query = """INSERT INTO productos (sku, nombre, cantidad, ubicacion) 
                   VALUES (%s, %s, %s, %s)"""
        cursor.execute(query, (sku, nombre, cantidad, ubicacion))
        conn.commit()
        print(f"✅ [Sistema] SKU {sku} registrado. Auditoría generada automáticamente.")
    except Error as e:
        print(f"⚠️ Error al insertar: {e}")
    finally:
        conn.close()

def actualizar_stock(sku, nueva_cantidad):
    """
    Actualiza la cantidad de un producto usando su SKU.
    Al usar una columna UNIQUE (sku), se evita el error de Safe Update Mode.
    """
    conn = conectar_db()
    if not conn: return

    try:
        cursor = conn.cursor()
        # Usamos el SKU porque es una llave única, lo cual es seguro para MySQL
        query = "UPDATE productos SET cantidad = %s WHERE sku = %s"
        cursor.execute(query, (nueva_cantidad, sku))
        conn.commit()
        
        if cursor.rowcount > 0:
            print(f"✅ [Sistema] Stock actualizado para {sku} a {nueva_cantidad} unidades.")
        else:
            print(f"⚠️ No se encontró ningún producto con el SKU: {sku}")
            
    except Error as e:
        print(f"❌ Error al actualizar stock: {e}")
    finally:
        conn.close()

def ver_historial_auditoria():
    """Consulta la tabla de auditoría para mostrar la trazabilidad de los datos."""
    conn = conectar_db()
    if not conn: return

    try:
        cursor = conn.cursor(dictionary=True)
        print("\n" + "="*60)
        print("📋 LOG DE AUDITORÍA (MOVIMIENTOS DE INVENTARIO)")
        print("="*60)
        
        query = "SELECT * FROM auditoria_inventario ORDER BY fecha_cambio DESC"
        cursor.execute(query)
        
        for fila in cursor.fetchall():
            msg = (f"[{fila['fecha_cambio']}] Producto ID: {fila['id_producto']} | "
                   f"Operación: {fila['operacion']} | "
                   f"Cant. Anterior: {fila['cantidad_anterior']} -> Nueva: {fila['cantidad_nueva']}")
            print(msg)
            
    except Error as e:
        print(f"⚠️ Error al leer auditoría: {e}")
    finally:
        conn.close()

def recursos_H(nombre, apaterno, amaterno, curp, puesto, departamento, estatus, telefono):
    """"Agregar nuevo registro a la tabla de Recursos Humanos."""

    if len(curp) !=18:
        print("⚠️ CURP debe tener 18 caracteres.")
        return

    conn = conectar_db()
    if not conn: return

    try:
        cursor = conn.cursor()
        query = """INSERT INTO recursos_humanos (nombre, apaterno, amaterno, curp, puesto, departamento, estatus, telefono)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
         
        valores = (nombre, apaterno, amaterno, curp, puesto, departamento, estatus, telefono)

        cursor.execute(query, valores)
        conn.commit()
        print(f"Empleado registrado exitosamente: {nombre} {apaterno} {amaterno}")
    except Error as e:
        print("Ocurrio un error al registrar el empleado: {e}")
    finally:
        conn.close()

def mostrar_empleados():
    """"Mostrando todos los empleados"""
    conn = conectar_db()
    if not conn: return
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM recursos_humanos"
        cursor.execute(query)
        for emp in cursor.fetchall():
            print(f"[{emp['nombre']} {emp['apaterno']} {emp['amaterno']}] - CURP: {emp['curp']} - Puesto: {emp['puesto']} - Departamento: {emp['departamento']} - Estatus: {emp['estatus']} - Teléfono: {emp['telefono']}")
    finally:
        conn.close()

        

# --- MENÚ DE PRUEBA PROFESIONAL ---
if __name__ == "__main__":
    while True:
        print("\n--- Gestión de Inventario Portuario (Altamira) ---")
        print("1. Registrar nuevo producto")
        print("2. Ver Log de Auditoría (Triggers)")
        print("3. Agregar empleado")
        print("4. Mostrar empleados")
        print("5. Salir")
        
        opcion = input("Seleccione una opción: ")
        
        if opcion == "1":
            s = input("SKU: ")
            n = input("Nombre: ")
            c = int(input("Cantidad: "))
            u = input("Ubicación: ")
            registrar_producto(s, n, c, u)
        elif opcion == "2":
            ver_historial_auditoria()
        elif opcion == "3":
            nombre = input("Nombre: ")
            apaterno = input("Apellido Paterno: ")
            amaterno = input("Apellido Materno: ")
            curp = input("CURP: ")
            puesto = input("Puesto: ")
            departamento = input("Departamento: ")
            estatus = input("Estatus: ")
            telefono = input("Teléfono: ")
            recursos_H(nombre, apaterno, amaterno, curp, puesto, departamento, estatus, telefono)
        elif opcion == "4":
            mostrar_empleados()
        elif opcion == "5":
            break