async function renovarAccessToken() {
    const clientId = '217452065709-eoi637u5kp9929b3laob6in6a6skknjv.apps.googleusercontent.com';
    const clientSecret = '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';
    const refreshToken = '1//04YzbTZvht8juCgYIARAAGAQSNwF-L9Ir9GmX3DjgLJnUPsgP889ElWofH2CYxZFwreBsPbLwdSpVXUNw-lsly-p8cuf0Nhje4U4';

    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
    });

    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
        });

        if (response.ok) {
            const data = await response.json();
            return data.access_token;
        } else {
            console.error('Error al renovar el token de acceso:', await response.text());
            alert('No se pudo renovar el token de acceso.');
        }
    } catch (error) {
        console.error('Error al renovar el token:', error);
    }
}

// Función para guardar la lista en Google Drive
async function guardarListaEnDrive() {
    const tablaAlumnos = document.getElementById('tabla-alumnos');
    const filas = tablaAlumnos.querySelectorAll('tr');
    const datos = [];

    // Obtener los valores de los dropdowns y construir el título del archivo
    const dropdownMateria = document.getElementById('materia');
    const dropdownGrupo = document.getElementById('grupo');
    const materia = dropdownMateria ? dropdownMateria.value.trim() : 'Materia';
    const grupo = dropdownGrupo ? dropdownGrupo.value.trim() : 'Grupo';
    const fecha = new Date();
    const fechaFormateada = `${fecha.toLocaleString('es-ES', { month: 'short' })} ${fecha.getDate()} de ${fecha.getFullYear()}`;
    const nombreArchivo = `${materia}-${grupo}-${fechaFormateada}.txt`;

    // Recopilar datos de la tabla
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        if (celdas.length > 0) {
            const alumno = celdas[0].textContent.trim();
            const nombre = celdas[1].textContent.trim();
            const asistio = celdas[2].querySelector('input').checked ? 'Sí' : 'No';
            const materia = celdas[3].textContent.trim();
            datos.push(`${alumno},${nombre},${asistio},${materia}`);
        }
    });

    // Convertir datos a formato de texto
    const contenido = datos.join('\n');

    // Renovar el token de acceso antes de subir el archivo
    const accessToken = await renovarAccessToken();
    if (!accessToken) {
        alert('No se pudo obtener el token de acceso. Inténtalo nuevamente.');
        return;
    }

    // Subir el archivo a Google Drive
    const fileMetadata = {
        name: nombreArchivo,
        mimeType: 'application/vnd.google-apps.file',
        parents: ['1xPJ8ZCeR8hvWu38BRW8Mpr5jcOs6Cceu'] // ID de la carpeta en Drive
    };
    const fileContent = new Blob([contenido], { type: 'text/plain' });

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    form.append('file', fileContent);

    try {
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            body: form
        });

        if (response.ok) {
            alert('Lista guardada exitosamente en Google Drive.');
        } else {
            const errorDetails = await response.json();
            console.error('Error al guardar el archivo:', errorDetails);
            alert(`Error al guardar la lista: ${errorDetails.error.message || 'Desconocido'}`);
        }
    } catch (error) {
        console.error('Error al guardar la lista en Drive:', error);
        alert('Ocurrió un error al guardar la lista.');
    }
}

// Agregar evento al botón de guardar
const botonGuardar = document.getElementById('guardar-lista');
if (botonGuardar) {
    botonGuardar.addEventListener('click', guardarListaEnDrive);
}

