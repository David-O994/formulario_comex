import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import App from "./App"; // formulario de cotización

function MainApp() {
  const [user, setUser] = useState(null); // { username, role }
  const [quotations, setQuotations] = useState([]);

  // Login
  const handleLogin = async (username, password) => {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setUser({ username, role: data.role });
    } else {
      alert(data.error);
    }
  };

  // Registro
  const handleRegister = async (username, password, role = "usuario") => {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Usuario creado correctamente");
    } else {
      alert(data.error);
    }
  };

  // Cargar cotizaciones si es admin
  useEffect(() => {
    if (user?.role === "admin") {
      fetch("http://localhost:3000/api/cotizacion")
        .then((res) => res.json())
        .then((data) => setQuotations(data))
        .catch((err) => console.error("Error cargando cotizaciones:", err));
    }
  }, [user]);

  if (!user) {
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
      <h2>Hola {user.username} ({user.role})</h2>
      <App /> {/* formulario de cotización */}

      {user.role === "admin" && (
        <section>
          <h2>Informe de Cotizaciones</h2>
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Tipo carga</th>
                <th>Peso</th>
                <th>Costo USD</th>
                <th>Costo CLP</th>
                <th>IVA</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q._id}>
                  <td>{q.fullName}</td>
                  <td>{q.origin}</td>
                  <td>{q.destination}</td>
                  <td>{q.cargoType}</td>
                  <td>{q.weight} kg</td>
                  <td>{q.totalCostUSD}</td>
                  <td>{q.totalCostCLP}</td>
                  <td>{q.ivaCLP}</td>
                  <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

export default MainApp;
