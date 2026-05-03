const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración del Pool de Conexiones (Más estable que una conexión única)
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gestor_polideportivo',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log("✅ Sistema de base de datos (Pool) inicializado");

// --- RUTAS DE USUARIO ---

// Registro
app.post('/api/registrar', (req, res) => {
    const { nombre, email, password } = req.body;
    const sql = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, "user")';

    db.query(sql, [nombre, email, password], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ mensaje: "El correo ya existe" });
            }
            return res.status(500).json({ mensaje: "Error al registrar" });
        }
        res.json({ mensaje: "Usuario registrado con éxito" });
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE email = ?';

    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ mensaje: "Error en el servidor" });
        if (results.length === 0) return res.status(401).json({ mensaje: "Usuario no encontrado" });

        const usuario = results[0];
        if (usuario.password !== password) {
            return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        }

        res.json({
            mensaje: "Login correcto",
            usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }
        });
    });
});

// --- RUTAS DE PISTAS (GENERAL) ---

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

// --- NUEVAS RUTAS DE ADMINISTRACIÓN (CRUD) ---

// 1. Crear una nueva pista
app.post('/api/pistas/crear', (req, res) => {
    const { nombre, tipo } = req.body;
    const sql = 'INSERT INTO pistas (nombre, tipo, estado) VALUES (?, ?, 1)';

    db.query(sql, [nombre, tipo], (err, result) => {
        if (err) return res.status(500).json({ mensaje: "Error al crear la pista" });
        res.json({ mensaje: "Pista creada con éxito", idPista: result.insertId });
    });
});

// 2. Cambiar estado (Activa/Mantenimiento)
app.put('/api/pistas/estado/:id', (req, res) => {
    const { id } = req.params;
    const { nuevoEstado } = req.body;
    const sql = 'UPDATE pistas SET estado = ? WHERE id = ?';

    db.query(sql, [nuevoEstado, id], (err, result) => {
        if (err) return res.status(500).json({ mensaje: "Error al actualizar estado" });
        res.json({ mensaje: "Estado actualizado correctamente" });
    });
});

// 3. Eliminar una pista definitivamente
app.delete('/api/pistas/eliminar/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM pistas WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ mensaje: "Error al eliminar la pista" });
        res.json({ mensaje: "Pista eliminada correctamente" });
    });
});

// 4. NUEVO: Editar nombre y tipo de una pista
app.put('/api/pistas/editar/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, tipo } = req.body;
    const sql = 'UPDATE pistas SET nombre = ?, tipo = ? WHERE id = ?';

    db.query(sql, [nombre, tipo, id], (err, result) => {
        if (err) return res.status(500).json({ mensaje: "Error al editar la pista" });
        res.json({ mensaje: "Pista editada correctamente" });
    });
});

// --- RUTAS DE RESERVAS ---

// Obtener reservas de una fecha específica para el panel de administración
app.get('/api/admin/reservas/fecha/:fecha', (req, res) => {
    const { fecha } = req.params;
    
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

// Obtener estadísticas globales con filtros de tiempo para el panel de administración
app.get('/api/admin/estadisticas', (req, res) => {
    const { periodo } = req.query; // dia, semana, mes, total
    let filtroFecha = "";

    if (periodo === 'dia') {
        filtroFecha = "WHERE r.fecha >= CURDATE()";
    } else if (periodo === 'semana') {
        filtroFecha = "WHERE r.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    } else if (periodo === 'mes') {
        filtroFecha = "WHERE r.fecha >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)";
    }

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

// 1. Crear una nueva reserva
app.post('/api/reservas', (req, res) => {
    const { id_usuario, id_pista, fecha, hora_inicio, hora_fin } = req.body;

    // Validación de formato y hora en punto
    const horaInicioStr = hora_inicio.substring(0, 5); // formato "HH:MM"
    const horaFinStr = hora_fin.substring(0, 5);

    if (!horaInicioStr.endsWith(':00') || !horaFinStr.endsWith(':00')) {
        return res.status(400).json({
            mensaje: "Las reservas solo se pueden hacer de hora en hora (ej. 16:00, 17:00)."
        });
    }

    const inicioMinutos = parseInt(horaInicioStr.split(':')[0], 10) * 60;
    const finMinutos = parseInt(horaFinStr.split(':')[0], 10) * 60;

    const aperturaManana = 8 * 60; // 08:00
    const cierreManana = 13 * 60; // 13:00
    const aperturaTarde = 15 * 60; // 15:00
    const cierreTarde = 22 * 60; // 22:00

    // Comprobar si las horas están fuera del horario permitido
    const esHorarioManana = (inicioMinutos >= aperturaManana && finMinutos <= cierreManana);
    const esHorarioTarde = (inicioMinutos >= aperturaTarde && finMinutos <= cierreTarde);

    if (!esHorarioManana && !esHorarioTarde) {
        return res.status(400).json({
            mensaje: "Horario no válido. Abrimos de 08:00 a 13:00 y de 15:00 a 22:00."
        });
    }

    // Validación de duración máxima (2 horas = 120 minutos)
    const duracionReserva = finMinutos - inicioMinutos;
    if (duracionReserva > 120) {
        return res.status(400).json({
            mensaje: "Las reservas no pueden exceder las 2 horas de duración."
        });
    }

    // Verificar si ya existe una reserva que se solape (misma pista y fecha, y las horas se cruzan)

    // Las horas se solapan si: (A_inicio < B_fin) Y (A_fin > B_inicio)
    // Para simplificar la validación en MySQL:
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

        // Si no hay solapamiento, crear reserva
        const sqlInsert = 'INSERT INTO reservas (id_usuario, id_pista, fecha, hora_inicio, hora_fin) VALUES (?, ?, ?, ?, ?)';
        db.query(sqlInsert, [id_usuario, id_pista, fecha, hora_inicio, hora_fin], (err, result) => {
            if (err) return res.status(500).json({ mensaje: "Error al crear la reserva" });
            res.json({ mensaje: "Reserva creada con éxito", idReserva: result.insertId });
        });
    });
});

// 2. Obtener reservas de un usuario
app.get('/api/reservas/usuario/:id', (req, res) => {
    const { id } = req.params;
    // Hacemos JOIN con pistas para tener el nombre y tipo de pista
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

// Obtener reservas de una pista en una fecha concreta (para mostrar disponibilidad)
app.get('/api/reservas/:id_pista/:fecha', (req, res) => {
    const { id_pista, fecha } = req.params;
    const sql = 'SELECT hora_inicio, hora_fin FROM reservas WHERE id_pista = ? AND fecha = ? ORDER BY hora_inicio ASC';
    db.query(sql, [id_pista, fecha], (err, results) => {
        if (err) return res.status(500).json({ mensaje: "Error al obtener reservas de la fecha" });
        res.json(results);
    });
});

// 3. Cancelar una reserva
app.delete('/api/reservas/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM reservas WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ mensaje: "Error al cancelar la reserva" });
        res.json({ mensaje: "Reserva cancelada correctamente" });
    });
});

app.listen(3000, () => console.log("Servidor SportLogix corriendo en puerto 3000"));