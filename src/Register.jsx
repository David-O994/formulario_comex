import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Validaciones
  const usernameTieneNumeros = /\d/.test(username);
  const usernameValido = username.trim() !== "" && !usernameTieneNumeros;

  const tieneLongitud = password.length >= 8;
  const tieneNumero = /\d/.test(password);
  const tieneEspecial = /[^A-Za-z0-9\s]/.test(password);

  const passwordValida =
    tieneLongitud && tieneNumero && tieneEspecial;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("El nombre de usuario es obligatorio.");
      return;
    }

    if (usernameTieneNumeros) {
      setError("El nombre de usuario no puede contener números.");
      return;
    }

    if (!passwordValida) {
      setError("La contraseña no cumple todos los requisitos.");
      return;
    }

    try {
      setEnviando(true);
      const token = localStorage.getItem("token"); // Obtenemos el token directamente del almacenamiento local

      const respuesta = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Requerido por el middleware de admin
        },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.error || "No se pudo crear el usuario");
      }

      alert("Usuario creado correctamente.");
      setUsername("");
      setPassword("");
      window.location.href = "/"; // Regresa al dashboard principal tras el éxito
    } catch (err) {
      console.error("Error al registrar:", err);
      setError(err.message || "Error al intentar crear el usuario.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main 
      className="dashboard-page" 
      style={{ 
        padding: "2rem", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center" 
      }}
    >
      <div style={{ width: "100%", maxWidth: "600px", marginBottom: "1rem" }}>
        <Link 
          to="/" 
          className="button-back" 
          style={{ textDecoration: "none", display: "inline-block" }}
        >
          ← Volver al dashboard
        </Link>
      </div>
      
      <section className="form-container" style={{ width: "100%", maxWidth: "600px" }}>
        <form onSubmit={handleSubmit}>
          <h2>Crear Nuevo Usuario</h2>
          <p className="step-description">Registra un nuevo usuario con rol estándar en el sistema.</p>

          <div className="field" style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="username">Usuario <span>*</span></label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              autoComplete="username"
              required
            />
            {usernameTieneNumeros && (
              <p style={{ color: "#dc2626", fontSize: "0.85rem", marginTop: "0.4rem", marginBotom: 0 }}>
                El nombre de usuario no puede contener números.
              </p>
            )}
          </div>

          <div className="field" style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="password">Contraseña <span>*</span></label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              autoComplete="new-password"
              aria-describedby="password-requirements"
              required
            />

            <ul id="password-requirements" style={{ marginTop: "0.75rem", fontSize: "0.85rem", listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
              <li style={{ color: tieneLongitud ? "#2b8a3e" : "#6c757d" }}>{tieneLongitud ? "✓" : "○"} Mínimo 8 caracteres</li>
              <li style={{ color: tieneNumero ? "#2b8a3e" : "#6c757d" }}>{tieneNumero ? "✓" : "○"} Al menos un número</li>
              <li style={{ color: tieneEspecial ? "#2b8a3e" : "#6c757d" }}>{tieneEspecial ? "✓" : "○"} Al menos un carácter especial</li>
            </ul>
          </div>

          {error && <p role="alert" style={{ color: "#dc2626", fontSize: "0.9rem", marginBottom: "1rem" }}>{error}</p>}

          <button 
            type="submit" 
            className="button primary"
            disabled={!passwordValida || !usernameValido || enviando}
            style={{ width: "100%" }}
          >
            {enviando ? "Creando..." : "Crear cuenta"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Register;