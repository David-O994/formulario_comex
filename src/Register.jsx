import { useState } from "react";
import { Link } from "react-router-dom";

function Register({ user, token, onLogout }) {
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
      const authToken = token || localStorage.getItem("token");

      const respuesta = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`, // Requerido por el middleware de admin
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

  const estaAutenticado = Boolean(token && user);

  return (
    <div className="dashboard-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* HEADER UNIFICADO */}
      <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <nav style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <a 
            href="https://www.cintac.cl/" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
          >
            <img 
              src="/cintac_logo.png" 
              alt="Logo CINTAC" 
              style={{ height: "28px", width: "auto", objectFit: "contain" }} 
            />
          </a>
          <span>|</span>
          <Link to="/" style={{ textDecoration: "none", color: "#fa8a0e", fontWeight: "600" }}>
            Inicio
          </Link>

          {/* Opciones exclusivas para ADMINISTRADOR */}
          {estaAutenticado && user?.role === "admin" && (
            <>
              <span>|</span>
              <Link to="/admin/crear-usuario" style={{ textDecoration: "none" }}>
                Crear usuario
              </Link>
              <span>|</span>
              <Link to="/cotizaciones/crear" style={{ textDecoration: "none" }}>
                Cotizar
              </Link>
              <span>|</span>
              <Link to="/admin/lista-usuarios" style={{ textDecoration: "none" }}>
                Lista usuarios
              </Link>
              <span>|</span>
              <Link to="/mis-cotizaciones" style={{ textDecoration: "none" }}>
                Mis cotizaciones
              </Link>
              <span>|</span>
              <Link to="/admin/historial" style={{ textDecoration: "none" }}>
                Historial cotizaciones
              </Link>
              <span>|</span>
              <Link to="/cotizador" style={{ textDecoration: "none" }}>
                Excel
              </Link>
            </>
          )}
        </nav>

        <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {estaAutenticado && (
            <>
              <span className="user-greeting">
                {user.username}
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

      {/* CONTENIDO PRINCIPAL DEL FORMULARIO */}
      <main 
        className="dashboard-main-wrapper" 
        style={{ 
          flex: 1,
          padding: "2rem", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center" 
        }}
      >
        <section className="form-container" style={{ width: "100%", maxWidth: "600px" }}>
          <form onSubmit={handleSubmit}>
            {/* ENCABEZADO CON FONDO NARANJA */}
            <div className="form-card-header">
              <h2>Nuevo Usuario</h2>
              <p className="step-description">Registrar un nuevo usuario con rol estándar en el sistema.</p>
            </div>

            <div className="field" style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="username" style={{ textAlign: "left" }}>Usuario <span>(*)</span></label>
              <input
                id="username"
                type="text"
                maxLength={50}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                autoComplete="username"
                required
              />
              {usernameTieneNumeros && (
                <p style={{ color: "#dc2626", fontSize: "0.85rem", fontWeight: "bold", marginTop: "0.4rem", marginBottom: 0, textAlign: "center" }}>
                  El nombre de usuario no puede contener números.
                </p>
              )}
            </div>

            <div className="field" style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="password" style={{ textAlign: "left" }}>Contraseña <span>(*)</span></label>
              <input
                id="password"
                type="password"
                maxLength={50}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoComplete="new-password"
                aria-describedby="password-requirements"
                required
              />

              <ul id="password-requirements" className="password-requirements">
                <li className={`password-requirement-item ${tieneLongitud ? "valid" : ""}`}>
                  {tieneLongitud ? "✓" : "○"} Mínimo 8 caracteres
                </li>
                <li className={`password-requirement-item ${tieneNumero ? "valid" : ""}`}>
                  {tieneNumero ? "✓" : "○"} Al menos un número
                </li>
                <li className={`password-requirement-item ${tieneEspecial ? "valid" : ""}`}>
                  {tieneEspecial ? "✓" : "○"} Al menos un carácter especial
                </li>
              </ul>
            </div>

            {error && <p role="alert" style={{ color: "#dc2626", fontSize: "0.9rem", marginBottom: "1rem", textAlign: "center" }}>{error}</p>}

            {/* CONTENEDOR DE ACCIONES */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "1.5rem" }}>
              <button 
                type="submit" 
                disabled={!passwordValida || !usernameValido || enviando}
                className="button-primary-blue"
              >
                {enviando ? "Creando..." : "Crear cuenta"}
              </button>

              <Link 
                to="/" 
                className="button-back" 
                style={{ textDecoration: "none", textAlign: "center", width: "100%", boxSizing: "border-box", display: "block" }}
              >
                Volver al dashboard
              </Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Register;