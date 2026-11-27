import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./MainApp.css";

const cargarImagen = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });

function MainApp({ user, token, onLogout, forcedView }) {
  const [dataList, setDataList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [exportandoId, setExportandoId] = useState(null);

  const esAdmin = user?.role === "admin";
  const esUsuario = Boolean(user && token && user.role === "usuario");
  const estaAutenticado = Boolean(user && token);
  const esHistorialGlobalAdmin = esAdmin && forcedView === "historial";

  const exportarCotizacionPDF = async (cotizacion) => {
    if (!cotizacion) return;

    const cotizacionId = cotizacion._id ?? "sin-id";
    setExportandoId(cotizacionId);

    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const fechaInforme = new Date().toLocaleString("es-CL");
      const incluirUsuario = esHistorialGlobalAdmin;

      const nombreUsuario =
        cotizacion.userId?.username ||
        (!incluirUsuario ? user?.username : null) ||
        "usuario";

      const columnas = [
        "Fecha",
        "Usuario",
        "Origen",
        "Destino",
        "Tránsito",
        "Peso (t)",
        "Contenedores",
        "Tarifa est. (USD)",
        "Valor carga",
        "Precio estimado",
        "Descripción",
      ];

      const tarifa = cotizacion.tarifas
        ? `$${cotizacion.tarifas.min?.toLocaleString("es-CL")} - $${cotizacion.tarifas.max?.toLocaleString("es-CL")}`
        : cotizacion.cost
          ? `$${cotizacion.cost.toLocaleString("es-CL")}`
          : "—";

      const precio =
        cotizacion.precioCLP?.min !== undefined && cotizacion.precioCLP?.max !== undefined
          ? `$${Math.round(cotizacion.precioCLP.min).toLocaleString("es-CL")} - $${Math.round(cotizacion.precioCLP.max).toLocaleString("es-CL")} CLP`
          : cotizacion.precio?.min !== undefined && cotizacion.precio?.max !== undefined
            ? `$${Math.round(cotizacion.precio.min).toLocaleString("en-US")} - $${Math.round(cotizacion.precio.max).toLocaleString("en-US")} USD`
            : "—";

      const filas = [
        [
          cotizacion.createdAt
            ? new Date(cotizacion.createdAt).toLocaleDateString("es-CL")
            : "—", // 1. Fecha
          nombreUsuario, // 2. Usuario
          cotizacion.origen ?? "—", // 3. Origen
          cotizacion.destino ?? "—", // 4. Destino
          cotizacion.transito
            ? `${cotizacion.transito.minDias} - ${cotizacion.transito.maxDias} días`
            : cotizacion.days !== undefined
              ? `${cotizacion.days} días`
              : "—", // 5. Tránsito
          cotizacion.weight !== undefined ? `${cotizacion.weight} t` : "—", // 6. Peso (t)
          cotizacion.contenedores ?? "—", // 7. Contenedores
          tarifa, // 8. Tarifa est. (USD)
          cotizacion.valorCarga
            ? `$${cotizacion.valorCarga.toLocaleString("es-CL")}`
            : "—", // 9. Valor carga
          precio, // 10. Precio estimado
          cotizacion.description ?? "—", // 11. Descripción
        ],
      ];

      let cursorY = 14;

      try {
        const logo = await cargarImagen("/cintac_logo.png");
        const anchoLogo = 34; // mm
        const altoLogo =
          logo.naturalWidth && logo.naturalHeight
            ? (logo.naturalHeight / logo.naturalWidth) * anchoLogo
            : 10;

        pdf.addImage(logo, "PNG", 14, cursorY, anchoLogo, altoLogo);
        cursorY += altoLogo + 6;
      } catch (imgError) {
        console.warn("No se pudo cargar el logo para el PDF:", imgError);
      }

      pdf.setFontSize(16);
      pdf.text(
        "Informe de cotización",
        14,
        cursorY
      );

      cursorY += 6;
      pdf.setFontSize(9);
      pdf.text(`Generado: ${fechaInforme}`, 14, cursorY);

      autoTable(pdf, {
        head: [columnas],
        body: filas,
        startY: cursorY + 5,
        theme: "grid",
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [0, 74, 146],
          textColor: [255, 255, 255],
        },
        bodyStyles: {
          textColor: [0, 0, 0],
        },
        columnStyles: { [columnas.length - 1]: { cellWidth: 48 } },
        didDrawPage: ({ pageNumber }) => {
          pdf.setFontSize(8);
          pdf.text(
            `Página ${pageNumber}`,
            pdf.internal.pageSize.getWidth() - 14,
            pdf.internal.pageSize.getHeight() - 7,
            { align: "right" }
          );
        },
      });

      const ahora = new Date();
const pad2 = (n) => String(n).padStart(2, "0");

const dia = pad2(ahora.getDate());
const mes = pad2(ahora.getMonth() + 1);
const anio = ahora.getFullYear();
const horaMinSeg = `${pad2(ahora.getHours())}${pad2(ahora.getMinutes())}${pad2(ahora.getSeconds())}`;

const usuarioSanitizado = String(nombreUsuario).trim().replace(/[^a-zA-Z0-9_-]/g, "_");

pdf.save(`informe-cotizacion-${usuarioSanitizado}-${dia}-${mes}-${anio}-${horaMinSeg}.pdf`);
    } catch (error) {
      console.error("Error al generar el informe PDF:", error);
      alert("No se pudo generar el informe PDF. Inténtalo nuevamente.");
    } finally {
      setExportandoId(null);
    }
  };

  // Cargar datos según la vista activa (Historial de cotizaciones o Lista de usuarios)
  useEffect(() => {
    const esVistaAdminHistorial = user?.role === "admin" && forcedView === "historial";
    const esVistaListaUsuarios = user?.role === "admin" && forcedView === "lista-usuarios";
    const esVistaMisCotizaciones = (user?.role === "usuario" || user?.role === "admin") && forcedView === "mis-cotizaciones";

    if (!user || !token || (!esVistaAdminHistorial && !esVistaListaUsuarios && !esVistaMisCotizaciones)) {
      return;
    }

    let cancelado = false;

    const cargarDatos = async () => {
      setLoadingData(true);

      try {
        let endpoint = "";
        if (esVistaAdminHistorial) {
          endpoint = "http://localhost:3000/api/quotations/admin/all";
        } else if (esVistaListaUsuarios) {
          endpoint = "http://localhost:3000/api/auth/admin/usuarios";
        } else {
          endpoint = "http://localhost:3000/api/quotations/mis-cotizaciones";
        }

        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.status === 401) {
          onLogout();
          alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
          window.location.href = "/login";
          return;
        }

        if (!res.ok) {
          throw new Error(
            data.error || "No se pudieron cargar los datos."
          );
        }

        if (!cancelado) {
          setDataList(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelado) {
          console.error("Error cargando datos:", error);
          alert(error.message || "No se pudieron cargar los datos.");
        }
      } finally {
        if (!cancelado) {
          setLoadingData(false);
        }
      }
    };

    cargarDatos();

    return () => {
      cancelado = true;
    };
  }, [user, token, forcedView, onLogout]);

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        {/* Navegación y opciones del menú */}
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
          <Link to="/" style={{ textDecoration: "none" }}>
            Inicio
          </Link>

          {/* Opciones para USUARIO ESTÁNDAR */}
          {estaAutenticado && user?.role !== "admin" && (
            <>
              <span>|</span>
              <Link to="/cotizaciones/crear" style={{ textDecoration: "none" }}>
                Cotizar
              </Link>
              <span>|</span>
              <Link to="/mis-cotizaciones" style={{ textDecoration: "none" }}>
                Historial cotizaciones
              </Link>
            </>
          )}

          {/* Opciones exclusivas para ADMINISTRADOR */}
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

        {/* Acciones de sesión de usuario */}
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
      <div className="dashboard-main-wrapper">
        <main 
          className="dashboard-content"
          style={
            forcedView === "lista-usuarios" || forcedView === "historial" || forcedView === "mis-cotizaciones"
              ? { background: "transparent", boxShadow: "none", border: "none", padding: 0, display: "flex", justifyContent: "center" }
              : {}
          }
        >
          {/* VISTA DE LISTADO DE USUARIOS (Solo Admin) */}
          {forcedView === "lista-usuarios" && esAdmin ? (
            <section className="form-container" style={{ width: "100%", maxWidth: "850px", padding: 0, overflow: "hidden" }}>
              <div className="form-card-header" style={{ margin: 0, borderRadius: 0 }}>
                <h2>Listado de usuarios</h2>
                <p className="step-description">Visualiza y administra los usuarios registrados en el sistema.</p>
              </div>

              <div style={{ padding: "30px" }}>
                {loadingData && <p style={{ textAlign: "center", padding: "1rem" }}>Cargando usuarios...</p>}

                {!loadingData && dataList.length === 0 && (
                  <p style={{ textAlign: "center", padding: "1rem" }}>No hay usuarios para mostrar.</p>
                )}

                {!loadingData && dataList.length > 0 && (
                  <div className="table-container" style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
                    <table className="custom-table" border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Nombre</th>
                          <th>Rol</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataList.map((u) => (
                          <tr key={u._id}>
                            <td><code>{u._id}</code></td>
                            <td>{u.username}</td>
                            <td>{u.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ marginTop: "2rem" }}>
                  <Link 
                    to="/" 
                    className="button-back" 
                    style={{ textDecoration: "none", textAlign: "center", width: "100%", boxSizing: "border-box", display: "block" }}
                  >
                    Volver al dashboard
                  </Link>
                </div>
              </div>
            </section>
          ) : /* VISTA DE HISTORIAL (Admin o Usuario según corresponda) */
          (forcedView === "historial" && esAdmin) || (forcedView === "mis-cotizaciones" && (esUsuario || esAdmin)) ? (
            <section className="form-container" style={{ width: "100%", maxWidth: "1100px", padding: 0, overflow: "hidden" }}>
              <div className="form-card-header" style={{ margin: 0, borderRadius: 0 }}>
                <h2>{esAdmin && forcedView === "historial" ? "Historial de cotizaciones" : "Mi historial de cotizaciones"}</h2>
                <p className="step-description">Revisa el registro detallado de las cotizaciones realizadas en el sistema.</p>
              </div>

              <div style={{ padding: "30px" }}>
                {loadingData && <p style={{ textAlign: "center", padding: "1rem" }}>Cargando cotizaciones...</p>}

                {!loadingData && dataList.length === 0 && (
                  <p style={{ textAlign: "center", padding: "1rem" }}>No hay cotizaciones para mostrar.</p>
                )}

                {!loadingData && dataList.length > 0 && (
                  <div className="table-container" style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
                    <table className="custom-table" border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Origen</th>
                          <th>Destino</th>
                          <th>Días Tránsito</th>
                          <th>Peso (t)</th>
                          <th>Contenedores</th>
                          <th>Tarifa Est. (USD)</th>
                          <th>Valor Carga</th>
                          <th>Descripción</th>
                          <th>Precio</th>
                          <th>Fecha</th>
                          {esAdmin && forcedView === "historial" && <th>Usuario</th>}
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataList.map((q) => {
                          const cotizacionId = q._id ?? "sin-id";
                          const estaExportandoFila = exportandoId === cotizacionId;

                          return (
                            <tr key={cotizacionId}>
                              <td>{q.origen}</td>
                              <td>{q.destino}</td>
                              <td>
                                {q.transito 
                                  ? `${q.transito.minDias} - ${q.transito.maxDias} días` 
                                  : (q.days !== undefined ? `${q.days} días` : "—")}
                              </td>
                              <td>{q.weight} t</td>
                              <td>{q.contenedores ?? "—"}</td>
                              <td>
                                {q.tarifas 
                                  ? `$${q.tarifas.min?.toLocaleString()} - $${q.tarifas.max?.toLocaleString()}` 
                                  : (q.cost ? `$${q.cost.toLocaleString()}` : "—")}
                              </td>
                              <td>{q.valorCarga ? `$${q.valorCarga.toLocaleString()}` : "—"}</td>
                              <td>{q.description}</td>
                              <td>
                                {q.precioCLP && q.precioCLP.min !== undefined && q.precioCLP.max !== undefined
                                  ? (q.precioCLP.min === q.precioCLP.max
                                      ? `$${Math.round(q.precioCLP.min).toLocaleString('es-CL')} CLP`
                                      : `$${Math.round(q.precioCLP.min).toLocaleString('es-CL')} - $${Math.round(q.precioCLP.max).toLocaleString('es-CL')} CLP`)
                                  : "—"}
                              </td>
                              <td>
                                {q.createdAt
                                  ? new Date(q.createdAt).toLocaleDateString("es-CL")
                                  : "—"}
                              </td>
                              {esAdmin && forcedView === "historial" && <td>{q.userId?.username ?? "—"}</td>}
                              <td>
                                <button
                                  type="button"
                                  className="button-export-pdf"
                                  onClick={() => exportarCotizacionPDF(q)}
                                  disabled={estaExportandoFila}
                                  style={{ whiteSpace: "nowrap", padding: "6px 12px", fontSize: "0.8rem" }}
                                >
                                  {estaExportandoFila ? "Generando PDF..." : "Exportar a PDF"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ marginTop: "2rem" }}>
                  <Link 
                    to="/" 
                    className="button-back" 
                    style={{ textDecoration: "none", textAlign: "center", width: "100%", boxSizing: "border-box", display: "block" }}
                  >
                    Volver al dashboard
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            /* VISTA NORMAL DE LAS TARJETAS DEL DASHBOARD (INICIO) */
            <>
              <section className="dashboard-intro">
                <p className="dashboard-eyebrow">PANEL PRINCIPAL</p>

                <h1>
                  {estaAutenticado
                    ? `Bienvenido, ${user.username}`
                    : "Bienvenido"}
                </h1>

                <p>
                  {esAdmin
                    ? "Administra los usuarios y consulta las cotizaciones."
                    : esUsuario
                      ? "Gestiona tus envíos y crea nuevas cotizaciones."
                      : "Inicia sesión para acceder a las opciones disponibles."}
                </p>
              </section>

              <section 
  className="dashboard-cards" 
  style={{ 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    maxWidth: "1050px",
    margin: "0 auto",
    gap: "1.5rem"
  }}
>
  {!estaAutenticado && (
    <Link to="/login" className="dashboard-card" style={{ textDecoration: "none" }}>
      <span className="dashboard-card-icon">↪</span>
      <h2>Iniciar sesión</h2>
      <p>Accede a tu cuenta para continuar.</p>
      <span className="dashboard-card-link">
        Ingresar →
      </span>
    </Link>
  )}

  {esAdmin && (
    <>
      {/* FILA 1: Crear usuario | Crear cotización | Módulo Cotizador */}
      <Link to="/admin/crear-usuario" className="dashboard-card" style={{ textDecoration: "none" }}>
        <span className="dashboard-card-icon">＋</span>
        <h2>Crear usuario</h2>
        <p>Registra una nueva cuenta de usuario.</p>
        <span className="dashboard-card-link">
          Crear usuario →
        </span>
      </Link>

      <Link to="/cotizaciones/crear" className="dashboard-card" style={{ textDecoration: "none" }}>
        <span className="dashboard-card-icon">＋</span>
        <h2>Crear cotización</h2>
        <p>Completa los datos de tu próximo envío.</p>
        <span className="dashboard-card-link">
          Crear cotización →
        </span>
      </Link>

      <Link to="/cotizador" className="dashboard-card" style={{ textDecoration: "none" }}>
        <span className="dashboard-card-icon">📊</span>
        <h2>Módulo Cotizador</h2>
        <p>Sube y gestiona las tarifas desde Excel.</p>
        <span className="dashboard-card-link">
          Ir al cotizador →
        </span>
      </Link>

      {/* FILA 2: Listado de usuarios | Mis cotizaciones | Historial de cotizaciones */}
      <Link to="/admin/lista-usuarios" className="dashboard-card" style={{ textDecoration: "none" }}>
        <span className="dashboard-card-icon">👥</span>
        <h2>Listado de usuarios</h2>
        <p>Consulta los usuarios registrados en el sistema.</p>
        <span className="dashboard-card-link">
          Ver usuarios →
        </span>
      </Link>

      <Link to="/mis-cotizaciones" className="dashboard-card" style={{ textDecoration: "none" }}>
        <span className="dashboard-card-icon">📋</span>
        <h2>Mis cotizaciones</h2>
        <p>Revisa el historial de tus envíos realizados.</p>
        <span className="dashboard-card-link">
          Ver mi historial →
        </span>
      </Link>

      <Link to="/admin/historial" className="dashboard-card" style={{ textDecoration: "none" }}>
        <span className="dashboard-card-icon">▤</span>
        <h2>Historial de cotizaciones</h2>
        <p>Consulta las cotizaciones disponibles.</p>
        <span className="dashboard-card-link">
          Ver historial →
        </span>
      </Link>
    </>
  )}

  {esUsuario && (
    <>
      <Link to="/cotizaciones/crear" className="dashboard-card" style={{ textDecoration: "none" }}>
        <span className="dashboard-card-icon">＋</span>
        <h2>Crear cotización</h2>
        <p>Completa los datos de tu próximo envío.</p>
        <span className="dashboard-card-link">
          Crear cotización →
        </span>
      </Link>

      <Link to="/mis-cotizaciones" className="dashboard-card" style={{ textDecoration: "none" }}>
        <span className="dashboard-card-icon">📋</span>
        <h2>Mis cotizaciones</h2>
        <p>Revisa el historial de tus envíos realizados.</p>
        <span className="dashboard-card-link">
          Ver mi historial →
        </span>
      </Link>
    </>
  )}
</section>
            </>
          )}
        </main>
      </div>
    </main>
  );
}

export default MainApp;