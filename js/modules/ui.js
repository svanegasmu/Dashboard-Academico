/* =========================================================
   INTERFAZ DE USUARIO
========================================================= */


/**
 * Muestra el estado de carga.
 */
function mostrarEstadoCarga() {

    const tbody =
        document.getElementById(
            "tabla-entregas-body"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="table-message"
            >
                Cargando entregas... ⏳
            </td>

        </tr>

    `;
}


/**
 * Muestra un mensaje de error.
 */
function mostrarEstadoError(error) {

    const tbody =
        document.getElementById(
            "tabla-entregas-body"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="table-message error"
            >
                Error al cargar las entregas.
            </td>

        </tr>

    `;


    console.error(
        "Detalle del error:",
        error
    );
}


/**
 * Actualiza las métricas.
 */
function mostrarMetricas(metricas) {

    const total =
        document.getElementById(
            "metric-total"
        );


    const urgentes =
        document.getElementById(
            "metric-urgentes"
        );


    const altas =
        document.getElementById(
            "metric-altas"
        );


    const vencidas =
        document.getElementById(
            "metric-vencidas"
        );


    if (total) {
        total.textContent =
            metricas.total;
    }


    if (urgentes) {
        urgentes.textContent =
            metricas.urgentes;
    }


    if (altas) {
        altas.textContent =
            metricas.altas;
    }


    if (vencidas) {
        vencidas.textContent =
            metricas.vencidas;
    }
}


/**
 * Crea una fila para una entrega.
 */
function crearFilaEntrega(entrega) {

    const tr =
        document.createElement("tr");


    tr.id =
        `row-${entrega.id}`;


    if (entrega.completada) {

        tr.classList.add(
            "row-completed"
        );
    }


    const prioridadHTML =
        crearBadgePrioridad(
            entrega.importancia
        );


    const semaforoHTML =
        crearBadgeSemaforo(
            entrega
        );


    const actividad =
        escaparHTML(
            entrega.actividad
        );


    const materia =
        escaparHTML(
            entrega.materia
        );


    const tipo =
        escaparHTML(
            entrega.tipo
        );


    tr.innerHTML = `

        <td>

            <input
                type="checkbox"
                class="check-btn"
                title="Marcar como realizada"
                aria-label="Marcar actividad como realizada"
            >

        </td>


        <td>

            <strong>
                ${actividad}
            </strong>

        </td>


        <td>
            ${materia}
        </td>


        <td>

            <span class="badge-tipo">
                ${tipo}
            </span>

        </td>


        <td>
            ${prioridadHTML}
        </td>


        <td>
            ${semaforoHTML}
        </td>


        <td class="actions-cell">

            <button
                type="button"
                class="btn-action btn-reschedule"
                title="Reprogramar fecha"
            >
                📅
            </button>


            <button
                type="button"
                class="btn-action"
                title="Archivar/Descartar"
            >
                🗑️
            </button>

        </td>

    `;


    const checkbox =
        tr.querySelector(
            ".check-btn"
        );


    checkbox.addEventListener(
        "change",
        () => {

            completarYEliminar(
                entrega.id,
                entrega.actividad
            );

        }
    );


    const botonReprogramar =
        tr.querySelector(
            ".btn-reschedule"
        );


    botonReprogramar.addEventListener(
        "click",
        () => {

            reprogramarTarea(
                entrega.id,
                entrega.actividad,
                entrega.tipo
            );

        }
    );


    const botonCompletar =
        tr.querySelector(
            ".btn-action:not(.btn-reschedule)"
        );


    botonCompletar.addEventListener(
        "click",
        () => {

            completarYEliminar(
                entrega.id,
                entrega.actividad
            );

        }
    );


    return tr;
}


/**
 * Genera el badge de prioridad.
 */
function crearBadgePrioridad(prioridad) {

    switch (prioridad) {

        case "Alta":

            return `

                <span
                    class="prio-badge prio-p1"
                    title="Prioridad Alta"
                >
                    🔥 Alta
                </span>

            `;


        case "Media":

            return `

                <span
                    class="prio-badge prio-p2"
                    title="Prioridad Media"
                >
                    ⚡ Media
                </span>

            `;


        case "Baja":

            return `

                <span
                    class="prio-badge prio-p4"
                    title="Prioridad Baja"
                >
                    ☕ Baja
                </span>

            `;


        default:

            return `

                <span
                    class="prio-badge prio-p4"
                    title="Sin prioridad"
                >
                    ☕ Sin prioridad
                </span>

            `;
    }
}


/**
 * Genera el badge del semáforo.
 */
function crearBadgeSemaforo(entrega) {

    if (
        entrega.diasRestantes === null
    ) {

        return `

            <span
                class="status-badge semaforo-verde"
            >
                🟢 Sin fecha
            </span>

        `;
    }


    if (entrega.esVencida) {

        return `

            <span
                class="status-badge semaforo-rojo"
            >
                🔴 Vencida
            </span>

        `;
    }


    if (entrega.urgente) {

        return `

            <span
                class="status-badge semaforo-rojo"
            >
                🔴 Entregar pronto
            </span>

        `;
    }


    if (
        entrega.diasRestantes <= 3
    ) {

        return `

            <span
                class="status-badge semaforo-amarillo"
            >
                🟡 Quedan
                ${entrega.diasRestantes}
                días
            </span>

        `;
    }


    return `

        <span
            class="status-badge semaforo-verde"
        >
            🟢 Quedan
            ${entrega.diasRestantes}
            días
        </span>

    `;
}


/**
 * Renderiza las actividades pendientes.
 *
 * Las vencidas se mantienen también en esta
 * tabla por ahora; posteriormente podremos
 * decidir si queremos separarlas completamente.
 */
function mostrarEntregas(entregas) {

    const tbody =
        document.getElementById(
            "tabla-entregas-body"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    if (
        entregas.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="table-message"
                >
                    🎉 ¡No tienes tareas pendientes!
                </td>

            </tr>

        `;

        return;
    }


    entregas.forEach(
        entrega => {

            const fila =
                crearFilaEntrega(
                    entrega
                );


            tbody.appendChild(
                fila
            );
        }
    );
}


/**
 * Renderiza las actividades vencidas
 * en su tabla específica.
 */
function mostrarEntregasVencidas(
    entregas
) {

    const tbody =
        document.getElementById(
            "tabla-vencidos-body"
        );


    const contenedor =
        document.getElementById(
            "vencidos-box"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    if (
        entregas.length === 0
    ) {

        if (contenedor) {

            contenedor.classList.add(
                "hidden"
            );
        }


        return;
    }


    if (contenedor) {

        contenedor.classList.remove(
            "hidden"
        );
    }


    entregas.forEach(
        entrega => {

            const fila =
                crearFilaEntrega(
                    entrega
                );


            tbody.appendChild(
                fila
            );
        }
    );
}