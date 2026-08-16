/* =========================================================
   ACADEMIC HUB
   DISPONIBILIDAD DINÁMICA
========================================================= */


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const STORAGE_KEY_DISPONIBILIDAD =
    "disponibilidad_temporal";


const STORAGE_KEY_EXCEPCIONES =
    "excepciones_disponibilidad";


/* =========================================================
   UTILIDADES INTERNAS
========================================================= */

/**
 * Convierte una fecha YYYY-MM-DD
 * a un objeto Date situado al inicio
 * del día.
 */
function convertirFechaDia(
    fecha
) {

    if (
        typeof fecha !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(
            fecha
        )
    ) {

        return null;

    }


    const [
        anio,
        mes,
        dia
    ] =
        fecha
            .split("-")
            .map(Number);


    const resultado =
        new Date(
            anio,
            mes - 1,
            dia
        );


    if (
        resultado.getFullYear() !== anio ||
        resultado.getMonth() !== mes - 1 ||
        resultado.getDate() !== dia
    ) {

        return null;

    }


    resultado.setHours(
        0,
        0,
        0,
        0
    );


    return resultado;

}


/**
 * Convierte una hora HH:MM
 * en minutos desde medianoche.
 */
function horaAMinutos(
    hora
) {

    if (
        typeof hora !== "string" ||
        !/^\d{2}:\d{2}$/.test(
            hora
        )
    ) {

        return null;

    }


    const [
        horas,
        minutos
    ] =
        hora
            .split(":")
            .map(Number);


    if (
        horas < 0 ||
        horas > 23 ||
        minutos < 0 ||
        minutos > 59
    ) {

        return null;

    }


    return (
        horas * 60 +
        minutos
    );

}


/**
 * Comprueba si dos intervalos
 * de tiempo se superponen.
 */
function intervalosSeSolapan(
    inicioA,
    finA,
    inicioB,
    finB
) {

    return (
        inicioA < finB &&
        finA > inicioB
    );

}


/* =========================================================
   DISPONIBILIDAD TEMPORAL
========================================================= */

/**
 * Obtiene todos los bloques temporales.
 */
function obtenerDisponibilidadTemporal() {

    try {

        const datos =
            localStorage.getItem(
                STORAGE_KEY_DISPONIBILIDAD
            );

        if (!datos) {
            return [];
        }

        const disponibilidad =
            JSON.parse(datos);

        if (
            !Array.isArray(
                disponibilidad
            )
        ) {
            return [];
        }

        return disponibilidad;

    }
    catch (error) {

        console.error(
            "Error al obtener disponibilidad temporal:",
            error
        );

        return [];

    }

}


/**
 * Guarda los bloques temporales.
 */
function guardarDisponibilidadTemporal(
    disponibilidad
) {

    localStorage.setItem(
        STORAGE_KEY_DISPONIBILIDAD,
        JSON.stringify(
            disponibilidad
        )
    );

}


/* =========================================================
   AGREGAR DISPONIBILIDAD TEMPORAL
========================================================= */

/**
 * Crea un bloque disponible
 * únicamente para una fecha concreta.
 *
 * Ejemplo:
 *
 * 12/08/2026
 * 14:00 - 17:00
 */
function agregarDisponibilidadTemporal(
    fecha,
    horaInicio,
    horaFin
) {

    const fechaObjeto =
        convertirFechaDia(
            fecha
        );

    if (!fechaObjeto) {

        throw new Error(
            "La fecha indicada no es válida."
        );

    }


    const inicioMinutos =
        horaAMinutos(
            horaInicio
        );

    const finMinutos =
        horaAMinutos(
            horaFin
        );


    if (
        inicioMinutos === null ||
        finMinutos === null
    ) {

        throw new Error(
            "Las horas indicadas no son válidas."
        );

    }


    if (
        inicioMinutos >=
        finMinutos
    ) {

        throw new Error(
            "La hora de fin debe ser posterior a la hora de inicio."
        );

    }


    /*
     * No permitimos registrar
     * disponibilidad completamente pasada.
     */

    const ahora =
        new Date();

    const inicio =
        new Date(
            fechaObjeto
        );

    const [horas, minutos] =
        horaInicio
            .split(":")
            .map(Number);

    inicio.setHours(
        horas,
        minutos,
        0,
        0
    );


    const fin =
        new Date(
            fechaObjeto
        );

    const [
        horasFin,
        minutosFin
    ] =
        horaFin
            .split(":")
            .map(Number);

    fin.setHours(
        horasFin,
        minutosFin,
        0,
        0
    );


    if (
        fin <= ahora
    ) {

        throw new Error(
            "No se puede registrar disponibilidad completamente pasada."
        );

    }


    const disponibilidad =
        obtenerDisponibilidadTemporal();


    /*
     * Impedir bloques temporales
     * superpuestos el mismo día.
     */

    const existeConflicto =
        disponibilidad.some(
            bloque => {

                if (
                    bloque.fecha !==
                    fecha
                ) {
                    return false;
                }

                return intervalosSeSolapan(
                    horaAMinutos(
                        bloque.horaInicio
                    ),
                    horaAMinutos(
                        bloque.horaFin
                    ),
                    inicioMinutos,
                    finMinutos
                );

            }
        );


    if (
        existeConflicto
    ) {

        throw new Error(
            "La disponibilidad temporal se superpone con otro bloque."
        );

    }


    const nuevoBloque = {

        id:
            typeof generarId ===
            "function"
                ? generarId()
                : Date.now().toString(),

        fecha,

        horaInicio,

        horaFin,

        origen:
            "temporal"

    };


    disponibilidad.push(
        nuevoBloque
    );


    disponibilidad.sort(
        compararDisponibilidadTemporal
    );


    guardarDisponibilidadTemporal(
        disponibilidad
    );


    return nuevoBloque;

}


