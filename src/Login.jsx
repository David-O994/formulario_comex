import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    }
  };

  return (
    <main className="dashboard-page" style={{ padding: "2rem" }}>
      <Link 
        to="/" 
        className="button-back" 
        style={{ textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}
      >
        ← Volver
      </Link>
      <form onSubmit={handleSubmit} style={{ maxWidth: "400px", margin: "0 auto" }}>
        <h2>Iniciar sesión</h2>
        <div style={{ marginBottom: "1rem" }}>
          <label>Usuario</label>
          <input 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>Contraseña</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <button type="submit" className="button primary">Ingresar</button>
      </form>
    </main>
  );
}

export default Login;