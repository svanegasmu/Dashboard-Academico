/* =========================================================
   ACADEMIC HUB - PUNTO DE ENTRADA DE LA APLICACIÓN
   ========================================================= */

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    inicializarAplicacion();
});


/**
 * Inicializa todos los componentes principales
 * de Academic Hub.
 */
async function inicializarAplicacion() {
    console.log(
        "🎓 Academic Hub iniciando..."
    );

    try {

        inicializarNavegacion();
        inicializarFormularios();
        inicializarHorario();
        inicializarDisponibilidadUI();
        inicializarRepasos();
        inicializarSeccionActiva();


        const entregasIniciales =
            await cargarEntregas();


        /*
         * null representa un fallo de carga.
         *
         * No convertirlo en [] ni continuar con
         * la regeneración, para evitar que el motor
         * realice una segunda consulta a Notion.
         */
        if (
            !Array.isArray(
                entregasIniciales
            )
        ) {
            return;
        }


        if (
            typeof regenerarRepasosSeguro ===
            "function"
        ) {

            await regenerarRepasosSeguro(
                entregasIniciales
            );

        }


        console.log(
            "✅ Academic Hub iniciado correctamente."
        );

    } catch (error) {

        console.error(
            "❌ Error al inicializar Academic Hub:",
            error
        );

    }
}


/* =========================================================
   NAVEGACIÓN
   ========================================================= */

/**
 * Configura los elementos de navegación
 * de la barra lateral.
 */
function inicializarNavegacion() {

    const elementos = document.querySelectorAll(".nav-item");

     elementos.forEach(elemento => {

        const activarSeccion = () => {

            const tab = elemento.dataset.tab;

            if (!tab) {
                return;
            }

            switchTab(tab);

        };

        elemento.addEventListener(
            "click",
            activarSeccion
        );

        elemento.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    activarSeccion();

                }

            }
        );

    });
}


/**
 * Cambia la sección visible.
 */
function switchTab(
    nombreSeccion,
    recargarEntregas = true
) {

    if (!nombreSeccion) {
        return;
    }

    const secciones =
        document.querySelectorAll(
            ".section"
        );

    const elementos =
        document.querySelectorAll(
            ".nav-item"
        );

    const seccionActual =
        document.querySelector(
            ".section.active"
        );

    const yaActiva =
        seccionActual &&
        seccionActual.id ===
        nombreSeccion;

    let seccionEncontrada =
        false;


    secciones.forEach(
        seccion => {

            const activa =
                seccion.id ===
                nombreSeccion;

            seccion.classList.toggle(
                "active",
                activa
            );

            if (activa) {
                seccionEncontrada =
                    true;
            }

        }
    );


    elementos.forEach(
        elemento => {

            const activo =
                elemento.dataset.tab ===
                nombreSeccion;

            elemento.classList.toggle(
                "active",
                activo
            );

        }
    );


    if (!seccionEncontrada) {

        console.warn(
            `La sección "${nombreSeccion}" no existe.`
        );

        return;
    }


    if (yaActiva) {
        return;
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (
        nombreSeccion ===
        "cronograma-repasos" &&
        typeof renderizarCronogramaRepasos ===
        "function"
    ) {

        renderizarCronogramaRepasos();

    }


    if (
        nombreSeccion === "horario" &&
        typeof renderizarHorarios ===
        "function"
    ) {

        renderizarHorarios();

    }

}


/**
 * Determina la sección inicial.
 */
function inicializarSeccionActiva() {

    const seccionActiva =
        document.querySelector(".section.active");


    if (seccionActiva) {

        switchTab(
            seccionActiva.id
        );

        return;
    }


    const primeraSeccion =
        document.querySelector(".section");


    if (primeraSeccion) {

        switchTab(
            primeraSeccion.id
        );

    }

}


/* =========================================================
   FORMULARIOS
   ========================================================= */

/**
 * Conecta los formularios HTML
 * con sus respectivas funciones.
 */
function inicializarFormularios() {

    const formularioActividad =
        document.getElementById(
            "form-actividad"
        );


    if (
        formularioActividad &&
        typeof enviarANotion === "function"
    ) {

        formularioActividad.addEventListener(
            "submit",
            enviarANotion
        );

    }


    const formularioHorario =
        document.getElementById(
            "form-horario"
        );


    if (
        formularioHorario &&
        typeof guardarBloqueHorario === "function"
    ) {

        formularioHorario.addEventListener(
            "submit",
            guardarBloqueHorario
        );

    }

}