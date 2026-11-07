import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./MainApp.css";

function MainApp({ user, token, onLogout, forcedView }) {
  const [quotations, setQuotations] = useState([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);

  const esAdmin = user?.role === "admin";
  const esUsuario = Boolean(user && token && user.role === "usuario");
  const estaAutenticado = Boolean(user && token);

  // Cargar cotizaciones para el historial del administrador si estamos en la vista forzada
  useEffect(() => {
    if (!user || !token || user.role !== "admin" || forcedView !== "historial") {
      return;
    }

    let cancelado = false;

    const cargarCotizaciones = async () => {
      setLoadingQuotations(true);

      try {
        const res = await fetch(
          "http://localhost:3000/api/quotations/admin/all",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (res.status === 401) {
          onLogout();
          alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
          window.location.href = "/login";
          return;
        }

        if (!res.ok) {
          throw new Error(
            data.error || "No se pudieron cargar las cotizaciones."
          );
        }

        if (!cancelado) {
          setQuotations(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelado) {
          console.error("Error cargando cotizaciones:", error);
          alert(error.message || "No se pudieron cargar las cotizaciones.");
        }
      } finally {
        if (!cancelado) {
          setLoadingQuotations(false);
        }
      }
    };

    cargarCotizaciones();

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
        {/* Si estamos en la ruta de historial (/admin/historial) */}
        {forcedView === "historial" && esAdmin ? (
          <section className="dashboard-panel history-panel">
            <Link to="/" className="button-back" style={{ textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}>
              ← Volver al dashboard
            </Link>

            <h1>Historial de cotizaciones</h1>

            {loadingQuotations && <p>Cargando cotizaciones...</p>}

            {!loadingQuotations && quotations.length === 0 && (
              <p>No hay cotizaciones para mostrar.</p>
            )}

            {!loadingQuotations && quotations.length > 0 && (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Origen</th>
                      <th>Destino</th>
                      <th>Días</th>
                      <th>Peso (kg)</th>
                      <th>Descripción</th>
                      <th>Fecha</th>
                      <th>Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.map((q) => (
                      <tr key={q._id}>
                        <td>{q.origin}</td>
                        <td>{q.destination}</td>
                        <td>{q.days ?? "—"}</td>
                        <td>{q.weight}</td>
                        <td>{q.description}</td>
                        <td>
                          {q.createdAt
                            ? new Date(q.createdAt).toLocaleDateString("es-CL")
                            : "—"}
                        </td>
                        <td>{q.userId?.username ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          /* Vista normal de la Tarjeta del Dashboard (Inicio) */
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
                  <Link to="/admin/crear-usuario" className="dashboard-card" style={{ textDecoration: "none" }}>
                    <span className="dashboard-card-icon">＋</span>
                    <h2>Crear usuario</h2>
                    <p>Registra una nueva cuenta de usuario.</p>
                    <span className="dashboard-card-link">
                      Crear usuario →
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
                <Link to="/cotizaciones/crear" className="dashboard-card" style={{ textDecoration: "none" }}>
                  <span className="dashboard-card-icon">＋</span>
                  <h2>Crear cotización</h2>
                  <p>Completa los datos de tu próximo envío.</p>
                  <span className="dashboard-card-link">
                    Crear cotización →
                  </span>
                </Link>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default MainApp;