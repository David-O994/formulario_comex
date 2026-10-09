import { useState } from "react";
import "./App.css";

const origins = [
  "Santiago - Chile",
  "Lima - Perú",
  "Buenos Aires - Argentina",
  "Sao Paulo - Brazil",
  "Bogota - Colombia",
  "Ciudad de Mexico - Mexico",
  "Miami - USA",
  "Los Angeles - USA",
  "Nueva York - USA",
  "Madrid - España",
  "Frankfurt - Alemania",
  "Shanghai - China",
];

const destinations = [
  "Miami - USA",
  "Los Angeles - USA",
  "New York - USA",
  "Madrid - España",
  "Frankfurt - Alemania",
  "Amsterdam - Países Bajos",
  "Paris - Francia",
  "Londres - Reino Unido",
  "Shanghai - China",
  "Hong Kong - China",
  "Tokyo - Japón",
  "Santiago - Chile",
];

const cargoTypes = [
  "General",
  "Perecederos",
  "Frágil",
  "Peligrosa",
  "Alto Valor",
  "Otro",
];

const contactPreferences = ["Email", "Telefono", "WhatsApp"];

const initialForm = {
  origin: "",
  destination: "",
  cargoType: "",
  weight: "",
  description: "",
  fullName: "",
  company: "",
  email: "",
  phone: "",
  contactPreference: "",
};