// Función para ocultar todos los formularios
function ocultarTodosLosFormularios() {
    const formularios = [
        'form-anexar',
        'form-pasar-lista',
        'form-visualizar-lista',
        'form-eliminar-lista',
        'form-imprimir-lista',
        'form-sumarizar',
    ];
    formularios.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

// Eventos de botones
document.getElementById('btn-anexar').addEventListener('click', () => {
    ocultarTodosLosFormularios();
    document.getElementById('form-anexar').style.display = 'block';
    document.getElementById('tabla-contenedor').style.display = 'none';
});

document.getElementById('btn-pasar-lista').addEventListener('click', () => {
    ocultarTodosLosFormularios();
    document.getElementById('form-pasar-lista').style.display = 'block';
    cargarEmpresas(); // Cargar empresas y grupos
});

document.getElementById('btn-visualizar').addEventListener('click', () => {
    ocultarTodosLosFormularios();
    document.getElementById('form-visualizar-lista').style.display = 'block';
    cargarEmpresasVisualizar();
});

document.getElementById('btn-borrar').addEventListener('click', () => {
    ocultarTodosLosFormularios();
    document.getElementById('form-eliminar-lista').style.display = 'block';
    document.getElementById('tabla-contenedor').style.display = 'none';
    cargarEmpresasEliminar();
});

document.getElementById('btn-imprimir').addEventListener('click', () => {
    ocultarTodosLosFormularios();
    document.getElementById('form-imprimir-lista').style.display = 'block';
    cargarEmpresasImprimir();
});

document.getElementById('btn-sumarizar').addEventListener('click', () => {
    ocultarTodosLosFormularios();
    document.getElementById('form-sumarizar').style.display = 'block';
    cargarEmpresasSumarizar();
});


const FOLDER_ID = "1xPJ8ZCeR8hvWu38BRW8Mpr5jcOs6Cceu"; // ID de la carpeta en Drive

document.getElementById('visualizar').addEventListener('click', async () => {
    const empresa = document.getElementById('materia-visualizar').value;
    const grupo = document.getElementById('grupo-visualizar').value;
    const fecha = document.getElementById('fecha-visualizar').value;

    // Validación de los campos
    if (!empresa || !grupo || !fecha) {
        alert('Por favor, selecciona una Empresa, Grupo-Materia y Fecha.');
        return;
    }

    // Formatea la fecha y construye el nombre del archivo
    const fechaFormateada = formatearFecha(fecha);
    const nombreArchivo = `${empresa}-${grupo}-${fechaFormateada}`;
    console.log(`Buscando archivo: ${nombreArchivo}`); // Muestra el nombre del archivo en consola

    try {
        const accessToken = await renovarAccessToken(); // Renueva el token de acceso
        const archivo = await buscarArchivoEnDrive(nombreArchivo, accessToken);

        if (archivo) {
      console.log(`Archivo encontrado: ${archivo.name} (ID: ${archivo.id})`);
      const contenido = await descargarContenidoArchivo(archivo.id, accessToken);
      mostrarTabla(contenido, fecha);
  } else {
      alert(`No se encontró un archivo con el nombre: ${nombreArchivo}. Por favor verifica los datos ingresados.`);
      console.warn(`Archivo no encontrado: ${nombreArchivo}`);
  }
    } catch (error) {
        console.error("Error:", error);
        alert('Ocurrió un error al buscar el archivo.');
    }
});

// Funciones de carga de datos desde Google Sheets
async function cargarEmpresas() {
    const sheetURL = "https://docs.google.com/spreadsheets/d/1dGOWq1lSrV_C7ISPSRV5U-htfeHJqEkkbEA9PrcROiU/gviz/tq?tqx=out:json&sheet=AnexoAlumnos";
    const response = await fetch(sheetURL);
    const text = await response.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));

    const empresas = new Set();
    const grupos = {};
    const data = json.table.rows;
    const selectEmpresa = document.getElementById('materia');
    selectEmpresa.innerHTML = '<option value="">Selecciona una opción</option>';

    data.forEach(row => {
        const empresa = row.c[4]?.v; // Columna E para Empresa
        if (empresa) {
            empresas.add(empresa);
            const grupo = row.c[6]?.v; // Columna G para Grupo-Materia
            if (grupo && !grupos[empresa]) {
                grupos[empresa] = new Set();
            }
            if (grupo) {
                grupos[empresa].add(grupo);
            }
        }
    });

    empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa;
        option.textContent = empresa;
        selectEmpresa.appendChild(option);
    });

    selectEmpresa.addEventListener('change', () => {
        cargarGrupos(data, selectEmpresa.value, grupos, 'grupo');
    });

    document.getElementById('grupo').addEventListener('change', () => {
        const materiaSeleccionada = selectEmpresa.value;
        const grupoSeleccionado = document.getElementById('grupo').value;
        cargarAlumnos(data, materiaSeleccionada, grupoSeleccionado);
    });
}

// Función para cargar los grupos según la materia seleccionada
function cargarGrupos(data, empresaSeleccionada, grupos, selectId) {
    const selectGrupo = document.getElementById(selectId);
    selectGrupo.innerHTML = '<option value="">Selecciona una opción</option>';

    if (empresaSeleccionada && grupos[empresaSeleccionada]) {
        grupos[empresaSeleccionada].forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo;
            option.textContent = grupo;
            selectGrupo.appendChild(option);
        });
    }
}

