/* =========================================================
   GESTIÓN DE ENTREGAS
========================================================= */


/**
 * Carga todas las entregas desde Notion.
 */
async function cargarEntregas() {
    try {
        mostrarEstadoCarga();

        const entregas =
            await obtenerEntregas();

        const entregasProcesadas =
            procesarEntregas(
                entregas
            );

        const entregasOrdenadas =
            ordenarEntregas(
                entregasProcesadas
            );

        const metricas =
            calcularMetricas(
                entregasProcesadas
            );

        mostrarMetricas(
            metricas
        );

        mostrarEntregas(
            entregasOrdenadas.filter(
                entrega =>
                    !entrega.esVencida
            )
        );

        const vencidas =
            entregasOrdenadas.filter(
                entrega =>
                    entrega.esVencida
            );

        mostrarEntregasVencidas(
            vencidas
        );

        return entregas;

    } catch (error) {

        console.error(
            "Error al cargar entregas:",
            error
        );

        mostrarEstadoError(
            error
        );

        return null;
    }
}

/**
 * Procesa las entregas y añade
 * información calculada.
 */
function procesarEntregas(resultados) {

    return resultados.map(
        entrega => {

            const fechaEntrega =
                entrega.fechaEntrega;


            const diasRestantes =
                calcularDiasRestantes(
                    fechaEntrega
                );


            const esVencida =
                estaVencida(
                    fechaEntrega
                );


            const urgente =
                !esVencida &&
                diasRestantes !== null &&
                diasRestantes <= 1;


            let pesoPrioridad = 0;


            if (
                entrega.importancia ===
                "Alta"
            ) {

                pesoPrioridad = 3;

            }

            else if (
                entrega.importancia ===
                "Media"
            ) {

                pesoPrioridad = 2;

            }

            else if (
                entrega.importancia ===
                "Baja"
            ) {

                pesoPrioridad = 1;

            }


            return {

                ...entrega,

                diasRestantes,

                esVencida,

                urgente,

                pesoPrioridad

            };

        }
    );
}


/**
 * Calcula las métricas generales.
 */
function calcularMetricas(entregas) {

    const metricas = {

        total: entregas.length,

        urgentes: 0,

        altas: 0,

        vencidas: 0

    };


    entregas.forEach(
        entrega => {

            if (
                entrega.importancia ===
                "Alta"
            ) {

                metricas.altas++;

            }


            if (entrega.urgente) {

                metricas.urgentes++;

            }


            if (entrega.esVencida) {

                metricas.vencidas++;

            }

        }
    );


    return metricas;
}


/**
 * Ordena las actividades:
 *
 * 1. Fechas válidas antes que sin fecha.
 * 2. Fecha más cercana primero.
 * 3. En caso de empate, mayor prioridad.
 */
function ordenarEntregas(entregas) {

    return [...entregas].sort(
        (a, b) => {

            if (
                a.diasRestantes === null &&
                b.diasRestantes !== null
            ) {

                return 1;
            }


            if (
                a.diasRestantes !== null &&
                b.diasRestantes === null
            ) {

                return -1;
            }


            if (
                a.diasRestantes === null &&
                b.diasRestantes === null
            ) {

                return (
                    b.pesoPrioridad -
                    a.pesoPrioridad
                );
            }


            if (
                a.diasRestantes !==
                b.diasRestantes
            ) {

                return (
                    a.diasRestantes -
                    b.diasRestantes
                );
            }


            return (
                b.pesoPrioridad -
                a.pesoPrioridad
            );
        }
    );
}


/**
 * Envía una nueva actividad a Notion.
 */
