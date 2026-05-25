# 🏟️ SportLogix - Sistema de Gestión de Pistas Deportivas

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**SportLogix** es una aplicación web diseñada para la gestión eficiente de instalaciones deportivas. Permite a los usuarios reservar pistas en tiempo real y a los administradores gestionar pistas, ver la ocupación y analizar estadísticas de uso básicas.

---

## 📸 Capturas de Pantalla

### Página de Inicio
![Página de inicio](https://github.com/user-attachments/assets/6ec1dbe9-e6d0-43c9-9c34-77d2ff6ee2b6)

### Modal de Confirmar Reserva
![Modal confirmar reserva](https://github.com/user-attachments/assets/51cadd9d-8b44-42db-b684-b42b9cf561d2)

### Página de Reservas
![Página de reservas](https://github.com/user-attachments/assets/0590963b-a7a1-4ec7-905f-af8a9070229f)

### Panel de Administrador — Gestión de Pistas
![Gestión de pistas](https://github.com/user-attachments/assets/e519c004-90e0-498f-b5bd-82c9e720ad8f)

### Panel de Administrador — Crear Pista
![Modal creación de pista](https://github.com/user-attachments/assets/9a3b2813-2478-456f-9a10-d03623040774)

### Panel de Administrador — Reservas
![Reservas admin](https://github.com/user-attachments/assets/430edfbb-ed57-46e6-bf29-bf2daab2e377)

### Panel de Administrador — Estadísticas
![Estadísticas básicas](https://github.com/user-attachments/assets/15555a04-379a-4358-a5ef-33494f645eb6)

---

## 🚀 Funcionalidades Principales

### Para Usuarios 👤
*   **Registro y Login:** Acceso seguro a la plataforma.
*   **Buscador:** Filtro por tipo de deporte y fecha de juego.
*   **Reservas:** Interfaz intuitiva para elegir slots de 1 hora.
*   **Gestión Personal:** Panel "Mis Reservas" para consultar y cancelar reservas.
*   **Interfaz Responsive:** Diseño adaptado a móviles y tablets.

### Para Administradores ⚙️
*   **Gestión de Pistas:** Crear, editar y eliminar pistas (Pádel, Fútbol 7, Baloncesto).
*   **Control de Estado:** Poner pistas en "Mantenimiento" para bloquearlas.
*   **Visor de Ocupación:** Calendario para ver las reservas de cada día y cancelar reservas.
*   **Estadísticas Básicas:** Dashboard con filtros de tiempo (Hoy, Semana, Mes, Total).
*   **Seguridad:** Panel protegido con control de roles.

## 🛠️ Tecnologías Utilizadas

*   **Backend:** Node.js con Express.
*   **Base de Datos:** MySQL (con sistema de Pool para mayor estabilidad).
*   **Frontend:** HTML5 y JavaScript (Vanilla).
*   **Estilos:** Tailwind CSS (via CDN) para el diseño visual y responsive.

## 📦 Instalación y Configuración

Sigue estos pasos para poner el proyecto en marcha en tu equipo local:

### 1. Requisitos Previos
*   Tener instalado [Node.js](https://nodejs.org/).
*   Un servidor MySQL (Recomendado: [Laragon](https://laragon.org/) o XAMPP).

### 2. Configuración de la Base de Datos
1.  Abre tu gestor de base de datos (HeidiSQL, phpMyAdmin, etc.).
2.  Importa el archivo `db_sportlogix.sql` que se encuentra en la raíz del proyecto.
3.  Este archivo creará la base de datos `gestor_polideportivo` y las tablas necesarias con datos de prueba.

### 3. Instalación de Dependencias
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
npm install
```

### 4. Ejecución del Servidor
Para iniciar la aplicación:
```bash
npm start
```
La aplicación estará disponible en: `http://localhost:3000`

## 🔑 Credenciales de Prueba (Adminiistrador y Usuario)

Para acceder al panel de administración:
*   **Email:** `admin@admin.com`
*   **Contraseña:** `admin`

Para acceder al panel de usuario:
*   **Email:** `davidraulrus2006@gmail.com`
*   **Contraseña:** `davidraulrus2006@gmail.com`

---
**Proyecto desarrollado por:** David Raul Rus
**Materia:** TFG Desarrollo de Aplicaciones Web