// Función para cargar los alumnos
function cargarAlumnos(data, materiaSeleccionada, grupoSeleccionado) {
    const tablaAlumnos = document.getElementById('tabla-alumnos');
    tablaAlumnos.innerHTML = ''; // Limpiar la tabla

    const alumnosFiltrados = data.filter(row => {
        const empresa = row.c[4]?.v; // Columna E para Empresa
        const grupo = row.c[6]?.v;  // Columna D para Grupo
        return empresa === materiaSeleccionada && grupo === grupoSeleccionado;
    });

    alumnosFiltrados.forEach(row => {
        const alumno = row.c[1]?.v;
        const nombre = row.c[2]?.v;
        const asistio = row.c[3]?.v;
        const fechaAsistencia = row.c[5]?.v;
// SI QUIERO VER MATERIA id grupoSeleccionado SI QUIER VER EMPRESA materiaSeleccionada
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${alumno}</td>
            <td>${nombre}</td>
            <td style="display: flex; align-items: center; justify-content: center;"><input type="checkbox" ${asistio === 'Sí' ? 'checked' : ''}></td>
            <td>${materiaSeleccionada}</td>
        `;
        tablaAlumnos.appendChild(tr);
    });
}

// Buscar archivo en Google Drive usando el Access Token
async function buscarArchivoEnDrive(nombreArchivo, accessToken) {
  const query = encodeURIComponent(`'${FOLDER_ID}' in parents and name='${nombreArchivo}'`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
  console.log("URL completa de la petición:", url); // Muestra la URL en consola

  try {
      const response = await fetch(url, {
          headers: {
              'Authorization': `Bearer ${accessToken}`
          }
      });

      if (!response.ok) {
          console.error('Error al buscar en Drive:', await response.text());
          throw new Error('No se pudo realizar la búsqueda en Google Drive.');
      }

      const data = await response.json();
      return data.files && data.files.length > 0 ? data.files[0] : null;
  } catch (error) {
      console.error("Error en buscarArchivoEnDrive:", error);
      throw error;
  }
}

// Descargar el contenido del archivo
async function descargarContenidoArchivo(fileId, accessToken) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;

    try {
        // Intentar descarga directa
        let response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // Si la descarga directa falla, intentar exportación
        if (!response.ok) {
            console.warn('Intentando exportar el archivo como texto...');
            response = await fetch(exportUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                console.error('Error al exportar el archivo:', await response.text());
                throw new Error('No se pudo exportar el archivo.');
            }
        }

        return await response.text(); // Retorna el contenido exportado o descargado
    } catch (error) {
        console.error('Error al descargar el archivo:', error);
        throw new Error('No se pudo descargar el archivo.');
    }
}

// Mostrar la tabla con los datos
function mostrarTabla(contenido, fecha) {
    // Elimina cualquier modal anterior existente
    const modalExistente = document.getElementById('tabla-modal');
    if (modalExistente) {
        modalExistente.remove();
    }

    const filas = contenido.trim().split('\n'); // Divide el contenido por líneas
    const datos = filas.map(fila => fila.split(',')); // Divide cada línea por comas

    // Crear el modal y su contenido
    const modal = document.createElement('div');
    modal.id = 'tabla-modal';
    modal.className = 'modal fade';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'tablaModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="tablaModalLabel">Lista del día ${formatearFechaVisual(fecha)}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <table class="table table-bordered">
                        <thead class="table-dark">
                            <tr>
                                <th>Número de Empleado</th>
                                <th>Nombre del Alumno</th>
                                <th>Asistió</th>
                                <th>Empresa</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${datos.map(d => `
                                <tr>
                                    <td>${d[0]}</td>
                                    <td>${d[1]}</td>
                                    <td>${d[2]}</td>
                                    <td>${d[3]}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary mt-3" data-bs-dismiss="modal">
                        <i class="fas fa-window-close"></i> Cerrar
                    </button>
                    <button id="imprimir-lista" class="btn btn-warning mt-3" onclick="imprimirTabla()">
                        <i class="fas fa-print"></i> Imprimir Lista
                    </button>
                </div>
            </div>
        </div>
    `;

    // Añadir el modal al cuerpo del documento
    document.body.appendChild(modal);

    // Mostrar el modal
    const modalBootstrap = new bootstrap.Modal(modal);
    modalBootstrap.show();
}

// Función para imprimir la tabla (opcional)
function imprimirTabla() {
    // Extraer solo la tabla y el título, ignorando botones
    const tabla = document.querySelector('#tabla-modal .modal-body table').outerHTML;
    const titulo = document.querySelector('#tabla-modal .modal-title').innerText;

    // Crear la ventana de impresión con estilos específicos
    const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');
    ventanaImpresion.document.open();
    ventanaImpresion.document.write(`
        <html>
            <head>
                <title>Imprimir Lista</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
                    h3 { text-align: center; margin-bottom: 20px; }
                    .table { width: 100%; border-collapse: collapse; }
                    .table th, .table td { border: 1px solid #000; padding: 8px; text-align: left; }
                    .table thead { background-color: #000; color: #fff; }
                    @media print {
                        body { margin: 0; }
                        .table { page-break-inside: auto; }
                        .table tr { page-break-inside: avoid; page-break-after: auto; }
                    }
                </style>
            </head>
            <body>
                <h3>${titulo}</h3>
                ${tabla}
            </body>
        </html>
    `);
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    ventanaImpresion.print();
    ventanaImpresion.close();
}




// Renueva el token de acceso
async function renovarAccessToken() {
    const clientId = '217452065709-eoi637u5kp9929b3laob6in6a6skknjv.apps.googleusercontent.com';
    const clientSecret = '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';
    const refreshToken = '1//04YzbTZvht8juCgYIARAAGAQSNwF-L9Ir9GmX3DjgLJnUPsgP889ElWofH2CYxZFwreBsPbLwdSpVXUNw-lsly-p8cuf0Nhje4U4';

    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
    });

    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
        });

        if (response.ok) {
            const data = await response.json();
            return data.access_token;
        } else {
            console.error('Error al renovar el token de acceso:', await response.text());
            throw new Error('No se pudo renovar el token de acceso.');
        }
    } catch (error) {
        console.error('Error al renovar el token:', error);
        throw error;
    }
}

// Formatea la fecha para el nombre del archivo
function formatearFecha(fechaInput) {
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    // Crear una fecha en la zona horaria local (sin ajustes UTC)
    const [anio, mes, dia] = fechaInput.split('-');
    const fecha = new Date(anio, mes - 1, dia); // mes es 0-based en JS

    const diaLocal = fecha.getDate();
    const mesLocal = meses[fecha.getMonth()];
    const anioLocal = fecha.getFullYear();
    return `${mesLocal} ${diaLocal} de ${anioLocal}`;
}


// Formatea la fecha para visualización en la tabla
function formatearFechaVisual(fechaInput) {
    const [anio, mes, dia] = fechaInput.split('-'); // Divide el formato "YYYY-MM-DD"
    const fecha = new Date(anio, mes - 1, dia); // Crear la fecha correctamente (meses empiezan en 0)
    return fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}


// Funciones de carga para los formularios de Visualizar, Eliminar e Imprimir
async function cargarEmpresasVisualizar() {
    const sheetURL = "https://docs.google.com/spreadsheets/d/1dGOWq1lSrV_C7ISPSRV5U-htfeHJqEkkbEA9PrcROiU/gviz/tq?tqx=out:json&sheet=AnexoAlumnos";
    const response = await fetch(sheetURL);
    const text = await response.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));

    const empresas = new Set();
    const grupos = {};
    const data = json.table.rows;
    const selectEmpresa = document.getElementById('materia-visualizar');
    selectEmpresa.innerHTML = '<option value="">Selecciona una opción</option>';

    data.forEach(row => {
        const empresa = row.c[4]?.v; // Columna E para Empresa
        if (empresa) {
            empresas.add(empresa);
            const grupo = row.c[6]?.v; // Columna D para Grupo
            if (grupo && !grupos[empresa]) {
                grupos[empresa] = new Set();
            }
            if (grupo) {
                grupos[empresa].add(grupo);
            }
        }
    });

    empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa;
        option.textContent = empresa;
        selectEmpresa.appendChild(option);
    });

    selectEmpresa.addEventListener('change', () => {
        cargarGrupos(data, selectEmpresa.value, grupos, 'grupo-visualizar');
    });

    document.getElementById('grupo-visualizar').addEventListener('change', () => {
        const materiaSeleccionada = selectEmpresa.value;
        const grupoSeleccionado = document.getElementById('grupo-visualizar').value;
        // Aquí puedes agregar funcionalidad adicional si es necesario
    });
}

// Inicializar la carga de datos
cargarEmpresasVisualizar();

// Función para cargar empresas en el formulario de eliminación
async function cargarEmpresasEliminar() {
    const sheetURL = "https://docs.google.com/spreadsheets/d/1dGOWq1lSrV_C7ISPSRV5U-htfeHJqEkkbEA9PrcROiU/gviz/tq?tqx=out:json&sheet=AnexoAlumnos";
    const response = await fetch(sheetURL);
    const text = await response.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));

    const empresas = new Set();
    const grupos = {};
    const data = json.table.rows;
    const selectEmpresa = document.getElementById('materia-eliminar');
    selectEmpresa.innerHTML = '<option value="">Selecciona una opción</option>';

    data.forEach(row => {
        const empresa = row.c[4]?.v; // Columna E para Empresa
        if (empresa) {
            empresas.add(empresa);
            const grupo = row.c[6]?.v; // Columna D para Grupo
            if (grupo && !grupos[empresa]) {
                grupos[empresa] = new Set();
            }
            if (grupo) {
                grupos[empresa].add(grupo);
            }
        }
    });

    empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa;
        option.textContent = empresa;
        selectEmpresa.appendChild(option);
    });

    selectEmpresa.addEventListener('change', () => {
        cargarGrupos(data, selectEmpresa.value, grupos, 'grupo-eliminar');
    });

    document.getElementById('grupo-eliminar').addEventListener('change', () => {
        const materiaSeleccionada = selectEmpresa.value;
        const grupoSeleccionado = document.getElementById('grupo-eliminar').value;
        cargarAlumnos(data, materiaSeleccionada, grupoSeleccionado);
    });
}
cargarEmpresasEliminar();
// Función para cargar empresas en el formulario de impresión
async function cargarEmpresasImprimir() {
    const sheetURL = "https://docs.google.com/spreadsheets/d/1dGOWq1lSrV_C7ISPSRV5U-htfeHJqEkkbEA9PrcROiU/gviz/tq?tqx=out:json&sheet=AnexoAlumnos";
    const response = await fetch(sheetURL);
    const text = await response.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));

    const empresas = new Set();
    const grupos = {};
    const data = json.table.rows;
    const selectEmpresa = document.getElementById('materia-imprimir');
    selectEmpresa.innerHTML = '<option value="">Selecciona una opción</option>';

    data.forEach(row => {
        const empresa = row.c[4]?.v; // Columna E para Empresa
        if (empresa) {
            empresas.add(empresa);
            const grupo = row.c[6]?.v; // Columna D para Grupo
            if (grupo && !grupos[empresa]) {
                grupos[empresa] = new Set();
            }
            if (grupo) {
                grupos[empresa].add(grupo);
            }
        }
    });

    empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa;
        option.textContent = empresa;
        selectEmpresa.appendChild(option);
    });

    selectEmpresa.addEventListener('change', () => {
        cargarGrupos(data, selectEmpresa.value, grupos, 'grupo-imprimir');
    });

    document.getElementById('grupo-imprimir').addEventListener('change', () => {
        const materiaSeleccionada = selectEmpresa.value;
        const grupoSeleccionado = document.getElementById('grupo-imprimir').value;
        cargarAlumnos(data, materiaSeleccionada, grupoSeleccionado);
    });
}

async function cargarEmpresasSumarizar() {
    const sheetURL = "https://docs.google.com/spreadsheets/d/1dGOWq1lSrV_C7ISPSRV5U-htfeHJqEkkbEA9PrcROiU/gviz/tq?tqx=out:json&sheet=AnexoAlumnos";
    const response = await fetch(sheetURL);
    const text = await response.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));

    const empresas = new Set();
    const grupos = {};
    const data = json.table.rows;
    const selectEmpresa = document.getElementById('sumarizar-materia');
    selectEmpresa.innerHTML = '<option value="">Selecciona una opción</option>';

    data.forEach(row => {
        const empresa = row.c[4]?.v; // Columna E para Empresa
        if (empresa) {
            empresas.add(empresa);
            const grupo = row.c[6]?.v; // Columna D para Grupo
            if (grupo && !grupos[empresa]) {
                grupos[empresa] = new Set();
            }
            if (grupo) {
                grupos[empresa].add(grupo);
            }
        }
    });

    empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa;
        option.textContent = empresa;
        selectEmpresa.appendChild(option);
    });

    selectEmpresa.addEventListener('change', () => {
        cargarGrupos(data, selectEmpresa.value, grupos, 'sumarizar-salon');
    });

    document.getElementById('grupo-imprimir').addEventListener('change', () => {
        const materiaSeleccionada = selectEmpresa.value;
        const grupoSeleccionado = document.getElementById('sumarizar-salon').value;
        cargarAlumnos(data, materiaSeleccionada, grupoSeleccionado);
    });
}

let datosOriginales = []; // Guarda todos los datos originales

// Función para obtener los datos desde Google Sheets
async function obtenerDatosGoogleSheets() {
    const url = 'https://docs.google.com/spreadsheets/d/1dGOWq1lSrV_C7ISPSRV5U-htfeHJqEkkbEA9PrcROiU/gviz/tq?tqx=out:json&sheet=AnexoAlumnos';

    try {
        const response = await fetch(url);
        const text = await response.text();
        // Extraer solo el contenido JSON válido de la respuesta
            const jsonData = JSON.parse(text.substring(47).slice(0, -2));

            // Mapear las filas del JSON a un formato más usable
            datosOriginales = jsonData.table.rows.map(row => ({
                Empresa: row.c[4]?.v || '',  // Columna A
                Grupo: row.c[6]?.v || '',    // Columna B
                B: row.c[1]?.v || '',        // Columna B (repitiendo por simplicidad)
                C: row.c[2]?.v || '',        // Columna C
                D: row.c[3]?.v || '',        // Columna D
                E: row.c[4]?.v || ''         // Columna E
            }));

            console.log("Datos cargados:", datosOriginales); // Debug: Verifica los datos cargados
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        }
    }

// Función para filtrar los datos y mostrar en la tabla
function cargarDatosFiltrados() {
    const empresaSeleccionada = document.getElementById('materia-imprimir').value;
    const grupoSeleccionado = document.getElementById('grupo-imprimir').value;

    if (empresaSeleccionada && grupoSeleccionado) {
        const datosFiltrados = datosOriginales.filter(row =>
            row.Empresa === empresaSeleccionada && row.Grupo === grupoSeleccionado
        );

        mostrarTablaEditable(datosFiltrados);
    }
}

// Función para mostrar datos en la tabla
function mostrarTablaEditable(rows) {
    const tbody = document.querySelector('#tabla-alumnos2 tbody');
    //tbody.innerHTML = ''; // Limpiar la tabla

    rows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td contenteditable="true" data-index="${index}" data-col="B">${row.B}</td>
            <td contenteditable="true" data-index="${index}" data-col="C">${row.C}</td>
            <td contenteditable="true" data-index="${index}" data-col="D">${row.D}</td>
            <td contenteditable="true" data-index="${index}" data-col="E">${row.E}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('popup-editar-tabla').style.display = 'block';
    console.log("Datos mostrados en la tabla:", rows);
}

document.getElementById('guardar-cambios').addEventListener('click', async () => {
    const tbody = document.querySelector('#tabla-alumnos2 tbody');
    const filas = Array.from(tbody.rows);
    const cambios = [];

    // Recorremos las filas de la tabla y recogemos las modificaciones
    filas.forEach(fila => {
        const index = fila.querySelector('[data-index]').dataset.index;
        const updatedB = fila.querySelector('[data-col="B"]').textContent;
        const updatedC = fila.querySelector('[data-col="C"]').textContent;
        const updatedD = fila.querySelector('[data-col="D"]').textContent;
        const updatedE = fila.querySelector('[data-col="E"]').textContent;

        // Guardamos los cambios (con el índice como referencia, si es necesario)
        cambios.push({
            index,
            B: updatedB,
            C: updatedC,
            D: updatedD,
            E: updatedE
        });
    });

    // Llamar a la función que actualizará los datos en Google Sheets
    await guardarCambiosGoogleSheets(cambios);
});

  //   const url = 'https://script.google.com/macros/s/AKfycbztW-Ufq5M2KSKeFXJ2Nx8a6RrKfMdQwnH38OWKtL2Gs0Yyc_cfyMZsvPIaHakZ-T0F/exec';
async function guardarCambiosGoogleSheets(cambios) {
    // Proxy para evitar el error de CORS
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const url = 'https://script.google.com/macros/s/AKfycbztW-Ufq5M2KSKeFXJ2Nx8a6RrKfMdQwnH38OWKtL2Gs0Yyc_cfyMZsvPIaHakZ-T0F/exec';

    const fullUrl = proxyUrl + url; // Combinar el proxy con tu URL

    const body = JSON.stringify({ cambios });

    try {
        // Enviar los cambios a Google Sheets a través del proxy
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body,
        });

        const data = await response.json();
        console.log('Respuesta del servidor:', data);

        if (data.success) {
            alert('Cambios guardados correctamente');
        } else {
            alert('Error al guardar los cambios');
        }
    } catch (error) {
        console.error('Error al guardar los cambios:', error);
        alert('Hubo un error al guardar los cambios');
    }
}

// Escuchar cambios en los dropdowns
document.getElementById('materia-imprimir').addEventListener('change', cargarDatosFiltrados);
document.getElementById('grupo-imprimir').addEventListener('change', cargarDatosFiltrados);


// Inicializar datos
obtenerDatosGoogleSheets();



//******************************************************************************************************


// Renovar el Access Token para acceder a la API de Google Drive
async function renovarAccessToken() {
    const clientId = '217452065709-eoi637u5kp9929b3laob6in6a6skknjv.apps.googleusercontent.com';
    const clientSecret = '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';
    const refreshToken = '1//04YzbTZvht8juCgYIARAAGAQSNwF-L9Ir9GmX3DjgLJnUPsgP889ElWofH2CYxZFwreBsPbLwdSpVXUNw-lsly-p8cuf0Nhje4U4';

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }).toString(),
    });

    const data = await response.json();
    if (!data.access_token) {
        console.error("Error al renovar el Access Token:", data);
        throw new Error("No se pudo renovar el Access Token.");
    }
    return data.access_token;
}

// Buscar archivos en Google Drive en base al nombre y carpeta
async function buscarArchivos(token, nombreArchivo, folderId) {
    const query = `'${folderId}' in parents and name contains '${nombreArchivo}' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;

    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    return data.files || [];
}

// Descargar contenido de un archivo desde Google Drive
async function descargarArchivo(token, fileId, mimeType = 'text/plain') {
    // Intentar descargar directamente
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${mimeType}`;

    try {
        let response = await fetch(downloadUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        // Si la descarga directa falla, intentar exportar el archivo
        if (!response.ok) {
            console.warn('Archivo no descargable directamente, intentando exportar...');
            response = await fetch(exportUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                console.error('Error al exportar el archivo:', await response.text());
                throw new Error('No se pudo exportar el archivo.');
            }
        }

        const contenido = await response.text();
        console.log('Contenido descargado o exportado:', contenido);
        return contenido;
    } catch (error) {
        console.error('Error al descargar o exportar el archivo:', error);
        throw error;
    }
}


// Generar un rango de fechas entre dos fechas dadas
function generarFechas(fechaInicial, fechaFinal) {
    const fechas = [];
    let fechaActual = new Date(fechaInicial);

    while (fechaActual <= new Date(fechaFinal)) {
        // Crear una nueva fecha para evitar modificaciones no deseadas
        fechas.push(new Date(fechaActual.getTime()));
        fechaActual.setDate(fechaActual.getDate() + 1); // Avanzar un día
    }

    return fechas;
}


// Formatear fechas en un formato legible para el nombre de archivo
function formatearFechaNombre(fecha) {
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const fechaLocal = new Date(fecha.getTime()); // Crear una copia para trabajar
    return `${meses[fechaLocal.getMonth()]} ${fechaLocal.getDate()} de ${fechaLocal.getFullYear()}`;
}


// Procesar el contenido descargado y extraer los datos relevantes
// Parsear el contenido del archivo
function parsearContenido(contenido, nombreArchivo) {
    try {
        const fecha = nombreArchivo.match(/(\w+\s\d{1,2}\sde\s\d{4})$/)?.[0] || '';
        
        // Verificar si el contenido es JSON
        if (contenido.trim().startsWith('{') || contenido.trim().startsWith('[')) {
            const datos = JSON.parse(contenido);
            return datos.map(item => ({
                numeroControl: item.numeroControl,
                nombre: item.nombre,
                materia: nombreArchivo.split('-')[0],
                asistencia: item.asistencia,
                fecha: fecha
            }));
        }

        // Procesar contenido como CSV
        const lineas = contenido.trim().split('\n');
        return lineas.map(linea => {
            const [numeroControl, nombre, asistencia, materia] = linea.split(',');
            return {
                numeroControl: numeroControl.trim(),
                nombre: nombre.trim(),
                materia: materia.trim(),
                asistencia: asistencia.trim(),
                fecha: fecha
            };
        });
    } catch (error) {
        console.error('Error procesando el contenido:', error);
        return [];
    }
}


// Renderizar la tabla en HTML con los datos procesados
function renderizarTabla(datos) {
    const tablaContainer = document.getElementById('tabla-container');
    const columnas = ['Numero de control', 'Nombre del alumno', 'Materia', 'Asistio', 'Fecha de Asistencia'];

    const tablaHTML = `
        <table class="table">
            <thead>
                <tr>${columnas.map(col => `<th>${col}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${datos.map(fila => `
                    <tr>
                        <td>${fila.numeroControl || ''}</td>
                        <td>${fila.nombre || ''}</td>
                        <td>${fila.materia || ''}</td>
                        <td>${fila.asistencia || ''}</td>
                        <td>${fila.fecha || ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div id="botones-container" class="botones">
        <div class="d-flex justify-content-center">
            <button id="imprimir-tabla" class="btn btn-secondary mt-3">
                <i class="fa fa-print"></i> Imprimir
            </button>
            <button id="exportar-csv" class="btn btn-secondary mt-3">
                <i class="fa fa-table"></i> Exportar a CSV
            </button>
        </div>
    `;

    tablaContainer.innerHTML = tablaHTML;

    // Agregar funcionalidad a los botones
    document.getElementById('imprimir-tabla').addEventListener('click', () => {
        imprimirTabla();
    });
    document.getElementById('exportar-csv').addEventListener('click', () => {
        exportarCSV(datos);
    });
}

function imprimirTabla() {
    const tablaContainer = document.getElementById('tabla-container');
    const botones = document.querySelectorAll('button'); // Seleccionar todos los botones visibles

    // Ocultar botones antes de imprimir
    botones.forEach(boton => boton.style.display = 'none');

    // Invocar el cuadro de impresión
    window.print();

    // Restaurar visibilidad de los botones después de imprimir
    botones.forEach(boton => boton.style.display = '');
}



// Exportar los datos a CSV
function exportarCSV(datos) {
    const columnas = ['Numero de control', 'Nombre del alumno', 'Materia', 'Asistio', 'Fecha de Asistencia'];
    const contenido = [
        columnas.join(','), // Encabezados
        ...datos.map(fila => [
            fila.numeroControl || '',
            fila.nombre || '',
            fila.materia || '',
            fila.asistencia || '',
            fila.fecha || ''
        ].join(','))
    ].join('\n');

    const blob = new Blob([contenido], { type: 'text/csv' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = 'lista_asistencia.csv';
    enlace.click();
}

// Controlador principal
document.getElementById('sumarizar-lista').addEventListener('click', async () => {
    const fechaInicio = document.getElementById('fecha-inicial').value;
    const fechaFin = document.getElementById('fecha-final').value;
    const materia = document.getElementById('sumarizar-materia').value;
    const folderId = '1xPJ8ZCeR8hvWu38BRW8Mpr5jcOs6Cceu'; // Cambia este ID por tu carpeta de Google Drive
    const estadoOperacion = document.getElementById('estado-operacion');

    if (!fechaInicio || !fechaFin || !materia) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    // Mostrar el mensaje de estado "Buscando..."
    estadoOperacion.textContent = "Buscando, por favor espera...";
    estadoOperacion.style.color = "blue";

    try {
        const token = await renovarAccessToken();
        const fechas = generarFechas(fechaInicio, fechaFin);
        const datosCompletos = [];

        for (const fecha of fechas) {
            const nombreArchivo = `${materia} - ${formatearFechaNombre(fecha)}`;
            const archivos = await buscarArchivos(token, nombreArchivo, folderId);

            for (const archivo of archivos) {
                const contenido = await descargarArchivo(token, archivo.id);
                const datos = parsearContenido(contenido, archivo.name);
                datosCompletos.push(...datos);
            }
        }

        if (datosCompletos.length > 0) {
            renderizarTabla(datosCompletos);
        } else {
            alert("No se encontraron datos para los filtros seleccionados.");
        }

        // Cambiar el mensaje al finalizar
        estadoOperacion.textContent = "Sumarizado finalizado.";
        estadoOperacion.style.color = "green";
    } catch (error) {
        console.error("Error durante la operación:", error);
        estadoOperacion.textContent = "Error durante la operación. Por favor, revisa la consola para más detalles.";
        estadoOperacion.style.color = "red";
    }
});


async function manejarArchivos(token, archivos) {
    for (const archivo of archivos) {
        console.log('Procesando archivo:', archivo.name);
        try {
            const contenido = await descargarArchivo(token, archivo.id, 'text/plain');
            console.log('Contenido descargado:', contenido);
            const datos = parsearContenido(contenido, archivo.name);
            datosCompletos.push(...datos);
        } catch (error) {
            console.error('Error manejando archivo:', archivo.name, error);
        }
    }
}

// BOTON PARA ELIMINAR FUNCION --------------------------------------------------------

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1dGOWq1lSrV_C7ISPSRV5U-htfeHJqEkkbEA9PrcROiU/gviz/tq?tqx=out:json&sheet=AnexoAlumnos';

// Función para renovar el token de acceso
async function renovarAccessToken() {
    const clientId = '217452065709-eoi637u5kp9929b3laob6in6a6skknjv.apps.googleusercontent.com';
    const clientSecret = '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';
    const refreshToken = '1//04YzbTZvht8juCgYIARAAGAQSNwF-L9Ir9GmX3DjgLJnUPsgP889ElWofH2CYxZFwreBsPbLwdSpVXUNw-lsly-p8cuf0Nhje4U4';

    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
    });

    if (response.ok) {
        const data = await response.json();
        return data.access_token;
    } else {
        console.error('Error al renovar el token de acceso:', await response.text());
        throw new Error('No se pudo renovar el token de acceso.');
    }
}

// Función para cargar datos desde Google Sheets
async function cargarDatosDesdeSheet() {
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));

        // Poblar las opciones de Materia y Grupo
        const materias = [...new Set(json.table.rows.map(row => row.c[4]?.v))];
        const grupos = [...new Set(json.table.rows.map(row => row.c[6]?.v))];

        const materiaSelect = document.getElementById('materia-eliminar');
        const grupoSelect = document.getElementById('grupo-eliminar');

        // Limpiar las opciones anteriores
        materiaSelect.innerHTML = '<option value="">Selecciona una opción</option>';
        grupoSelect.innerHTML = '<option value="">Selecciona una opción</option>';

        // Agregar nuevas opciones
        materias.forEach(materia => {
            const option = document.createElement('option');
            option.value = materia;
            option.textContent = materia;
            materiaSelect.appendChild(option);
        });

        grupos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo;
            option.textContent = grupo;
            grupoSelect.appendChild(option);
        });

        return json.table.rows.map(row => ({
            control: row.c[1]?.v || '',
            nombre: row.c[2]?.v || '',
            materia: row.c[3]?.v || '',
            grupo: row.c[4]?.v || ''
        }));
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        throw error;
    }
}


// Filtrar y mostrar datos en la tabla
document.getElementById('filtrar-datos').addEventListener('click', async () => {
    const materiaSeleccionada = document.getElementById('materia-eliminar').value;
    const grupoSeleccionado = document.getElementById('grupo-eliminar').value;

    console.log('Materia seleccionada:', materiaSeleccionada);
    console.log('Grupo seleccionado:', grupoSeleccionado);

    try {
        const datos = await cargarDatosDesdeSheet();
        console.log('Datos cargados desde Google Sheets:', datos);

        const alumnosFiltrados = datos.filter(
            alumno => alumno.materia === materiaSeleccionada && alumno.grupo === grupoSeleccionado
        );

        console.log('Alumnos filtrados:', alumnosFiltrados);

        const tabla = document.getElementById('tabla-alumnoseliminar');
        tabla.innerHTML = ''; // Limpiar la tabla

        alumnosFiltrados.forEach((alumno, index) => {
            console.log('Agregando alumno a la tabla:', alumno);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${alumno.control}</td>
                <td>${alumno.nombre}</td>
                <td>${alumno.materia}</td>
                <td>
                    <button class="btn btn-danger btn-sm eliminar-btn" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tabla.appendChild(tr);
        });

        console.log('Tabla actualizada con los alumnos filtrados.');

        // Añadir funcionalidad de eliminación
        document.querySelectorAll('.eliminar-btn').forEach(boton => {
            boton.addEventListener('click', async (event) => {
                const index = event.target.closest('button').dataset.index;
                const alumno = alumnosFiltrados[index];

                console.log('Intentando eliminar alumno:', alumno);

                try {
                    const accessToken = await renovarAccessToken();
                    console.log('Access token renovado:', accessToken);

                    // Simular eliminación del registro
                    console.log(`Eliminando alumno con control ${alumno.control}`);

                    // Eliminar fila de la tabla visualmente
                    event.target.closest('tr').remove();
                    alert('Registro eliminado correctamente.');
                } catch (error) {
                    console.error('Error al eliminar el registro:', error);
                    alert('No se pudo eliminar el registro.');
                }
            });
        });
    } catch (error) {
        console.error('Error al filtrar los datos:', error);
    }
});



