/* =========================================================
   ACADEMIC HUB
   HORARIOS Y DISPONIBILIDAD RECURRENTE
========================================================= */


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const STORAGE_KEY_HORARIOS =
    "bloques_estudio";


const DIAS_SEMANA = {

    Domingo: 0,
    Lunes: 1,
    Martes: 2,
    Miércoles: 3,
    Jueves: 4,
    Viernes: 5,
    Sábado: 6

};


const ORDEN_DIAS = {

    Lunes: 1,
    Martes: 2,
    Miércoles: 3,
    Jueves: 4,
    Viernes: 5,
    Sábado: 6,
    Domingo: 7

};


/* =========================================================
   OBTENER HORARIOS
========================================================= */

function obtenerHorarios() {

    try {

        const datos =
            localStorage.getItem(
                "bloques_estudio"
            );


        if (!datos) {
            return [];
        }


        const horarios =
            JSON.parse(
                datos
            );


        if (
            !Array.isArray(horarios)
        ) {
            return [];
        }


        return horarios.map(
            horario => ({

                ...horario,

                /*
                 * Compatibilidad temporal con
                 * registros antiguos.
                 */

                horaInicio:
                    horario.horaInicio ??
                    horario.inicio,

                horaFin:
                    horario.horaFin ??
                    horario.fin

            })
        );

    }
    catch (error) {

        console.error(
            "Error leyendo horarios:",
            error
        );

        return [];

    }

}


/* =========================================================
   GUARDAR HORARIOS
========================================================= */

function guardarHorarios(horarios) {

    localStorage.setItem(

        STORAGE_KEY_HORARIOS,

        JSON.stringify(horarios)

    );

}


/* =========================================================
   GENERAR ID
========================================================= */

function generarIdHorario() {

    if (
        typeof generarId ===
        "function"
    ) {

        return generarId();

    }


    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );

}


/* =========================================================
   VALIDAR HORARIO
========================================================= */

function validarHorario(
    dia,
    horaInicio,
    horaFin
) {

    if (!dia) {

        return {
            valido: false,
            mensaje:
                "Debes seleccionar un día."
        };

    }


    if (!horaInicio) {

        return {
            valido: false,
            mensaje:
                "Debes indicar una hora de inicio."
        };

    }


    if (!horaFin) {

        return {
            valido: false,
            mensaje:
                "Debes indicar una hora de finalización."
        };

    }


    if (horaInicio >= horaFin) {

        return {
            valido: false,
            mensaje:
                "La hora de fin debe ser posterior a la hora de inicio."
        };

    }


    return {

        valido: true,

        mensaje: ""

    };

}


/* =========================================================
   DETECTAR SUPERPOSICIONES
========================================================= */

function existeSolapamientoHorario(
    horarios,
    nuevoHorario
) {

    return horarios.some(
        horario => {

            if (
                horario.dia !==
                nuevoHorario.dia
            ) {

                return false;

            }


            const inicioExistente =
                horario.horaInicio;

            const finExistente =
                horario.horaFin;


            const inicioNuevo =
                nuevoHorario.horaInicio;

            const finNuevo =
                nuevoHorario.horaFin;


            return (
                inicioNuevo <
                finExistente
            ) &&
            (
                finNuevo >
                inicioExistente
            );

        }
    );

}


/* =========================================================
   ELIMINAR BLOQUE
========================================================= */

function eliminarBloqueHorario(id) {

    const horarios =
        obtenerHorarios();


    const resultado =
        horarios.filter(
            horario =>
                String(horario.id) !==
                String(id)
        );


    localStorage.setItem(
        "bloques_estudio",
        JSON.stringify(
            resultado
        )
    );


    renderizarHorarios();


    if (
        typeof actualizarInterfazDisponibilidad ===
        "function"
    ) {

        actualizarInterfazDisponibilidad();

    }


    if (
        typeof recalcularCronogramaRepasos ===
        "function"
    ) {

        recalcularCronogramaRepasos();

    }

}


/* =========================================================
   COMPARAR HORARIOS
========================================================= */

function compararHorarios(
    a,
    b
) {

    const ordenA =
        ORDEN_DIAS[a.dia] ??
        99;


    const ordenB =
        ORDEN_DIAS[b.dia] ??
        99;


    if (
        ordenA !==
        ordenB
    ) {

        return (
            ordenA -
            ordenB
        );

    }


    return (
        a.horaInicio
            .localeCompare(
                b.horaInicio
            )
    );

}


/* =========================================================
   RENDERIZAR HORARIOS
========================================================= */

