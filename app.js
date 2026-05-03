// Importación de módulos necesarios para el servidor
const express = require('express'); // Framework web para Node.js
const mysql = require('mysql2');    // Conector para base de datos MySQL
const path = require('path');       // Utilidad para manejar rutas de archivos
const app = express();              // Inicialización de la aplicación Express

// Middlewares de configuración
app.use(express.json()); // Permite a la aplicación entender datos en formato JSON (para peticiones POST/PUT)
app.use(express.static(path.join(__dirname, 'public'))); // Sirve los archivos estáticos (HTML, CSS, JS) de la carpeta 'public'

// Configuración del Pool de Conexiones a la Base de Datos
// El uso de un Pool es más eficiente y estable que abrir y cerrar conexiones individuales
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gestor_polideportivo',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Mensaje de confirmación de inicialización de la base de datos
console.log("✅ Sistema de base de datos (Pool) inicializado");

// --- RUTAS DE GESTIÓN DE USUARIOS ---

/**
 * Ruta para el registro de nuevos usuarios.
 * Recibe: nombre, email y password.
 */
app.post('/api/registrar', (req, res) => {
    const { nombre, email, password } = req.body;
    const sql = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, "user")';

    db.query(sql, [nombre, email, password], (err, result) => {
        if (err) {
            // Manejo de error por duplicidad de correo electrónico
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ mensaje: "El correo ya existe" });
            }
            return res.status(500).json({ mensaje: "Error al registrar" });
        }
        res.json({ mensaje: "Usuario registrado con éxito" });
    });
});

/**
 * Ruta para el inicio de sesión (Login).
 * Verifica las credenciales y devuelve los datos básicos del usuario.
 */
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE email = ?';

    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ mensaje: "Error en el servidor" });
        if (results.length === 0) return res.status(401).json({ mensaje: "Usuario no encontrado" });

        const usuario = results[0];
        // Verificación básica de contraseña (en producción debería usarse hashing como bcrypt)
        if (usuario.password !== password) {
            return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        }

        // Respuesta con datos del usuario si el login es exitoso
        res.json({
            mensaje: "Login correcto",
            usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }
        });
    });
});

// --- RUTAS DE GESTIÓN DE PISTAS (GENERAL) ---

/**
 * Obtiene la lista completa de todas las pistas registradas en el sistema.
 */
app.get('/api/pistas', (req, res) => {
    const sql = 'SELECT * FROM pistas';
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error al obtener pistas:", err);
            return res.status(500).json({ mensaje: "Error al obtener las pistas de SportLogix" });
        }
        res.json(results);
    });
});

// --- RUTAS DE ADMINISTRACIÓN DE PISTAS (CRUD) ---

/**
 * Crea una nueva pista deportiva (Función exclusiva de Admin).
 * Estado por defecto: 1 (Activa).
 */
app.post('/api/pistas/crear', (req, res) => {
    const { nombre, tipo } = req.body;
    const sql = 'INSERT INTO pistas (nombre, tipo, estado) VALUES (?, ?, 1)';

    db.query(sql, [nombre, tipo], (err, result) => {
        if (err) return res.status(500).json({ mensaje: "Error al crear la pista" });
        res.json({ mensaje: "Pista creada con éxito", idPista: result.insertId });
    });
});

/**
 * Actualiza el estado de una pista (Activa/Mantenimiento).
 */
app.put('/api/pistas/estado/:id', (req, res) => {
    const { id } = req.params;
    const { nuevoEstado } = req.body;
    const sql = 'UPDATE pistas SET estado = ? WHERE id = ?';

    db.query(sql, [nuevoEstado, id], (err, result) => {
        if (err) return res.status(500).json({ mensaje: "Error al actualizar estado" });
        res.json({ mensaje: "Estado actualizado correctamente" });
    });
});

/**
 * Elimina definitivamente una pista del sistema.
 */
app.delete('/api/pistas/eliminar/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM pistas WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ mensaje: "Error al eliminar la pista" });
        res.json({ mensaje: "Pista eliminada correctamente" });
    });
});

/**
 * Edita el nombre y el tipo de deporte de una pista existente.
 */
