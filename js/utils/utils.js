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


function combinarFechaHora(fecha, hora) {

    if (!fecha) {
        return null;
    }

    const horaFinal =
        hora || "00:00";

    const fechaHora =
        `${fecha}T${horaFinal}:00`;

    const fechaObjeto =
        new Date(fechaHora);

    if (
        Number.isNaN(
            fechaObjeto.getTime()
        )
    ) {
        return null;
    }

    const offsetMinutos =
        -fechaObjeto.getTimezoneOffset();

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
        `${fechaHora}${signo}${horasOffset}:${minutosOffset}`
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