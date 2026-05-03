document.addEventListener('DOMContentLoaded', () => {
    // ELEMENTOS DEL REGISTRO
    const modal = document.getElementById('modal-registro');
    const btnAbrir = document.getElementById('btn-abrir-registro');
    const btnCerrar = document.getElementById('btn-cerrar-registro');
    const formRegistro = document.getElementById('form-registro');

    // ELEMENTOS DEL LOGIN
    const formLogin = document.getElementById('form-login');

    // Gestion del modal
    btnAbrir.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.remove('hidden');
    });

    btnCerrar.addEventListener('click', () => modal.classList.add('hidden'));
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    // Logica de registro
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nuevoUsuario = {
            nombre: document.getElementById('reg-nombre').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            password: document.getElementById('reg-password').value
        };

        try {
            const respuesta = await fetch('/api/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoUsuario)
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                alert("¡Registro exitoso! Ya puedes iniciar sesión.");
                modal.classList.add('hidden');
                formRegistro.reset();
            } else {
                alert("Error: " + data.mensaje);
            }
        } catch (err) {
            alert("Error conectando con el servidor. ¿Has arrancado Node.js?");
        }
    });

    // Logica de login
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const credenciales = {
            email: document.getElementById('login-email').value.trim(),
            password: document.getElementById('login-password').value
        };

        try {
            const respuesta = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credenciales)
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                // Guardar el usuario en el almacenamiento del navegador
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                
                alert("Bienvenido a SportLogix, Gestor de Pistas");
                
                // Redirigir al dashboard
                window.location.href = 'index.html'; 
            } else {
                alert("Error: " + data.mensaje);
            }
        } catch (err) {
            alert("Error al intentar iniciar sesión.");
        }
    });
});