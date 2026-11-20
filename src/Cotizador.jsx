import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Cotizador({ user, token, onLogout }) {
  const [file, setFile] = useState(null);
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchTarifas = async () => {
    try {
      const response = await fetch('/api/tarifa-cotizador');
      if (response.ok) {
        const data = await response.json();
        setTarifas(data);
      }
    } catch (err) {
      console.error('Error al obtener datos:', err);
    }
  };

  useEffect(() => {
    fetchTarifas();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Selecciona un archivo Excel primero.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/tarifa-cotizador/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const resData = await response.json();
      if (response.ok) {
        setMessage(`¡Éxito! Se guardaron ${resData.count} registros en la nueva tabla.`);
        setFile(null);
        fetchTarifas();
      } else {
        setMessage(`Error: ${resData.message}`);
      }
    } catch (err) {
      setMessage('Ocurrió un error al subir el archivo.');
    } finally {
      setLoading(false);
    }
  };

  const primerRegistro = tarifas.length > 0 ? tarifas[0] : null;
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

      {/* CONTENIDO PRINCIPAL */}
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
        <section className="form-container" style={{ width: "100%", maxWidth: "850px" }}>
          {/* ENCABEZADO CON FONDO NARANJA */}
          <div className="form-card-header">
            <h2>Módulo Cotizador</h2>
            <p className="step-description">Al cargar un Excel, sus tarifas reemplazan la tabla actual de MongoDB.</p>
          </div>

          <div style={{ marginBottom: '2rem', border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '8px', background: '#f8f9fa' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#16213e' }}>Subir Excel</h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={(e) => setFile(e.target.files[0])} 
                disabled={loading} 
                style={{ background: '#fff' }}
              />
              <button className="button-primary-blue" type="submit" disabled={loading}>
                {loading ? 'Subiendo...' : 'Cargar Archivo'}
              </button>
            </form>
            {message && <p style={{ marginTop: '1rem', fontWeight: 'bold', color: message.includes('Éxito') ? '#2b8a3e' : '#dc2626' }}>{message}</p>}
          </div>

          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#16213e' }}>Contenido de la Tabla MongoDB</h3>
          
          <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
            <table className="custom-table" border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Tarifa 20'</th>
                  <th>Tarifa 40'</th>
                  <th>Tránsito Mínimo</th>
                  <th>Tránsito Máximo</th>
                </tr>
              </thead>
              <tbody>
                {tarifas.length > 0 ? (
                  tarifas.map((item) => (
                    <tr key={item._id}>
                      <td>{item.origen}</td>
                      <td>{item.destino}</td>
                      <td>Min: ${item.tarifas?.['20']?.min} / Max: ${item.tarifas?.['20']?.max}</td>
                      <td>Min: ${item.tarifas?.['40']?.min} / Max: ${item.tarifas?.['40']?.max}</td>
                      <td>{item.transito?.minDias} días</td>
                      <td>{item.transito?.maxDias} días</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No hay registros en esta tabla.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Fechas de creación abajo */}
          {primerRegistro && (
            <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#555', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
              <div><strong>Fecha de creación:</strong> {primerRegistro.createdAt ? new Date(primerRegistro.createdAt).toLocaleString() : '—'}</div>
            </div>
          )}

          {/* Botón de "Volver" al final */}
          <div>
            <Link 
              to="/" 
              className="button-back" 
              style={{ textDecoration: "none", textAlign: "center", width: "100%", boxSizing: "border-box", display: "block" }}
            >
              Volver al dashboard
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}