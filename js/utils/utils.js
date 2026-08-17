/* =========================================================
   UTILIDADES GENERALES
========================================================= */


/**
 * Convierte un UUID sin guiones al formato estándar.
 */
function formatearUuid(uuid) {

    if (!uuid) {
        return "";
    }

    const limpio = uuid.replaceAll("-", "");

    if (limpio.length !== 32) {
        return uuid;
    }

    return [
        limpio.slice(0, 8),
        limpio.slice(8, 12),
        limpio.slice(12, 16),
        limpio.slice(16, 20),
        limpio.slice(20)
    ].join("-");
}


function combinarFechaHora(
    fecha,
    hora
) {

    if (
        typeof fecha !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ) {
        return null;
    }


    const horaFinal =
        hora || "00:00";


    if (
        !/^\d{2}:\d{2}$/.test(horaFinal)
    ) {
        return null;
    }


    const [
        horas,
        minutos
    ] =
        horaFinal
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


    /*
     * La fecha de entrega representa la hora local
     * introducida por el usuario.
     *
     * Se conserva explícitamente el offset local
     * para evitar que el navegador/Notion interprete
     * la fecha en UTC y produzca un desfase de día.
     */
    const fechaLocal =
        new Date(
            Number(fecha.substring(0, 4)),
            Number(fecha.substring(5, 7)) - 1,
            Number(fecha.substring(8, 10)),
            horas,
            minutos,
            0,
            0
        );


    if (
        Number.isNaN(
            fechaLocal.getTime()
        )
    ) {
        return null;
    }


    const offsetMinutos =
        -fechaLocal.getTimezoneOffset();


    const signo =
        offsetMinutos >= 0
            ? "+"
            : "-";


    const horasOffset =
        String(
            Math.floor(
                Math.abs(offsetMinutos) / 60
            )
        ).padStart(
            2,
            "0"
        );


    const minutosOffset =
        String(
            Math.abs(offsetMinutos) % 60
        ).padStart(
            2,
            "0"
        );


    return (
        `${fecha}T${horaFinal}:00` +
        `${signo}${horasOffset}:${minutosOffset}`
    );

}

/**
 * Determina si una fecha ya venció.
 */
function estaVencida(fechaEntrega) {

    const fecha = convertirAFecha(fechaEntrega);

    if (!fecha) {
        return false;
    }

    return fecha.getTime() < Date.now();
}



/**
 * Escapa texto antes de insertarlo
 * directamente mediante innerHTML.
 */
function escaparHTML(texto) {

    if (texto === null || texto === undefined) {
        return "";
    }

    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}