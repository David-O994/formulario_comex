import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./App.css";

const formularioInicial = {
  origin: "",
  destination: "",
  weight: "",
  description: "",
};

function CrearCotizacion({ token }) {
  const [paso, setPaso] = useState(1);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const [tarifasDB, setTarifasDB] = useState([]);
  const [cargandoTarifas, setCargandoTarifas] = useState(true);

  useEffect(() => {
    const fetchTarifasDB = async () => {
      try {
        const respuesta = await fetch("http://localhost:3000/api/tarifa-cotizador");
        if (respuesta.ok) {
          const data = await respuesta.json();
          setTarifasDB(data);
        }
      } catch (error) {
        console.error("Error al obtener las tarifas desde la BD:", error);
      } finally {
        setCargandoTarifas(false);
      }
    };

    fetchTarifasDB();
  }, []);

  const origenesDisponibles = Array.from(
    new Set(tarifasDB.map((t) => t.origen))
  ).filter(Boolean);

  const destinosDisponibles = Array.from(
    new Set(
      tarifasDB
        .filter((t) => t.origen === formulario.origin)
        .map((t) => t.destino)
    )
  ).filter(Boolean);

  const rutaSeleccionada = tarifasDB.find(
    (t) => t.origen === formulario.origin && t.destino === formulario.destination
  );

  // Función para calcular contenedores optimizada
  const calcularContenedores = (pesoKg) => {
    const kg = parseFloat(pesoKg);
    if (isNaN(kg) || kg <= 0) return [{ tipo: "20'", cantidad: 1 }];

    const cap20 = 23000;
    const cap40 = 25000;

    // 1. Si cabe exactamente en un contenedor de 20'
    if (kg <= cap20) {
      return [{ tipo: "20'", cantidad: 1 }];
    }
    
    // 2. Si equivale exactamente a dos contenedores de 20' (ej. 46000 kg)
    if (kg > cap20 && kg <= cap20 * 2) {
      if (kg > cap40) {
        return [{ tipo: "20'", cantidad: 2 }];
      }
    }

    // 3. Si cabe exactamente en un contenedor de 40'
    if (kg <= cap40) {
      return [{ tipo: "40'", cantidad: 1 }];
    }

    // 4. Lógica general para pesos mayores: empaquetado optimizado
    let pesoRestante = kg;
    let cont40 = 0;
    let cont20 = 0;

    cont40 = Math.floor(pesoRestante / cap40);
    pesoRestante %= cap40;

    if (pesoRestante > 0) {
      if (pesoRestante <= cap20) {
        cont20 += 1;
      } else {
        cont40 += 1;
      }
    }

    if (cont40 === 1 && cont20 === 0 && kg <= cap20 * 2) {
      return [{ tipo: "20'", cantidad: 2 }];
    }

    const resultado = [];
    if (cont40 > 0) resultado.push({ tipo: "40'", cantidad: cont40 });
    if (cont20 > 0) resultado.push({ tipo: "20'", cantidad: cont20 });
    return resultado;
  };

  const contenedoresSugeridos = calcularContenedores(formulario.weight);

  // Función para calcular el precio total basado en los contenedores sugeridos y la ruta
  const calcularPrecioTotal = () => {
    if (!rutaSeleccionada || !rutaSeleccionada.tarifas) return { min: 0, max: 0 };

    let totalMin = 0;
    let totalMax = 0;

    const tarifa20Min = Number(rutaSeleccionada.tarifas['20']?.min || 0);
    const tarifa20Max = Number(rutaSeleccionada.tarifas['20']?.max || 0);
    const tarifa40Min = Number(rutaSeleccionada.tarifas['40']?.min || 0);
    const tarifa40Max = Number(rutaSeleccionada.tarifas['40']?.max || 0);

    contenedoresSugeridos.forEach((c) => {
      if (c.tipo === "20'") {
        totalMin += tarifa20Min * c.cantidad;
        totalMax += tarifa20Max * c.cantidad;
      } else if (c.tipo === "40'") {
        totalMin += tarifa40Min * c.cantidad;
        totalMax += tarifa40Max * c.cantidad;
      }
    });

    return { min: totalMin, max: totalMax };
  };

  const precioEstimado = calcularPrecioTotal();

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;

    setFormulario((anterior) => {
      const nuevoFormulario = { ...anterior, [name]: value };
      if (name === "origin") {
        nuevoFormulario.destination = "";
      }
      return nuevoFormulario;
    });

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
      if (!formulario.origin) nuevosErrores.origin = "Selecciona un origen.";
      if (!formulario.destination) nuevosErrores.destination = "Selecciona un destino.";
      if (formulario.origin && formulario.origin === formulario.destination) {
        nuevosErrores.destination = "El origen y el destino deben ser diferentes.";
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
    if (!validarPaso()) return;
    setErrores({});
    setPaso(2);
  };

  const manejarVolver = () => {
    setErrores({});
    setPaso(1);
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    if (!validarPaso()) return;

    if (!token) {
      alert("Tu sesión no está activa. Inicia sesión nuevamente.");
      return;
    }

    if (!rutaSeleccionada) {
      alert("No se encontró una tarifa válida para la ruta seleccionada.");
      return;
    }

    setEnviando(true);

    const datosCotizacion = {
      ...formulario,
      days: rutaSeleccionada.transito?.minDias || 0,
    };

    try {
      const respuesta = await fetch("http://localhost:3000/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datosCotizacion),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.message || data.error || "No se pudo enviar la cotización.");
      }

      alert(data.message || "¡Cotización enviada correctamente!");
      setFormulario(formularioInicial);
      setErrores({});
      setPaso(1);
    } catch (error) {
      console.error("Error al enviar la cotización:", error);
      alert(error.message || "No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="page" style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "600px", marginBottom: "1rem" }}>
        <Link to="/" className="button-back" style={{ textDecoration: "none", display: "inline-block" }}>
          ← Volver al dashboard
        </Link>
      </div>

      <section className="form-container" style={{ width: "100%", maxWidth: "600px" }}>
        <header className="form-header">
          <h1>Cotiza tu Envío</h1>

          <div className="steps">
            {[1, 2].map((numeroPaso) => (
              <div
                key={numeroPaso}
                className={`step ${numeroPaso === paso ? "active" : ""} ${numeroPaso < paso ? "completed" : ""}`}
              >
                <span>{numeroPaso}</span>
                <small>{numeroPaso === 1 ? "Ruta" : "Carga"}</small>
              </div>
            ))}
          </div>
        </header>

        <form onSubmit={manejarEnvio}>
          {paso === 1 && (
            <div className="form-step">
              <h2>Información del envío</h2>
              <p className="step-description">Indica desde dónde y hacia dónde quieres realizar tu envío.</p>

              {cargandoTarifas ? (
                <p>Cargando rutas disponibles desde la base de datos...</p>
              ) : (
                <>
                  <div className="field">
                    <label htmlFor="origin">Selecciona origen <span>*</span></label>
                    <select
                      id="origin"
                      name="origin"
                      value={formulario.origin}
                      onChange={manejarCambio}
                      className={errores.origin ? "input-error" : ""}
                      required
                    >
                      <option value="">Selecciona un origen</option>
                      {origenesDisponibles.map((origen) => (
                        <option key={origen} value={origen}>{origen}</option>
                      ))}
                    </select>
                    {errores.origin && <span className="error">{errores.origin}</span>}
                  </div>

                  <div className="field">
                    <label htmlFor="destination">Selecciona destino <span>*</span></label>
                    <select
                      id="destination"
                      name="destination"
                      value={formulario.destination}
                      onChange={manejarCambio}
                      className={errores.destination ? "input-error" : ""}
                      disabled={!formulario.origin}
                      required
                    >
                      <option value="">Selecciona un destino</option>
                      {destinosDisponibles.map((destino) => (
                        <option key={destino} value={destino}>{destino}</option>
                      ))}
                    </select>

                    {rutaSeleccionada && (
                      <p className="transit-days" style={{ marginTop: "0.5rem", fontWeight: "bold", color: "#333" }}>
                        Días en tránsito: {rutaSeleccionada.transito?.minDias} (mínimo) - {rutaSeleccionada.transito?.maxDias} (máximo)
                      </p>
                    )}

                    {errores.destination && <span className="error">{errores.destination}</span>}
                  </div>
                </>
              )}
            </div>
          )}

          {paso === 2 && (
            <div className="form-step">
              <h2>Información de la carga</h2>
              <p className="step-description">Cuéntanos qué deseas enviar.</p>

              <div className="field">
                <label htmlFor="weight">Peso <span>*</span></label>
                <div className="input-with-unit">
                  <input
                    id="weight"
                    type="number"
                    name="weight"
                    min="0.01"
                    step="0.01"
                    value={formulario.weight}
                    onChange={manejarCambio}
                    className={errores.weight ? "input-error" : ""}
                    placeholder="Ej: 25000"
                    required
                  />
                  <span>kg</span>
                </div>

                {/* Contenedores sugerido */}
                <div style={{ marginTop: "0.75rem", padding: "0.5rem", backgroundColor: "#f8f9fa", borderRadius: "4px", border: "1px solid #e9ecef" }}>
                  <small style={{ display: "block", color: "#6c757d", marginBottom: "0.25rem", fontWeight: "bold" }}>
                    Contenedores sugerido:
                  </small>
                  {contenedoresSugeridos.map((c, idx) => (
                    <div key={idx} style={{ fontSize: "0.95rem", color: "#212529", fontWeight: "500" }}>
                      Contenedor {c.tipo} x {c.cantidad}
                    </div>
                  ))}
                </div>

                {errores.weight && <span className="error">{errores.weight}</span>}
              </div>

              <div className="field">
                <label htmlFor="description">Descripción <span>*</span></label>
                <textarea
                  id="description"
                  name="description"
                  rows="5"
                  value={formulario.description}
                  onChange={manejarCambio}
                  className={errores.description ? "input-error" : ""}
                  placeholder="Describe brevemente la carga."
                  required
                />
                {errores.description && <span className="error">{errores.description}</span>}
              </div>

              {/* Visualizador del Precio Estimado */}
              <div style={{ marginTop: "1rem", marginBottom: "1.5rem", padding: "0.75rem", backgroundColor: "#e7f5ff", borderRadius: "6px", border: "1px solid #74c0fc", textAlign: "center" }}>
                <span style={{ display: "block", fontSize: "0.85rem", color: "#1c7ed6", fontWeight: "bold", textTransform: "uppercase" }}>
                  Precio Estimado del Envío:
                </span>
                <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#212529" }}>
                  ${precioEstimado.min.toLocaleString()} USD — ${precioEstimado.max.toLocaleString()} USD
                </span>
              </div>
            </div>
          )}

          <div className="form-actions">
            {paso > 1 && (
              <button type="button" className="button secondary" onClick={manejarVolver} disabled={enviando}>
                Volver
              </button>
            )}

            {paso === 1 ? (
              <button type="button" className="button primary" onClick={manejarContinuar} disabled={cargandoTarifas}>
                Continuar
              </button>
            ) : (
              <button type="submit" className="button primary" disabled={enviando}>
                {enviando ? "Enviando..." : "Finalizar"}
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}

export default CrearCotizacion;