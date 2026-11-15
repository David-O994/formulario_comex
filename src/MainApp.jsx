import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./MainApp.css";

function MainApp({ user, token, onLogout, forcedView }) {
  const [dataList, setDataList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const esAdmin = user?.role === "admin";
  const esUsuario = Boolean(user && token && user.role === "usuario");
  const estaAutenticado = Boolean(user && token);

  // Cargar datos según la vista activa (Historial de cotizaciones o Lista de usuarios)
  useEffect(() => {
    const esVistaAdminHistorial = user?.role === "admin" && forcedView === "historial";
    const esVistaListaUsuarios = user?.role === "admin" && forcedView === "lista-usuarios";
    const esVistaMisCotizaciones = (user?.role === "usuario" || user?.role === "admin") && forcedView === "mis-cotizaciones";

    if (!user || !token || (!esVistaAdminHistorial && !esVistaListaUsuarios && !esVistaMisCotizaciones)) {
      return;
    }

    let cancelado = false;

    const cargarDatos = async () => {
      setLoadingData(true);

      try {
        let endpoint = "";
        if (esVistaAdminHistorial) {
          endpoint = "http://localhost:3000/api/quotations/admin/all";
        } else if (esVistaListaUsuarios) {
          endpoint = "http://localhost:3000/api/auth/admin/usuarios";
        } else {
          endpoint = "http://localhost:3000/api/quotations/mis-cotizaciones";
        }

        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.status === 401) {
          onLogout();
          alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
          window.location.href = "/login";
          return;
        }

        if (!res.ok) {
          throw new Error(
            data.error || "No se pudieron cargar los datos."
          );
        }

        if (!cancelado) {
          setDataList(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelado) {
          console.error("Error cargando datos:", error);
          alert(error.message || "No se pudieron cargar los datos.");
        }
      } finally {
        if (!cancelado) {
          setLoadingData(false);
        }
      }
    };

    cargarDatos();

    return () => {
      cancelado = true;
    };
  }, [user, token, forcedView, onLogout]);

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link to="/" className="brand-button" style={{ textDecoration: "none" }}>
          Inicio
        </Link>

        <div className="header-actions">
          {estaAutenticado && (
            <>
              <span className="user-greeting">
                Hola, {user.username}
              </span>

              <button
                type="button"
                className="button-logout"
                onClick={() => {
                  onLogout();
                  window.location.href = "/";
                }}
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </header>

      <div className="dashboard-content">
        {/* VISTA DE LISTADO DE USUARIOS (Solo Admin) */}
        {forcedView === "lista-usuarios" && esAdmin ? (
          <section className="dashboard-panel history-panel">
            <Link to="/" className="button-back" style={{ textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}>
              ← Volver al dashboard
            </Link>

            <h1>Listado de usuarios</h1>

            {loadingData && <p>Cargando usuarios...</p>}

            {!loadingData && dataList.length === 0 && (
              <p>No hay usuarios para mostrar.</p>
            )}

            {!loadingData && dataList.length > 0 && (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Rol</th>
                      <th>Fecha registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataList.map((u) => (
                      <tr key={u._id}>
                        <td>{u._id}</td>
                        <td>{u.username}</td>
                        <td>{u.role}</td>
                        <td>
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString("es-CL")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : /* VISTA DE HISTORIAL (Admin o Usuario según corresponda) */
        (forcedView === "historial" && esAdmin) || (forcedView === "mis-cotizaciones" && (esUsuario || esAdmin)) ? (
          <section className="dashboard-panel history-panel">
            <Link to="/" className="button-back" style={{ textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}>
              ← Volver al dashboard
            </Link>

            <h1>{esAdmin && forcedView === "historial" ? "Historial de cotizaciones" : "Mi historial de cotizaciones"}</h1>

            {loadingData && <p>Cargando cotizaciones...</p>}

            {!loadingData && dataList.length === 0 && (
              <p>No hay cotizaciones para mostrar.</p>
            )}

            {!loadingData && dataList.length > 0 && (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Origen</th>
                      <th>Destino</th>
                      <th>Días Tránsito</th>
                      <th>Peso (t)</th>
                      <th>Contenedores</th>
                      <th>Tarifa Est. (USD)</th>
                      <th>Valor Carga</th>
                      <th>Descripción</th>
                      <th>Fecha</th>
                      {esAdmin && forcedView === "historial" && <th>Usuario</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {dataList.map((q) => (
                      <tr key={q._id}>
                        <td>{q.origen}</td>
                        <td>{q.destino}</td>
                        <td>
                          {q.transito 
                            ? `${q.transito.minDias} - ${q.transito.maxDias} días` 
                            : (q.days !== undefined ? `${q.days} días` : "—")}
                        </td>
                        <td>{q.weight} t</td>
                        <td>{q.contenedores ?? "—"}</td>
                        <td>
                          {q.tarifas 
                            ? `$${q.tarifas.min?.toLocaleString()} - $${q.tarifas.max?.toLocaleString()}` 
                            : (q.cost ? `$${q.cost.toLocaleString()}` : "—")}
                        </td>
                        <td>{q.valorCarga ? `$${q.valorCarga.toLocaleString()}` : "—"}</td>
                        <td>{q.description}</td>
                        <td>
                          {q.createdAt
                            ? new Date(q.createdAt).toLocaleDateString("es-CL")
                            : "—"}
                        </td>
                        {esAdmin && forcedView === "historial" && <td>{q.userId?.username ?? "—"}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          /* VISTA NORMAL DE LAS TARJETAS DEL DASHBOARD (INICIO) */
          <>
            <section className="dashboard-intro">
              <p className="dashboard-eyebrow">PANEL PRINCIPAL</p>

              <h1>
                {estaAutenticado
                  ? `Bienvenido, ${user.username}`
                  : "Bienvenido"}
              </h1>

              <p>
                {esAdmin
                  ? "Administra los usuarios y consulta las cotizaciones."
                  : esUsuario
                    ? "Gestiona tus envíos y crea nuevas cotizaciones."
                    : "Inicia sesión para acceder a las opciones disponibles."}
              </p>
            </section>

            <section className="dashboard-cards">
              {!estaAutenticado && (
                <Link to="/login" className="dashboard-card" style={{ textDecoration: "none" }}>
                  <span className="dashboard-card-icon">↪</span>
                  <h2>Iniciar sesión</h2>
                  <p>Accede a tu cuenta para continuar.</p>
                  <span className="dashboard-card-link">
                    Ingresar →
                  </span>
                </Link>
              )}

              {esAdmin && (
                <>
                  {/* Fila 1: Crear usuario | Crear cotización | Módulo Cotizador */}
                  <Link to="/admin/crear-usuario" className="dashboard-card" style={{ textDecoration: "none" }}>
                    <span className="dashboard-card-icon">＋</span>
                    <h2>Crear usuario</h2>
                    <p>Registra una nueva cuenta de usuario.</p>
                    <span className="dashboard-card-link">
                      Crear usuario →
                    </span>
                  </Link>

                  <Link to="/cotizaciones/crear" className="dashboard-card" style={{ textDecoration: "none" }}>
                    <span className="dashboard-card-icon">＋</span>
                    <h2>Crear cotización</h2>
                    <p>Completa los datos de tu próximo envío.</p>
                    <span className="dashboard-card-link">
                      Crear cotización →
                    </span>
                  </Link>

                  <Link to="/cotizador" className="dashboard-card" style={{ textDecoration: "none" }}>
                    <span className="dashboard-card-icon">📊</span>
                    <h2>Módulo Cotizador</h2>
                    <p>Sube y gestiona las tarifas desde Excel.</p>
                    <span className="dashboard-card-link">
                      Ir al cotizador →
                    </span>
                  </Link>

                  {/* Fila 2: Listado de usuarios | Mis cotizaciones | Historial de cotizaciones */}
                  <Link to="/admin/lista-usuarios" className="dashboard-card" style={{ textDecoration: "none" }}>
                    <span className="dashboard-card-icon">👥</span>
                    <h2>Listado de usuarios</h2>
                    <p>Consulta los usuarios registrados en el sistema.</p>
                    <span className="dashboard-card-link">
                      Ver usuarios →
                    </span>
                  </Link>

                  <Link to="/mis-cotizaciones" className="dashboard-card" style={{ textDecoration: "none" }}>
                    <span className="dashboard-card-icon">📋</span>
                    <h2>Mis cotizaciones</h2>
                    <p>Revisa el historial de tus envíos realizados.</p>
                    <span className="dashboard-card-link">
                      Ver mi historial →
                    </span>
                  </Link>

                  <Link to="/admin/historial" className="dashboard-card" style={{ textDecoration: "none" }}>
                    <span className="dashboard-card-icon">▤</span>
                    <h2>Historial de cotizaciones</h2>
                    <p>Consulta las cotizaciones disponibles.</p>
                    <span className="dashboard-card-link">
                      Ver historial →
                    </span>
                  </Link>
                </>
              )}

              {esUsuario && (
                <>
                  <Link to="/cotizaciones/crear" className="dashboard-card" style={{ textDecoration: "none" }}>
                    <span className="dashboard-card-icon">＋</span>
                    <h2>Crear cotización</h2>
                    <p>Completa los datos de tu próximo envío.</p>
                    <span className="dashboard-card-link">
                      Crear cotización →
                    </span>
                  </Link>

                  <Link to="/mis-cotizaciones" className="dashboard-card" style={{ textDecoration: "none" }}>
                    <span className="dashboard-card-icon">📋</span>
                    <h2>Mis cotizaciones</h2>
                    <p>Revisa el historial de tus envíos realizados.</p>
                    <span className="dashboard-card-link">
                      Ver mi historial →
                    </span>
                  </Link>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default MainApp;