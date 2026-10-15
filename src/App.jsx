import { useState } from "react";
import "./App.css";

const origenes = [
  { nombre: "Valparaíso / Valparaíso - Chile", dias: 0 },
  { nombre: "San Antonio / San Antonio - Chile", dias: 0 },
  { nombre: "Lima / Callao - Perú", dias: 7 },
  { nombre: "Buenos Aires / Puerto Madero - Argentina", dias: 10 },
  { nombre: "Sao Paulo / Santos - Brazil", dias: 12 },
  { nombre: "Bogota / Fontibón - Colombia", dias: 14 },
  { nombre: "Ciudad de Mexico / Cuauhtémoc - Mexico", dias: 22 },
  { nombre: "Miami / PortMiami - USA", dias: 20 },
  { nombre: "Los Angeles / San Pedro - USA", dias: 18 },
  { nombre: "Nueva York / Brooklyn - USA", dias: 25 },
  { nombre: "Madrid / Coslada - España", dias: 32 },
  { nombre: "Frankfurt / Osthafen - Alemania", dias: 32 },
  { nombre: "Shanghai / Pudong - China", dias: 26 },
  { nombre: "Ningbo / Beilun - China", dias: 27 },
  { nombre: "Qingdao / Huangdao - China", dias: 29 },
  { nombre: "Shenzhen / Yantian - China", dias: 28 },
  { nombre: "Tianjin / Nuevo Distrito de Binhai - China", dias: 31 },
  { nombre: "Busan / Nam-gu - Corea del Sur", dias: 31 },
  { nombre: "Tokio / Yokohama - Japón", dias: 33 },
  { nombre: "Ho Chi Minh / District 7 - Vietnam", dias: 36 },
  { nombre: "Tuas / Tuas Port - Singapur", dias: 34 },
];

const destinos = [
  "Valparaíso / Valparaíso - Chile",
  "San Antonio / San Antonio - Chile",
];

const formularioInicial = {
  origin: "",
  destination: "",
  weight: "",
  description: "",
};

