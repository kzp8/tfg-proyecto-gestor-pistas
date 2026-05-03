document.addEventListener('DOMContentLoaded', () => {
    // --- SEGURIDAD Y CONTROL DE ACCESO ---
    
    // Se verifica que el usuario esté logueado y tenga el rol de 'admin'
    const usuarioJSON = localStorage.getItem('usuario');
    const usuario = usuarioJSON ? JSON.parse(usuarioJSON) : null;

    if (!usuario || usuario.rol !== 'admin') {
        alert("Acceso denegado: Se requieren permisos de administrador.");
        window.location.href = 'index.html'; // Redirección si no es admin
        return;
    }

    // Referencias a elementos del DOM principales
    const tabla = document.getElementById('tabla-pistas-admin');
    const seccionInventario = document.getElementById('seccion-inventario');
    const seccionReservas = document.getElementById('seccion-reservas');
    const seccionEstadisticas = document.getElementById('seccion-estadisticas');

    // --- MENÚ MÓVIL ADMINISTRATIVO ---
    const btnAdminMobileMenu = document.getElementById('btn-admin-mobile-menu');
    const adminMobileMenu = document.getElementById('admin-mobile-menu');
    
    if (btnAdminMobileMenu && adminMobileMenu) {
        btnAdminMobileMenu.addEventListener('click', () => {
            adminMobileMenu.classList.toggle('hidden');
        });
    }

    // --- NAVEGACIÓN ENTRE SECCIONES DEL PANEL (PESTAÑAS) ---
    const linkPistas = document.getElementById('link-pistas');
    const linkReservas = document.getElementById('link-reservas');
    const linkEstadisticas = document.getElementById('link-estadisticas');
    const linkMobilePistas = document.getElementById('link-mobile-pistas');
    const linkMobileReservas = document.getElementById('link-mobile-reservas');
    const linkMobileEstadisticas = document.getElementById('link-mobile-estadisticas');

    /**
     * Gestiona el cambio de vista entre Inventario, Reservas y Estadísticas.
     */
    function activarPestaña(pestaña) {
        // Limpiar estilos de todos los enlaces de navegación
        const allLinks = [linkPistas, linkMobilePistas, linkReservas, linkMobileReservas, linkEstadisticas, linkMobileEstadisticas];
        allLinks.forEach(el => {
            if(el) {
                el.classList.remove('bg-emerald-600', 'text-white', 'font-bold');
                el.classList.add('text-slate-400');
            }
        });

        // Ocultar todas las secciones de contenido
        if(seccionInventario) seccionInventario.classList.add('hidden');
        if(seccionReservas) seccionReservas.classList.add('hidden');
        if(seccionEstadisticas) seccionEstadisticas.classList.add('hidden');

        // Activar la sección correspondiente y cargar sus datos
        if (pestaña === 'pistas') {
            [linkPistas, linkMobilePistas].forEach(el => {
                if(el) { el.classList.add('bg-emerald-600', 'text-white', 'font-bold'); el.classList.remove('text-slate-400'); }
            });
            if(seccionInventario) seccionInventario.classList.remove('hidden');
        } else if (pestaña === 'reservas') {
            [linkReservas, linkMobileReservas].forEach(el => {
                if(el) { el.classList.add('bg-emerald-600', 'text-white', 'font-bold'); el.classList.remove('text-slate-400'); }
            });
            if(seccionReservas) seccionReservas.classList.remove('hidden');
            
            // Carga inicial de reservas con la fecha actual
            const inputFecha = document.getElementById('filtro-fecha-admin');
            if (inputFecha) {
                if(!inputFecha.value) inputFecha.value = new Date().toISOString().split('T')[0];
                cargarReservasAdmin(inputFecha.value);
            }
        } else if (pestaña === 'estadisticas') {
            [linkEstadisticas, linkMobileEstadisticas].forEach(el => {
                if(el) { el.classList.add('bg-emerald-600', 'text-white', 'font-bold'); el.classList.remove('text-slate-400'); }
            });
            if(seccionEstadisticas) seccionEstadisticas.classList.remove('hidden');
            
            // Carga inicial de estadísticas (Histórico Total por defecto)
            const selectPeriodo = document.getElementById('filtro-periodo-stats');
            cargarEstadisticas(selectPeriodo ? selectPeriodo.value : 'total');
        }
        
        // Cerrar menú móvil automáticamente tras seleccionar pestaña
        if (adminMobileMenu) adminMobileMenu.classList.add('hidden');
    }

    // Eventos de clic para todos los enlaces de navegación
    if (linkPistas) linkPistas.onclick = (e) => { e.preventDefault(); activarPestaña('pistas'); };
    if (linkMobilePistas) linkMobilePistas.onclick = (e) => { e.preventDefault(); activarPestaña('pistas'); };
    if (linkReservas) linkReservas.onclick = (e) => { e.preventDefault(); activarPestaña('reservas'); };
    if (linkMobileReservas) linkMobileReservas.onclick = (e) => { e.preventDefault(); activarPestaña('reservas'); };
    if (linkEstadisticas) linkEstadisticas.onclick = (e) => { e.preventDefault(); activarPestaña('estadisticas'); };
    if (linkMobileEstadisticas) linkMobileEstadisticas.onclick = (e) => { e.preventDefault(); activarPestaña('estadisticas'); };

    // --- GESTIÓN DE INVENTARIO (CRUD PISTAS) ---

    /**
     * Obtiene las pistas del servidor y las renderiza ordenadas por deporte y nombre.
     */
    async function cargarPistasAdmin() {
        try {
            const respuesta = await fetch('/api/pistas');
            let pistas = await respuesta.json();

            // Lógica de ordenación: Primero por tipo de deporte predefinido, luego alfabéticamente
            const ordenDeportes = { 'Pádel': 1, 'Fútbol 7': 2, 'Baloncesto': 3 };
            pistas.sort((a, b) => {
                const pesoA = ordenDeportes[a.tipo] || 99;
                const pesoB = ordenDeportes[b.tipo] || 99;
                return (pesoA !== pesoB) ? pesoA - pesoB : a.nombre.localeCompare(b.nombre, undefined, { numeric: true });
            });

            if(tabla) {
                tabla.innerHTML = '';
                pistas.forEach(pista => {
                    const fila = document.createElement('tr');
                    fila.className = "border-b border-slate-100 hover:bg-slate-50 transition";
                    fila.innerHTML = `
                        <td class="p-4 font-bold text-slate-700">${pista.nombre}</td>
                        <td class="p-4 text-slate-600">${pista.tipo}</td>
                        <td class="p-4 text-center">
                            <span class="${pista.estado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} text-[10px] font-black px-2 py-1 rounded-md uppercase">
                                ${pista.estado ? 'Activa' : 'Mantenimiento'}
                            </span>
                        </td>
                        <td class="p-4 text-center space-x-2">
                            <button onclick="abrirModalEdicion(${pista.id}, '${pista.nombre}', '${pista.tipo}')" class="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg font-bold transition">Editar</button>
                            <button onclick="cambiarEstado(${pista.id}, ${pista.estado})" class="text-xs ${pista.estado ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'} hover:opacity-70 px-3 py-1 rounded-lg font-bold transition">${pista.estado ? 'Poner en Mantenimiento' : 'Activar Pista'}</button>
                            <button onclick="eliminarPista(${pista.id})" class="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded-lg font-bold transition">Eliminar</button>
                        </td>
                    `;
                    tabla.appendChild(fila);
                });
            }
        } catch (error) {
            console.error("Error cargando el panel de SportLogix:", error);
        }
    }

    /**
     * Alterna entre estado 'Activa' y 'En Mantenimiento'.
     */
    window.cambiarEstado = async (id, estadoActual) => {
        const nuevoEstado = estadoActual === 1 ? 0 : 1;
        await fetch(`/api/pistas/estado/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevoEstado })
        });
        cargarPistasAdmin();
    };

    /**
     * Elimina definitivamente una instalación tras confirmación.
     */
    window.eliminarPista = async (id) => {
        if (confirm('¿Estás seguro de eliminar esta instalación?')) {
            await fetch(`/api/pistas/eliminar/${id}`, { method: 'DELETE' });
            cargarPistasAdmin();
        }
    };

    // --- GESTIÓN DE RESERVAS EN PANEL ADMIN ---
    
    const tablaReservasHoy = document.getElementById('tabla-reservas-hoy');
    const inputFechaAdmin = document.getElementById('filtro-fecha-admin');

    if (inputFechaAdmin) {
        inputFechaAdmin.addEventListener('change', (e) => {
            cargarReservasAdmin(e.target.value);
        });
    }

    /**
     * Carga las reservas registradas para una fecha específica.
     */
    async function cargarReservasAdmin(fechaStr) {
        if (!tablaReservasHoy || !fechaStr) return;
        try {
            const respuesta = await fetch(`/api/admin/reservas/fecha/${fechaStr}`);
            const reservas = await respuesta.json();
            tablaReservasHoy.innerHTML = '';

            if (reservas.length === 0) {
                tablaReservasHoy.innerHTML = `<tr><td colspan="4" class="p-10 text-center text-slate-500 font-medium">No hay reservas para el día seleccionado.</td></tr>`;
                return;
            }

            reservas.forEach(reserva => {
                const horaIn = reserva.hora_inicio ? reserva.hora_inicio.substring(0, 5) : "??:??";
                const horaFin = reserva.hora_fin ? reserva.hora_fin.substring(0, 5) : "??:??";
                const fila = document.createElement('tr');
                fila.className = "border-b border-slate-100 hover:bg-slate-50 transition";
                fila.innerHTML = `
                    <td class="p-4 font-bold text-slate-700">${horaIn} - ${horaFin}</td>
                    <td class="p-4 font-bold text-emerald-700">${reserva.pista_nombre || 'Pista Eliminada'}</td>
                    <td class="p-4 text-slate-600">${reserva.usuario_nombre || 'Usuario Desconocido'}</td>
                    <td class="p-4 text-center flex items-center justify-center gap-2">
                        <span class="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md uppercase">Confirmada</span>
                        <button onclick="cancelarReservaAdmin(${reserva.id})" class="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded-lg font-bold transition">Cancelar</button>
                    </td>
                `;
                tablaReservasHoy.appendChild(fila);
            });
        } catch (error) {
            console.error("Error al cargar reservas:", error);
        }
    }

    // --- PANEL DE ESTADÍSTICAS ---
    
    const selectPeriodo = document.getElementById('filtro-periodo-stats');
    if (selectPeriodo) {
        selectPeriodo.addEventListener('change', (e) => {
            cargarEstadisticas(e.target.value);
        });
    }

    /**
     * Obtiene métricas de uso (total reservas, deporte favorito, pista más usada).
     * @param {string} periodo - 'dia', 'semana', 'mes' o 'total'.
     */
    async function cargarEstadisticas(periodo = 'total') {
        const txtTotal = document.getElementById('stat-total-reservas');
        const txtDeporte = document.getElementById('stat-deporte-favorito');
        const txtPista = document.getElementById('stat-pista-estrella');

        // Efecto visual de carga
        if (txtTotal) txtTotal.textContent = '...';
        if (txtDeporte) txtDeporte.textContent = '...';
        if (txtPista) txtPista.textContent = '...';

        try {
            const respuesta = await fetch(`/api/admin/estadisticas?periodo=${periodo}`);
            const data = await respuesta.json();

            // Inserción de resultados en las tarjetas
            if (txtTotal) txtTotal.textContent = data.total_reservas;
            if (txtDeporte) txtDeporte.textContent = data.deporte_favorito;
            if (txtPista) txtPista.textContent = data.pista_estrella;
        } catch (error) {
            console.error("Error al cargar estadísticas:", error);
        }
    }

    // --- CANCELACIÓN DE RESERVAS (MODAL DE CONFIRMACIÓN) ---
    
    const modalCancelarReserva = document.getElementById('modal-cancelar-reserva');
    const btnCerrarModalCancelar = document.getElementById('btn-cerrar-modal-cancelar');
    const btnConfirmarModalCancelar = document.getElementById('btn-confirmar-modal-cancelar');
    let idReservaACancelar = null;

    window.cancelarReservaAdmin = (idReserva) => {
        idReservaACancelar = idReserva;
        if(modalCancelarReserva) {
            modalCancelarReserva.classList.remove('hidden');
            setTimeout(() => modalCancelarReserva.classList.remove('opacity-0'), 10);
        }
    };

    if (btnCerrarModalCancelar) {
        btnCerrarModalCancelar.onclick = () => {
            modalCancelarReserva.classList.add('opacity-0');
            setTimeout(() => modalCancelarReserva.classList.add('hidden'), 300);
        };
    }

    if (btnConfirmarModalCancelar) {
        btnConfirmarModalCancelar.onclick = async () => {
            if (!idReservaACancelar) return;
            await fetch(`/api/reservas/${idReservaACancelar}`, { method: 'DELETE' });
            const f = document.getElementById('filtro-fecha-admin');
            cargarReservasAdmin(f ? f.value : new Date().toISOString().split('T')[0]);
            modalCancelarReserva.classList.add('opacity-0');
            setTimeout(() => modalCancelarReserva.classList.add('hidden'), 300);
        };
    }

    // --- FORMULARIOS DINÁMICOS: EDICIÓN Y CREACIÓN DE PISTAS ---

    /**
     * Genera un modal al vuelo para editar nombre y tipo de una pista.
     */
    window.abrirModalEdicion = (id, nombreActual, tipoActual) => {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = "fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50";
        modalOverlay.innerHTML = `
            <div class="bg-white p-8 rounded-3xl shadow-2xl w-96">
                <h2 class="text-2xl font-black text-slate-800 mb-6 uppercase">Editar Instalación</h2>
                <div class="space-y-4">
                    <input type="text" id="edit-nombre" value="${nombreActual}" class="w-full border rounded-xl px-4 py-3 outline-none">
                    <select id="edit-tipo" class="w-full border rounded-xl px-4 py-3 outline-none">
                        <option value="Pádel" ${tipoActual === 'Pádel' ? 'selected' : ''}>Pádel</option>
                        <option value="Fútbol 7" ${tipoActual === 'Fútbol 7' ? 'selected' : ''}>Fútbol 7</option>
                        <option value="Baloncesto" ${tipoActual === 'Baloncesto' ? 'selected' : ''}>Baloncesto</option>
                    </select>
                </div>
                <div class="flex gap-3 mt-8">
                    <button id="edit-cancelar" class="flex-1 py-3 text-slate-500 font-bold">Cancelar</button>
                    <button id="edit-guardar" class="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
        document.getElementById('edit-cancelar').onclick = () => modalOverlay.remove();
        document.getElementById('edit-guardar').onclick = async () => {
            const nombre = document.getElementById('edit-nombre').value;
            const tipo = document.getElementById('edit-tipo').value;
            await fetch(`/api/pistas/editar/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, tipo })
            });
            modalOverlay.remove();
            cargarPistasAdmin();
        };
    };

    /**
     * Genera un modal al vuelo para añadir una nueva pista al sistema.
     */
    const btnNueva = document.getElementById('btn-nueva-pista');
    if (btnNueva) {
        btnNueva.onclick = () => {
            const modalOverlay = document.createElement('div');
            modalOverlay.className = "fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50";
            modalOverlay.innerHTML = `
                <div class="bg-white p-8 rounded-3xl shadow-2xl w-96">
                    <h2 class="text-2xl font-black text-slate-800 mb-6 uppercase">Nueva Instalación</h2>
                    <div class="space-y-4">
                        <input type="text" id="modal-nombre" placeholder="Nombre" class="w-full border rounded-xl px-4 py-3 outline-none">
                        <select id="modal-tipo" class="w-full border rounded-xl px-4 py-3 outline-none">
                            <option value="Pádel">Pádel</option>
                            <option value="Fútbol 7">Fútbol 7</option>
                            <option value="Baloncesto">Baloncesto</option>
                        </select>
                    </div>
                    <div class="flex gap-3 mt-8">
                        <button id="modal-cancelar" class="flex-1 py-3 text-slate-500 font-bold">Cancelar</button>
                        <button id="modal-guardar" class="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold">Guardar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modalOverlay);
            document.getElementById('modal-cancelar').onclick = () => modalOverlay.remove();
            document.getElementById('modal-guardar').onclick = async () => {
                const nombre = document.getElementById('modal-nombre').value;
                const tipo = document.getElementById('modal-tipo').value;
                if (nombre) {
                    await fetch('/api/pistas/crear', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre, tipo })
                    });
                    modalOverlay.remove();
                    cargarPistasAdmin();
                }
            };
        };
    }

    // --- GESTIÓN DE RESERVA FORZADA (ADMIN MANUAL) ---

    const btnReservaForzada = document.getElementById('btn-reserva-forzada');
    const modalReservaForzada = document.getElementById('modal-reserva-forzada');
    const btnCerrarModalRF = document.getElementById('btn-cerrar-modal-rf');
    const formReservaForzada = document.getElementById('form-reserva-forzada');
    const selectRFUsuario = document.getElementById('rf-usuario');
    const selectRFPista = document.getElementById('rf-pista');

    if (btnReservaForzada) {
        btnReservaForzada.onclick = async () => {
            // Abrir modal
            if (modalReservaForzada) {
                modalReservaForzada.classList.remove('hidden');
                setTimeout(() => modalReservaForzada.classList.remove('opacity-0'), 10);
            }

            // Cargar usuarios y pistas para los selectores
            cargarSelectoresRF();
        };
    }

    if (btnCerrarModalRF) {
        btnCerrarModalRF.onclick = () => cerrarModalRF();
    }

    function cerrarModalRF() {
        if (modalReservaForzada) {
            modalReservaForzada.classList.add('opacity-0');
            setTimeout(() => modalReservaForzada.classList.add('hidden'), 300);
            formReservaForzada.reset();
        }
    }

    /**
     * Obtiene usuarios y pistas y rellena los campos select del modal.
     */
    async function cargarSelectoresRF() {
        try {
            // Fetch Usuarios
            const resUsers = await fetch('/api/admin/usuarios');
            const users = await resUsers.json();
            if (selectRFUsuario) {
                selectRFUsuario.innerHTML = '<option value="" disabled selected>Selecciona un usuario...</option>';
                users.forEach(u => {
                    const opt = document.createElement('option');
                    opt.value = u.id;
                    opt.textContent = `${u.nombre} (${u.email})`;
                    selectRFUsuario.appendChild(opt);
                });
            }

            // Fetch Pistas
            const resPistas = await fetch('/api/pistas');
            const pistas = await resPistas.json();
            if (selectRFPista) {
                selectRFPista.innerHTML = '<option value="" disabled selected>Selecciona una pista...</option>';
                pistas.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = p.nombre;
                    selectRFPista.appendChild(opt);
                });
            }
        } catch (error) {
            console.error("Error cargando selectores de reserva forzada:", error);
        }
    }

    if (formReservaForzada) {
        formReservaForzada.onsubmit = async (e) => {
            e.preventDefault();

            const datos = {
                id_usuario: document.getElementById('rf-usuario').value,
                id_pista: document.getElementById('rf-pista').value,
                fecha: document.getElementById('rf-fecha').value,
                hora_inicio: document.getElementById('rf-hora-inicio').value,
                hora_fin: document.getElementById('rf-hora-fin').value
            };

            try {
                const respuesta = await fetch('/api/admin/reservas/forzar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });

                const resultado = await respuesta.json();

                if (respuesta.ok) {
                    alert("✅ Reserva forzada creada con éxito.");
                    cerrarModalRF();
                    // Recargar tabla si la fecha coincide
                    const f = document.getElementById('filtro-fecha-admin');
                    if (f && f.value === datos.fecha) {
                        cargarReservasAdmin(f.value);
                    } else if (f) {
                        f.value = datos.fecha;
                        cargarReservasAdmin(f.value);
                    }
                } else {
                    alert(`❌ Error: ${resultado.mensaje}`);
                }
            } catch (error) {
                console.error("Error al crear reserva forzada:", error);
                alert("Ocurrió un error inesperado al procesar la reserva.");
            }
        };
    }

    // Inicialización del panel cargando las pistas existentes
    cargarPistasAdmin();
});