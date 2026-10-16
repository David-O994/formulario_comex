import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import App from "./App";
import "./MainApp.css";

function MainApp() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [vista, setVista] = useState("dashboard");

  const [quotations, setQuotations] = useState([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);

  // Inicio de sesión
  const handleLogin = async (username, password) => {
    try {
      const res = await fetch(
        "http://localhost:3000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "No se pudo iniciar sesión.");
        return;
      }

      if (!data.token || !data.user) {
        alert("El servidor no devolvió los datos de autenticación esperados.");
        return;
      }

      setToken(data.token);
      setUser(data.user);
      setQuotations([]);
      setVista("dashboard");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  // Registro de usuario
  const handleRegister = async (username, password) => {
    try {
      const res = await fetch(
        "http://localhost:3000/api/auth/register",{
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "No se pudo crear el usuario.");
        return;
      }

      alert("Usuario creado correctamente.");

      setVista("dashboard");
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  // Cargar cotizaciones para el historial del administrador.
  useEffect(() => {
    if (!user || !token || user.role !== "admin" || vista !== "historial") {
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
          setUser(null);
          setToken(null);
          setQuotations([]);
          setVista("dashboard");

          alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
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
  }, [user, token, vista]);

  // Cerrar sesión y volver al dashboard público.
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setQuotations([]);
    setVista("dashboard");
  };

  const volverAlDashboard = () => {
    setVista("dashboard");
  };

  const esAdmin = user?.role === "admin";
  const esUsuario = Boolean(
    user && token && user.role === "usuario"
    );
  const estaAutenticado = Boolean(user && token);

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <button
          type="button"
          className="brand-button"
          onClick={volverAlDashboard}
        >
          Inicio
        </button>

        <div className="header-actions">
          {estaAutenticado && (
            <>
              <span className="user-greeting">
                Hola, {user.username}
              </span>

              <button
                type="button"
                className="button-logout"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </header>

      <div className="dashboard-content">
        {vista === "dashboard" && (
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
                <button
                  type="button"
                  className="dashboard-card"
                  onClick={() => setVista("login")}
                >
                  <span className="dashboard-card-icon">↪</span>
                  <h2>Iniciar sesión</h2>
                  <p>Accede a tu cuenta para continuar.</p>
                  <span className="dashboard-card-link">
                    Ingresar →
                  </span>
                </button>
              )}

              {esAdmin && (
                <>
                  <button
                    type="button"
                    className="dashboard-card"
                    onClick={() => setVista("crear-usuario")}
                  >
                    <span className="dashboard-card-icon">＋</span>
                    <h2>Crear usuario</h2>
                    <p>Registra una nueva cuenta de usuario.</p>
                    <span className="dashboard-card-link">
                      Crear usuario →
                    </span>
                  </button>

                  <button
                    type="button"
                    className="dashboard-card"
                    onClick={() => setVista("historial")}
                  >
                    <span className="dashboard-card-icon">▤</span>
                    <h2>Historial de cotizaciones</h2>
                    <p>Consulta las cotizaciones disponibles.</p>
                    <span className="dashboard-card-link">
                      Ver historial →
                    </span>
                  </button>
                </>
              )}

              {esUsuario && (
                <button
                  type="button"
                  className="dashboard-card"
                  onClick={() => setVista("crear-cotizacion")}
                >
                  <span className="dashboard-card-icon">＋</span>
                  <h2>Crear cotización</h2>
                  <p>Completa los datos de tu próximo envío.</p>
                  <span className="dashboard-card-link">
                    Crear cotización →
                  </span>
                </button>
              )}
            </section>
          </>
        )}

        {vista === "login" && (
          <section className="dashboard-panel">
            <button
              type="button"
              className="button-back"
              onClick={volverAlDashboard}
            >
              ← Volver al inicio
            </button>

            <Login onLogin={handleLogin} />
          </section>
        )}

        {vista === "crear-usuario" && esAdmin && (
          <section className="dashboard-panel">
            <button
              type="button"
              className="button-back"
              onClick={volverAlDashboard}
            >
              ← Volver al dashboard
            </button>

            <Register onRegister={handleRegister} />
          </section>
        )}

        {vista === "crear-cotizacion" && esUsuario && (
          <section className="dashboard-panel">
            <button
              type="button"
              className="button-back"
              onClick={volverAlDashboard}
            >
              ← Volver al dashboard
            </button>

            <App token={token} />
          </section>
        )}

        {vista === "historial" && esAdmin && (
          <section className="dashboard-panel history-panel">
            <button
              type="button"
              className="button-back"
              onClick={volverAlDashboard}
            >
              ← Volver al dashboard
            </button>

            <h1>Historial de cotizaciones</h1>

            {loadingQuotations && (
              <p>Cargando cotizaciones...</p>
            )}

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
                      <th>Peso (toneladas)</th>
                      <th>Contenedores</th>
                      <th>Descripción</th>
                      <th>Costo CLP</th>
                      <th>IVA CLP</th>
                      <th>Total CLP</th>
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
                        <td>{q.contenedores ?? "—"}</td>
                        <td>{q.description}</td>
                        <td>
                          {Number(q.cost).toLocaleString("es-CL")}
                        </td>
                        <td>
                          {Number(q.ivaCLP).toLocaleString("es-CL")}
                        </td>
                        <td>
                          {(
                            Number(q.cost) + Number(q.ivaCLP)
                          ).toLocaleString("es-CL")}
                        </td>
                        <td>
                          {q.createdAt
                            ? new Date(q.createdAt).toLocaleDateString(
                                "es-CL"
                              )
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
        )}
      </div>
    </main>
  );
}

export default MainApp;