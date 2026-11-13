import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import MainApp from "./MainApp";
import Login from "./Login";
import Register from "./Register";
import CrearCotizacion from "./CrearCotizacion";
import Cotizador from "./Cotizador";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <Router>
      <Routes>
        {/* Ruta de Inicio / Dashboard */}
        <Route 
          path="/" 
          element={<MainApp user={user} token={token} onLogout={handleLogout} />} 
        />

        {/* Ruta de Login */}
        <Route 
          path="/login" 
          element={
            !token ? (
              <Login onLoginSuccess={handleLoginSuccess} />
            ) : (
              <Navigate to="/" />
            )
          } 
        />

        {/* Ruta de Excel */}
        <Route 
          path="/cotizador" 
          element={<Cotizador />} 
        />

        {/* Ruta de Crear Usuario (Solo Admin) */}
        <Route 
          path="/admin/crear-usuario" 
          element={
            user?.role === "admin" ? (
              <Register token={token} />
            ) : (
              <Navigate to="/" />
            )
          } 
        />

        {/* Ruta de Historial de Cotizaciones (Solo Admin) */}
        <Route 
          path="/admin/historial" 
          element={
            user?.role === "admin" ? (
              <MainApp user={user} token={token} onLogout={handleLogout} forcedView="historial" />
            ) : (
              <Navigate to="/" />
            )
          } 
        />

        {/* ---> NUEVA RUTA: Historial de Cotizaciones para el Usuario normal <--- */}
        <Route 
          path="/mis-cotizaciones" 
          element={
            user?.role === "usuario" ? (
              <MainApp user={user} token={token} onLogout={handleLogout} forcedView="mis-cotizaciones" />
            ) : (
              <Navigate to="/" />
            )
          } 
        />

        {/* Ruta de Crear Cotización (Solo Usuario) */}
        <Route 
          path="/cotizaciones/crear" 
          element={
            user?.role === "usuario" ? (
              <CrearCotizacion token={token} />
            ) : (
              <Navigate to="/" />
            )
          } 
        />

        {/* Redirección por defecto si escriben cualquier otra URL */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;