function App() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const handleSubmit = async () => {
  const res = await fetch('http://localhost:3000/api/cotizacion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form)
  });
  const data = await res.json();
  console.log('📩 Respuesta cotización:', data);
  alert(data.message || data.error);
};


  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Elimina el error del campo cuando el usuario lo corrige.
    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }
  };

  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (!form.origin) {
        newErrors.origin = "Selecciona un origen.";
      }

      if (!form.destination) {
        newErrors.destination = "Selecciona un destino.";
      }
    }

    if (step === 2) {
      if (!form.cargoType) {
        newErrors.cargoType = "Selecciona un tipo de carga.";
      }

      if (!form.weight || Number(form.weight) <= 0) {
        newErrors.weight = "El peso debe ser mayor que 0.";
      }

      if (!form.description.trim()) {
        newErrors.description = "Ingresa una descripción.";
      }
    }

    if (step === 3) {
      if (!form.fullName.trim()) {
        newErrors.fullName = "Ingresa tu nombre completo.";
      }

      if (!form.email.trim()) {
        newErrors.email = "Ingresa tu email.";
      } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        newErrors.email = "Ingresa un email válido.";
      }

      if (!form.phone || Number(form.phone) <= 0) {
        newErrors.phone = "Ingresa un teléfono válido.";
      }

      if (!form.contactPreference) {
        newErrors.contactPreference =
          "Selecciona una preferencia de contacto.";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validateStep()) {
      return;
    }

    setStep((previous) => Math.min(previous + 1, 3));
  };

  const handleBack = () => {
    setErrors({});
    setStep((previous) => Math.max(previous - 1, 1));
  };

    // Aquí posteriormente puedes enviar los datos a una API.
    // Ejemplo:
    //
    // await fetch("/api/cotizacion", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(form),
    // });

  return (
    <main className="page">
      <section className="form-container">
        <header className="form-header">
          <h1>Cotiza tu Envio</h1>

          <div className="steps">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`step ${
                  stepNumber === step ? "active" : ""
                } ${stepNumber < step ? "completed" : ""}`}
              >
                <span>{stepNumber}</span>
                <small>
                  {stepNumber === 1 && "Ruta"}
                  {stepNumber === 2 && "Carga"}
                  {stepNumber === 3 && "Contacto"}
                </small>
              </div>
            ))}
          </div>
        </header>

        <form>
          {/* PANTALLA 1 */}
          {step === 1 && (
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
                  value={form.origin}
                  onChange={handleChange}
                  className={errors.origin ? "input-error" : ""}
                >
                  <option value="">Selecciona un origen</option>

                  {origins.map((origin) => (
                    <option key={origin} value={origin}>
                      {origin}
                    </option>
                  ))}
                </select>

                {errors.origin && (
                  <span className="error">{errors.origin}</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="destination">
                  Selecciona destino <span>*</span>
                </label>

                <select
                  id="destination"
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  className={errors.destination ? "input-error" : ""}
                >
                  <option value="">Selecciona un destino</option>

                  {destinations.map((destination) => (
                    <option key={destination} value={destination}>
                      {destination}
                    </option>
                  ))}
                </select>

                {errors.destination && (
                  <span className="error">{errors.destination}</span>
                )}
              </div>
            </div>
          )}

          {/* PANTALLA 2 */}
          {step === 2 && (
            <div className="form-step">
              <h2>Información de la carga</h2>
              <p className="step-description">
                Cuéntanos qué deseas enviar.
              </p>

              <div className="field">
                <label>
                  Tipo de carga <span>*</span>
                </label>

                <div className="radio-group">
                  {cargoTypes.map((type) => (
                    <label className="radio-option" key={type}>
                      <input
                        type="radio"
                        name="cargoType"
                        value={type}
                        checked={form.cargoType === type}
                        onChange={handleChange}
                      />

                      <span>{type}</span>
                    </label>
                  ))}
                </div>

                {errors.cargoType && (
                  <span className="error">{errors.cargoType}</span>
                )}
              </div>

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
                    value={form.weight}
                    onChange={handleChange}
                    className={errors.weight ? "input-error" : ""}
                    placeholder="Ej: 25"
                  />

                  <span>kg</span>
                </div>

                {errors.weight && (
                  <span className="error">{errors.weight}</span>
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
                  value={form.description}
                  onChange={handleChange}
                  className={errors.description ? "input-error" : ""}
                  placeholder="Describe brevemente la carga..."
                />

                {errors.description && (
                  <span className="error">{errors.description}</span>
                )}
              </div>
            </div>
          )}

          {/* PANTALLA 3 */}
          {step === 3 && (
            <div className="form-step">
              <h2>Datos de contacto</h2>
              <p className="step-description">
                Déjanos tus datos para poder contactarte.
              </p>

              <div className="field">
                <label htmlFor="fullName">
                  Nombre completo <span>*</span>
                </label>

                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className={errors.fullName ? "input-error" : ""}
                  placeholder="Tu nombre completo"
                />

                {errors.fullName && (
                  <span className="error">{errors.fullName}</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="company">Empresa</label>

                <input
                  id="company"
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Nombre de tu empresa"
                />
              </div>

              <div className="field">
                <label htmlFor="email">
                  Email <span>*</span>
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={errors.email ? "input-error" : ""}
                  placeholder="correo@ejemplo.com"
                />

                {errors.email && (
                  <span className="error">{errors.email}</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="phone">
                  Teléfono / Whatsapp <span>*</span>
                </label>

                <input
                  id="phone"
                  type="number"
                  name="phone"
                  min="1"
                  step="1"
                  value={form.phone}
                  onChange={handleChange}
                  className={errors.phone ? "input-error" : ""}
                  placeholder="Ej: 56912345678"
                />

                {errors.phone && (
                  <span className="error">{errors.phone}</span>
                )}
              </div>

              <div className="field">
                <label>
                  Preferencia de contacto <span>*</span>
                </label>

                <div className="radio-group horizontal">
                  {contactPreferences.map((preference) => (
                    <label className="radio-option" key={preference}>
                      <input
                        type="radio"
                        name="contactPreference"
                        value={preference}
                        checked={
                          form.contactPreference === preference
                        }
                        onChange={handleChange}
                      />

                      <span>{preference}</span>
                    </label>
                  ))}
                </div>

                {errors.contactPreference && (
                  <span className="error">
                    {errors.contactPreference}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="form-actions">
            {step > 1 && (
              <button
                type="button"
                className="button secondary"
                onClick={handleBack}
              >
                Volver
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                className="button primary"
                onClick={handleContinue}
              >
                Continuar
              </button>
            ) : (
              <button type="button" className="button primary" onClick={handleSubmit}>
                Finalizar
                </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}

export default App;