function renderizarHorarios() {

    const tbody =
        document.getElementById(
            "tabla-horarios-body"
        );


    if (!tbody) {

        return;

    }


    const horarios =
        obtenerHorarios();


    horarios.sort(
        compararHorarios
    );


    tbody.innerHTML = "";


    if (
        horarios.length ===
        0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty-message"
                >

                    No has registrado
                    bloques de disponibilidad aún.

                </td>

            </tr>

        `;

        return;

    }


    horarios.forEach(
        horario => {

            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `

                <td>
                    ${horario.dia}
                </td>

                <td>
                    ${horario.horaInicio}
                </td>

                <td>
                    ${horario.horaFin}
                </td>

                <td>
                    🔁 Recurrente
                </td>

                <td>

                    <button
                        type="button"
                        class="btn-action"
                        title="Eliminar bloque"
                    >
                        🗑️
                    </button>

                </td>

            `;


            const boton =
                tr.querySelector(
                    ".btn-action"
                );


            boton.addEventListener(
                "click",
                () => {

                    eliminarBloqueHorario(
                        horario.id
                    );

                }
            );


            tbody.appendChild(
                tr
            );

        }
    );

}

/* =========================================================
   FORMULARIO DE HORARIOS
========================================================= */

function guardarBloqueHorario(event) {

    event.preventDefault();


    const dia =
        document.getElementById(
            "dia-semana"
        )?.value;


    const horaInicio =
        document.getElementById(
            "hora-inicio"
        )?.value;


    const horaFin =
        document.getElementById(
            "hora-fin"
        )?.value;


    if (
        !dia ||
        !horaInicio ||
        !horaFin
    ) {

        alert(
            "Completa todos los campos del horario."
        );

        return;

    }


    const inicio =
        horaAMinutos(
            horaInicio
        );


    const fin =
        horaAMinutos(
            horaFin
        );


    if (
        inicio === null ||
        fin === null
    ) {

        alert(
            "Las horas indicadas no son válidas."
        );

        return;

    }


    if (
        inicio >= fin
    ) {

        alert(
            "La hora de inicio debe ser anterior a la hora de fin."
        );

        return;

    }


    const horarios =
        obtenerHorarios();


    /*
     * Evitar horarios recurrentes superpuestos
     * en el mismo día.
     */

    const existeConflicto =
        horarios.some(
            horario => {

                if (
                    horario.dia !==
                    dia
                ) {
                    return false;
                }


                const inicioExistente =
                    horaAMinutos(
                        horario.horaInicio ??
                        horario.inicio
                    );


                const finExistente =
                    horaAMinutos(
                        horario.horaFin ??
                        horario.fin
                    );


                if (
                    inicioExistente === null ||
                    finExistente === null
                ) {
                    return false;
                }


                return intervalosSeSolapan(
                    inicioExistente,
                    finExistente,
                    inicio,
                    fin
                );

            }
        );


    if (
        existeConflicto
    ) {

        alert(
            "El horario se superpone con otro bloque del mismo día."
        );

        return;

    }


    horarios.push({

        id:
            typeof generarId ===
            "function"
                ? generarId()
                : Date.now().toString(),

        dia,

        horaInicio,

        horaFin

    });


    localStorage.setItem(
        "bloques_estudio",
        JSON.stringify(
            horarios
        )
    );


    const formulario =
        document.getElementById(
            "form-horario"
        );


    if (formulario) {
        formulario.reset();
    }


    if (
        typeof renderizarHorarios ===
        "function"
    ) {

        renderizarHorarios();

    }


    if (
        typeof actualizarInterfazDisponibilidad ===
        "function"
    ) {

        actualizarInterfazDisponibilidad();

    }


    if (
        typeof recalcularCronogramaRepasos ===
        "function"
    ) {

        recalcularCronogramaRepasos();

    }

}

/* =========================================================
   CREAR FECHA CON HORA
========================================================= */

function crearFechaHora(
    fecha,
    hora
) {

    const resultado =
        new Date(
            fecha
        );


    const [
        horas,
        minutos
    ] =
        hora
            .split(":")
            .map(Number);


    resultado.setHours(
        horas,
        minutos,
        0,
        0
    );


    return resultado;

}


/* =========================================================
   GENERAR OCURRENCIAS DE DISPONIBILIDAD
========================================================= */

function generarOcurrenciasDisponibilidad(
    fechaInicio,
    fechaFin
) {

    const horarios =
        obtenerHorarios();


    const ocurrencias = [];


    if (
        horarios.length ===
        0
    ) {

        return ocurrencias;

    }


    const inicio =
        new Date(
            fechaInicio
        );


    const fin =
        new Date(
            fechaFin
        );


    inicio.setSeconds(
        0,
        0
    );


    fin.setSeconds(
        0,
        0
    );


    /*
     * Recorremos día por día.
     *
     * Esto nos permite generar
     * fechas concretas a partir
     * de los bloques recurrentes.
     */

    const cursor =
        new Date(
            inicio
        );


    cursor.setHours(
        0,
        0,
        0,
        0
    );


    while (
        cursor <= fin
    ) {

        const nombreDia =
            Object.keys(
                DIAS_SEMANA
            ).find(
                nombre =>
                    DIAS_SEMANA[nombre] ===
                    cursor.getDay()
            );


        if (nombreDia) {

            const bloquesDelDia =
                horarios.filter(
                    horario =>
                        horario.dia ===
                        nombreDia
                );


            bloquesDelDia.forEach(
                horario => {

                    const bloqueInicio =
                        crearFechaHora(
                            cursor,
                            horario.horaInicio
                        );


                    const bloqueFin =
                        crearFechaHora(
                            cursor,
                            horario.horaFin
                        );


                    /*
                     * El bloque debe tener
                     * alguna intersección con
                     * el rango solicitado.
                     */

                    if (
                        bloqueFin >
                        inicio &&
                        bloqueInicio <
                        fin
                    ) {

                        ocurrencias.push({

                            id:
                                generarIdHorario(),

                            horarioId:
                                horario.id,

                            dia:
                                horario.dia,

                            fecha:
                                new Date(
                                    cursor
                                ),

                            inicio:
                                bloqueInicio,

                            fin:
                                bloqueFin,

                            origen:
                                "recurrente"

                        });

                    }

                }
            );

        }


        cursor.setDate(
            cursor.getDate() +
            1
        );

    }


    ocurrencias.sort(
        (a, b) =>
            a.inicio.getTime() -
            b.inicio.getTime()
    );


    return ocurrencias;

}

/* =========================================================
   INICIALIZACIÓN DEL MÓDULO
========================================================= */

function inicializarHorario() {

    renderizarHorarios();

}


