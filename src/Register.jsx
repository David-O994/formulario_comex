import { useState } from "react";

function Register({ onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const tieneLongitud = password.length >= 8;
  const tieneNumero = /\d/.test(password);
  const tieneEspecial = /[^A-Za-z0-9\s]/.test(password);

  const passwordValida =
    tieneLongitud && tieneNumero && tieneEspecial;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("El nombre de usuario es obligatorio.");
      return;
    }

    if (!passwordValida) {
      setError("La contraseña no cumple todos los requisitos.");
      return;
    }

    onRegister(username.trim(), password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Registro</h2>

      <div>
        <label htmlFor="username">Usuario</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </div>

      <div>
        <label htmlFor="password">Contraseña</label>
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

        <ul id="password-requirements">
          <li>{tieneLongitud ? "✓" : "○"} Mínimo 8 caracteres</li>
          <li>{tieneNumero ? "✓" : "○"} Al menos un número</li>
          <li>{tieneEspecial ? "✓" : "○"} Al menos un carácter especial</li>
        </ul>
      </div>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={!passwordValida || !username.trim()}>
        Crear cuenta
      </button>
    </form>
  );
}

export default Register;