app.put('/api/pistas/editar/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, tipo } = req.body;
    const sql = 'UPDATE pistas SET nombre = ?, tipo = ? WHERE id = ?';

    db.query(sql, [nombre, tipo, id], (err, result) => {
        if (err) return res.status(500).json({ mensaje: "Error al editar la pista" });
        res.json({ mensaje: "Pista editada correctamente" });
    });
});

// --- RUTAS DE GESTIÓN DE RESERVAS ---

/**
 * Obtiene las reservas de una fecha específica para visualización en el panel de administrador.
 */
app.get('/api/admin/reservas/fecha/:fecha', (req, res) => {
    const { fecha } = req.params;
    
    // Consulta con JOIN para obtener nombres de pista y usuario
    const sql = `
        SELECT r.id, r.hora_inicio, r.hora_fin, p.nombre AS pista_nombre, u.nombre AS usuario_nombre
        FROM reservas r
        JOIN pistas p ON r.id_pista = p.id
        JOIN usuarios u ON r.id_usuario = u.id
        WHERE r.fecha = ?
        ORDER BY r.hora_inicio ASC
    `;

    db.query(sql, [fecha], (err, results) => {
        if (err) return res.status(500).json({ mensaje: "Error al obtener las reservas de la fecha" });
        res.json(results);
    });
});

/**
 * Obtiene estadísticas de uso del polideportivo.
 * Soporta filtros: 'dia', 'semana', 'mes' o total.
 */
app.get('/api/admin/estadisticas', (req, res) => {
    const { periodo } = req.query; // dia, semana, mes, total
    let filtroFecha = "";

    // Construcción dinámica del filtro de fecha según el periodo solicitado
    if (periodo === 'dia') {
        filtroFecha = "WHERE r.fecha >= CURDATE()";
    } else if (periodo === 'semana') {
        filtroFecha = "WHERE r.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    } else if (periodo === 'mes') {
        filtroFecha = "WHERE r.fecha >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)";
    }

    // Queries para obtener: Total de reservas, Deporte más jugado y Pista más reservada
    const queryTotal = `SELECT COUNT(*) as total FROM reservas r ${filtroFecha}`;
    const queryDeporte = `
        SELECT p.tipo, COUNT(r.id) as cantidad 
        FROM reservas r JOIN pistas p ON r.id_pista = p.id 
        ${filtroFecha}
        GROUP BY p.tipo ORDER BY cantidad DESC LIMIT 1
    `;
    const queryPista = `
        SELECT p.nombre, COUNT(r.id) as cantidad 
        FROM reservas r JOIN pistas p ON r.id_pista = p.id 
        ${filtroFecha}
        GROUP BY p.id ORDER BY cantidad DESC LIMIT 1
    `;

    // Ejecución encadenada de las consultas estadísticas
    db.query(queryTotal, (errTotal, resTotal) => {
        if (errTotal) return res.status(500).json({ mensaje: "Error total" });
        
        db.query(queryDeporte, (errDep, resDep) => {
            if (errDep) return res.status(500).json({ mensaje: "Error deporte" });
            
            db.query(queryPista, (errPista, resPista) => {
                if (errPista) return res.status(500).json({ mensaje: "Error pista" });
                
                res.json({
                    total_reservas: resTotal[0].total || 0,
                    deporte_favorito: resDep.length > 0 ? resDep[0].tipo : 'Ninguno',
                    pista_estrella: resPista.length > 0 ? resPista[0].nombre : 'Ninguna'
                });
            });
        });
    });
});

/**
 * Crea una nueva reserva validando horarios, duración y disponibilidad.
 */
