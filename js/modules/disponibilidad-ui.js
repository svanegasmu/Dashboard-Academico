/* =========================================================
   ACADEMIC HUB
   INTERFAZ DE DISPONIBILIDAD DINÁMICA
========================================================= */


/* =========================================================
   INICIALIZACIÓN
========================================================= */

function inicializarDisponibilidadUI() {

    inicializarFormularioDisponibilidadTemporal();

    inicializarFormularioExcepcion();

    establecerFechasMinimas();

    renderizarDisponibilidadTemporal();

    renderizarExcepciones();

    actualizarSelectorHorariosExcepcion();

}


/* =========================================================
   FECHAS MÍNIMAS
========================================================= */

function establecerFechasMinimas() {

    const hoy =
        new Date();

    const fechaISO =
        formatearFechaISO(hoy);


    const fechaTemporal =
        document.getElementById(
            "fecha-disponibilidad"
        );


    const fechaExcepcion =
        document.getElementById(
            "fecha-excepcion"
        );


    if (fechaTemporal) {

        fechaTemporal.min =
            fechaISO;

    }


    if (fechaExcepcion) {

        fechaExcepcion.min =
            fechaISO;

    }

}


/* =========================================================
   FORMULARIO DE DISPONIBILIDAD TEMPORAL
========================================================= */

function inicializarFormularioDisponibilidadTemporal() {

    const formulario =
        document.getElementById(
            "form-disponibilidad-temporal"
        );


    if (!formulario) {
        return;
    }


    formulario.addEventListener(
        "submit",
        manejarFormularioDisponibilidadTemporal
    );

}


function manejarFormularioDisponibilidadTemporal(
    event
) {

    event.preventDefault();


    const fecha =
        document.getElementById(
            "fecha-disponibilidad"
        )?.value;


    const horaInicio =
        document.getElementById(
            "hora-temporal-inicio"
        )?.value;


    const horaFin =
        document.getElementById(
            "hora-temporal-fin"
        )?.value;


    try {

        agregarDisponibilidadTemporal(
            fecha,
            horaInicio,
            horaFin
        );


        event.target.reset();


        establecerFechasMinimas();

        renderizarDisponibilidadTemporal();


        /*
         * La nueva disponibilidad puede liberar
         * una sesión que antes no podía programarse.
         */

        if (
            typeof recalcularCronogramaRepasos ===
            "function"
        ) {

            recalcularCronogramaRepasos();

        }


        alert(
            "Disponibilidad temporal agregada correctamente."
        );

    }
    catch (error) {

        console.error(
            "Error al agregar disponibilidad temporal:",
            error
        );


        alert(
            error.message
        );

    }

}

/* =========================================================
   RENDERIZAR DISPONIBILIDAD TEMPORAL
========================================================= */

