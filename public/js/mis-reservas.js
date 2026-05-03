document.addEventListener('DOMContentLoaded', () => {
    // --- 1. VERIFICACIÓN DE SESIÓN ---
    
    // Se recupera el usuario del LocalStorage para asegurar que está logueado
    const usuarioJSON = localStorage.getItem('usuario');
    if (!usuarioJSON) {
        window.location.href = 'login.html'; // Redirección si no hay sesión
        return;
    }
    const usuario = JSON.parse(usuarioJSON);

    // --- 2. PERSONALIZACIÓN DE LA INTERFAZ ---
    
    // Inserción de nombre e inicial del usuario en el menú
    const txtIniciales = document.querySelectorAll('.inicial-usuario');
    const txtNombres = document.querySelectorAll('.nombre-usuario');
    
    txtIniciales.forEach(el => el.textContent = usuario.nombre.charAt(0).toUpperCase());
    txtNombres.forEach(el => el.textContent = usuario.nombre);

    // Si el usuario es administrador, se le muestra el acceso al panel técnico
    const contenedoresAdmin = document.querySelectorAll('.contenedor-admin');
    if (usuario.rol === 'admin') {
        contenedoresAdmin.forEach(contenedor => {
            contenedor.innerHTML = `
                <a href="admin.html" class="bg-white/20 hover:bg-white/40 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition border border-white/30 flex items-center gap-2">
                    ⚙️ Panel Admin
                </a>
            `;
        });
    }

    // Configuración del botón de cierre de sesión
    const btnsLogout = document.querySelectorAll('.btn-logout');
    btnsLogout.forEach(btn => {
        btn.addEventListener('click', () => {
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        });
    });

    // --- 3. CARGA DINÁMICA DE RESERVAS ---
    
    const contenedorReservas = document.getElementById('contenedor-reservas');

    /**
     * Obtiene las reservas del usuario actual desde la API y las renderiza como tarjetas.
     */
    async function cargarMisReservas() {
        if (!contenedorReservas) return;

        try {
            const respuesta = await fetch(`/api/reservas/usuario/${usuario.id}`);
            
            if (!respuesta.ok) {
                throw new Error("Error HTTP: " + respuesta.status);
            }

            const reservas = await respuesta.json();
            contenedorReservas.innerHTML = ''; // Limpiar mensaje de carga

            // Caso: El usuario no tiene reservas todavía
            if (reservas.length === 0) {
                contenedorReservas.innerHTML = `
                    <div class="col-span-full py-20 text-center">
                        <div class="text-6xl mb-4 opacity-50">🏟️</div>
                        <h3 class="text-2xl font-bold text-slate-700 mb-2">No tienes reservas activas</h3>
                        <p class="text-slate-500 mb-6">Explora nuestras instalaciones y reserva tu pista ahora.</p>
                        <a href="index.html" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg inline-block">Ver Pistas Disponibles</a>
                    </div>
                `;
                return;
            }

            // Renderizado de cada reserva
            reservas.forEach(reserva => {
                // Lógica de iconos según el deporte
                let icono = '🎾';
                let tipo = 'Pista';
                
                if (reserva.pista_tipo) {
                    tipo = reserva.pista_tipo;
                    const tipoLower = tipo.toLowerCase();
                    if (tipoLower.includes('fútbol')) icono = '⚽';
                    else if (tipoLower.includes('baloncesto')) icono = '🏀';
                }

                // Formateo de fecha para que sea legible (ej: lunes, 5 de mayo)
                let fechaFormateada = reserva.fecha;
                if (reserva.fecha) {
                    const fechaDate = new Date(reserva.fecha);
                    fechaFormateada = fechaDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                }

                // Limpieza de formato de hora (quitar segundos)
                let horaIn = "00:00";
                if (reserva.hora_inicio && typeof reserva.hora_inicio === 'string') {
                    horaIn = reserva.hora_inicio.substring(0, 5);
                }
                
                let horaFin = "00:00";
                if (reserva.hora_fin && typeof reserva.hora_fin === 'string') {
                    horaFin = reserva.hora_fin.substring(0, 5);
                }

                // Creación de la tarjeta (Card) con Tailwind
                const card = document.createElement('div');
                card.className = "bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-xl transition-shadow duration-300 relative overflow-hidden";

                card.innerHTML = `
                    <div class="absolute -right-6 -top-6 text-8xl opacity-5 pointer-events-none">${icono}</div>
                    <div>
                        <div class="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h3 class="text-xl font-bold text-slate-800">${reserva.pista_nombre || 'Desconocida'}</h3>
                                <p class="text-slate-500 text-sm italic">${tipo}</p>
                            </div>
                            <span class="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                                Confirmada
                            </span>
                        </div>
                        
                        <div class="space-y-3 mt-6 relative z-10">
                            <div class="flex items-center gap-3 text-slate-700">
                                <span class="bg-slate-100 p-2 rounded-lg">📅</span>
                                <div>
                                    <p class="text-xs text-slate-500 font-bold uppercase">Fecha</p>
                                    <p class="font-medium capitalize">${fechaFormateada}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3 text-slate-700">
                                <span class="bg-slate-100 p-2 rounded-lg">⏱️</span>
                                <div>
                                    <p class="text-xs text-slate-500 font-bold uppercase">Horario</p>
                                    <p class="font-medium">${horaIn} - ${horaFin}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Botón de cancelación -->
                    <button onclick="cancelarReserva(${reserva.id})" class="w-full mt-8 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 py-3 rounded-xl font-bold transition relative z-10 group">
                        <span class="group-hover:hidden">Cancelar Reserva</span>
                        <span class="hidden group-hover:block">¿Estás seguro?</span>
                    </button>
                `;
                contenedorReservas.appendChild(card);
            });

        } catch (error) {
            console.error("Error al cargar reservas:", error);
            if (contenedorReservas) {
                contenedorReservas.innerHTML = `<p class="text-red-500 col-span-full text-center py-10 font-medium">Error al cargar las reservas. Detalle: ${error.message}</p>`;
            }
        }
    }

    // --- 4. CANCELACIÓN DE RESERVAS ---

    /**
     * Elimina una reserva del sistema tras confirmación del usuario.
     */
    window.cancelarReserva = async (idReserva) => {
        if (!confirm("¿Seguro que deseas cancelar esta reserva de forma permanente?")) return;

        try {
            const respuesta = await fetch(`/api/reservas/${idReserva}`, {
                method: 'DELETE'
            });

            if (respuesta.ok) {
                alert("Reserva cancelada correctamente.");
                cargarMisReservas(); // Refrescar el listado automáticamente
            } else {
                alert("Error al cancelar la reserva en el servidor.");
            }
        } catch (error) {
            console.error("Error al cancelar:", error);
            alert("No se pudo conectar con el servidor para cancelar.");
        }
    };

    // Inicialización de la carga de datos
    cargarMisReservas();

    // Lógica del menú móvil (Abrir/Cerrar)
    const btnMenu = document.getElementById('btn-mobile-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    if (btnMenu && mobileMenu) {
        btnMenu.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
});

