
---

# 📘 README – Proyecto ComercioTech

## 🚀 Requisitos previos
- **Node.js** (v18 o superior)
- **npm** (incluido con Node.js)
- **MongoDB** instalado localmente y corriendo en `localhost:27017`
- **Visual Studio Code** (opcional, recomendado)

---

## ⚙️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/usuario/formulario_comex.git
   cd formulario_comex
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar la base de datos**
   - Asegúrate de que MongoDB esté corriendo:
     ```bash
     mongod
     ```
   - La aplicación se conecta automáticamente a la base `cintac`.

---

## ▶️ Ejecución

### 1. Backend (Express + MongoDB)
En una terminal:
```bash
npm start
```
Esto levanta el servidor en:
```
http://localhost:3000
```
Verás en consola:
```
Servidor corriendo en http://localhost:3000
✅ Conectado a MongoDB (BD cintac)
```

### 2. Frontend (React + Vite)
En otra terminal:
```bash
npm run dev
```
Esto levanta el frontend en:
```
http://localhost:5173
```

---

## 🔑 Flujo de uso

1. **Registro/Login**  
   - Crear usuario (`user` o `admin`).  
   - Login para acceder al sistema.

2. **Formulario de cotización**  
   - Completar los 3 pasos: Ruta → Carga → Contacto.  
   - Al finalizar, se guarda la cotización en la colección `quotations` de la BD `cintac`.

3. **Informe de cotizaciones (solo admin)**  
   - Si el usuario logueado es `admin`, se muestra una tabla con todas las cotizaciones registradas.

---

## 🛠️ Comandos útiles

- **Reiniciar nodemon** (backend):
  ```bash
  rs
  ```
- **Verificar conexión MongoDB**:
  ```bash
  mongo
  use cintac
  show collections
  db.quotations.find().pretty()
  ```

---

## 🎯 Resumen
- `npm install` → instala dependencias.  
- `npm start` → backend en puerto 3000.  
- `npm run dev` → frontend en puerto 5173.  
- MongoDB debe estar corriendo en `localhost:27017` con BD `cintac`.  

---
