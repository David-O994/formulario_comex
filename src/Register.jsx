import { useState } from "react";

function Register({ onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(username, password); // por defecto role = "usuario"
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Registro</h2>
      <div>
        <label>Usuario</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div>
        <label>Contraseña</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button type="submit">Crear cuenta</button>
    </form>
  );
}

export default Register;
