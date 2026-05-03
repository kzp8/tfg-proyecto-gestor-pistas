document.addEventListener('DOMContentLoaded', () => {
    // Obtener usuario del LocalStorage
    const usuarioJSON = localStorage.getItem('usuario');

    if (!usuarioJSON) {
        window.location.href = 'login.html';
        return;
    }

    const usuario = JSON.parse(usuarioJSON);

    // Personalizar la interfaz con el nombre del usuario
    const txtNombre = document.querySelectorAll('.nombre-usuario');
    const txtInicial = document.querySelectorAll('.inicial-usuario');

    if (txtNombre.length > 0) {
        txtNombre.forEach(el => el.textContent = usuario.nombre);
    }
    if (txtInicial.length > 0) {
        txtInicial.forEach(el => el.textContent = usuario.nombre.charAt(0).toUpperCase());
    }

    // --- LÓGICA BOTÓN ADMIN ---
    const contenedoresAdmin = document.querySelectorAll('.contenedor-admin');
    if (usuario.rol === 'admin' && contenedoresAdmin.length > 0) {
        contenedoresAdmin.forEach(contenedor => {
            contenedor.innerHTML = `
                <a href="admin.html" class="bg-white/20 hover:bg-white/40 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition border border-white/30 flex items-center gap-2 w-fit">
                    ⚙️ Panel Admin
                </a>
            `;
        });
    }

    // Cerrar Sesion
    const btnsLogout = document.querySelectorAll('.btn-logout');
    btnsLogout.forEach(btn => {
        btn.addEventListener('click', () => {
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        });
    });

    // Menú móvil
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const mobileMenu = document.getElementById('mobile-menu');

    if (btnMobileMenu && mobileMenu) {
        btnMobileMenu.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- RESTRICCIÓN DE FECHAS (No permitir fechas pasadas) ---
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (dateInputs.length > 0) {
        const hoy = new Date();
        const hoyStr = hoy.toISOString().split('T')[0];
        dateInputs.forEach(input => {
            input.setAttribute('min', hoyStr);
            // Si el input está vacío, poner la fecha de hoy por defecto para mayor comodidad
            if (!input.value) {
                input.value = hoyStr;
            }
        });
    }

    // CARGAR PISTAS DINAMICAMENTE
    async function cargarPistas(filtroDeporte = "") {
        const contenedor = document.getElementById('contenedor-pistas');
        if (!contenedor) return;

        try {
            const respuesta = await fetch('/api/pistas');
            let pistas = await respuesta.json();

            // Filtrar por deporte si hay uno seleccionado
            if (filtroDeporte && filtroDeporte !== "Todos los deportes" && filtroDeporte !== "") {
                pistas = pistas.filter(pista => pista.tipo.toLowerCase().includes(filtroDeporte.toLowerCase()));
            }

            contenedor.innerHTML = '';

            if (pistas.length === 0) {
                contenedor.innerHTML = '<p class="col-span-full text-center text-slate-400 py-10">No hay pistas disponibles para este deporte.</p>';
                return;
            }

            pistas.forEach(pista => {
                let icono = '🎾';
                const tipo = pista.tipo.toLowerCase();
                if (tipo.includes('fútbol')) icono = '⚽';
                else if (tipo.includes('baloncesto')) icono = '🏀';

                const card = document.createElement('div');
                card.className = "group bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300";

                card.innerHTML = `
                    <div class="h-32 ${pista.estado ? 'bg-emerald-100' : 'bg-slate-200'} flex items-center justify-center overflow-hidden">
                        <span class="text-5xl opacity-20 group-hover:scale-110 transition-transform duration-500">${icono}</span>
                    </div>
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-xl font-bold text-slate-800">${pista.nombre}</h3>
                                <p class="text-slate-500 text-sm italic">${pista.tipo}</p>
                            </div>
                            <span class="${pista.estado ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                                ${pista.estado ? 'Activa' : 'Mantenimiento'}
                            </span>
                        </div>
                        <button onclick="abrirModalReserva(${pista.id}, '${pista.nombre}')" class="w-full mt-4 ${pista.estado ? 'bg-slate-800 hover:bg-slate-900' : 'bg-slate-300 cursor-not-allowed'} text-white py-4 rounded-2xl font-bold transition shadow-lg" ${!pista.estado ? 'disabled' : ''}>
                            ${pista.estado ? 'Confirmar Reserva' : 'En Mantenimiento'}
                        </button>
                    </div>
                `;
                contenedor.appendChild(card);
            });
        } catch (error) {
            console.error("Error al cargar instalaciones:", error);
            contenedor.innerHTML = '<p class="col-span-full text-center text-slate-400 py-10">No se pudieron cargar las instalaciones de SportLogix.</p>';
        }
    }

    // LÓGICA DEL BUSCADOR
    const btnBuscar = document.getElementById('btn-buscar');
    const filtroDeporte = document.getElementById('filtro-deporte');
    const filtroFecha = document.getElementById('filtro-fecha');

    if (btnBuscar) {
        btnBuscar.addEventListener('click', () => {
            const deporteSeleccionado = filtroDeporte ? filtroDeporte.value : "";
            const fechaSeleccionada = filtroFecha ? filtroFecha.value : "";
            
            // Si el usuario seleccionó una fecha en el buscador, la guardamos globalmente
            // para que al abrir el modal de reserva ya aparezca seleccionada.
            if (fechaSeleccionada) {
                window.fechaBuscador = fechaSeleccionada;
            }
            
            cargarPistas(deporteSeleccionado);
        });
    }

    cargarPistas();

    // --- LÓGICA DEL MODAL DE RESERVAS ---
    const modalReserva = document.getElementById('modal-reserva');
    const formReserva = document.getElementById('form-reserva');
    const btnCancelarReserva = document.getElementById('btn-cancelar-reserva');
    const inputIdPista = document.getElementById('reserva-id-pista');
    const txtModalNombre = document.getElementById('modal-pista-nombre');
    const divError = document.getElementById('reserva-error');

    window.abrirModalReserva = (idPista, nombrePista) => {
        inputIdPista.value = idPista;
        txtModalNombre.textContent = nombrePista;
        divError.classList.add('hidden');
        
        // Reset form
        document.getElementById('form-reserva').reset();
        
        // Pre-rellenar fecha si se buscó antes
        if (window.fechaBuscador) {
            document.getElementById('reserva-fecha').value = window.fechaBuscador;
        }

        // Reiniciar selectFin
        const selectFin = document.getElementById('reserva-fin');
        if (selectFin) {
            selectFin.innerHTML = '<option value="">Selecciona primero el inicio</option>';
            selectFin.disabled = true;
        }

        modalReserva.classList.remove('hidden');
        setTimeout(() => modalReserva.classList.remove('opacity-0'), 10);
    };

    const cerrarModalReserva = () => {
        modalReserva.classList.add('opacity-0');
        setTimeout(() => modalReserva.classList.add('hidden'), 300);
    };

    if (btnCancelarReserva) {
        btnCancelarReserva.addEventListener('click', cerrarModalReserva);
    }

    // Modal de Horarios Ocupados y Pista Llena
    const btnVerHorarios = document.getElementById('btn-ver-horarios');
    const modalHorariosOcupados = document.getElementById('modal-horarios-ocupados');
    const btnCerrarHorarios = document.getElementById('btn-cerrar-horarios');
    const listaHorariosOcupados = document.getElementById('lista-horarios-ocupados');
    const btnConfirmarReserva = document.getElementById('btn-confirmar-reserva');
    const inputFecha = document.getElementById('reserva-fecha');

    if (btnCerrarHorarios && modalHorariosOcupados) {
        btnCerrarHorarios.addEventListener('click', () => {
            modalHorariosOcupados.classList.add('opacity-0');
            setTimeout(() => modalHorariosOcupados.classList.add('hidden'), 300);
        });
    }

    if (btnVerHorarios && modalHorariosOcupados) {
        btnVerHorarios.addEventListener('click', () => {
            modalHorariosOcupados.classList.remove('hidden');
            setTimeout(() => modalHorariosOcupados.classList.remove('opacity-0'), 10);
        });
    }

    if (inputFecha) {
        inputFecha.addEventListener('change', async () => {
            const fecha = inputFecha.value;
            const idPista = inputIdPista.value;
            
            if (!fecha || !idPista) return;

            btnVerHorarios.textContent = "Cargando...";
            btnVerHorarios.disabled = true;

            try {
                const respuesta = await fetch(`/api/reservas/${idPista}/${fecha}`);
                const reservas = await respuesta.json();

                listaHorariosOcupados.innerHTML = '';
                
                if (reservas.length === 0) {
                    listaHorariosOcupados.innerHTML = '<li class="text-emerald-600 font-bold p-3 bg-emerald-50 rounded-xl text-center">¡Toda la pista está libre!</li>';
                    btnConfirmarReserva.disabled = false;
                    btnConfirmarReserva.textContent = "Confirmar";
                    btnConfirmarReserva.classList.replace('bg-slate-400', 'bg-emerald-600');
                    btnVerHorarios.textContent = "Ver Ocupados";
                    btnVerHorarios.disabled = false;
                    return;
                }

                // Calcular horas ocupadas y mostrar en lista
                let totalHorasOcupadas = 0;

                reservas.forEach(r => {
                    const horaInStr = r.hora_inicio.substring(0, 5);
                    const horaFinStr = r.hora_fin.substring(0, 5);
                    listaHorariosOcupados.innerHTML += `<li class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">Ocupada de <span class="font-bold text-red-500">${horaInStr}</span> a <span class="font-bold text-red-500">${horaFinStr}</span></li>`;
                    
                    const hInicio = parseInt(horaInStr.split(':')[0], 10);
                    const hFin = parseInt(horaFinStr.split(':')[0], 10);
                    totalHorasOcupadas += (hFin - hInicio);
                });

                // Son 12 horas totales (08-13 = 5h) + (15-22 = 7h) = 12h
                if (totalHorasOcupadas >= 12) {
                    btnConfirmarReserva.disabled = true;
                    btnConfirmarReserva.textContent = "Pista Llena";
                    btnConfirmarReserva.classList.replace('bg-emerald-600', 'bg-slate-400');
                } else {
                    btnConfirmarReserva.disabled = false;
                    btnConfirmarReserva.textContent = "Confirmar";
                    btnConfirmarReserva.classList.replace('bg-slate-400', 'bg-emerald-600');
                }

                btnVerHorarios.textContent = "Ver Ocupados";
                btnVerHorarios.disabled = false;

            } catch (error) {
                console.error("Error al obtener ocupación:", error);
                listaHorariosOcupados.innerHTML = '<li class="text-red-500 text-sm">Error al cargar horarios.</li>';
                btnVerHorarios.textContent = "Ver Ocupados";
                btnVerHorarios.disabled = false;
            }
        });
    }

    const selectInicio = document.getElementById('reserva-inicio');
    const selectFin = document.getElementById('reserva-fin');

    if (selectInicio && selectFin) {
        selectInicio.addEventListener('change', () => {
            selectFin.innerHTML = ''; // Limpiar opciones

            if (!selectInicio.value) {
                selectFin.innerHTML = '<option value="">Selecciona primero el inicio</option>';
                selectFin.disabled = true;
                return;
            }

            selectFin.disabled = false;
            let horaInicio = parseInt(selectInicio.value.split(':')[0], 10);

            // Opción 1: +1 hora
            let hora1 = horaInicio + 1;
            // Para la hora de fin, la hora puede ser un número ocupado O la hora justo antes (ej si de 17 a 18 esta ocupado, a las 17:00 puede terminar)
            // Esto implica que si está ocupado, no lo ofrecemos como selectInicio. Pero selectFin tiene que asegurarse de que no se superponga.
            // Es más fácil que el selectFin solo valide:
            if (hora1 !== 14 && hora1 !== 15 && hora1 <= 22) { // Evitar la pausa de 13 a 15, y no pasar de cierre
                const hora1Str = hora1.toString().padStart(2, '0') + ':00';
                selectFin.innerHTML += `<option value="${hora1Str}">${hora1Str}</option>`;
            }

            // Opción 2: +2 horas
            let hora2 = horaInicio + 2;
            if (hora2 !== 14 && hora2 !== 15 && hora2 <= 22) {
                // Verificar si la +1 hora está ocupada en el selectInicio (si no está, es que está reservada)
                // Si la hora +1 no está en las options de selectInicio (excluyendo el placeholder), no se puede hacer reserva de 2h
                let hora1Ocupada = true;
                for (let i = 0; i < selectInicio.options.length; i++) {
                    if (selectInicio.options[i].value === (hora1.toString().padStart(2, '0') + ':00')) {
                        hora1Ocupada = false;
                        break;
                    }
                }

                if (!hora1Ocupada) {
                    const hora2Str = hora2.toString().padStart(2, '0') + ':00';
                    selectFin.innerHTML += `<option value="${hora2Str}">${hora2Str}</option>`;
                }
            }

            if (selectFin.options.length === 0) {
                selectFin.innerHTML = '<option value="">No hay horas de fin válidas</option>';
                selectFin.disabled = true;
            }
        });
    }

    if (formReserva) {
        formReserva.addEventListener('submit', async (e) => {
            e.preventDefault();
            divError.classList.add('hidden');

            const id_pista = inputIdPista.value;
            const fecha = document.getElementById('reserva-fecha').value;
            const hora_inicio = document.getElementById('reserva-inicio').value;
            const hora_fin = document.getElementById('reserva-fin').value;

            if (hora_inicio >= hora_fin) {
                divError.textContent = "La hora de inicio debe ser anterior a la hora de fin.";
                divError.classList.remove('hidden');
                return;
            }

            // Validación frontend de 2 horas
            const inicioMinutos = parseInt(hora_inicio.split(':')[0]) * 60 + parseInt(hora_inicio.split(':')[1]);
            const finMinutos = parseInt(hora_fin.split(':')[0]) * 60 + parseInt(hora_fin.split(':')[1]);

            if (finMinutos - inicioMinutos > 120) {
                divError.textContent = "Las reservas tienen un máximo de 2 horas.";
                divError.classList.remove('hidden');
                return;
            }

            try {
                const respuesta = await fetch('/api/reservas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_usuario: usuario.id,
                        id_pista,
                        fecha,
                        hora_inicio,
                        hora_fin
                    })
                });

                const data = await respuesta.json();

                if (!respuesta.ok) {
                    divError.textContent = data.mensaje || "Error al realizar la reserva.";
                    divError.classList.remove('hidden');
                    return;
                }

                alert("¡Reserva confirmada con éxito!");
                cerrarModalReserva();

            } catch (error) {
                console.error("Error:", error);
                divError.textContent = "Error de conexión con el servidor.";
                divError.classList.remove('hidden');
            }
        });
    }
});