function App({ token }) {
  const [paso, setPaso] = useState(1);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  // Obtiene los días asociados al origen seleccionado.
  const origenSeleccionado = origenes.find(
    (origen) => origen.nombre === formulario.origin
  );

  const diasSeleccionados = origenSeleccionado?.dias;

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    if (errores[name]) {
      setErrores((anterior) => ({
        ...anterior,
        [name]: "",
      }));
    }
  };

  const validarPaso = () => {
    const nuevosErrores = {};

    if (paso === 1) {
      if (!formulario.origin) {
        nuevosErrores.origin = "Selecciona un origen.";
      }

      if (!formulario.destination) {
        nuevosErrores.destination = "Selecciona un destino.";
      }

      if (
        formulario.origin &&
        formulario.origin === formulario.destination
      ) {
        nuevosErrores.destination =
          "El origen y el destino deben ser diferentes.";
      }
    }

    if (paso === 2) {
      if (
        !formulario.weight ||
        !Number.isFinite(Number(formulario.weight)) ||
        Number(formulario.weight) <= 0
      ) {
        nuevosErrores.weight = "El peso debe ser mayor que 0.";
      }

      if (!formulario.description.trim()) {
        nuevosErrores.description = "Ingresa una descripción.";
      }
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarContinuar = () => {
    if (!validarPaso()) {
      return;
    }

    setErrores({});
    setPaso(2);
  };

  const manejarVolver = () => {
    setErrores({});
    setPaso(1);
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();

    if (!validarPaso()) {
      return;
    }

    if (!token) {
      alert("Tu sesión no está activa. Inicia sesión nuevamente.");
      return;
    }

    if (diasSeleccionados === undefined) {
      alert("No se pudieron determinar los días de tránsito.");
      return;
    }

    setEnviando(true);

    // Se envía "days" junto con los datos del formulario.
    const datosCotizacion = {
      ...formulario,
      days: diasSeleccionados,
    };

    console.log("Datos de cotización:", datosCotizacion);

    try {
      const respuesta = await fetch(
        "http://localhost:3000/api/quotations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(datosCotizacion),
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "No se pudo enviar la cotización."
        );
      }

      console.log("Respuesta cotización:", data);

      alert(data.message || "¡Cotización enviada correctamente!");

      setFormulario(formularioInicial);
      setErrores({});
      setPaso(1);
    } catch (error) {
      console.error("Error al enviar la cotización:", error);

      alert(
        error.message ||
          "No se pudo conectar con el servidor. Inténtalo nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="page">
      <section className="form-container">
        <header className="form-header">
          <h1>Cotiza tu Envío</h1>

          <div className="steps">
            {[1, 2].map((numeroPaso) => (
              <div
                key={numeroPaso}
                className={`step ${
                  numeroPaso === paso ? "active" : ""
                } ${
                  numeroPaso < paso ? "completed" : ""
                }`}
              >
                <span>{numeroPaso}</span>
                <small>
                  {numeroPaso === 1 ? "Ruta" : "Carga"}
                </small>
              </div>
            ))}
          </div>
        </header>

        <form onSubmit={manejarEnvio}>
          {paso === 1 && (
            <div className="form-step">
              <h2>Información del envío</h2>

              <p className="step-description">
                Indica desde dónde y hacia dónde quieres realizar tu envío.
              </p>

              <div className="field">
                <label htmlFor="origin">
                  Selecciona origen <span>*</span>
                </label>

                <select
                  id="origin"
                  name="origin"
                  value={formulario.origin}
                  onChange={manejarCambio}
                  className={errores.origin ? "input-error" : ""}
                  required
                >
                  <option value="">Selecciona un origen</option>

                  {origenes.map((origen) => (
                    <option
                      key={origen.nombre}
                      value={origen.nombre}
                    >
                      {origen.nombre}
                    </option>
                  ))}
                </select>

                {errores.origin && (
                  <span className="error">{errores.origin}</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="destination">
                  Selecciona destino <span>*</span>
                </label>

                <select
                  id="destination"
                  name="destination"
                  value={formulario.destination}
                  onChange={manejarCambio}
                  className={
                    errores.destination ? "input-error" : ""
                  }
                  required
                >
                  <option value="">Selecciona un destino</option>

                  {destinos.map((destino) => (
                    <option key={destino} value={destino}>
                      {destino}
                    </option>
                  ))}
                </select>

                {/* Los días aparecen debajo del selector de destino. */}
                {origenSeleccionado && (
                  <p className="transit-days">
                    Días en tránsito: {diasSeleccionados}
                  </p>
                )}

                {errores.destination && (
                  <span className="error">
                    {errores.destination}
                  </span>
                )}
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className="form-step">
              <h2>Información de la carga</h2>

              <p className="step-description">
                Cuéntanos qué deseas enviar.
              </p>

              <div className="field">
                <label htmlFor="weight">
                  Peso <span>*</span>
                </label>

                <div className="input-with-unit">
                  <input
                    id="weight"
                    type="number"
                    name="weight"
                    min="0.01"
                    step="0.01"
                    value={formulario.weight}
                    onChange={manejarCambio}
                    className={
                      errores.weight ? "input-error" : ""
                    }
                    placeholder="Ej: 25"
                    required
                  />

                  <span>kg</span>
                </div>

                {errores.weight && (
                  <span className="error">{errores.weight}</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="description">
                  Descripción <span>*</span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows="5"
                  value={formulario.description}
                  onChange={manejarCambio}
                  className={
                    errores.description ? "input-error" : ""
                  }
                  placeholder="Describe brevemente la carga."
                  required
                />

                {errores.description && (
                  <span className="error">
                    {errores.description}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="form-actions">
            {paso > 1 && (
              <button
                type="button"
                className="button secondary"
                onClick={manejarVolver}
                disabled={enviando}
              >
                Volver
              </button>
            )}

            {paso === 1 ? (
              <button
                type="button"
                className="button primary"
                onClick={manejarContinuar}
              >
                Continuar
              </button>
            ) : (
              <button
                type="submit"
                className="button primary"
                disabled={enviando}
              >
                {enviando ? "Enviando..." : "Finalizar"}
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}

export default App;