function renderizarDisponibilidadTemporal() {

    const tbody =
        document.getElementById(
            "tabla-disponibilidad-temporal-body"
        );


    if (!tbody) {
        return;
    }


    const disponibilidad =
        obtenerDisponibilidadTemporal();


    tbody.innerHTML = "";


    if (
        disponibilidad.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-message"
                >
                    No hay disponibilidades
                    temporales registradas.
                </td>

            </tr>

        `;

        return;

    }


    disponibilidad
        .sort(
            compararDisponibilidadTemporal
        )
        .forEach(
            bloque => {

                const tr =
                    document.createElement(
                        "tr"
                    );


                tr.innerHTML = `

                    <td>
                        ${formatearFechaLegible(
                            bloque.fecha
                        )}
                    </td>

                    <td>
                        ${bloque.horaInicio}
                    </td>

                    <td>
                        ${bloque.horaFin}
                    </td>

                    <td>

                        <span
                            class="availability-type
                                   availability-temporal"
                        >
                            🟢 Temporal
                        </span>

                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn-action btn-delete"
                            title="Eliminar disponibilidad"
                        >
                            🗑️
                        </button>

                    </td>

                `;


                const boton =
                    tr.querySelector(
                        ".btn-delete"
                    );


                boton.addEventListener(
                    "click",
                    () => {

                        const confirmar =
                            confirm(
                                "¿Eliminar esta disponibilidad temporal?"
                            );


                        if (!confirmar) {
                            return;
                        }


                        eliminarDisponibilidadTemporal(
                            bloque.id
                        );

                    }
                );


                tbody.appendChild(
                    tr
                );

            }
        );

}

function eliminarDisponibilidadTemporal(
    id
) {

    const disponibilidad =
        obtenerDisponibilidadTemporal();


    const resultado =
        disponibilidad.filter(
            bloque =>
                String(bloque.id) !==
                String(id)
        );


    guardarDisponibilidadTemporal(
        resultado
    );


    renderizarDisponibilidadTemporal();


    if (
        typeof recalcularCronogramaRepasos ===
        "function"
    ) {

        recalcularCronogramaRepasos();

    }

}


/* =========================================================
   FORMULARIO DE EXCEPCIONES
========================================================= */

function inicializarFormularioExcepcion() {

    const formulario =
        document.getElementById(
            "form-excepcion-horario"
        );


    if (!formulario) {
        return;
    }


    formulario.addEventListener(
        "submit",
        manejarFormularioExcepcion
    );

}


async function manejarFormularioExcepcion(
    event
) {
    event.preventDefault();


    const horarioId =
        document.getElementById(
            "horario-excepcion"
        )?.value;

    const fecha =
        document.getElementById(
            "fecha-excepcion"
        )?.value;


    if (!horarioId) {

        alert(
            "Selecciona un bloque recurrente."
        );

        return;
    }


    if (!fecha) {

        alert(
            "Selecciona una fecha."
        );

        return;
    }

    try {
        const cancelacionCreada = await cancelarDisponibilidadRecurrente(
            horarioId,
            fecha
        );

        if (!cancelacionCreada) {
            alert("El bloque ya estaba cancelado para esa fecha.");
            return;
        }

        event.target.reset();
        establecerFechasMinimas();
        renderizarExcepciones();

        if (typeof recalcularCronogramaRepasos === "function") {
            recalcularCronogramaRepasos();
        }

        alert("El bloque fue cancelado para esa fecha.");

    } catch (error) {
        console.error("Error al registrar excepción:", error);
        alert(error.message);
    }
}


/* =========================================================
   SELECTOR DE HORARIOS
========================================================= */

function actualizarSelectorHorariosExcepcion() {

    const selector =
        document.getElementById(
            "horario-excepcion"
        );


    if (!selector) {
        return;
    }


    selector.innerHTML = `

        <option value="">
            Selecciona un bloque...
        </option>

    `;


    if (
        typeof obtenerHorarios !==
        "function"
    ) {

        return;

    }


    const horarios =
        obtenerHorarios();


    horarios.forEach(
        horario => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                horario.id;


            option.textContent =
                `${horario.dia} — ` +
                `${horario.horaInicio} → ` +
                `${horario.horaFin}`;


            selector.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   RENDERIZAR EXCEPCIONES
========================================================= */

function renderizarExcepciones() {

    const tbody =
        document.getElementById(
            "tabla-excepciones-body"
        );


    if (!tbody) {
        return;
    }


    const excepciones =
        obtenerExcepcionesDisponibilidad();


    tbody.innerHTML = "";


    if (
        excepciones.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty-message"
                >
                    No hay excepciones registradas.
                </td>

            </tr>

        `;

        return;

    }


    const horarios =
        typeof obtenerHorarios ===
        "function"
            ? obtenerHorarios()
            : [];


    excepciones.forEach(
        excepcion => {

            const horario =
                horarios.find(
                    item =>
                        item.id ===
                        excepcion.horarioId
                );


            const tr =
                document.createElement(
                    "tr"
                );


            const descripcionHorario =
                horario
                    ? `${horario.horaInicio} → ${horario.horaFin}`
                    : "Horario no encontrado";


            tr.classList.add(
                "exception-row"
            );


            tr.innerHTML = `

                <td>
                    ${formatearFechaLegible(
                        excepcion.fecha
                    )}
                </td>

                <td>
                    ${descripcionHorario}
                </td>

                <td>

                    <span
                        class="availability-type
                               availability-cancelled"
                    >
                        🔴 Cancelado
                    </span>

                </td>

                <td>

                    <button
                        type="button"
                        class="btn-action btn-delete"
                        title="Restaurar disponibilidad"
                    >
                        ↩️
                    </button>

                </td>

            `;


            const boton =
                tr.querySelector(
                    ".btn-delete"
                );


            boton.addEventListener(
                "click",
                () => {

                    const confirmar =
                        confirm(
                            "¿Restaurar este bloque para esa fecha?"
                        );


                    if (!confirmar) {
                        return;
                    }


                    restaurarDisponibilidadRecurrente(
                        excepcion.horarioId,
                        excepcion.fecha
                    );


                    renderizarExcepciones();

                }
            );


            tbody.appendChild(
                tr
            );

        }
    );

}

function restaurarDisponibilidadRecurrente(
    horarioId,
    fecha
) {

    const excepciones =
        obtenerExcepcionesDisponibilidad();


    const indice =
        excepciones.findIndex(
            excepcion =>
                String(
                    excepcion.horarioId
                ) ===
                String(horarioId)
                &&
                excepcion.fecha ===
                fecha
        );


    if (
        indice === -1
    ) {

        return false;

    }


    excepciones.splice(
        indice,
        1
    );


    guardarExcepcionesDisponibilidad(
        excepciones
    );


    if (
        typeof recalcularCronogramaRepasos ===
        "function"
    ) {

        recalcularCronogramaRepasos();

    }


    return true;

}


/* =========================================================
   ACTUALIZAR INTERFAZ COMPLETA
========================================================= */

function actualizarInterfazDisponibilidad() {

    establecerFechasMinimas();

    actualizarSelectorHorariosExcepcion();

    renderizarDisponibilidadTemporal();

    renderizarExcepciones();

}


/* =========================================================
   FORMATEAR FECHA
========================================================= */

function formatearFechaLegible(
    fecha
) {

    if (!fecha) {
        return "Sin fecha";
    }


    const objeto =
        convertirFechaDia(
            fecha
        );


    if (!objeto) {
        return fecha;
    }


    return objeto.toLocaleDateString(
        "es-CO",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}