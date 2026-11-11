// src/Cotizador.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Cotizador() {
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

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Módulo Cotizador (Tabla Independiente)</h1>

      <div style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1.5rem', borderRadius: '8px' }}>
        <h3>Subir Excel a Nueva Tabla de MongoDB</h3>
        <form onSubmit={handleUpload}>
          <input type="file" accept=".xlsx, .xls" onChange={(e) => setFile(e.target.files[0])} disabled={loading} />
          <button type="submit" disabled={loading} style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}>
            {loading ? 'Subiendo...' : 'Cargar Archivo'}
          </button>
        </form>
        {message && <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>{message}</p>}
      </div>

      <h2>Contenido de la Tabla MongoDB</h2>
      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4' }}>
            <th>_id</th>
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
                <td><code>{item._id}</code></td>
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
              <td colSpan="7" style={{ textAlign: 'center' }}>No hay registros en esta tabla.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Fechas de creación y última modificación abajo */}
      {primerRegistro && (
        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#555', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
          <div><strong>Fecha de creación:</strong> {primerRegistro.createdAt ? new Date(primerRegistro.createdAt).toLocaleString() : '—'}</div>
          <div><strong>Última modificación:</strong> {primerRegistro.updatedAt ? new Date(primerRegistro.updatedAt).toLocaleString() : '—'}</div>
        </div>
      )}

      {/* Botón de "Volver" al final, similar a otras vistas */}
      <div style={{ marginTop: '2rem' }}>
        <Link 
          to="/" 
          style={{ 
            textDecoration: 'none', 
            padding: '0.5rem 1rem', 
            backgroundColor: '#6c757d', 
            color: 'white', 
            borderRadius: '4px', 
            display: 'inline-block' 
          }}
        >
          ← Volver al dashboard
        </Link>
      </div>
    </div>
  );
}