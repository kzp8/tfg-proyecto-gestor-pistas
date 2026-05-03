document.addEventListener('DOMContentLoaded', () => {
    // --- SEGURIDAD: CONTROL DE ACCESO ---
    const usuarioJSON = localStorage.getItem('usuario');
    const usuario = usuarioJSON ? JSON.parse(usuarioJSON) : null;

    if (!usuario || usuario.rol !== 'admin') {
        alert("Acceso denegado: Se requieren permisos de administrador.");
        window.location.href = 'index.html';
        return;
    }

    const tabla = document.getElementById('tabla-pistas-admin');
    const seccionInventario = document.getElementById('seccion-inventario');
    const seccionReservas = document.getElementById('seccion-reservas');
    const seccionEstadisticas = document.getElementById('seccion-estadisticas');

    // --- Lógica Menú Móvil Admin ---
    const btnAdminMobileMenu = document.getElementById('btn-admin-mobile-menu');
    const adminMobileMenu = document.getElementById('admin-mobile-menu');
    
    if (btnAdminMobileMenu && adminMobileMenu) {
        btnAdminMobileMenu.addEventListener('click', () => {
            adminMobileMenu.classList.toggle('hidden');
        });
    }

    // --- NAVEGACIÓN POR PESTAÑAS ---
    const linkPistas = document.getElementById('link-pistas');
    const linkReservas = document.getElementById('link-reservas');
    const linkEstadisticas = document.getElementById('link-estadisticas');
    const linkMobilePistas = document.getElementById('link-mobile-pistas');
    const linkMobileReservas = document.getElementById('link-mobile-reservas');
    const linkMobileEstadisticas = document.getElementById('link-mobile-estadisticas');

    function activarPestaña(pestaña) {
        // Reset styles (Desktop + Mobile)
        const allLinks = [linkPistas, linkMobilePistas, linkReservas, linkMobileReservas, linkEstadisticas, linkMobileEstadisticas];
        allLinks.forEach(el => {
            if(el) {
                el.classList.remove('bg-emerald-600', 'text-white', 'font-bold');
                el.classList.add('text-slate-400');
            }
        });

        // Ocultar todas las secciones
        if(seccionInventario) seccionInventario.classList.add('hidden');
        if(seccionReservas) seccionReservas.classList.add('hidden');
        if(seccionEstadisticas) seccionEstadisticas.classList.add('hidden');

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
            
            const selectPeriodo = document.getElementById('filtro-periodo-stats');
            cargarEstadisticas(selectPeriodo ? selectPeriodo.value : 'total');
        }
        
        if (adminMobileMenu) adminMobileMenu.classList.add('hidden');
    }

    if (linkPistas) linkPistas.onclick = (e) => { e.preventDefault(); activarPestaña('pistas'); };
    if (linkMobilePistas) linkMobilePistas.onclick = (e) => { e.preventDefault(); activarPestaña('pistas'); };
    if (linkReservas) linkReservas.onclick = (e) => { e.preventDefault(); activarPestaña('reservas'); };
    if (linkMobileReservas) linkMobileReservas.onclick = (e) => { e.preventDefault(); activarPestaña('reservas'); };
    if (linkEstadisticas) linkEstadisticas.onclick = (e) => { e.preventDefault(); activarPestaña('estadisticas'); };
    if (linkMobileEstadisticas) linkMobileEstadisticas.onclick = (e) => { e.preventDefault(); activarPestaña('estadisticas'); };

    // 1. Cargar las pistas desde la base de datos con ORDENACIÓN
    async function cargarPistasAdmin() {
        try {
            const respuesta = await fetch('/api/pistas');
            let pistas = await respuesta.json();

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

    window.cambiarEstado = async (id, estadoActual) => {
        const nuevoEstado = estadoActual === 1 ? 0 : 1;
        await fetch(`/api/pistas/estado/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuevoEstado })
        });
        cargarPistasAdmin();
    };

    window.eliminarPista = async (id) => {
        if (confirm('¿Estás seguro de eliminar esta instalación?')) {
            await fetch(`/api/pistas/eliminar/${id}`, { method: 'DELETE' });
            cargarPistasAdmin();
        }
    };

    // --- SECCIÓN: RESERVAS POR FECHA ---
    const tablaReservasHoy = document.getElementById('tabla-reservas-hoy');
    const inputFechaAdmin = document.getElementById('filtro-fecha-admin');

    if (inputFechaAdmin) {
        inputFechaAdmin.addEventListener('change', (e) => {
            cargarReservasAdmin(e.target.value);
        });
    }

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

    // --- SECCIÓN: ESTADÍSTICAS ---
    const selectPeriodo = document.getElementById('filtro-periodo-stats');
    if (selectPeriodo) {
        selectPeriodo.addEventListener('change', (e) => {
            cargarEstadisticas(e.target.value);
        });
    }

    async function cargarEstadisticas(periodo = 'total') {
        const txtTotal = document.getElementById('stat-total-reservas');
        const txtDeporte = document.getElementById('stat-deporte-favorito');
        const txtPista = document.getElementById('stat-pista-estrella');

        // Ponemos puntos suspensivos mientras carga para dar feedback
        if (txtTotal) txtTotal.textContent = '...';
        if (txtDeporte) txtDeporte.textContent = '...';
        if (txtPista) txtPista.textContent = '...';

        try {
            const respuesta = await fetch(`/api/admin/estadisticas?periodo=${periodo}`);
            const data = await respuesta.json();

            if (txtTotal) txtTotal.textContent = data.total_reservas;
            if (txtDeporte) txtDeporte.textContent = data.deporte_favorito;
            if (txtPista) txtPista.textContent = data.pista_estrella;
        } catch (error) {
            console.error("Error al cargar estadísticas:", error);
        }
    }

    // --- CANCELACIÓN CON MODAL ---
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

    // --- EDICIÓN Y CREACIÓN ---
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

    cargarPistasAdmin();
});