/* =========================================================
   COMPARAR DISPONIBILIDAD TEMPORAL
========================================================= */

function compararDisponibilidadTemporal(
    a,
    b
) {

    const fechaA =
        convertirFechaDia(
            a.fecha
        );

    const fechaB =
        convertirFechaDia(
            b.fecha
        );


    if (
        fechaA &&
        fechaB &&
        fechaA.getTime() !==
        fechaB.getTime()
    ) {

        return (
            fechaA.getTime() -
            fechaB.getTime()
        );

    }


    return (
        a.horaInicio.localeCompare(
            b.horaInicio
        )
    );

}

/* =========================================================
   EXCEPCIONES
========================================================= */

/**
 * Las excepciones permiten cancelar
 * una disponibilidad recurrente.
 *
 * Ejemplo:
 *
 * Normalmente:
 * Lunes 08:00 - 10:00
 *
 * Pero este lunes:
 * CANCELADO
 */
function obtenerExcepcionesDisponibilidad() {

    try {

        const datos =
            localStorage.getItem(
                STORAGE_KEY_EXCEPCIONES
            );

        if (!datos) {
            return [];
        }

        const excepciones =
            JSON.parse(datos);

        if (
            !Array.isArray(
                excepciones
            )
        ) {
            return [];
        }

        return excepciones;

    }
    catch (error) {

        console.error(
            "Error al obtener excepciones:",
            error
        );

        return [];

    }

}


/**
 * Guarda excepciones.
 */
function guardarExcepcionesDisponibilidad(
    excepciones
) {

    localStorage.setItem(
        STORAGE_KEY_EXCEPCIONES,
        JSON.stringify(
            excepciones
        )
    );

}


/* =========================================================
   CANCELAR BLOQUE RECURRENTE
========================================================= */

/**
 * Cancela un bloque recurrente
 * solamente para una fecha concreta.
 *
 * No elimina el horario original.
 */
function cancelarDisponibilidadRecurrente(
    horarioId,
    fecha
) {

    if (!horarioId) {

        throw new Error(
            "No se indicó el bloque que se desea cancelar."
        );

    }


    if (!fecha) {

        throw new Error(
            "No se indicó la fecha que se desea cancelar."
        );

    }


    const excepciones =
        obtenerExcepcionesDisponibilidad();


    const yaExiste =
        excepciones.some(
            excepcion =>
                excepcion.horarioId ===
                horarioId &&
                excepcion.fecha ===
                fecha
        );


    if (
        yaExiste
    ) {

        return false;

    }


    excepciones.push({
        id:
            typeof generarId ===
            "function"
                ? generarId()
                : Date.now().toString(),
        horarioId,
        fecha,
        tipo:
            "cancelacion"
    });


    guardarExcepcionesDisponibilidad(
        excepciones
    );

    return true;
}

/* =========================================================
   COMPROBAR CANCELACIÓN
========================================================= */

function estaDisponibilidadCancelada(
    horarioId,
    fecha
) {

    const excepciones =
        obtenerExcepcionesDisponibilidad();


    return excepciones.some(
        excepcion =>
            excepcion.horarioId ===
            horarioId &&
            excepcion.fecha ===
            fecha &&
            excepcion.tipo ===
            "cancelacion"
    );

}


/* =========================================================
   CONVERTIR BLOQUE TEMPORAL
   A OCURRENCIA NORMALIZADA
========================================================= */

