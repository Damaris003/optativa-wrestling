const API_URL = '/api/v1'; // Usando la ruta relativa

const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');

// Variable global para almacenar el rol actual del usuario logueado
let usuarioRolActual = '';

// ---- ALTERNAR PANELES DE LOGIN ----
window.alternarPanel = function(panel) {
    if (panel === 'staff') {
        document.getElementById('panel-usuarios').style.display = 'none';
        document.getElementById('panel-staff').style.display = 'block';
    } else {
        document.getElementById('panel-staff').style.display = 'none';
        document.getElementById('panel-usuarios').style.display = 'block';
    }
}

// ---- LÓGICA DE REGISTRO (USUARIOS NORMALES) ----
document.getElementById('btnRegistrar').addEventListener('click', async () => {
    const usuario = document.getElementById('loginUserUsuario').value;
    const password = document.getElementById('loginUserPassword').value;

    if (!usuario || !password) {
        alert("⚠️ Ingresa un usuario y contraseña en los campos para poder registrarte.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });
        const result = await response.json();

        // Corrección: Evaluando ambas posibles respuestas de éxito
        if (result.status === 'success' || result.success) {
            alert("✅ ¡Registro exitoso! Ahora presiona 'Entrar como Usuario'.");
        } else {
            alert("❌ Ocurrió un error. Es posible que el usuario ya exista.");
        }
    } catch (err) {
        alert("Error de conexión con el servidor MySQL.");
    }
});

// ---- LÓGICA DE LOGIN ----
async function procesarLogin(usuario, password, errorElementId) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });
        const result = await response.json();

        if (result.success) {
            loginScreen.style.display = 'none';
            appScreen.style.display = 'flex';
            document.getElementById('userActual').innerText = result.nombre.toUpperCase();
            document.getElementById('rolActual').innerText = result.rol || 'Normal';
            
            usuarioRolActual = result.rol || 'Normal';
            adaptarInterfazRol();
            cargarProgramas();
            cargarAtletas();
        } else {
            document.getElementById(errorElementId).style.display = 'block';
        }
    } catch (err) {
        alert("Error de conexión con el servidor MySQL.");
    }
}

document.getElementById('loginUserForm').addEventListener('submit', (e) => {
    e.preventDefault();
    procesarLogin(
        document.getElementById('loginUserUsuario').value,
        document.getElementById('loginUserPassword').value,
        'loginUserError'
    );
});

document.getElementById('loginStaffForm').addEventListener('submit', (e) => {
    e.preventDefault();
    procesarLogin(
        document.getElementById('loginStaffUsuario').value,
        document.getElementById('loginStaffPassword').value,
        'loginStaffError'
    );
});

// ---- ADAPTAR LA VISTA SEGÚN EL ROL ----
function adaptarInterfazRol() {
    const formCardRegistro = document.getElementById('formCardRegistro');
    const thAcciones = document.getElementById('thAcciones');

    if (usuarioRolActual === 'Head Coach') {
        formCardRegistro.style.display = 'block'; // Puede registrar
        thAcciones.style.display = 'table-cell';  // Puede eliminar
    } else if (usuarioRolActual === 'Asistente') {
        formCardRegistro.style.display = 'block'; // Puede registrar
        thAcciones.style.display = 'none';        // NO puede eliminar
    } else {
        formCardRegistro.style.display = 'none';  // NO puede registrar
        thAcciones.style.display = 'none';        // NO puede eliminar
    }
}

// ---- CERRAR SESIÓN ----
document.getElementById('btnLogout').addEventListener('click', () => {
    appScreen.style.display = 'none';
    loginScreen.style.display = 'flex';
    usuarioRolActual = '';
    document.getElementById('loginStaffForm').reset();
    document.getElementById('loginUserForm').reset();
    document.getElementById('loginStaffError').style.display = 'none';
    document.getElementById('loginUserError').style.display = 'none';
    alternarPanel('usuarios'); 
});

// ---- OBTENER DATOS ----
async function cargarProgramas() {
    const res = await fetch(`${API_URL}/programas`);
    const programas = await res.json();
    const select = document.getElementById('programaSelect');
    select.innerHTML = '<option value="">Asignar Programa de Entrenamiento...</option>';
    programas.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.nombre} (${p.nivel})</option>`;
    });
}

async function cargarAtletas() {
    const res = await fetch(`${API_URL}/inscripciones`);
    const atletas = await res.json();
    const tbody = document.querySelector('#atletasTable tbody');
    tbody.innerHTML = '';
    
    atletas.forEach(a => {
        const fechaFormat = new Date(a.fecha_ingreso).toLocaleDateString('es-ES');
        
        let celdaAcciones = '';
        if (usuarioRolActual === 'Head Coach') {
            celdaAcciones = `
                <td>
                    <button class="btn-delete" onclick="eliminarInscripcion(${a.id})" style="background:#d32f2f; color:white; padding:5px 10px; font-size:12px;">Eliminar</button>
                </td>
            `;
        }

        tbody.innerHTML += `
            <tr>
                <td><b>${a.nombre}</b></td>
                <td>${a.peso_kg} kg</td>
                <td>${a.programa} <br><small style="color:#aaa">${a.nivel}</small></td>
                <td>${fechaFormat}</td>
                ${celdaAcciones}
            </tr>
        `;
    });
}

// ---- ELIMINAR ATLETA ----
window.eliminarInscripcion = async function(id) {
    if (usuarioRolActual !== 'Head Coach') {
        alert("❌ ERROR: Solo los administradores pueden eliminar registros.");
        return;
    }

    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
        const response = await fetch(`${API_URL}/inscripciones/${id}`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'rol': usuarioRolActual 
            }
        });

        const result = await response.json();

        if (response.status === 403) {
            alert("❌ ERROR: " + result.message);
            return;
        }

        // Corrección: Evaluando ambas posibles respuestas de éxito
        if (result.status === 'success' || result.success) {
            alert("✔ Registro eliminado con éxito.");
            cargarAtletas();
        } else {
            alert("Hubo un error al intentar eliminar.");
        }
    } catch (err) {
        alert("Error de conexión con el servidor.");
    }
};

// ---- REGISTRAR ATLETA ----
document.getElementById('atletaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuevoRegistro = {
        nombre: document.getElementById('nombre').value,
        peso_kg: document.getElementById('peso').value,
        telefono: document.getElementById('telefono').value,
        programa_id: document.getElementById('programaSelect').value,
        fecha_ingreso: document.getElementById('fecha').value
    };

    await fetch(`${API_URL}/inscripciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoRegistro)
    });

    document.getElementById('atletaForm').reset();
    cargarAtletas();
});