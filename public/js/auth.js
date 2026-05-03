document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DE LA INTERFAZ ---
    
    // Referencias a los elementos del modal de registro
    const modal = document.getElementById('modal-registro');
    const btnAbrir = document.getElementById('btn-abrir-registro');
    const btnCerrar = document.getElementById('btn-cerrar-registro');
    const formRegistro = document.getElementById('form-registro');

    // Referencia al formulario de inicio de sesión
    const formLogin = document.getElementById('form-login');

    // --- GESTIÓN DEL MODAL DE REGISTRO ---
    
    // Abrir el modal al hacer clic en el enlace de registro
    btnAbrir.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.remove('hidden');
    });

    // Cerrar el modal al hacer clic en el botón de cerrar (X)
    btnCerrar.addEventListener('click', () => modal.classList.add('hidden'));
    
    // Cerrar el modal al hacer clic fuera del contenido blanco (en el fondo oscuro)
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    // --- LÓGICA DE REGISTRO DE USUARIO ---
    
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita la recarga de la página

        // Captura de datos del formulario de registro
        const nuevoUsuario = {
            nombre: document.getElementById('reg-nombre').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            password: document.getElementById('reg-password').value
        };

        try {
            // Envío de datos al servidor (API de registro)
            const respuesta = await fetch('/api/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoUsuario)
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                // Notificación de éxito y limpieza del formulario
                alert("¡Registro exitoso! Ya puedes iniciar sesión.");
                modal.classList.add('hidden');
                formRegistro.reset();
            } else {
                // Manejo de errores controlados (ej: email duplicado)
                alert("Error: " + data.mensaje);
            }
        } catch (err) {
            // Manejo de errores de conexión o servidor caído
            alert("Error conectando con el servidor. ¿Has arrancado Node.js?");
        }
    });

    // --- LÓGICA DE INICIO DE SESIÓN (LOGIN) ---
    
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita la recarga de la página

        // Captura de credenciales
        const credenciales = {
            email: document.getElementById('login-email').value.trim(),
            password: document.getElementById('login-password').value
        };

        try {
            // Petición de autenticación al servidor
            const respuesta = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credenciales)
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                // Persistencia de sesión: Guardar los datos básicos del usuario en LocalStorage
                // Esto permite que el usuario siga logueado aunque recargue o cierre el navegador
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                
                alert("Bienvenido a SportLogix, Gestor de Pistas");
                
                // Redirección a la página principal tras el éxito
                window.location.href = 'index.html'; 
            } else {
                // Manejo de credenciales incorrectas
                alert("Error: " + data.mensaje);
            }
        } catch (err) {
            // Manejo de errores genéricos de red
            alert("Error al intentar iniciar sesión.");
        }
    });
});