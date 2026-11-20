import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./App.css";

const formularioInicial = {
  origin: "",
  destination: "",
  weight: "",
  unidadPeso: "kg", // "kg" o "t"
  valorCarga: "",   // Opcional
  monedaValorCarga: "USD",
  tasaArancel: "6", // "6" o "0"
  description: "",
};

function CrearCotizacion({ user, token, onLogout }) {
  const [paso, setPaso] = useState(1);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const [tarifasDB, setTarifasDB] = useState([]);
  const [cargandoTarifas, setCargandoTarifas] = useState(true);
  const [tasaDolar, setTasaDolar] = useState(null);
  const [errorTasaDolar, setErrorTasaDolar] = useState("");
  const cargandoTasaDolar = formulario.monedaValorCarga === "CLP" && !tasaDolar && !errorTasaDolar;

  useEffect(() => {
    const fetchTarifasDB = async () => {
      try {
        const respuesta = await fetch("/api/tarifa-cotizador");
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

  useEffect(() => {
    if (formulario.monedaValorCarga !== "CLP") {
      return;
    }

    let cancelado = false;
    const obtenerTasaDolar = async () => {
      try {
        const respuesta = await fetch("/api/quotations/exchange-rate", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await respuesta.json();
        if (!respuesta.ok) {
          throw new Error(data.error || "No se pudo obtener la tasa del dólar.");
        }

        if (!cancelado) {
          setTasaDolar(data.tasaDolar);
        }
      } catch (error) {
        if (!cancelado) {
          setTasaDolar(null);
          setErrorTasaDolar(error.message || "No se pudo obtener la tasa del dólar.");
        }
      }
    };

    obtenerTasaDolar();
    return () => {
      cancelado = true;
    };
  }, [formulario.monedaValorCarga, token]);

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

  const obtenerPesoEnKg = () => {
    const valor = parseFloat(formulario.weight);
    if (isNaN(valor) || valor <= 0) return 0;
    return formulario.unidadPeso === "t" ? valor * 1000 : valor;
  };

  const calcularContenedores = () => {
    const kg = obtenerPesoEnKg();
    if (kg <= 0) return [{ tipo: "20'", cantidad: 1 }];

    const cap20 = 23000;
    const cap40 = 25000;

    if (kg <= cap20) {
      return [{ tipo: "20'", cantidad: 1 }];
    }
    
    if (kg > cap20 && kg <= cap20 * 2) {
      if (kg > cap40) {
        return [{ tipo: "20'", cantidad: 2 }];
      }
    }

    if (kg <= cap40) {
      return [{ tipo: "40'", cantidad: 1 }];
    }

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

  const contenedoresSugeridos = calcularContenedores();
  const totalContenedores = contenedoresSugeridos.reduce((acc, c) => acc + c.cantidad, 0);

  const calcularPrecioTotal = () => {
    if (!rutaSeleccionada || !rutaSeleccionada.tarifas) return { min: 0, max: 0 };

    let fleteMin = 0;
    let fleteMax = 0;

    const tarifa20Min = Number(rutaSeleccionada.tarifas['20']?.min || 0);
    const tarifa20Max = Number(rutaSeleccionada.tarifas['20']?.max || 0);
    const tarifa40Min = Number(rutaSeleccionada.tarifas['40']?.min || 0);
    const tarifa40Max = Number(rutaSeleccionada.tarifas['40']?.max || 0);

    contenedoresSugeridos.forEach((c) => {
      if (c.tipo === "20'") {
        fleteMin += tarifa20Min * c.cantidad;
        fleteMax += tarifa20Max * c.cantidad;
      } else if (c.tipo === "40'") {
        fleteMin += tarifa40Min * c.cantidad;
        fleteMax += tarifa40Max * c.cantidad;
      }
    });

    const valorCargaIngresado = parseFloat(formulario.valorCarga);
    const tieneValorCarga = !isNaN(valorCargaIngresado) && valorCargaIngresado > 0;

    if (!tieneValorCarga) {
      return { min: fleteMin, max: fleteMax };
    }

    const valorCargaNum = formulario.monedaValorCarga === "CLP"
      ? valorCargaIngresado / tasaDolar
      : valorCargaIngresado;
    if (!Number.isFinite(valorCargaNum)) {
      return { min: fleteMin, max: fleteMax };
    }

    const tasaArancel = formulario.tasaArancel === "0" ? 0 : 0.06;

    const calcularTotalConTributos = (flete) => {
      const cif = flete + valorCargaNum;
      const arancel = cif * tasaArancel;
      const iva = (cif + arancel) * 0.19;
      return cif + arancel + iva;
    };

    return {
      min: calcularTotalConTributos(fleteMin),
      max: calcularTotalConTributos(fleteMax)
    };
  };

  const precioEstimado = calcularPrecioTotal();
  const fleteBaseEstimado = (() => {
    if (!rutaSeleccionada || !rutaSeleccionada.tarifas) return { min: 0, max: 0 };
    let min = 0, max = 0;
    const tarifa20Min = Number(rutaSeleccionada.tarifas['20']?.min || 0);
    const tarifa20Max = Number(rutaSeleccionada.tarifas['20']?.max || 0);
    const tarifa40Min = Number(rutaSeleccionada.tarifas['40']?.min || 0);
    const tarifa40Max = Number(rutaSeleccionada.tarifas['40']?.max || 0);

    contenedoresSugeridos.forEach((c) => {
      if (c.tipo === "20'") {
        min += tarifa20Min * c.cantidad;
        max += tarifa20Max * c.cantidad;
      } else if (c.tipo === "40'") {
        min += tarifa40Min * c.cantidad;
        max += tarifa40Max * c.cantidad;
      }
    });
    return { min, max };
  })();

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;

    if (name === "monedaValorCarga") {
      setTasaDolar(null);
      setErrorTasaDolar("");
    }

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

    if (
      formulario.monedaValorCarga === "CLP" &&
      formulario.valorCarga !== "" &&
      Number(formulario.valorCarga) > 0 &&
      !tasaDolar
    ) {
      alert(errorTasaDolar || "No se pudo obtener la tasa del dólar para convertir el valor de carga.");
      return;
    }

    setEnviando(true);

    const pesoKg = obtenerPesoEnKg();
    const pesoToneladas = pesoKg / 1000;
    const tieneValorCarga = formulario.valorCarga !== "" && !isNaN(Number(formulario.valorCarga));

    const datosCotizacion = {
      origen: formulario.origin.trim(),
      destino: formulario.destination.trim(),
      weight: pesoToneladas,
      valorCarga: tieneValorCarga ? Number(formulario.valorCarga) : undefined,
      monedaValorCarga: formulario.monedaValorCarga,
      precio: {
        min: precioEstimado.min,
        max: precioEstimado.max,
      },
      description: formulario.description.trim(),
      contenedores: totalContenedores,
      tarifas: {
        min: fleteBaseEstimado.min,
        max: fleteBaseEstimado.max,
      },
      transito: {
        minDias: rutaSeleccionada.transito?.minDias || 0,
        maxDias: rutaSeleccionada.transito?.maxDias || 0,
      }
    };

    try {
      const respuesta = await fetch("/api/quotations", {
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
        <section className="form-container" style={{ width: "100%", maxWidth: "600px" }}>
          <form onSubmit={manejarEnvio}>
            {/* ENCABEZADO CON FONDO NARANJA */}
            <div className="form-card-header">
              <h2>Cotiza tu Envío</h2>
              <p className="step-description">Completa los datos de tu próximo envío.</p>
            </div>

              <div className="steps" style={{ marginTop: "1rem" }}>
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

            {paso === 1 && (
              <div className="form-step">
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Información del envío</h3>
                <p className="step-description">Indica desde dónde y hacia dónde quieres realizar tu envío.</p>

                {cargandoTarifas ? (
                  <p>Cargando rutas disponibles desde la base de datos...</p>
                ) : (
                  <>
                    <div className="field">
                      <label htmlFor="origin" style={{ textAlign: "left" }}>Selecciona origen <span>*</span></label>
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
                      <label htmlFor="destination" style={{ textAlign: "left" }}>Selecciona destino <span>*</span></label>
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
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Información de la carga</h3>
                <p className="step-description">Cuéntanos qué deseas enviar.</p>

                <div className="field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <label htmlFor="weight" style={{ margin: 0, textAlign: "left" }}>Peso <span>*</span></label>
                    
                    <div style={{ display: "flex", background: "#e9ecef", borderRadius: "4px", padding: "2px" }}>
                      <button
                        type="button"
                        onClick={() => setFormulario({ ...formulario, unidadPeso: "kg" })}
                        style={{
                          padding: "2px 8px",
                          fontSize: "0.8rem",
                          border: "none",
                          background: formulario.unidadPeso === "kg" ? "#fa8a0e" : "transparent",
                          color: formulario.unidadPeso === "kg" ? "#fff" : "#495057",
                          borderRadius: "3px",
                          cursor: "pointer"
                        }}
                      >
                        kg
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormulario({ ...formulario, unidadPeso: "t" })}
                        style={{
                          padding: "2px 8px",
                          fontSize: "0.8rem",
                          border: "none",
                          background: formulario.unidadPeso === "t" ? "#fa8a0e" : "transparent",
                          color: formulario.unidadPeso === "t" ? "#fff" : "#495057",
                          borderRadius: "3px",
                          cursor: "pointer"
                        }}
                      >
                        t
                      </button>
                    </div>
                  </div>

                  <div className="input-with-unit">
                    <input
                      id="weight"
                      type="number"
                      name="weight"
                      min="0.01"
                      step="any"
                      value={formulario.weight}
                      onChange={manejarCambio}
                      className={errores.weight ? "input-error" : ""}
                      placeholder={formulario.unidadPeso === "kg" ? "Ej: 46000" : "Ej: 46"}
                      required
                    />
                    <span>{formulario.unidadPeso}</span>
                  </div>

                  <div style={{ marginTop: "0.75rem", padding: "0.5rem", backgroundColor: "#f8f9fa", borderRadius: "4px", border: "1px solid #e9ecef" }}>
                    <small style={{ display: "block", color: "#6c757d", marginBottom: "0.25rem", fontWeight: "bold" }}>
                      Contenedores sugeridos:
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
                  <label htmlFor="valorCarga" style={{ textAlign: "left" }}>Valor de carga (Opcional)</label>
                  <select
                    id="monedaValorCarga"
                    name="monedaValorCarga"
                    value={formulario.monedaValorCarga}
                    onChange={manejarCambio}
                    aria-label="Moneda del valor de carga"
                  >
                    <option value="USD">Dólares (USD)</option>
                    <option value="CLP">Pesos chilenos (CLP)</option>
                  </select>
                  <input
                    id="valorCarga"
                    type="number"
                    name="valorCarga"
                    min="0"
                    step="any"
                    value={formulario.valorCarga}
                    onChange={manejarCambio}
                    placeholder={formulario.monedaValorCarga === "USD" ? "Ej: 50000 USD" : "Ej: 45000000 CLP"}
                  />
                  {formulario.monedaValorCarga === "CLP" && (
                    <small role="status" style={{ display: "block", marginTop: "0.35rem" }}>
                      {cargandoTasaDolar
                        ? "Obteniendo tasa de cambio..."
                        : tasaDolar
                          ? `1 USD = ${tasaDolar.toLocaleString("es-CL")} CLP`
                          : errorTasaDolar}
                    </small>
                  )}

                  {formulario.valorCarga !== "" && !isNaN(Number(formulario.valorCarga)) && Number(formulario.valorCarga) > 0 && (
                    <div style={{ marginTop: "0.75rem", padding: "0.5rem", backgroundColor: "#f8f9fa", borderRadius: "4px", border: "1px solid #e9ecef" }}>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "#495057", marginBottom: "0.3rem", fontWeight: "bold", textAlign: "left" }}>
                        Tasa de Arancel Aduanero:
                      </label>
                      <div style={{ display: "flex", gap: "1.5rem" }}>
                        <label style={{ fontWeight: "normal", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <input
                            type="radio"
                            name="tasaArancel"
                            value="6"
                            checked={formulario.tasaArancel === "6"}
                            onChange={manejarCambio}
                          />
                          6% (General)
                        </label>
                        <label style={{ fontWeight: "normal", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <input
                            type="radio"
                            name="tasaArancel"
                            value="0"
                            checked={formulario.tasaArancel === "0"}
                            onChange={manejarCambio}
                          />
                          0% (Exento)
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="description" style={{ textAlign: "left" }}>Descripción <span>*</span></label>
                  <textarea
                    id="description"
                    name="description"
                    rows="5"
                    maxLength={200}
                    value={formulario.description}
                    onChange={manejarCambio}
                    className={errores.description ? "input-error" : ""}
                    placeholder="Describe brevemente la carga (máximo 200 caracteres)."
                    required
                  />
                  {errores.description && <span className="error">{errores.description}</span>}
                </div>

                <div style={{ marginTop: "1rem", marginBottom: "1.5rem", padding: "0.75rem", backgroundColor: "#e7f5ff", borderRadius: "6px", border: "1px solid #74c0fc", textAlign: "center" }}>
                  <span style={{ display: "block", fontSize: "0.85rem", color: "#1c7ed6", fontWeight: "bold", textTransform: "uppercase" }}>
                    Precio Estimado del Envío:
                  </span>
                  <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#212529" }}>
                    ${Math.round(precioEstimado.min).toLocaleString()} USD — ${Math.round(precioEstimado.max).toLocaleString()} USD
                  </span>
                </div>
              </div>
            )}

            {/* CONTENEDOR DE ACCIONES / BOTONES */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "1.5rem" }}>
              {paso === 1 ? (
                <button 
                  type="button" 
                  className="button-primary-blue" 
                  onClick={manejarContinuar} 
                  disabled={cargandoTarifas}
                >
                  Continuar
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="button-primary-blue" 
                  disabled={enviando}
                >
                  {enviando ? "Enviando..." : "Finalizar"}
                </button>
              )}

              {paso > 1 && (
                <button 
                  type="button" 
                  className="button-primary-blue" 
                  onClick={manejarVolver} 
                  disabled={enviando}
                  style={{ textDecoration: "none", textAlign: "center", width: "100%", boxSizing: "border-box", display: "block", border: "1px solid #fa8a0e" }}
                >
                  Volver
                </button>
              )}

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

export default CrearCotizacion;