function convertirDisponibilidadTemporal(
    bloque
) {

    const fecha =
        convertirFechaDia(
            bloque.fecha
        );


    if (!fecha) {
        return null;
    }


    const inicio =
        crearFechaHora(
            fecha,
            bloque.horaInicio
        );


    const fin =
        crearFechaHora(
            fecha,
            bloque.horaFin
        );


    return {

        id:
            `temporal-${bloque.id}`,

        horarioId:
            null,

        dia:
            obtenerNombreDia(
                fecha
            ),

        fecha:
            new Date(
                fecha
            ),

        inicio,

        fin,

        origen:
            "temporal",

        origenId:
            bloque.id

    };

}


/* =========================================================
   OBTENER NOMBRE DEL DÍA
========================================================= */

function obtenerNombreDia(
    fecha
) {

    if (!fecha) {
        return null;
    }


    return Object.keys(
        DIAS_SEMANA
    ).find(
        nombre =>
            DIAS_SEMANA[nombre] ===
            fecha.getDay()
    ) ?? null;

}


/* =========================================================
   OBTENER DISPONIBILIDAD EFECTIVA
========================================================= */
function obtenerDisponibilidadEfectiva(
    fechaInicio,
    fechaFin
) {

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (
        Number.isNaN(inicio.getTime()) ||
        Number.isNaN(fin.getTime()) ||
        fin <= inicio
    ) {
        return [];
    }

    const ahora = new Date();

    const inicioBusqueda =
        inicio > ahora
            ? inicio
            : ahora;

    const disponibilidad = [];


    /* =====================================================
       1. DISPONIBILIDAD RECURRENTE
    ===================================================== */

    if (
        typeof generarOcurrenciasDisponibilidad ===
        "function"
    ) {

       const recurrentes =
    generarOcurrenciasDisponibilidad(
        inicioBusqueda,
        fin
    );

if (Array.isArray(recurrentes)) {

    recurrentes.forEach(
        bloque => {

            if (!bloque) {
                return;
            }

            const fechaTexto =
                formatearFechaISO(
                    bloque.fecha
                );

            if (!fechaTexto) {
                return;
            }


            /*
             * Cancelación excepcional.
             */

            if (
                estaDisponibilidadCancelada(
                    bloque.horarioId,
                    fechaTexto
                )
            ) {
                return;
            }


            let inicioBloque =
                convertirAFecha(
                    bloque.inicio
                );

            let finBloque =
                convertirAFecha(
                    bloque.fin
                );

            if (
                !inicioBloque ||
                !finBloque
            ) {
                return;
            }


            /*
             * El bloque debe intersectar
             * el período solicitado.
             */

            if (
                finBloque <= inicioBusqueda ||
                inicioBloque >= fin
            ) {
                return;
            }


            /*
             * Nunca devolver tiempo pasado.
             */

            if (
                inicioBloque < ahora
            ) {

                inicioBloque =
                    new Date(ahora);

            }


            if (
                finBloque <=
                inicioBloque
            ) {
                return;
            }


            disponibilidad.push({

                ...bloque,

                fechaInicio:
                    inicioBloque,

                fechaFin:
                    finBloque,

                inicio:
                    inicioBloque,

                fin:
                    finBloque,

                origen:
                    bloque.origen ||
                    "recurrente",

                tipo:
                    bloque.tipo ||
                    "recurrente"

            });

        }
    );

}
}


    /* =====================================================
       2. DISPONIBILIDAD TEMPORAL
    ===================================================== */

    const temporales =
        obtenerDisponibilidadTemporal();

    temporales.forEach(
        bloque => {

            const ocurrencia =
                convertirDisponibilidadTemporal(
                    bloque
                );

            if (!ocurrencia) {
                return;
            }


            if (
                ocurrencia.fin <=
                inicioBusqueda
            ) {
                return;
            }


            if (
                ocurrencia.inicio >=
                fin
            ) {
                return;
            }


            let inicioBloque =
                new Date(
                    ocurrencia.inicio
                );

            const finBloque =
                new Date(
                    ocurrencia.fin
                );


            if (
                inicioBloque < ahora
            ) {

                inicioBloque =
                    new Date(ahora);

            }


            if (
                finBloque <=
                inicioBloque
            ) {
                return;
            }


            disponibilidad.push({

                ...ocurrencia,

                fechaInicio:
                    inicioBloque,

                fechaFin:
                    finBloque,

                inicio:
                    inicioBloque,

                fin:
                    finBloque,

                tipo:
                    "temporal",

                origen:
                    "temporal"

            });

        }
    );


    /* =====================================================
       3. ORDEN CRONOLÓGICO
    ===================================================== */

    disponibilidad.sort(
        (a, b) =>
            a.fechaInicio.getTime() -
            b.fechaInicio.getTime()
    );


    return disponibilidad;

}


/* =========================================================
   FORMATEAR FECHA ISO
========================================================= */

