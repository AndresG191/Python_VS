import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || `Error ${response.status}`);
  }
  return data;
}

function Icon({ name, size = 20 }) {
  const paths = {
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5h6a1.5 1.5 0 0 0-1.5-1.5h-3A1.5 1.5 0 0 0 9 4.5ZM9 10h6M9 14h6M9 18h3" /></>,
    person: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function ProductForm({ onClose, onCreated }) {
  const [form, setForm] = useState({ sku: "", nombre: "", cantidad: "", ubicacion: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await request("/productos", {
        method: "POST",
        body: JSON.stringify({ ...form, sku: form.sku.trim(), nombre: form.nombre.trim(), ubicacion: form.ubicacion.trim(), cantidad: Number(form.cantidad) }),
      });
      await onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
      <div className="modal-heading"><div><p className="eyebrow">NUEVO REGISTRO</p><h2 id="form-title">Agregar producto</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar"><Icon name="close" /></button></div>
      <p className="modal-copy">Completa los datos para integrar el producto al inventario.</p>
      <form onSubmit={submit}>
        <label>SKU<input name="sku" value={form.sku} onChange={update} placeholder="Ej. ALT-2048" required maxLength="40" autoFocus /></label>
        <label>Nombre del producto<input name="nombre" value={form.nombre} onChange={update} placeholder="Nombre del producto" required maxLength="150" /></label>
        <div className="form-row"><label>Existencias<input name="cantidad" type="number" value={form.cantidad} onChange={update} placeholder="0" min="0" step="1" required /></label><label>Ubicación<input name="ubicacion" value={form.ubicacion} onChange={update} placeholder="Ej. Almacén A-01" required maxLength="100" /></label></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions"><button type="button" className="button button-muted" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar producto"}</button></div>
      </form>
    </section>
  </div>;
}

function StockForm({ product, onClose, onUpdated }) {
  const [cantidad, setCantidad] = useState(String(product.cantidad ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await request(`/productos/${encodeURIComponent(product.sku)}/stock`, {
        method: "PATCH",
        body: JSON.stringify({ cantidad: Number(cantidad) }),
      });
      await onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el stock.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal stock-modal" role="dialog" aria-modal="true" aria-labelledby="stock-title">
      <div className="modal-heading"><div><p className="eyebrow">AJUSTE DE EXISTENCIAS</p><h2 id="stock-title">Actualizar stock</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar"><Icon name="close" /></button></div>
      <p className="modal-copy">{product.nombre} <span className="stock-sku">· {product.sku}</span></p>
      <form onSubmit={submit}>
        <label>Nueva cantidad<input type="number" value={cantidad} onChange={(event) => setCantidad(event.target.value)} min="0" step="1" required autoFocus /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions"><button type="button" className="button button-muted" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? "Guardando…" : "Actualizar stock"}</button></div>
      </form>
    </section>
  </div>;
}

function EmployeeForm({ onClose, onCreated }) {
  const [form, setForm] = useState({ numero_nomina: "", nombre: "", apaterno: "", amaterno: "", curp: "", puesto: "", departamento: "", estatus: "Activo", telefono: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await request("/empleados", {
        method: "POST",
        body: JSON.stringify({ ...form, numero_nomina: form.numero_nomina.trim(), nombre: form.nombre.trim(), apaterno: form.apaterno.trim(), amaterno: form.amaterno.trim(), curp: form.curp.trim().toUpperCase(), puesto: form.puesto.trim(), departamento: form.departamento.trim(), telefono: form.telefono.trim() }),
      });
      await onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "No se pudo registrar al empleado.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal employee-modal" role="dialog" aria-modal="true" aria-labelledby="employee-form-title">
      <div className="modal-heading"><div><p className="eyebrow">RECURSOS HUMANOS</p><h2 id="employee-form-title">Agregar empleado</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar"><Icon name="close" /></button></div>
      <p className="modal-copy">Registra los datos del personal de la terminal.</p>
      <form onSubmit={submit}>
        <label>Número de nómina<input name="numero_nomina" value={form.numero_nomina} onChange={update} required maxLength="30" inputMode="numeric" placeholder="Ej. 001234" autoFocus /></label>
        <div className="form-row"><label>Nombre(s)<input name="nombre" value={form.nombre} onChange={update} required maxLength="100" /></label><label>Apellido paterno<input name="apaterno" value={form.apaterno} onChange={update} required maxLength="100" /></label></div>
        <div className="form-row"><label>Apellido materno<input name="amaterno" value={form.amaterno} onChange={update} required maxLength="100" /></label><label>CURP<input name="curp" value={form.curp} onChange={update} required minLength="18" maxLength="18" /></label></div>
        <div className="form-row"><label>Puesto<input name="puesto" value={form.puesto} onChange={update} required maxLength="100" /></label><label>Departamento<input name="departamento" value={form.departamento} onChange={update} required maxLength="100" /></label></div>
        <div className="form-row"><label>Estatus<select name="estatus" value={form.estatus} onChange={update}><option>Activo</option><option>Inactivo</option><option>Permiso</option></select></label><label>Teléfono<input name="telefono" type="tel" value={form.telefono} onChange={update} required maxLength="30" /></label></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions"><button type="button" className="button button-muted" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? "Guardando…" : "Registrar empleado"}</button></div>
      </form>
    </section>
  </div>;
}

function PayrollForm({ employee, onClose, onUpdated }) {
  const [numeroNomina, setNumeroNomina] = useState(String(employee.numero_nomina ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await request(`/empleados/${encodeURIComponent(employee.curp)}/nomina`, {
        method: "PATCH",
        body: JSON.stringify({ numero_nomina: numeroNomina.trim() }),
      });
      await onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el número de nómina.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="payroll-title">
      <div className="modal-heading"><div><p className="eyebrow">RECURSOS HUMANOS</p><h2 id="payroll-title">{employee.numero_nomina ? "Editar nómina" : "Asignar nómina"}</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar"><Icon name="close" /></button></div>
      <p className="modal-copy">{[employee.nombre, employee.apaterno, employee.amaterno].filter(Boolean).join(" ")}</p>
      <form onSubmit={submit}>
        <label>Número de nómina<input value={numeroNomina} onChange={(event) => setNumeroNomina(event.target.value)} required maxLength="30" inputMode="numeric" placeholder="Ej. 001234" autoFocus /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions"><button type="button" className="button button-muted" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar nómina"}</button></div>
      </form>
    </section>
  </div>;
}

function EmployeeDirectory({ employees, loading, error, query, onQuery, onRefresh, onAdd, onEditPayroll }) {
  const term = query.trim().toLocaleLowerCase("es");
  const filtered = employees.filter((employee) => [employee.numero_nomina, employee.nombre, employee.apaterno, employee.amaterno, employee.curp, employee.departamento, employee.puesto].some((value) => String(value ?? "").toLocaleLowerCase("es").includes(term)));
  const active = employees.filter((employee) => String(employee.estatus || "").toLocaleLowerCase("es") === "activo").length;
  const departments = new Set(employees.map((employee) => employee.departamento).filter(Boolean)).size;
  return <>
    <section className="metrics" aria-label="Resumen del personal">
      <article className="metric-card"><div className="metric-top"><span>Personal registrado</span><span className="metric-icon blue"><Icon name="users" /></span></div><strong>{employees.length}</strong><small>Registros en recursos humanos</small></article>
      <article className="metric-card"><div className="metric-top"><span>Personal activo</span><span className="metric-icon green"><Icon name="person" /></span></div><strong>{active}</strong><small>Con estatus activo</small></article>
      <article className="metric-card"><div className="metric-top"><span>Departamentos</span><span className="metric-icon amber"><Icon name="grid" /></span></div><strong>{departments}</strong><small>Áreas con personal registrado</small></article>
    </section>
    <section className="inventory-card">
      <div className="table-heading"><div><h2>Directorio de personal</h2><p>Empleados registrados en recursos humanos</p></div><button className="icon-button" onClick={onRefresh} aria-label="Actualizar personal" title="Actualizar"><Icon name="refresh" /></button></div>
      <div className="table-tools"><div className="search-box"><Icon name="search" size={18} /><input aria-label="Buscar empleados" placeholder="Buscar por nómina, nombre, CURP o departamento…" value={query} onChange={(event) => onQuery(event.target.value)} />{query && <button className="clear-search" onClick={() => onQuery("")} aria-label="Limpiar búsqueda"><Icon name="close" size={16} /></button>}</div><span className="result-count">{filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}</span></div>
      {error && <div className="error-banner" role="alert"><div><strong>No se pudo cargar el personal</strong><span>{error}</span><small>Confirma que la API y la tabla de recursos humanos estén disponibles.</small></div><button className="button button-muted" onClick={onRefresh}>Reintentar</button></div>}
      <div className="table-scroll"><table className="employee-table"><thead><tr><th>NÓMINA</th><th>EMPLEADO</th><th>CURP</th><th>PUESTO</th><th>DEPARTAMENTO</th><th>ESTATUS</th><th>TELÉFONO</th><th><span className="sr-only">ACCIONES</span></th></tr></thead><tbody>
        {loading ? <tr><td colSpan="8"><div className="empty-state">Cargando personal…</div></td></tr> : filtered.length === 0 ? <tr><td colSpan="8"><div className="empty-state"><div className="empty-icon"><Icon name="users" size={24} /></div><strong>{query ? "Sin coincidencias" : "Aún no hay empleados"}</strong><span>{query ? "Prueba con otro término de búsqueda." : "Agrega a una persona para crear el directorio del personal."}</span>{!query && !error && <button className="button button-primary" onClick={onAdd}><Icon name="plus" size={17} />Agregar empleado</button>}</div></td></tr> : filtered.map((employee, index) => {
          const status = String(employee.estatus || "Sin estatus");
          const isActive = status.toLocaleLowerCase("es") === "activo";
          return <tr key={employee.id ?? employee.curp ?? index}><td><span className="sku payroll-number">{employee.numero_nomina ?? "—"}</span></td><td><div className="product-cell"><span className={`product-avatar tone-${index % 5}`}>{String(employee.nombre || "?").trim().charAt(0).toUpperCase()}</span><strong>{[employee.nombre, employee.apaterno, employee.amaterno].filter(Boolean).join(" ")}</strong></div></td><td><span className="sku curp-text">{employee.curp || "—"}</span></td><td>{employee.puesto || "—"}</td><td>{employee.departamento || "—"}</td><td><span className={`badge ${isActive ? "badge-ok" : "badge-low"}`}><i />{status}</span></td><td>{employee.telefono || "—"}</td><td><button className="adjust-button" onClick={() => onEditPayroll(employee)}>{employee.numero_nomina ? "Editar" : "Asignar"}</button></td></tr>;
        })}
      </tbody></table></div>
      <div className="table-footer"><span>Datos conectados a recursos humanos</span><button className="text-button" onClick={onRefresh}>Sincronizar <Icon name="arrow" size={15} /></button></div>
    </section>
  </>;
}

function AuditDirectory({ audit, loading, error, onRefresh }) {
  const inserts = audit.filter((entry) => String(entry.operacion || "").toLocaleLowerCase("es").includes("insert")).length;
  const updates = audit.filter((entry) => String(entry.operacion || "").toLocaleLowerCase("es").includes("update")).length;
  return <>
    <section className="metrics" aria-label="Resumen de auditoría">
      <article className="metric-card"><div className="metric-top"><span>Movimientos registrados</span><span className="metric-icon blue"><Icon name="clipboard" /></span></div><strong>{audit.length}</strong><small>Eventos en el historial</small></article>
      <article className="metric-card"><div className="metric-top"><span>Altas de producto</span><span className="metric-icon green"><Icon name="plus" /></span></div><strong>{inserts}</strong><small>Registros de alta en auditoría</small></article>
      <article className="metric-card"><div className="metric-top"><span>Actualizaciones</span><span className="metric-icon amber"><Icon name="refresh" /></span></div><strong>{updates}</strong><small>Cambios registrados</small></article>
    </section>
    <section className="inventory-card">
      <div className="table-heading"><div><h2>Historial de movimientos</h2><p>Auditoría generada por los cambios de inventario</p></div><button className="icon-button" onClick={onRefresh} aria-label="Actualizar auditoría" title="Actualizar"><Icon name="refresh" /></button></div>
      {error && <div className="error-banner" role="alert"><div><strong>No se pudo cargar la auditoría</strong><span>{error}</span><small>Confirma que la API y la tabla de auditoría estén disponibles.</small></div><button className="button button-muted" onClick={onRefresh}>Reintentar</button></div>}
      <div className="table-scroll"><table className="audit-table"><thead><tr><th>FECHA Y HORA</th><th>PRODUCTO ID</th><th>OPERACIÓN</th><th>CANTIDAD ANTERIOR</th><th>CANTIDAD NUEVA</th><th>CAMBIO</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="6"><div className="empty-state">Cargando auditoría…</div></td></tr> : audit.length === 0 ? <tr><td colSpan="6"><div className="empty-state"><div className="empty-icon"><Icon name="clipboard" size={24} /></div><strong>{error ? "No hay datos para mostrar" : "Aún no hay movimientos"}</strong><span>Cuando se registren o actualicen productos, sus eventos aparecerán aquí.</span></div></td></tr> : audit.map((entry, index) => {
          const oldAmount = Number(entry.cantidad_anterior);
          const newAmount = Number(entry.cantidad_nueva);
          const delta = Number.isFinite(oldAmount) && Number.isFinite(newAmount) ? newAmount - oldAmount : null;
          const operation = String(entry.operacion || "Movimiento");
          const when = entry.fecha_cambio ? new Date(entry.fecha_cambio).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";
          return <tr key={entry.id ?? `${entry.fecha_cambio}-${index}`}><td><span className="audit-date">{when}</span></td><td><span className="sku">{entry.id_producto ?? "—"}</span></td><td><span className={`badge ${operation.toLocaleLowerCase("es").includes("insert") ? "badge-ok" : "badge-low"}`}><i />{operation}</span></td><td>{Number.isFinite(oldAmount) ? oldAmount.toLocaleString("es-MX") : entry.cantidad_anterior ?? "—"}</td><td><strong className="quantity">{Number.isFinite(newAmount) ? newAmount.toLocaleString("es-MX") : entry.cantidad_nueva ?? "—"}</strong></td><td className={delta > 0 ? "delta-positive" : delta < 0 ? "delta-negative" : ""}>{delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta.toLocaleString("es-MX")}`}</td></tr>;
        })}
      </tbody></table></div>
      <div className="table-footer"><span>Ordenado del movimiento más reciente al más antiguo</span><button className="text-button" onClick={onRefresh}>Sincronizar <Icon name="arrow" size={15} /></button></div>
    </section>
  </>;
}

export default function App() {
  const [section, setSection] = useState("inventory");
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [audit, setAudit] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [error, setError] = useState("");
  const [sectionError, setSectionError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [payrollEmployee, setPayrollEmployee] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);

  const loadProducts = useCallback(async () => {
    setError("");
    try {
      const data = await request("/productos");
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "No se pudo conectar con la API.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    setSectionError("");
    setSectionLoading(true);
    try {
      const data = await request("/empleados");
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setSectionError(err.message || "No se pudo cargar el personal.");
    } finally {
      setSectionLoading(false);
    }
  }, []);

  const loadAudit = useCallback(async () => {
    setSectionError("");
    setSectionLoading(true);
    try {
      const data = await request("/auditoria");
      setAudit(Array.isArray(data) ? data : []);
    } catch (err) {
      setSectionError(err.message || "No se pudo cargar la auditoría.");
    } finally {
      setSectionLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => {
    if (section === "employees") loadEmployees();
    if (section === "audit") loadAudit();
  }, [section, loadEmployees, loadAudit]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    if (!term) return products;
    return products.filter((item) => [item.sku, item.nombre, item.ubicacion].some((value) => String(value ?? "").toLocaleLowerCase("es").includes(term)));
  }, [products, query]);
  const totalUnits = products.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
  const lowStock = products.filter((item) => Number(item.cantidad) > 0 && Number(item.cantidad) <= 10).length;
  const title = section === "inventory" ? "Inventario" : section === "employees" ? "Personal" : "Auditoría";
  const subtitle = section === "inventory" ? "Consulta y administra los productos de tu operación." : section === "employees" ? "Consulta y administra el personal de la terminal." : "Trazabilidad de movimientos registrados en el inventario.";

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Icon name="box" size={23} /></div><div><strong>ALTAMIRA</strong><span>LOGÍSTICA PORTUARIA</span></div></div>
      <div className="side-label">OPERACIÓN</div>
      <nav aria-label="Secciones del sistema">
        <button className={`nav-item ${section === "inventory" ? "active" : ""}`} onClick={() => { setSection("inventory"); setQuery(""); }}><Icon name="grid" /><span>Inventario</span><span className="nav-count">{products.length}</span></button>
        <button className={`nav-item ${section === "employees" ? "active" : ""}`} onClick={() => { setSection("employees"); setQuery(""); }}><Icon name="users" /><span>Personal</span><span className="nav-count">{employees.length}</span></button>
        <button className={`nav-item ${section === "audit" ? "active" : ""}`} onClick={() => { setSection("audit"); setQuery(""); }}><Icon name="clipboard" /><span>Auditoría</span></button>
      </nav>
      <div className="sidebar-bottom"><div className="port-icon">A</div><div><strong>Terminal Altamira</strong><span>Tamaulipas, México</span></div><span className="status-dot" title="Sistema local" /></div>
    </aside>

    <main className="main-content" id="inventario">
      <header className="topbar"><div className="breadcrumb">Operación <span>/</span> <strong>{title}</strong></div><div className="topbar-right"><span className="system-status"><i /> API local</span><span className="today">Panel de control</span></div></header>
      <div className="page-wrap">
        <section className="page-heading"><div><p className="eyebrow">{section === "inventory" ? "GESTIÓN DE ALMACÉN" : section === "employees" ? "RECURSOS HUMANOS" : "TRAZABILIDAD DEL SISTEMA"}</p><h1>{title}</h1><p className="subtitle">{subtitle}</p></div>{section !== "audit" && <button className="button button-primary" onClick={() => section === "inventory" ? setShowForm(true) : setShowEmployeeForm(true)}><Icon name="plus" size={18} />{section === "inventory" ? "Agregar producto" : "Agregar empleado"}</button>}</section>

        {section === "inventory" && <>
          <section className="metrics" aria-label="Resumen del inventario">
            <article className="metric-card"><div className="metric-top"><span>Productos registrados</span><span className="metric-icon blue"><Icon name="box" /></span></div><strong>{products.length}</strong><small>Referencias en el catálogo</small></article>
            <article className="metric-card"><div className="metric-top"><span>Unidades en almacén</span><span className="metric-icon green"><Icon name="grid" /></span></div><strong>{totalUnits.toLocaleString("es-MX")}</strong><small>Existencias totales</small></article>
            <article className="metric-card"><div className="metric-top"><span>Stock bajo</span><span className="metric-icon amber"><span className="alert-mark">!</span></span></div><strong>{lowStock}</strong><small>Productos con 10 unidades o menos</small></article>
          </section>

          <section className="inventory-card">
            <div className="table-heading"><div><h2>Productos</h2><p>Listado de existencias registradas</p></div><button className="icon-button refresh-button" onClick={loadProducts} aria-label="Actualizar inventario" title="Actualizar"><Icon name="refresh" /></button></div>
            <div className="table-tools"><div className="search-box"><Icon name="search" size={18} /><input aria-label="Buscar productos" placeholder="Buscar por SKU, nombre o ubicación…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button className="clear-search" onClick={() => setQuery("")} aria-label="Limpiar búsqueda"><Icon name="close" size={16} /></button>}</div><span className="result-count">{filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}</span></div>
            {error && <div className="error-banner" role="alert"><div><strong>No se pudo cargar el inventario</strong><span>{error}</span><small>Confirma que la API y MySQL estén activos.</small></div><button className="button button-muted" onClick={loadProducts}>Reintentar</button></div>}
            <div className="table-scroll"><table><thead><tr><th>SKU</th><th>PRODUCTO</th><th>UBICACIÓN</th><th>EXISTENCIAS</th><th>ESTADO</th><th><span className="sr-only">ACCIONES</span></th></tr></thead><tbody>
              {loading ? <tr><td colSpan="6"><div className="empty-state">Cargando inventario…</div></td></tr> : filtered.length === 0 ? <tr><td colSpan="6"><div className="empty-state"><div className="empty-icon"><Icon name={query ? "search" : "box"} size={24} /></div><strong>{query ? "Sin coincidencias" : "Aún no hay productos"}</strong><span>{query ? "Prueba con otro término de búsqueda." : "Agrega un producto para empezar a visualizar tu inventario."}</span>{!query && !error && <button className="button button-primary" onClick={() => setShowForm(true)}><Icon name="plus" size={17} />Agregar producto</button>}</div></td></tr> : filtered.map((product, index) => {
                const amount = Number(product.cantidad) || 0;
                const status = amount === 0 ? "Agotado" : amount <= 10 ? "Stock bajo" : "Disponible";
                return <tr key={product.id ?? product.sku ?? index}><td><span className="sku">{product.sku || "—"}</span></td><td><div className="product-cell"><span className={`product-avatar tone-${index % 5}`}>{String(product.nombre || "?").trim().charAt(0).toUpperCase()}</span><strong>{product.nombre || "Sin nombre"}</strong></div></td><td><span className="location"><Icon name="pin" size={15} />{product.ubicacion || "Sin ubicación"}</span></td><td><strong className="quantity">{amount.toLocaleString("es-MX")}</strong><span className="units-label"> unidades</span></td><td><span className={`badge ${amount === 0 ? "badge-out" : amount <= 10 ? "badge-low" : "badge-ok"}`}><i />{status}</span></td><td><button className="adjust-button" onClick={() => setStockProduct(product)}>Ajustar</button></td></tr>;
              })}
            </tbody></table></div>
            <div className="table-footer"><span>Datos conectados a la base de inventario</span><button className="text-button" onClick={loadProducts}>Sincronizar <Icon name="arrow" size={15} /></button></div>
          </section>
        </>}
        {section === "employees" && <EmployeeDirectory employees={employees} loading={sectionLoading} error={sectionError} query={query} onQuery={setQuery} onRefresh={loadEmployees} onAdd={() => setShowEmployeeForm(true)} onEditPayroll={setPayrollEmployee} />}
        {section === "audit" && <AuditDirectory audit={audit} loading={sectionLoading} error={sectionError} onRefresh={loadAudit} />}
        <footer className="footer">Sistema de gestión logística <span>•</span> Terminal Altamira</footer>
      </div>
    </main>
    {showForm && <ProductForm onClose={() => setShowForm(false)} onCreated={loadProducts} />}
    {showEmployeeForm && <EmployeeForm onClose={() => setShowEmployeeForm(false)} onCreated={loadEmployees} />}
    {payrollEmployee && <PayrollForm employee={payrollEmployee} onClose={() => setPayrollEmployee(null)} onUpdated={loadEmployees} />}
    {stockProduct && <StockForm product={stockProduct} onClose={() => setStockProduct(null)} onUpdated={loadProducts} />}
  </div>;
}