app.post('/api/reservas', (req, res) => {
    const { id_usuario, id_pista, fecha, hora_inicio, hora_fin } = req.body;

    // Validación: Las reservas deben ser en horas en punto (ej: 16:00, no 16:30)
    const horaInicioStr = hora_inicio.substring(0, 5); 
    const horaFinStr = hora_fin.substring(0, 5);

    if (!horaInicioStr.endsWith(':00') || !horaFinStr.endsWith(':00')) {
        return res.status(400).json({
            mensaje: "Las reservas solo se pueden hacer de hora en hora (ej. 16:00, 17:00)."
        });
    }

    // Conversión a minutos para facilitar los cálculos de horario
    const inicioMinutos = parseInt(horaInicioStr.split(':')[0], 10) * 60;
    const finMinutos = parseInt(horaFinStr.split(':')[0], 10) * 60;

    // Horarios de apertura y cierre (En minutos desde las 00:00)
    const aperturaManana = 8 * 60; // 08:00
    const cierreManana = 13 * 60; // 13:00
    const aperturaTarde = 15 * 60; // 15:00
    const cierreTarde = 22 * 60; // 22:00

    // Comprobación de que la reserva está dentro del horario comercial
    const esHorarioManana = (inicioMinutos >= aperturaManana && finMinutos <= cierreManana);
    const esHorarioTarde = (inicioMinutos >= aperturaTarde && finMinutos <= cierreTarde);

    if (!esHorarioManana && !esHorarioTarde) {
        return res.status(400).json({
            mensaje: "Horario no válido. Abrimos de 08:00 a 13:00 y de 15:00 a 22:00."
        });
    }

    // Validación: Duración máxima de 2 horas (120 minutos)
    const duracionReserva = finMinutos - inicioMinutos;
    if (duracionReserva > 120) {
        return res.status(400).json({
            mensaje: "Las reservas no pueden exceder las 2 horas de duración."
        });
    }

    // Verificación de disponibilidad: Buscar si hay solapamiento de horarios
    // Se solapan si: (Inicio_A < Fin_B) Y (Fin_A > Inicio_B)
    const sqlCheckSimplified = `
        SELECT * FROM reservas 
        WHERE id_pista = ? AND fecha = ? 
        AND hora_inicio < ? AND hora_fin > ?
    `;

    db.query(sqlCheckSimplified, [id_pista, fecha, hora_fin, hora_inicio], (err, results) => {
        if (err) return res.status(500).json({ mensaje: "Error al verificar disponibilidad" });

        if (results.length > 0) {
            return res.status(409).json({ mensaje: "La pista ya está reservada en ese horario" });
        }

        // Si la pista está libre, se procede a insertar la reserva
        const sqlInsert = 'INSERT INTO reservas (id_usuario, id_pista, fecha, hora_inicio, hora_fin) VALUES (?, ?, ?, ?, ?)';
        db.query(sqlInsert, [id_usuario, id_pista, fecha, hora_inicio, hora_fin], (err, result) => {
            if (err) return res.status(500).json({ mensaje: "Error al crear la reserva" });
            res.json({ mensaje: "Reserva creada con éxito", idReserva: result.insertId });
        });
    });
});

/**
 * Obtiene el historial de reservas de un usuario específico.
 */
app.get('/api/reservas/usuario/:id', (req, res) => {
    const { id } = req.params;
    // JOIN con pistas para mostrar información detallada al usuario
    const sql = `
        SELECT r.id, r.fecha, r.hora_inicio, r.hora_fin, p.nombre AS pista_nombre, p.tipo AS pista_tipo
        FROM reservas r
        JOIN pistas p ON r.id_pista = p.id
        WHERE r.id_usuario = ?
        ORDER BY r.fecha DESC, r.hora_inicio DESC
    `;

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ mensaje: "Error al obtener las reservas" });
        res.json(results);
    });
});

/**
 * Obtiene los horarios ocupados de una pista en una fecha dada.
 * Útil para que el cliente sepa qué horas NO puede reservar.
 */
app.get('/api/reservas/:id_pista/:fecha', (req, res) => {
    const { id_pista, fecha } = req.params;
    const sql = 'SELECT hora_inicio, hora_fin FROM reservas WHERE id_pista = ? AND fecha = ? ORDER BY hora_inicio ASC';
    db.query(sql, [id_pista, fecha], (err, results) => {
        if (err) return res.status(500).json({ mensaje: "Error al obtener reservas de la fecha" });
        res.json(results);
    });
});

/**
 * Cancela (elimina) una reserva por su ID.
 */
app.delete('/api/reservas/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM reservas WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ mensaje: "Error al cancelar la reserva" });
        res.json({ mensaje: "Reserva cancelada correctamente" });
    });
});

// Puesta en marcha del servidor en el puerto 3000
app.listen(3000, () => console.log("Servidor SportLogix corriendo en puerto 3000"));