function formatearFechaISO(
    fecha
) {

    if (!fecha) {
        return null;
    }


    const año =
        fecha.getFullYear();


    const mes =
        String(
            fecha.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const dia =
        String(
            fecha.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${año}-${mes}-${dia}`
    );

}


/* =========================================================
   OBTENER DISPONIBILIDAD DESDE HOY
   HASTA UNA FECHA
========================================================= */

function obtenerDisponibilidadHasta(
    fechaFin
) {

    const ahora =
        new Date();


    return obtenerDisponibilidadEfectiva(
        ahora,
        fechaFin
    );

}


/* =========================================================
   OBTENER DISPONIBILIDAD ENTRE DOS FECHAS
========================================================= */

function obtenerDisponibilidadEntre(
    fechaInicio,
    fechaFin
) {

    return obtenerDisponibilidadEfectiva(
        fechaInicio,
        fechaFin
    );

}


/* =========================================================
   CALCULAR MINUTOS DISPONIBLES
========================================================= */

function calcularMinutosDisponibles(
    bloque
) {

    if (
        !bloque ||
        !bloque.inicio ||
        !bloque.fin
    ) {

        return 0;

    }


    const diferencia =
        bloque.fin.getTime() -
        bloque.inicio.getTime();


    return Math.max(
        0,
        Math.floor(
            diferencia /
            (1000 * 60)
        )
    );

}


/* =========================================================
   CALCULAR HORAS DISPONIBLES
========================================================= */

function calcularHorasDisponibles(
    bloques
) {

    if (
        !Array.isArray(
            bloques
        )
    ) {

        return 0;

    }


    const minutos =
        bloques.reduce(
            (
                total,
                bloque
            ) =>
                total +
                calcularMinutosDisponibles(
                    bloque
                ),
            0
        );


    return (
        minutos / 60
    );

}


/* =========================================================
   ELIMINAR DISPONIBILIDAD TEMPORAL PASADA
========================================================= */

function limpiarDisponibilidadTemporalPasada() {

    const ahora =
        new Date();


    const disponibilidad =
        obtenerDisponibilidadTemporal();


    const resultado =
        disponibilidad.filter(
            bloque => {

                const fecha =
                    convertirFechaDia(
                        bloque.fecha
                    );


                /*
                 * Un dato inválido no debe
                 * interpretarse como vencido.
                 *
                 * Se conserva para evitar
                 * pérdida silenciosa de datos.
                 */

                if (!fecha) {
                    return true;
                }


                const fin =
                    crearFechaHora(
                        fecha,
                        bloque.horaFin
                    );


                /*
                 * Si la hora almacenada no puede
                 * convertirse correctamente,
                 * tampoco se elimina el bloque.
                 */

                if (!fin) {
                    return true;
                }


                return (
                    fin > ahora
                );

            }
        );


    guardarDisponibilidadTemporal(
        resultado
    );


    if (
        typeof renderizarDisponibilidadTemporal ===
        "function"
    ) {

        renderizarDisponibilidadTemporal();

    }

}


/* =========================================================
   DEBUG
========================================================= */

/**
 * Permite inspeccionar desde consola
 * la disponibilidad efectiva.
 *
 * Ejemplo:
 *
 * diagnosticarDisponibilidad(
 *     new Date(),
 *     fechaEntrega
 * );
 */
function diagnosticarDisponibilidad(
    fechaInicio,
    fechaFin
) {

    const bloques =
        obtenerDisponibilidadEntre(
            fechaInicio,
            fechaFin
        );


    console.group(
        "📅 Disponibilidad efectiva"
    );


    console.log(
        "Bloques encontrados:",
        bloques.length
    );


    bloques.forEach(
        (
            bloque,
            indice
        ) => {

            console.log(
                `${indice + 1}.`,
                bloque.origen,
                bloque.inicio,
                "→",
                bloque.fin,
                `(${calcularMinutosDisponibles(bloque)} min)`
            );

        }
    );


    console.log(
        "Horas totales:",
        calcularHorasDisponibles(
            bloques
        )
    );


    console.groupEnd();


    return bloques;

}

function obtenerDisponibilidadFutura(
    dias = 60
) {

    const ahora =
        new Date();

    const fechaFin =
        new Date(ahora);

    fechaFin.setDate(
        fechaFin.getDate() +
        Number(dias || 60)
    );

    return obtenerDisponibilidadEfectiva(
        ahora,
        fechaFin
    );

}


/* =========================================================
EXPORTACIÓN GLOBAL
========================================================= */

function prepararDisponibilidadFutura() {

    limpiarDisponibilidadTemporalPasada();

}


/*
 * Exponer API pública.
 */

if (typeof window !== "undefined") {

    window.obtenerDisponibilidadFutura =
        obtenerDisponibilidadFutura;

    window.prepararDisponibilidadFutura =
        prepararDisponibilidadFutura;

}