async function enviarANotion(event) {

    event.preventDefault();


    /* =====================================================
       OBTENER DATOS DEL FORMULARIO
    ===================================================== */

    const actividad =
        document
            .getElementById("actividad")
            .value
            .trim();


    const materia =
        document
            .getElementById("materia")
            .value
            .trim();


    const tipo =
        document
            .getElementById("tipo")
            .value;


    const importancia =
        document
            .getElementById("importancia")
            .value;


    const fecha =
        document
            .getElementById("fecha")
            .value;


    const hora =
        document
            .getElementById("hora")
            .value;


    const esquemaRepaso =
        document
            .getElementById("esquema-repaso")
            .value;


    const fechaEntrega =
        combinarFechaHora(
            fecha,
            hora
        );


    /* =====================================================
       VALIDACIONES
    ===================================================== */

    if (!actividad) {

        alert(
            "Debes ingresar el nombre de la actividad."
        );

        return;
    }


    if (!materia) {

        alert(
            "Debes ingresar la materia."
        );

        return;
    }


    if (!fechaEntrega) {

        alert(
            "Debes ingresar una fecha de entrega."
        );

        return;
    }

    const fechaEntregaObjeto =
    convertirAFecha(
        fechaEntrega
    );


if (
    !fechaEntregaObjeto ||
    fechaEntregaObjeto <= new Date()
) {

    alert(
        "La fecha y hora de entrega deben ser futuras."
    );

    return;
}

    /* =====================================================
       DATOS DE LA ACTIVIDAD
    ===================================================== */

    const datosEntrega = {

        actividad,

        materia,

        tipo,

        importancia,

        fechaEntrega,

        esquemaRepaso

    };


    /* =====================================================
       GUARDAR EN NOTION
    ===================================================== */

    try {

       const paginaCreada =
    await crearEntregaEnNotion(
        datosEntrega
    );


const entregaCreada = {

    id:
        paginaCreada.id,

    actividad,

    materia,

    tipo,

    importancia,

    fechaEntrega,

    esquemaRepaso

};


console.log(
    "✅ Actividad creada:",
    entregaCreada
);


/* =================================================
   LIMPIAR FORMULARIO
================================================= */

const formulario =
    document.getElementById(
        "form-actividad"
    );


if (formulario) {

    formulario.reset();

}


/* =================================================
   ACTUALIZAR ENTREGAS Y CRONOGRAMA
================================================= */

const entregasActualizadas =
    await cargarEntregas();


if (
    typeof regenerarRepasosSeguro ===
    "function"
) {

    await regenerarRepasosSeguro(
        entregasActualizadas
    );

    console.log(
        "🧠 Cronograma de repasos recalculado."
    );

}


/* =================================================
   IR A ENTREGAS
================================================= */

switchTab(
    "entregas",
    false
);


    }
    catch (error) {

        console.error(
            "Error al crear entrega:",
            error
        );


        alert(
            "No se pudo registrar la actividad: " +
            error.message
        );

    }

}


/**
 * Reprograma una actividad.
 *
 * Esta primera versión utiliza prompt.
 * Posteriormente construiremos un modal
 * propio para hacerlo más profesional.
 */
async function reprogramarTarea(
    pageId,
    nombreActividad,
    tipo
) {

    const nuevaFecha =
        prompt(
            `Nueva fecha para "${nombreActividad}"\n\n` +
            `Formato: AAAA-MM-DD HH:MM`
        );


    if (!nuevaFecha) {
        return;
    }


    const partes =
        nuevaFecha.trim().split(" ");


    const fecha =
        partes[0];


    const hora =
        partes[1] || "00:00";


    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ) {

        alert(
            "La fecha debe tener el formato AAAA-MM-DD."
        );

        return;
    }


    if (
        !/^\d{2}:\d{2}$/.test(hora)
    ) {

        alert(
            "La hora debe tener el formato HH:MM."
        );

        return;
    }


    const fechaFinal =
        combinarFechaHora(
            fecha,
            hora
        );


    const fechaFinalObjeto =
        convertirAFecha(
            fechaFinal
        );


    if (
        !fechaFinalObjeto ||
        fechaFinalObjeto <= new Date()
    ) {

        alert(
            "La fecha y hora de entrega deben ser futuras."
        );

        return;
    }


    try {

        await actualizarFechaEntrega(
            pageId,
            fechaFinal
        );


        const entregasActualizadas =
            await cargarEntregas();


        await regenerarRepasosSeguro(
            entregasActualizadas
        );


        alert(
            "Actividad reprogramada correctamente."
        );

    } catch (error) {

        console.error(
            "Error al reprogramar la actividad:",
            error
        );

        alert(
            "Ocurrió un error al reprogramar la actividad."
        );

    }
}


/**
 * Archiva una actividad.
 */
async function completarYEliminar(
    pageId,
    nombreActividad
) {

    const confirmar =
        confirm(
            `¿Deseas archivar "${nombreActividad}"?`
        );


    if (!confirmar) {
        return;
    }

    try {

    await archivarEntrega(
        pageId
    );


    const entregasActualizadas =
        await cargarEntregas();

        await regenerarRepasosSeguro(
            entregasActualizadas
        );



    alert(
        "Actividad archivada correctamente."
    );

}
catch (error) {

    console.error(
        "Error al archivar:",
        error
    );


    alert(
        "No se pudo archivar la actividad:\n" +
        error.message
    );

}
}