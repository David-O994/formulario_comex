
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

## Configurar el entorno

- Crea un archivo llamado .env en la raíz del proyecto. Añade la siguiente variable:

  JWT_SECRET = PEGA_EL_CODIGO_SECRETO
  
- Para generar el código, ejecuta lo siguiente en una terminal con node.js instalado

  node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
  
## Configurar MongoDB

- Inicia el servicio de MongoDB.
- Abre MongoDB Compass.
- Conéctate a mongodb://localhost:27017.
- Crea o selecciona la base de datos cintac. En ella, crea las tablas users y quotations.

### Crear el Admin

El registro de usuarios está protegido: únicamente un administrador autenticado puede crear nuevas cuentas desde la aplicación. Por ello, para el primer inicio es necesario crear manualmente el administrador en MongoDB Compass.

Desde la raíz del proyecto, ejecuta:

node --input-type=module -e "import bcrypt from 'bcrypt'; console.log(await bcrypt.hash('CAMBIA_ESTA_CONTRASEÑA', 10));"

Sustituye CAMBIA_ESTA_CONTRASEÑA por una contraseña fuerte y única.

Copia el hash generado.

En Compass, abre la base de datos cintac y la colección users.

Selecciona Add Data → Insert Document e inserta un documento como este:

{
  "username": "admin",
  "password": "PEGA_AQUI_EL_HASH_BCRYPT",
  "role": "admin"
}

Reemplaza PEGA_AQUI_EL_HASH_BCRYPT por el hash generado anteriormente.

Los campos deben respetar el modelo User:

- username: nombre de usuario único.
- password: hash bcrypt de la contraseña.
- role: admin para el administrador inicial o usuario para las cuentas normales.

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
