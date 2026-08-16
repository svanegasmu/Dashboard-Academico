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


/**
 * Combina una fecha y una hora.
 *
 * Ejemplo:
 * combinarFechaHora("2026-08-10", "14:30")
 * → "2026-08-10T14:30"
 */
function combinarFechaHora(fecha, hora) {

    if (!fecha) {
        return null;
    }

    const horaFinal = hora || "00:00";

    return `${fecha}T${horaFinal}`;
}


/**
 * Convierte cualquier valor válido a Date.
 */
function convertirAFecha(valor) {

    if (!valor) {
        return null;
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
        return null;
    }

    return fecha;
}


/**
 * Calcula los días restantes hasta una fecha.
 *
 * Devuelve:
 * - número entero
 * - null si no existe una fecha válida
 */
function calcularDiasRestantes(fechaEntrega) {

    const fecha = convertirAFecha(fechaEntrega);

    if (!fecha) {
        return null;
    }

    const ahora = new Date();

    const diferencia =
        fecha.getTime() - ahora.getTime();

    return Math.ceil(
        diferencia / (1000 * 60 * 60 * 24)
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
 * Formatea una fecha para mostrarla al usuario.
 */
function formatearFechaHora(fechaEntrega) {

    const fecha = convertirAFecha(fechaEntrega);

    if (!fecha) {
        return "Sin fecha";
    }

    return fecha.toLocaleString("es-CO", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}


/**
 * Genera un identificador único.
 */
function generarId() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).substring(2)
    );
}


/**
 * Escapa caracteres que podrían romper
 * atributos HTML construidos dinámicamente.
 */
function escaparComillas(texto) {

    if (texto === null || texto === undefined) {
        return "";
    }

    return String(texto)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");
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