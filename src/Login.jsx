import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "No se pudo iniciar sesión.");
        return;
      }

      if (!data.token || !data.user) {
        alert("El servidor no devolvió los datos esperados.");
        return;
      }

      // Guardamos token y usuario globalmente
      onLoginSuccess(data.token, data.user);
      
      // Redirigimos al inicio mediante URL
      navigate("/");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="dashboard-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* HEADER UNIFICADO (Solo muestra CINTAC e Inicio) */}
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
        </nav>
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
              <h2>Iniciar Sesión</h2>
              <p className="step-description">Accede a tu cuenta para continuar en el sistema.</p>
            </div>

            <div className="field" style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="username" style={{ textAlign: "left" }}>Usuario <span>(*)</span></label>
              <input 
                id="username"
                type="text"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                autoComplete="username"
                required
              />
            </div>

            <div className="field" style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="password" style={{ textAlign: "left" }}>Contraseña <span>(*)</span></label>
              <input 
                id="password"
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                autoComplete="current-password"
                required
              />
            </div>

            {/* CONTENEDOR DE ACCIONES */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "1.5rem" }}>
              <button 
                type="submit" 
                disabled={cargando}
                className="button-primary-blue"
              >
                {cargando ? "Ingresando..." : "Ingresar"}
              </button>

              <Link 
                to="/" 
                className="button-back" 
                style={{ textDecoration: "none", textAlign: "center", width: "100%", boxSizing: "border-box", display: "block" }}
              >
                Volver
              </Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Login;