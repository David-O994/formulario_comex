import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import App from "./App";

function MainApp() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
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
        alert(
          "El servidor no devolvió los datos de autenticación esperados."
        );
        return;
      }

      setToken(data.token);
      setUser(data.user);
      setQuotations([]);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  // Registro público: el backend asigna el rol de usuario.
  const handleRegister = async (username, password) => {
    try {
      const res = await fetch(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert(
          "Usuario creado correctamente. Ya puedes iniciar sesión."
        );
      } else {
        alert(data.error || "No se pudo crear el usuario.");
      }
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  // Cargar cotizaciones del usuario autenticado.
  useEffect(() => {
    if (!user || !token) {
      setQuotations([]);
      return;
    }

    const cargarCotizaciones = async () => {
      setLoadingQuotations(true);

      try {
        const res = await fetch(
          "http://localhost:3000/api/quotations",
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

          alert(
            "Tu sesión ha expirado. Inicia sesión nuevamente."
          );
          return;
        }

        if (!res.ok) {
          throw new Error(
            data.error ||
              "No se pudieron cargar las cotizaciones."
          );
        }

        setQuotations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(
          "Error cargando cotizaciones:",
          error
        );
      } finally {
        setLoadingQuotations(false);
      }
    };

    cargarCotizaciones();
  }, [user, token]);

  // Cierre de sesión
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setQuotations([]);
  };

  // Mostrar inicio de sesión y registro si no hay sesión activa.
  if (!user || !token) {
    return (
      <div>
        <h1>Bienvenido</h1>

        <Login onLogin={handleLogin} />
        <Register onRegister={handleRegister} />
      </div>
    );
  }

  return (
    <div>
      <header>
        <h2>
          Hola {user.username} ({user.role})
        </h2>

        <button
          type="button"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </header>

      <App token={token} />

      {user.role === "admin" && (
        <section>
          <h2>Informe de cotizaciones propias</h2>

          {loadingQuotations && (
            <p>Cargando cotizaciones...</p>
          )}

          {!loadingQuotations &&
            quotations.length === 0 && (
              <p>No hay cotizaciones para mostrar.</p>
            )}

          {quotations.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Descripción</th>
                  <th>Peso</th>
                  <th>Costo CLP</th>
                  <th>IVA CLP</th>
                  <th>Total CLP</th>
                  <th>Fecha</th>
                </tr>
              </thead>

              <tbody>
                {quotations.map((q) => (
                  <tr key={q._id}>
                    <td>{q.origin}</td>
                    <td>{q.destination}</td>
                    <td>{q.description}</td>
                    <td>{q.weight} kg</td>

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
                        ? new Date(
                            q.createdAt
                          ).toLocaleDateString("es-CL")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

export default MainApp;