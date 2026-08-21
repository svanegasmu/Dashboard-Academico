
/* =========================================================
   ACADEMIC HUB - MOTOR DE REPASOS
   ---------------------------------------------------------
   Funciones principales:

   1. Analizar actividades pendientes.
   2. Obtener disponibilidad futura.
   3. Aplicar curva del olvido como referencia.
   4. No utilizar bloques pasados.
   5. No programar después de la entrega.
   6. Priorizar por urgencia + importancia.
   7. Dar prioridad a la primera sesión.
   8. Evitar que una actividad monopolice los bloques.
   9. Respetar disponibilidad recurrente y temporal.
   10. Evitar duplicados y solapamientos.
   11. Mantener el historial de sesiones completadas.
   ========================================================= */


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const CONFIG_REPASOS = {

    intervalos: [1, 3, 7, 14],

    maximoRepasos: 4,

    diasUrgencia: 3,

    diasGeneracionHorarios: 60,

    toleranciaSolapamientoMs: 0,

    pesoImportancia: {
        Alta: 3,
        Media: 2,
        Baja: 1
    },

    claveStorage:
        "academic_hub_repasos"

};


/* =========================================================
   ESTADO DEL PLANIFICADOR
   ========================================================= */

let estadoRepasos = {

    actividades: [],

    bloquesDisponibles: [],

    sesiones: [],

    ultimaGeneracion: null

};


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

function inicializarRepasos() {

    console.log(
        "🧠 Inicializando motor de repasos..."
    );

    cargarSesionesRepaso();

    renderizarCronogramaRepasos();

}


/* =========================================================
   ALMACENAMIENTO
   ========================================================= */

function obtenerClaveRepasos() {

    return CONFIG_REPASOS.claveStorage;

}


function cargarSesionesRepaso() {

    try {

        const datos =
            localStorage.getItem(
                obtenerClaveRepasos()
            );


        if (!datos) {

            estadoRepasos.sesiones = [];

            return;

        }


        const sesiones =
            JSON.parse(datos);


        if (
            !Array.isArray(sesiones)
        ) {

            estadoRepasos.sesiones = [];

            return;

        }


        estadoRepasos.sesiones =
            sesiones.filter(
                sesion =>
                    sesion &&
                    typeof sesion === "object" &&
                    sesion.actividadId !== undefined
            );


        const sesionesAntes =
            estadoRepasos.sesiones.length;


        limpiarHistorialSesionesCompletadas();


        const huboLimpieza =
            estadoRepasos.sesiones.length !==
            sesionesAntes;


        /*
         * Si se eliminaron sesiones antiguas,
         * persistir inmediatamente el historial
         * reducido utilizando la misma clave
         * y la misma función de almacenamiento.
         */

        if (
            huboLimpieza
        ) {

            guardarSesionesRepaso();

        }

    }
    catch (error) {

        console.error(
            "❌ Error al cargar sesiones de repaso:",
            error
        );

        estadoRepasos.sesiones = [];

    }

}

function limpiarHistorialSesionesCompletadas() {

    if (
        !Array.isArray(
            estadoRepasos.sesiones
        )
    ) {

        return;

    }


    const ahora =
        new Date();


    const diezDiasMs =
        10 *
        24 *
        60 *
        60 *
        1000;


    estadoRepasos.sesiones =
        estadoRepasos.sesiones.filter(
            sesion => {

                /*
                 * Las sesiones pendientes nunca se
                 * eliminan mediante esta limpieza.
                 */

                if (
                    sesion.estado !==
                    "completado"
                ) {

                    return true;

                }


                /*
                 * Una sesión completada sin
                 * completadoEn debe conservarse
                 * por seguridad.
                 */

                const completadoEn =
                    convertirAFecha(
                        sesion.completadoEn
                    );


                if (
                    !completadoEn
                ) {

                    return true;

                }


                const antiguedadMs =
                    ahora.getTime() -
                    completadoEn.getTime();


                /*
                 * Conservar hasta cumplir exactamente
                 * 10 días.
                 *
                 * Solo eliminar cuando sea MAYOR
                 * a 10 días.
                 */

                if (
                    antiguedadMs <=
                    diezDiasMs
                ) {

                    return true;

                }


                return false;

            }
        );

}


function guardarSesionesRepaso() {

    try {

        localStorage.setItem(
            obtenerClaveRepasos(),
            JSON.stringify(
                estadoRepasos.sesiones
            )
        );

        return true;

    }
    catch (error) {

        console.error(
            "❌ Error al guardar sesiones de repaso:",
            error
        );

        return false;

    }

}


/* =========================================================
   GENERACIÓN PRINCIPAL
   ========================================================= */

async function generarCronogramaRepasos(
    entregasDisponibles = undefined
) {

    console.log(
        "🧠 Generando cronograma de repasos..."
    );


    try {

        const entregas =
            await obtenerEntregasSeguras(
                entregasDisponibles
            );


        /*
         * null significa que no fue posible cargar
         * las entregas.
         *
         * No interpretar el fallo como una lista
         * vacía y no modificar el estado del motor.
         */
        if (
            entregas === null
        ) {
            return;
        }


        const actividades =
            prepararActividades(
                entregas
            );


        const bloques =
            obtenerBloquesDisponiblesFuturos();


        estadoRepasos.actividades =
            actividades;

        estadoRepasos.bloquesDisponibles =
            bloques;


        /*
         * Primero eliminar sesiones pendientes
         * que dejaron de ser válidas.
         *
         * El historial completado permanece.
         */
        limpiarSesionesInvalidas(
            actividades,
            bloques
        );


        if (
            actividades.length === 0 ||
            bloques.length === 0
        ) {

            estadoRepasos.ultimaGeneracion =
                new Date().toISOString();

            guardarSesionesRepaso();

            renderizarCronogramaRepasos();

            return;
        }


        const nuevasSesiones =
            planificarSesiones(
                actividades,
                bloques
            );


        estadoRepasos.sesiones =
            fusionarSesiones(
                estadoRepasos.sesiones,
                nuevasSesiones
            );


        estadoRepasos.sesiones =
            eliminarSesionesDuplicadas(
                estadoRepasos.sesiones
            );


        estadoRepasos.ultimaGeneracion =
            new Date().toISOString();


        guardarSesionesRepaso();

        renderizarCronogramaRepasos();


        console.log(
            "✅ Cronograma generado:",
            nuevasSesiones
        );

    } catch (error) {

        console.error(
            "❌ Error generando cronograma:",
            error
        );

    }
}


/* =========================================================
   OBTENER ENTREGAS DE FORMA SEGURA
   ========================================================= */

async function obtenerEntregasSeguras(
    entregasDisponibles = undefined
) {

    if (
        Array.isArray(
            entregasDisponibles
        )
    ) {
        return entregasDisponibles;
    }


    /*
     * null representa explícitamente un fallo
     * de una carga anterior.
     *
     * No realizar una segunda consulta.
     */
    if (
        entregasDisponibles === null
    ) {
        return null;
    }


    if (
        typeof obtenerEntregas !==
        "function"
    ) {

        console.error(
            "❌ No se encontró la función obtenerEntregas()."
        );

        return null;
    }


    try {

        const resultado =
            await obtenerEntregas();


        return Array.isArray(
            resultado
        )
            ? resultado
            : null;

    } catch (error) {

        console.error(
            "❌ Error obteniendo entregas:",
            error
        );

        return null;
    }
}


/* =========================================================
   PREPARAR ACTIVIDADES
   ========================================================= */

function prepararActividades(
    entregas
) {

    if (
        !Array.isArray(entregas)
    ) {

        return [];

    }


    const ahora =
        new Date();


    return entregas

        .filter(
            entrega =>
                entrega &&
                typeof entrega === "object"
        )

        .filter(
            entrega => {

                const fecha =
                    convertirAFecha(
                        obtenerFechaEntrega(
                            entrega
                        )
                    );


                if (!fecha) {

                    return false;

                }


                /*
                 * Una actividad vencida no recibe
                 * nuevas sesiones.
                 */

                return fecha.getTime() >
                    ahora.getTime();

            }
        )

        .map(
            entrega => {

                const fechaEntrega =
                    convertirAFecha(
                        obtenerFechaEntrega(
                            entrega
                        )
                    );


                const diasRestantes =
                    calcularDiasRestantes(
                        fechaEntrega
                    );


                const importancia =
                    normalizarImportancia(
                        entrega.importancia
                    );


                const pesoImportancia =
                    CONFIG_REPASOS
                        .pesoImportancia[
                            importancia
                        ] || 1;


                const actividadId =
                    obtenerIdActividad(
                        entrega
                    );


                const sesionesExistentes =
                    contarSesionesActividad(
                        actividadId
                    );


                const repasosRealizados =
                    contarRepasosRealizados(
                        actividadId
                    );


                return {

                    ...entrega,

                    id:
                        actividadId,

                    fechaEntregaObjeto:
                        fechaEntrega,

                    diasRestantes,

                    pesoImportancia,

                    sesionesExistentes,

                    repasosRealizados,

                    necesitaPrimeraSesion:
                        sesionesExistentes === 0,

                    prioridadPlanificacion:
                        calcularPrioridadActividad(
                            entrega,
                            diasRestantes,
                            sesionesExistentes
                        )

                };

            }
        );

}


/* =========================================================
   OBTENER FECHA DE ENTREGA
   ========================================================= */

function obtenerFechaEntrega(
    actividad
) {

    if (!actividad) {

        return null;

    }


    return (
        actividad.fechaEntrega ??
        actividad.fecha_entrega ??
        actividad.fechaLimite ??
        actividad.fechaLimiteEntrega ??
        actividad.entrega
    );

}


/* =========================================================
   OBTENER ID DE ACTIVIDAD
   ========================================================= */

function obtenerIdActividad(
    actividad
) {

    if (
        actividad &&
        actividad.id !== undefined &&
        actividad.id !== null &&
        String(actividad.id).trim() !== ""
    ) {

        return String(
            actividad.id
        );

    }


    /*
     * Compatibilidad con posibles nombres
     * utilizados por otros módulos.
     */

    if (
        actividad &&
        actividad.idActividad !== undefined
    ) {

        return String(
            actividad.idActividad
        );

    }


    if (
        actividad &&
        actividad.identificador !== undefined
    ) {

        return String(
            actividad.identificador
        );

    }


    /*
     * Si no existe ID, generamos uno estable
     * a partir de algunos datos básicos.
     */

    const texto =
        [
            actividad?.actividad,
            actividad?.materia,
            obtenerFechaEntrega(actividad)
        ]
            .filter(
                valor =>
                    valor !== undefined &&
                    valor !== null
            )
            .join("|");


    return (
        "actividad-" +
        hashSimple(
            texto
        )
    );

}


/* =========================================================
   NORMALIZAR IMPORTANCIA
   ========================================================= */

function normalizarImportancia(
    importancia
) {

    const valor =
        String(
            importancia || "Media"
        )
            .trim()
            .toLowerCase();


    if (
        valor === "alta"
    ) {

        return "Alta";

    }


    if (
        valor === "baja"
    ) {

        return "Baja";

    }


    return "Media";

}


/* =========================================================
   PRIORIDAD DE ACTIVIDADES
   ========================================================= */

function calcularPrioridadActividad(
    actividad,
    diasRestantes,
    sesionesExistentes
) {

    let puntuacion = 0;


    const importancia =
        normalizarImportancia(
            actividad?.importancia
        );


    /*
     * IMPORTANCIA
     */

    puntuacion +=
        (
            CONFIG_REPASOS
                .pesoImportancia[
                    importancia
                ] || 1
        ) * 10;


    /*
     * URGENCIA
     */

    if (
        Number.isFinite(
            diasRestantes
        )
    ) {

        if (
            diasRestantes <= 1
        ) {

            puntuacion += 50;

        }
        else if (
            diasRestantes <=
            CONFIG_REPASOS.diasUrgencia
        ) {

            puntuacion += 35;

        }
        else if (
            diasRestantes <= 7
        ) {

            puntuacion += 20;

        }
        else if (
            diasRestantes <= 14
        ) {

            puntuacion += 10;

        }

    }


    /*
     * PRIMERA SESIÓN
     */

    if (
        sesionesExistentes === 0
    ) {

        puntuacion += 25;

    }


    /*
     * EQUILIBRIO.
     */

    puntuacion -=
        sesionesExistentes * 8;


    return puntuacion;

}


/* =========================================================
   BLOQUES DE DISPONIBILIDAD
   ========================================================= */

function obtenerBloquesDisponiblesFuturos() {

    try {

        /*
         * La disponibilidad.js es ahora la ÚNICA fuente
         * de disponibilidad.
         */

        if (
            typeof obtenerDisponibilidadFutura !==
            "function"
        ) {

            console.error(
                "❌ No existe obtenerDisponibilidadFutura()."
            );

            return [];

        }


        const bloques =
            obtenerDisponibilidadFutura(
                CONFIG_REPASOS
                    .diasGeneracionHorarios
            );


        if (
            !Array.isArray(bloques)
        ) {

            return [];

        }


        return bloques

            .map(
                normalizarBloque
            )

            .filter(
                bloque =>
                    bloque !== null
            )

            .filter(
                bloque =>
                    bloque.fechaFin >
                    new Date()
            )

            .sort(
                (a, b) =>
                    a.fechaInicio -
                    b.fechaInicio
            );

    }
    catch (error) {

        console.error(
            "❌ Error obteniendo disponibilidad futura:",
            error
        );

        return [];

    }

}


/* =========================================================
   NORMALIZACIÓN DE BLOQUES
   ========================================================= */

function normalizarBloque(
    bloque
) {

    if (
        !bloque ||
        typeof bloque !== "object"
    ) {
        return null;
    }


    const valorInicio =
        bloque.fechaInicio ??
        bloque.inicio ??
        bloque.start ??
        bloque.startTime;


    const valorFin =
        bloque.fechaFin ??
        bloque.fin ??
        bloque.end ??
        bloque.endTime;


    if (
        !valorInicio ||
        !valorFin
    ) {
        return null;
    }


    const inicio =
        convertirAFecha(
            valorInicio
        );


    const fin =
        convertirAFecha(
            valorFin
        );


    if (
        !inicio ||
        !fin ||
        fin <= inicio
    ) {
        return null;
    }


    return {

        id:
            bloque.id ??
            generarId(),

        fechaInicio:
            inicio,

        fechaFin:
            fin,

        inicio:
            inicio,

        fin:
            fin,

        tipo:
            bloque.tipo ??
            "recurrente",

        origen:
            bloque.origen ??
            "disponibilidad",

        horarioId:
            bloque.horarioId ??
            null

    };

}

/* =========================================================
   NORMALIZAR NOMBRE DE DÍA
   ========================================================= */

function normalizarNombreDia(
    dia
) {

    return String(
        dia || ""
    )
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );

}


/* =========================================================
   CONSTRUIR FECHA + HORA
   ========================================================= */

function construirFechaConHora(
    fecha,
    hora
) {

    if (
        !fecha ||
        hora === null ||
        hora === undefined
    ) {

        return null;

    }


    const texto =
        String(hora)
            .trim();


    /*
     * Aceptar HH:MM y HH:MM:SS.
     */

    const coincidencia =
        texto.match(
            /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
        );


    if (
        !coincidencia
    ) {

        return null;

    }


    const horas =
        Number(
            coincidencia[1]
        );


    const minutos =
        Number(
            coincidencia[2]
        );


    const segundos =
        Number(
            coincidencia[3] || 0
        );


    if (
        horas < 0 ||
        horas > 23 ||
        minutos < 0 ||
        minutos > 59 ||
        segundos < 0 ||
        segundos > 59
    ) {

        return null;

    }


    const resultado =
        new Date(
            fecha
        );


    resultado.setHours(
        horas,
        minutos,
        segundos,
        0
    );


    return resultado;

}


/* =========================================================
   PLANIFICACIÓN
   ========================================================= */

function planificarSesiones(
    actividades,
    bloques
) {

    const nuevasSesiones = [];

    const reasignacionesAceptadas = [];


    if (
        !Array.isArray(actividades) ||
        !Array.isArray(bloques)
    ) {

        return nuevasSesiones;

    }


    const bloquesTodos =
        [...bloques];


    const sesionesTrabajo =
        Array.isArray(
            estadoRepasos.sesiones
        )
            ? estadoRepasos.sesiones.map(
                sesion => ({
                    ...sesion
                })
            )
            : [];


    /*
     * =====================================================
     * FASES ESTRICTAS
     * =====================================================
     *
     * Fase 1 -> repaso 1
     * Fase 2 -> repaso 2
     * Fase 3 -> repaso 3
     * Fase 4 -> repaso 4
     *
     * Una actividad solamente entra en una fase
     * si puede solicitar ese número de repaso.
     */

    for (
        let numeroRepaso = 1;
        numeroRepaso <=
        CONFIG_REPASOS.maximoRepasos;
        numeroRepaso++
    ) {

        /*
         * Determinar las actividades que pueden
         * solicitar ESTE número de repaso.
         *
         * Una actividad queda bloqueada si existe
         * un repaso pendiente anterior.
         */

        const actividadesElegibles =
            actividades
                .filter(
                    actividad => {

                        const sesionesActividad =
                            [
                                ...sesionesTrabajo,
                                ...nuevasSesiones
                            ]
                                .filter(
                                    sesion =>
                                        String(
                                            sesion.actividadId
                                        ) ===
                                        String(
                                            actividad.id
                                        )
                                );


                        /*
                         * No crear un repaso que ya existe.
                         */

                        const yaExiste =
                            sesionesActividad.some(
                                sesion =>
                                    Number(
                                        sesion.numeroRepaso
                                    ) ===
                                    numeroRepaso
                            );


                        if (
                            yaExiste
                        ) {

                            return false;

                        }


                        /*
                         * Si existe cualquier repaso
                         * anterior pendiente, no se puede
                         * saltar al siguiente.
                         *
                         * Ejemplo:
                         *
                         * 1 completado
                         * 2 pendiente
                         *
                         * -> no puede solicitar 3.
                         */

                        const tieneRepasoAnteriorPendiente =
                            sesionesActividad.some(
                                sesion =>

                                    sesion.estado ===
                                    "pendiente" &&

                                    Number(
                                        sesion.numeroRepaso
                                    ) <
                                    numeroRepaso
                            );


                        if (
                            tieneRepasoAnteriorPendiente
                        ) {

                            return false;

                        }


                        /*
                         * Para solicitar el repaso N,
                         * todos los repasos anteriores
                         * deben existir.
                         *
                         * Esto evita saltos producidos
                         * por historial limpiado o datos
                         * incompletos.
                         */

                        for (
                            let anterior = 1;
                            anterior < numeroRepaso;
                            anterior++
                        ) {

                            const existeAnterior =
                                sesionesActividad.some(
                                    sesion =>
                                        Number(
                                            sesion.numeroRepaso
                                        ) ===
                                        anterior
                                );


                            if (
                                !existeAnterior
                            ) {

                                return false;

                            }

                        }


                        return true;

                    }
                )
                .sort(
                    (a, b) => {

                        if (
                            b.prioridadPlanificacion !==
                            a.prioridadPlanificacion
                        ) {

                            return (
                                b.prioridadPlanificacion -
                                a.prioridadPlanificacion
                            );

                        }


                        return (
                            a.fechaEntregaObjeto -
                            b.fechaEntregaObjeto
                        );

                    }
                );


        for (
            const actividad
            of actividadesElegibles
        ) {

            /*
             * Protección adicional contra superar
             * el máximo configurado.
             */

            if (
                numeroRepaso >
                CONFIG_REPASOS.maximoRepasos
            ) {

                continue;

            }


            const sesionesConsideradas =
                [
                    ...sesionesTrabajo,
                    ...nuevasSesiones
                ];


            /*
             * Primero utilizar bloques libres.
             */

            const bloquesLibres =
                filtrarBloquesNoOcupados(
                    bloquesTodos,
                    sesionesConsideradas
                );


            let bloque =
                buscarMejorBloque(
                    actividad,
                    numeroRepaso,
                    bloquesLibres,
                    sesionesConsideradas
                );


            /*
             * La reasignación solamente está permitida
             * para conseguir un PRIMER repaso.
             *
             * Los repasos 2/3/4 nunca desplazan
             * sesiones existentes.
             */

            if (
    !bloque &&
    numeroRepaso === 1
) {

    const resultadoReasignacion =
        buscarReasignacionSeguraParaPrimerRepaso(
            actividad,
            bloquesTodos,
            sesionesConsideradas,
            actividades
        );


    if (
        resultadoReasignacion &&
        Array.isArray(
            resultadoReasignacion.reasignaciones
        ) &&
        resultadoReasignacion
            .reasignaciones
            .length > 0
    ) {

        /*
         * Modificar únicamente las copias de trabajo.
         */

        aplicarReasignacionesTemporales(
            sesionesTrabajo,
            resultadoReasignacion
                .reasignaciones
        );


        /*
         * Registrar la reasignación solamente después
         * de que la simulación haya confirmado que
         * toda la secuencia es válida.
         */

        reasignacionesAceptadas.push(
            ...resultadoReasignacion
                .reasignaciones
        );


        /*
         * El bloque ocupado originalmente por la
         * sesión desplazada queda disponible para
         * el nuevo repaso 1.
         */

        bloque =
            resultadoReasignacion
                .bloqueLiberado;

    }

}


            /*
             * Si no existe ningún bloque válido,
             * esta actividad no bloquea a las demás.
             */

            if (
                !bloque
            ) {

                continue;

            }


            const sesion =
                crearSesionRepaso(
                    actividad,
                    numeroRepaso,
                    bloque
                );


            nuevasSesiones.push(
                sesion
            );


            /*
             * Actualizar inmediatamente la copia
             * de trabajo para que una segunda
             * iteración no pueda crear el mismo
             * repaso.
             *
             * No se modifica todavía el estado real.
             */

            actividad.sesionesExistentes =
                (
                    actividad.sesionesExistentes ||
                    0
                ) + 1;


            actividad.necesitaPrimeraSesion =
                false;

        }

    }


    /*
     * Aplicar las reasignaciones aceptadas al
     * estado real solamente una vez.
     */

    if (
        reasignacionesAceptadas.length > 0
    ) {

        aplicarReasignacionesTemporales(
            estadoRepasos.sesiones,
            reasignacionesAceptadas
        );

    }


    return nuevasSesiones;

}


function buscarReasignacionSeguraParaPrimerRepaso(
    actividadNueva,
    bloques,
    sesionesConsideradas,
    actividades
) {

    if (
        !actividadNueva ||
        !Array.isArray(bloques) ||
        !Array.isArray(sesionesConsideradas) ||
        !Array.isArray(actividades)
    ) {

        return null;

    }


    /*
     * Solamente sesiones pendientes posteriores
     * al primer repaso pueden ser desplazadas.
     *
     * Nunca:
     *
     * - repaso 1;
     * - sesiones completadas.
     */

    const sesionesDesplazables =
        sesionesConsideradas
            .filter(
                sesion =>

                    sesion &&
                    sesion.estado ===
                    "pendiente" &&

                    Number(
                        sesion.numeroRepaso
                    ) > 1
            );


    if (
        sesionesDesplazables.length === 0
    ) {

        return null;

    }


    /*
     * Primero comprobar todos los bloques
     * ocupados por esas sesiones.
     *
     * Se priorizan los bloques más cercanos
     * a la fecha ideal del nuevo repaso 1.
     */

    const candidatos = [];


    sesionesDesplazables.forEach(
        sesion => {

            /*
             * Resolver el bloque actual que
             * representa el hueco de la sesión.
             *
             * 1. Coincidencia exacta por ID.
             *    Los bloques temporales conservan
             *    identidad estable entre generaciones.
             *
             * 2. Cobertura íntegra del intervalo.
             *    Los IDs recurrentes se regeneran en
             *    cada generación y no pueden coincidir
             *    con un bloqueId persistido de una
             *    generación anterior.
             */

            let bloque =
                bloques.find(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(
                            sesion.bloqueId
                        )
                );


            if (
                !bloque
            ) {

                const fechaSesion =
                    convertirAFecha(
                        sesion.fechaProgramada
                    );


                const fechaFinSesion =
                    convertirAFecha(
                        sesion.fechaFin
                    );


                if (
                    fechaSesion &&
                    fechaFinSesion
                ) {

                    bloque =
                        bloques.find(
                            item => {

                                const inicioBloque =
                                    convertirAFecha(
                                        item.fechaInicio ??
                                        item.inicio
                                    );

                                const finBloque =
                                    convertirAFecha(
                                        item.fechaFin ??
                                        item.fin
                                    );

                                if (
                                    !inicioBloque ||
                                    !finBloque
                                ) {
                                    return false;
                                }

                                return (
                                    inicioBloque <=
                                    fechaSesion &&
                                    finBloque >=
                                    fechaFinSesion
                                );

                            }
                        );

                }

            }


            if (
                !bloque
            ) {

                return;

            }


            /*
             * El bloque debe ser realmente válido
             * para la nueva actividad.
             */

            if (
                !esBloqueValidoParaActividad(
                    bloque,
                    actividadNueva
                )
            ) {

                return;

            }


            /*
             * Si existe otra sesión solapada en el
             * mismo bloque, no intentar desplazar
             * una sola de ellas.
             */

            const sesionesEnBloque =
                sesionesConsideradas.filter(
                    existente =>

                        existente.id !==
                        sesion.id &&

                        bloquesSeSolapan(
                            bloque,
                            {
                                fechaProgramada:
                                    existente.fechaProgramada,

                                fechaFin:
                                    existente.fechaFin
                            }
                        )
                );


            if (
                sesionesEnBloque.length > 0
            ) {

                return;

            }


            const distancia =
                calcularDistanciaBloqueAFechaIdeal(
                    actividadNueva,
                    1,
                    bloque
                );


            candidatos.push({

                sesion,

                bloque,

                distancia

            });

        }
    );


    candidatos.sort(
        (a, b) =>
            a.distancia -
            b.distancia
    );


    /*
     * Intentar cada candidato hasta encontrar
     * una reasignación completamente factible.
     */

    for (
        const candidato
        of candidatos
    ) {

        const actividadAfectada =
            actividades.find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        candidato.sesion.actividadId
                    )
            );


        if (
            !actividadAfectada
        ) {

            continue;

        }


        const resultado =
            simularReasignacionSesion(
                candidato.sesion,
                candidato.bloque,
                actividadAfectada,
                bloques,
                sesionesConsideradas
            );


        if (
            resultado
        ) {

            return {

                bloqueLiberado:
                    candidato.bloque,

                reasignaciones:
                    resultado.reasignaciones

            };

        }

    }


    return null;

}

function esBloqueValidoParaActividad(
    bloque,
    actividad
) {

    if (
        !bloque ||
        !actividad
    ) {

        return false;

    }


    const inicio =
        convertirAFecha(
            bloque.fechaInicio
        );


    const fin =
        convertirAFecha(
            bloque.fechaFin
        );


    const entrega =
        convertirAFecha(
            actividad.fechaEntregaObjeto
        );


    if (
        !inicio ||
        !fin ||
        !entrega
    ) {

        return false;

    }


    const ahora =
        new Date();


    if (
        inicio <= ahora
    ) {

        return false;

    }


    /*
     * El bloque completo debe terminar
     * estrictamente antes de la entrega.
     */

    if (
        fin >= entrega
    ) {

        return false;

    }


    return true;

}

function calcularDistanciaBloqueAFechaIdeal(
    actividad,
    numeroRepaso,
    bloque
) {

    const fechaIdeal =
        calcularFechaIdealRepaso(
            actividad,
            numeroRepaso
        );


    const inicio =
        convertirAFecha(
            bloque?.fechaInicio
        );


    if (
        !fechaIdeal ||
        !inicio
    ) {

        return Number.MAX_SAFE_INTEGER;

    }


    return Math.abs(
        inicio.getTime() -
        fechaIdeal.getTime()
    );

}

function simularReasignacionSesion(
    sesionObjetivo,
    bloqueNuevo,
    actividad,
    bloques,
    sesionesConsideradas
) {

    if (
        !sesionObjetivo ||
        !bloqueNuevo ||
        !actividad ||
        !Array.isArray(bloques) ||
        !Array.isArray(sesionesConsideradas)
    ) {

        return null;

    }


    if (
        sesionObjetivo.estado !==
        "pendiente"
    ) {

        return null;

    }


    if (
        Number(
            sesionObjetivo.numeroRepaso
        ) <= 1
    ) {

        return null;

    }


    /*
     * El bloque nuevo debe ser válido para
     * la actividad afectada.
     */

    if (
        !esBloqueValidoParaActividad(
            bloqueNuevo,
            actividad
        )
    ) {

        return null;

    }


    /*
     * Crear una copia aislada de las sesiones.
     *
     * La sesión original NO se modifica.
     */

    const sesionesSimuladas =
        sesionesConsideradas
            .map(
                sesion => ({
                    ...sesion
                })
            );


    const objetivoSimulado =
        sesionesSimuladas.find(
            sesion =>
                String(
                    sesion.id
                ) ===
                String(
                    sesionObjetivo.id
                )
        );


    if (
        !objetivoSimulado
    ) {

        return null;

    }


    /*
     * El bloque nuevo no puede estar ocupado
     * por otra sesión.
     */

    const otrasSesiones =
        sesionesSimuladas.filter(
            sesion =>
                String(
                    sesion.id
                ) !==
                String(
                    sesionObjetivo.id
                )
        );


    if (
        bloqueEstaOcupado(
            bloqueNuevo,
            otrasSesiones
        )
    ) {

        return null;

    }


    /*
     * Mover temporalmente el objetivo.
     */

    objetivoSimulado.fechaProgramada =
        bloqueNuevo.fechaInicio
            .toISOString();


    objetivoSimulado.fechaFin =
        bloqueNuevo.fechaFin
            .toISOString();


    objetivoSimulado.bloqueId =
        bloqueNuevo.id;


    objetivoSimulado.bloqueTipo =
        bloqueNuevo.tipo;


    objetivoSimulado.bloqueOrigen =
        bloqueNuevo.origen;


    /*
     * Obtener los repasos posteriores
     * pendientes de la misma actividad.
     */

    const posteriores =
        sesionesSimuladas
            .filter(
                sesion =>

                    String(
                        sesion.actividadId
                    ) ===
                    String(
                        actividad.id
                    ) &&

                    Number(
                        sesion.numeroRepaso
                    ) >
                    Number(
                        sesionObjetivo.numeroRepaso
                    ) &&

                    sesion.estado ===
                    "pendiente"
            )
            .sort(
                (a, b) =>
                    Number(
                        a.numeroRepaso
                    ) -
                    Number(
                        b.numeroRepaso
                    )
            );


    /*
     * La simulación debe poder mantener toda
     * la cadena restante.
     */

    const reasignaciones = [

        {

            sesion:
                sesionObjetivo,

            nuevoBloque:
                bloqueNuevo

        }

    ];


    let fechaAnterior =
        convertirAFecha(
            objetivoSimulado.fechaProgramada
        );


    const sesionesBloqueadas =
        sesionesSimuladas.filter(
            sesion =>
                String(
                    sesion.id
                ) !==
                String(
                    sesionObjetivo.id
                )
        );


    for (
        const posterior
        of posteriores
    ) {

        const numeroRepaso =
            Number(
                posterior.numeroRepaso
            );


        const candidatos =
            bloques
                .filter(
                    bloque => {

                        if (
                            !esBloqueValidoParaActividad(
                                bloque,
                                actividad
                            )
                        ) {

                            return false;

                        }


                        /*
                         * El siguiente repaso debe
                         * ocurrir después del anterior.
                         */

                        if (
                            bloque.fechaInicio <=
                            fechaAnterior
                        ) {

                            return false;

                        }


                        /*
                         * No puede utilizar un bloque
                         * ocupado por otra sesión.
                         */

                        if (
                            bloqueEstaOcupado(
                                bloque,
                                sesionesBloqueadas
                            )
                        ) {

                            return false;

                        }


                        /*
                         * Tampoco puede utilizar un
                         * bloque ya asignado dentro
                         * de esta misma simulación.
                         */

                        if (
                            bloqueEstaOcupado(
                                bloque,
                                posteriores
                                    .filter(
                                        item =>
                                            item !==
                                            posterior
                                    )
                            )
                        ) {

                            return false;

                        }


                        return true;

                    }
                )
                .sort(
                    (a, b) =>
                        calcularDistanciaBloqueAFechaIdeal(
                            actividad,
                            numeroRepaso,
                            a
                        ) -
                        calcularDistanciaBloqueAFechaIdeal(
                            actividad,
                            numeroRepaso,
                            b
                        )
                );


        if (
            candidatos.length === 0
        ) {

            /*
             * No existe secuencia completa.
             *
             * Rechazar TODA la reasignación.
             */

            return null;

        }


        const bloqueSeleccionado =
            candidatos[0];


        posterior.fechaProgramada =
            bloqueSeleccionado.fechaInicio
                .toISOString();


        posterior.fechaFin =
            bloqueSeleccionado.fechaFin
                .toISOString();


        posterior.bloqueId =
            bloqueSeleccionado.id;


        posterior.bloqueTipo =
            bloqueSeleccionado.tipo;


        posterior.bloqueOrigen =
            bloqueSeleccionado.origen;


        reasignaciones.push({

            sesion:
                sesionesConsideradas.find(
                    sesion =>
                        String(
                            sesion.id
                        ) ===
                        String(
                            posterior.id
                        )
                ) || posterior,

            nuevoBloque:
                bloqueSeleccionado

        });


        fechaAnterior =
            bloqueSeleccionado.fechaInicio;


        sesionesBloqueadas.push(
            posterior
        );

    }


    return {

        reasignaciones

    };

}

function aplicarReasignacionesTemporales(
    sesiones,
    reasignaciones
) {

    if (
        !Array.isArray(sesiones) ||
        !Array.isArray(reasignaciones)
    ) {

        return;

    }


    reasignaciones.forEach(
        movimiento => {

            if (
                !movimiento ||
                !movimiento.sesion ||
                !movimiento.nuevoBloque
            ) {

                return;

            }


            const sesion =
                sesiones.find(
                    existente =>
                        String(
                            existente.id
                        ) ===
                        String(
                            movimiento.sesion.id
                        )
                );


            /*
             * Nunca modificar una sesión que
             * no exista o que ya esté completada.
             */

            if (
                !sesion ||
                sesion.estado !==
                "pendiente"
            ) {

                return;

            }


            sesion.fechaProgramada =
                movimiento.nuevoBloque
                    .fechaInicio
                    .toISOString();


            sesion.fechaFin =
                movimiento.nuevoBloque
                    .fechaFin
                    .toISOString();


            sesion.bloqueId =
                movimiento.nuevoBloque.id;


            sesion.bloqueTipo =
                movimiento.nuevoBloque.tipo;


            sesion.bloqueOrigen =
                movimiento.nuevoBloque.origen;

        }
    );

}

function bloquesSeSolapan(
    bloque,
    sesion
) {

    if (
        !bloque ||
        !sesion
    ) {

        return false;

    }


    const inicioBloque =
        convertirAFecha(
            bloque.fechaInicio ??
            bloque.inicio
        );


    const finBloque =
        convertirAFecha(
            bloque.fechaFin ??
            bloque.fin
        );


    const inicioSesion =
        convertirAFecha(
            sesion.fechaProgramada
        );


    const finSesion =
        convertirAFecha(
            sesion.fechaFin
        );


    if (
        !inicioBloque ||
        !finBloque ||
        !inicioSesion ||
        !finSesion
    ) {

        return false;

    }


    const tolerancia =
        Number(
            CONFIG_REPASOS
                .toleranciaSolapamientoMs
        ) || 0;


    return (
        inicioBloque <
        (
            finSesion.getTime() +
            tolerancia
        )
        &&
        finBloque >
        (
            inicioSesion.getTime() -
            tolerancia
        )
    );

}

/* =========================================================
   BUSCAR MEJOR BLOQUE
   ========================================================= */

function buscarMejorBloque(
    actividad,
    numeroRepaso,
    bloques,
    sesionesConsideradas = estadoRepasos.sesiones
) {

    if (
        !Array.isArray(bloques) ||
        bloques.length === 0
    ) {
        return null;
    }


    const fechaEntrega =
        actividad.fechaEntregaObjeto;


    const fechaIdeal =
        calcularFechaIdealRepaso(
            actividad,
            numeroRepaso
        );


    if (!fechaIdeal) {
        return null;
    }


    const ahora =
        new Date();


    const candidatos =
        bloques.filter(
            bloque => {

                if (
                    !bloque ||
                    !bloque.fechaInicio ||
                    !bloque.fechaFin
                ) {
                    return false;
                }


                if (
                    bloque.fechaInicio <=
                    ahora
                ) {
                    return false;
                }


                /*
                 * El bloque completo debe terminar
                 * estrictamente antes de la entrega.
                 *
                 * También rechaza un bloque que
                 * termine exactamente a la hora
                 * de entrega.
                 */

                if (
                    bloque.fechaFin >=
                    fechaEntrega
                ) {
                    return false;
                }


                /*
                 * Evitar cualquier sesión existente
                 * o recién creada.
                 */

                if (
                    bloqueEstaOcupado(
                        bloque,
                        sesionesConsideradas
                    )
                ) {
                    return false;
                }


                return true;

            }
        );


    if (
        candidatos.length === 0
    ) {
        return null;
    }


    candidatos.sort(
        (a, b) => {

            const distanciaA =
                Math.abs(
                    a.fechaInicio -
                    fechaIdeal
                );


            const distanciaB =
                Math.abs(
                    b.fechaInicio -
                    fechaIdeal
                );


            if (
                distanciaA !==
                distanciaB
            ) {

                return (
                    distanciaA -
                    distanciaB
                );

            }


            return (
                a.fechaInicio -
                b.fechaInicio
            );

        }
    );


    return candidatos[0];

}


/* =========================================================
   FECHA IDEAL DE REPASO
   ========================================================= */

function calcularFechaIdealRepaso(
    actividad,
    numeroRepaso
) {

    const ahora =
        new Date();


    const entrega =
        actividad.fechaEntregaObjeto;


    if (
        !entrega ||
        entrega <= ahora
    ) {
        return null;
    }


    /*
     * Si ya existe un repaso completado,
     * usarlo como referencia para el siguiente.
     */

    const sesionesCompletadas =
        estadoRepasos.sesiones
            .filter(
                sesion =>
                    sesion.actividadId ===
                    actividad.id &&
                    sesion.estado ===
                    "completado"
            )
            .sort(
                (a, b) =>
                    convertirAFecha(
                        b.completadoEn ||
                        b.fechaProgramada
                    ) -
                    convertirAFecha(
                        a.completadoEn ||
                        a.fechaProgramada
                    )
            );


    let referencia =
        ahora;


    if (
        numeroRepaso > 1 &&
        sesionesCompletadas.length > 0
    ) {

        const ultimaFecha =
            convertirAFecha(
                sesionesCompletadas[0]
                    .completadoEn ||
                sesionesCompletadas[0]
                    .fechaProgramada
            );


        if (
            ultimaFecha
        ) {

            referencia =
                ultimaFecha > ahora
                    ? ahora
                    : ultimaFecha;

        }

    }


    const indice =
        Math.min(
            Math.max(
                numeroRepaso - 1,
                0
            ),
            CONFIG_REPASOS
                .intervalos.length - 1
        );


    const dias =
        CONFIG_REPASOS
            .intervalos[indice] || 1;


    let ideal =
        sumarDias(
            referencia,
            dias
        );


    /*
     * Cuando quedan 2 días o menos para
     * la entrega, mantener el repaso dentro
     * del tiempo restante y orientarlo hacia
     * el último período válido antes de entregar.
     *
     * No se crea ningún bloque artificial.
     * buscarMejorBloque() decidirá si existe
     * realmente un bloque utilizable.
     */

    const margenMs =
        entrega.getTime() -
        ahora.getTime();


    const dosDiasMs =
        2 *
        24 *
        60 *
        60 *
        1000;


    if (
        margenMs <=
        dosDiasMs
    ) {

        const margenSeguroMs =
            60 *
            1000;


        const limiteAntesEntrega =
            new Date(
                entrega.getTime() -
                margenSeguroMs
            );


        if (
            ideal >=
            entrega ||
            ideal > limiteAntesEntrega
        ) {

            ideal =
                limiteAntesEntrega;

        }

    }
    else if (
        ideal >= entrega
    ) {

        /*
         * Fuera de los últimos 2 días,
         * conservar la lógica existente:
         * acercar la fecha ideal sin cruzar
         * la entrega.
         */

        const margenDias =
            Math.floor(
                margenMs /
                (1000 * 60 * 60 * 24)
            );


        ideal =
            sumarDias(
                ahora,
                Math.max(
                    0,
                    margenDias - 1
                )
            );

    }


    if (
        ideal >= entrega
    ) {
        return null;
    }


    return ideal;

}


/* =========================================================
   CREAR SESIÓN
   ========================================================= */

function crearSesionRepaso(
    actividad,
    numeroRepaso,
    bloque
) {

    return {

        id:
            generarId(),

        actividadId:
            actividad.id,

        actividad:
            actividad.actividad ??
            actividad.nombre ??
            "Actividad",

        materia:
            actividad.materia ??
            "",

        tipoActividad:
            actividad.tipo ??
            "",

        importancia:
            normalizarImportancia(
                actividad.importancia
            ),

        numeroRepaso,

        fechaProgramada:
            bloque.fechaInicio
                .toISOString(),

        fechaFin:
            bloque.fechaFin
                .toISOString(),

        bloqueId:
            bloque.id,

        bloqueTipo:
            bloque.tipo,

        bloqueOrigen:
            bloque.origen,

        estado:
            "pendiente",

        creadoEn:
            new Date()
                .toISOString()

    };

}


/* =========================================================
   CONTADORES
   ========================================================= */

function contarSesionesActividad(
    actividadId
) {

    const id =
        String(
            actividadId
        );


    return estadoRepasos.sesiones.filter(
        sesion =>
            String(
                sesion.actividadId
            ) === id
    ).length;

}


function contarRepasosRealizados(
    actividadId
) {

    const id =
        String(
            actividadId
        );


    return estadoRepasos.sesiones.filter(
        sesion =>
            String(
                sesion.actividadId
            ) === id &&
            sesion.estado ===
            "completado"
    ).length;

}


/* =========================================================
   FUSIÓN DE SESIONES
   ========================================================= */

function fusionarSesiones(
    existentes,
    nuevas
) {

    const resultado =
        Array.isArray(existentes)
            ? [...existentes]
            : [];


    if (
        !Array.isArray(nuevas)
    ) {

        return resultado;

    }


    nuevas.forEach(
        nueva => {

            if (
                !nueva
            ) {

                return;

            }


            const indiceExistente =
                resultado.findIndex(
                    existente =>
                        String(
                            existente.actividadId
                        ) ===
                        String(
                            nueva.actividadId
                        ) &&

                        Number(
                            existente.numeroRepaso
                        ) ===
                        Number(
                            nueva.numeroRepaso
                        )
                );


            if (
                indiceExistente === -1
            ) {

                resultado.push(
                    nueva
                );

                return;

            }


            const existente =
                resultado[
                    indiceExistente
                ];


            /*
             * Nunca reemplazar el historial completado.
             */
            if (
                existente.estado ===
                "completado"
            ) {

                return;

            }


            /*
             * Si la sesión existente está pendiente,
             * la nueva planificación representa el
             * cronograma vigente y debe sustituirla.
             */
            resultado[
                indiceExistente
            ] = nueva;

        }
    );


    return resultado;

}


/* =========================================================
   ELIMINAR DUPLICADOS
   ========================================================= */

function eliminarSesionesDuplicadas(
    sesiones
) {

    if (
        !Array.isArray(sesiones)
    ) {

        return [];

    }


    const mapa =
        new Map();


    sesiones.forEach(
        sesion => {

            if (
                !sesion
            ) {

                return;

            }


            /*
             * Para el mismo número de repaso de una
             * actividad, conservar preferentemente
             * la sesión completada.
             */

            const clave =
                [
                    String(
                        sesion.actividadId
                    ),
                    Number(
                        sesion.numeroRepaso
                    )
                ].join("|");


            const existente =
                mapa.get(
                    clave
                );


            if (
                !existente ||
                (
                    sesion.estado ===
                    "completado" &&
                    existente.estado !==
                    "completado"
                )
            ) {

                mapa.set(
                    clave,
                    sesion
                );

            }

        }
    );


    return Array.from(
        mapa.values()
    );

}


/* =========================================================
   LIMPIAR SESIONES INVÁLIDAS
   ========================================================= */

function limpiarSesionesInvalidas(
    actividades,
    bloquesDisponibles
) {

    if (
        !Array.isArray(actividades)
    ) {
        return;
    }


    const mapa =
        new Map(
            actividades.map(
                actividad =>
                    [
                        String(
                            actividad.id
                        ),
                        actividad
                    ]
            )
        );


    const ahora =
        new Date();


    const bloques =
        Array.isArray(
            bloquesDisponibles
        )
            ? bloquesDisponibles
            : [];


    estadoRepasos.sesiones =
        estadoRepasos.sesiones.filter(
            sesion => {

                if (
                    !sesion
                ) {
                    return false;
                }


                /*
                 * El historial completado se conserva.
                 */
                if (
                    sesion.estado ===
                    "completado"
                ) {
                    return true;
                }


                const actividad =
                    mapa.get(
                        String(
                            sesion.actividadId
                        )
                    );


                /*
                 * La ausencia de una actividad en
                 * una respuesta externa no demuestra
                 * que haya sido eliminada.
                 *
                 * Las sesiones pendientes solamente
                 * se eliminan mediante una acción
                 * explícita de archivado.
                 */
                if (
                    !actividad
                ) {
                    return true;
                }


                const fechaSesion =
                    convertirAFecha(
                        sesion.fechaProgramada
                    );

                const fechaFinSesion =
                    convertirAFecha(
                        sesion.fechaFin
                    );


                if (
                    !fechaSesion ||
                    !fechaFinSesion
                ) {
                    return false;
                }


                if (
                    fechaSesion <=
                    ahora
                ) {
                    return false;
                }


                if (
                    fechaSesion >=
                    actividad.fechaEntregaObjeto
                ) {
                    return false;
                }


                /*
                 * La sesión pendiente solamente sigue
                 * siendo válida si su intervalo completo
                 * continúa cubierto por un bloque de
                 * disponibilidad efectiva actual.
                 */
                const bloqueVigente =
                    bloques.some(
                        bloque => {

                            if (
                                !bloque
                            ) {
                                return false;
                            }


                            const inicioBloque =
                                convertirAFecha(
                                    bloque.fechaInicio ??
                                    bloque.inicio
                                );

                            const finBloque =
                                convertirAFecha(
                                    bloque.fechaFin ??
                                    bloque.fin
                                );


                            if (
                                !inicioBloque ||
                                !finBloque
                            ) {
                                return false;
                            }


                            return (
                                inicioBloque <=
                                fechaSesion &&
                                finBloque >=
                                fechaFinSesion
                            );
                        }
                    );


                return bloqueVigente;
            }
        );

}


/* =========================================================
   FILTRAR BLOQUES OCUPADOS
   ========================================================= */

function filtrarBloquesNoOcupados(
    bloques,
    sesiones
) {

    if (
        !Array.isArray(bloques)
    ) {

        return [];

    }


    return bloques.filter(
        bloque =>
            !bloqueEstaOcupado(
                bloque,
                sesiones
            )
    );

}


/* =========================================================
   COMPROBAR SOLAPAMIENTO
   ========================================================= */

function bloqueEstaOcupado(
    bloque,
    sesiones
) {

    if (
        !bloque ||
        !Array.isArray(sesiones)
    ) {
        return false;
    }


    const inicioBloque =
        convertirAFecha(
            bloque.fechaInicio ??
            bloque.inicio
        );


    const finBloque =
        convertirAFecha(
            bloque.fechaFin ??
            bloque.fin
        );


    if (
        !inicioBloque ||
        !finBloque
    ) {
        return false;
    }


    const tolerancia =
        Number(
            CONFIG_REPASOS
                .toleranciaSolapamientoMs
        ) || 0;


    return sesiones.some(
        sesion => {

            if (!sesion) {
                return false;
            }


            /*
             * Las sesiones completadas también
             * mantienen ocupado el bloque.
             */

            const inicioSesion =
                convertirAFecha(
                    sesion.fechaProgramada
                );


            const finSesion =
                convertirAFecha(
                    sesion.fechaFin
                );


            if (
                !inicioSesion ||
                !finSesion
            ) {
                return false;
            }


            return (
                inicioBloque <
                (
                    finSesion.getTime() +
                    tolerancia
                )
                &&
                finBloque >
                (
                    inicioSesion.getTime() -
                    tolerancia
                )
            );

        }
    );

}


/* =========================================================
   UTILIDADES DE FECHA
   ========================================================= */

function convertirAFecha(
    valor
) {

    if (
        valor instanceof Date
    ) {

        if (
            Number.isNaN(
                valor.getTime()
            )
        ) {

            return null;

        }


        return new Date(
            valor.getTime()
        );

    }


    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return null;

    }


    const fecha =
        new Date(
            valor
        );


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return null;

    }


    return fecha;

}


function calcularDiasRestantes(
    fecha
) {

    const fechaObjetivo =
        convertirAFecha(
            fecha
        );


    if (
        !fechaObjetivo
    ) {

        return null;

    }


    const ahora =
        new Date();


    const diferencia =
        fechaObjetivo.getTime() -
        ahora.getTime();


    return Math.ceil(
        diferencia /
        (1000 * 60 * 60 * 24)
    );

}


function sumarDias(
    fecha,
    dias
) {

    const resultado =
        convertirAFecha(
            fecha
        );


    if (
        !resultado
    ) {

        return null;

    }


    resultado.setDate(
        resultado.getDate() +
        Number(dias || 0)
    );


    return resultado;

}


/* =========================================================
   GENERAR ID
   ========================================================= */

function generarId() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID ===
        "function"
    ) {

        return crypto.randomUUID();

    }


    return (
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 11)
    );

}


/* =========================================================
   HASH SIMPLE PARA IDS DE EMERGENCIA
   ========================================================= */

function hashSimple(
    texto
) {

    const valor =
        String(
            texto || ""
        );


    let hash = 0;


    for (
        let i = 0;
        i < valor.length;
        i++
    ) {

        hash =
            (
                (
                    hash << 5
                ) -
                hash
            ) +
            valor.charCodeAt(i);


        hash |= 0;

    }


    return Math.abs(
        hash
    ).toString(
        36
    );

}


/* =========================================================
   RENDERIZADO
   ========================================================= */

function renderizarCronogramaRepasos() {

    const tbody =
        document.getElementById(
            "tabla-cronograma-body"
        );


    if (
        !tbody
    ) {

        return;

    }


    tbody.innerHTML = "";


    const sesiones =
        [...estadoRepasos.sesiones]
            .sort(
                (
                    a,
                    b
                ) => {

                    const fechaA =
                        convertirAFecha(
                            a.fechaProgramada
                        );


                    const fechaB =
                        convertirAFecha(
                            b.fechaProgramada
                        );


                    if (
                        !fechaA &&
                        !fechaB
                    ) {

                        return 0;

                    }


                    if (
                        !fechaA
                    ) {

                        return 1;

                    }


                    if (
                        !fechaB
                    ) {

                        return -1;

                    }


                    return (
                        fechaA -
                        fechaB
                    );

                }
            );


    if (
        sesiones.length === 0
    ) {

        const tr =
            document.createElement(
                "tr"
            );


        const td =
            document.createElement(
                "td"
            );


        td.className =
            "empty-message";


        td.colSpan =
            5;


        td.textContent =
            "No hay sesiones de repaso programadas.";


        tr.appendChild(
            td
        );


        tbody.appendChild(
            tr
        );


        return;

    }


    sesiones.forEach(
        sesion => {

            tbody.appendChild(
                crearFilaRepaso(
                    sesion
                )
            );

        }
    );

}


/* =========================================================
   FILA DE REPASO
   ========================================================= */

function crearFilaRepaso(
    sesion
) {

    const tr =
        document.createElement(
            "tr"
        );


    const fecha =
        convertirAFecha(
            sesion.fechaProgramada
        );


    const fechaTexto =
        fecha
            ? fecha.toLocaleString(
                "es-CO",
                {
                    dateStyle:
                        "medium",
                    timeStyle:
                        "short"
                }
            )
            : "Sin fecha";


    let estadoTexto =
        "⏳ Pendiente";


    if (
        sesion.estado ===
        "completado"
    ) {

        estadoTexto =
            "✅ Completado";

    }
    else if (
        fecha &&
        fecha < new Date()
    ) {

        estadoTexto =
            "⚠️ Perdido";

    }


    /*
     * Crear celdas sin depender de innerHTML
     * para datos provenientes de actividades.
     */

    const tdEstado =
        document.createElement(
            "td"
        );


    tdEstado.textContent =
        estadoTexto;


    const tdActividad =
        document.createElement(
            "td"
        );


    const strong =
        document.createElement(
            "strong"
        );


    strong.textContent =
        `Repaso ${sesion.numeroRepaso}`;


    const br =
        document.createElement(
            "br"
        );


    const small =
        document.createElement(
            "small"
        );


    small.textContent =
        sesion.actividad ||
        "Actividad";


    tdActividad.appendChild(
        strong
    );


    tdActividad.appendChild(
        br
    );


    tdActividad.appendChild(
        small
    );


    const tdFecha =
        document.createElement(
            "td"
        );


    tdFecha.textContent =
        fechaTexto;


    const tdBloque =
        document.createElement(
            "td"
        );


    tdBloque.innerHTML =
        formatearBloque(
            sesion
        );


    const tdAccion =
        document.createElement(
            "td"
        );


    if (
        sesion.estado ===
        "completado"
    ) {

        tdAccion.textContent =
            "—";

    }
    else {

        const boton =
            document.createElement(
                "button"
            );


        boton.type =
            "button";


        boton.className =
            "btn-action";


        boton.textContent =
            "✅";


        boton.setAttribute(
            "aria-label",
            "Marcar repaso como completado"
        );


        boton.addEventListener(
            "click",
            () =>
                marcarRepasoCompletado(
                    sesion.id
                )
        );


        tdAccion.appendChild(
            boton
        );

    }


    tr.appendChild(
        tdEstado
    );


    tr.appendChild(
        tdActividad
    );


    tr.appendChild(
        tdFecha
    );


    tr.appendChild(
        tdBloque
    );


    tr.appendChild(
        tdAccion
    );


    return tr;

}


/* =========================================================
   FORMATEAR BLOQUE
   ========================================================= */

function formatearBloque(
    sesion
) {

    const inicio =
        convertirAFecha(
            sesion.fechaProgramada
        );


    const fin =
        convertirAFecha(
            sesion.fechaFin
        );


    if (
        !inicio ||
        !fin
    ) {

        return "Sin bloque";

    }


    const horaInicio =
        inicio.toLocaleTimeString(
            "es-CO",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    const horaFin =
        fin.toLocaleTimeString(
            "es-CO",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    return (
        horaInicio +
        " - " +
        horaFin
    );

}


/* =========================================================
   COMPLETAR REPASO
   ========================================================= */

async function marcarRepasoCompletado(
    id
) {

    const sesion =
        estadoRepasos.sesiones.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (
        !sesion
    ) {

        console.warn(
            "⚠️ No se encontró la sesión:",
            id
        );

        return;

    }


    if (
        sesion.estado ===
        "completado"
    ) {

        return;

    }


    sesion.estado =
        "completado";


    sesion.completadoEn =
        new Date()
            .toISOString();


    guardarSesionesRepaso();

    renderizarCronogramaRepasos();


    /*
     * Al completar una sesión, regeneramos
     * para calcular posibles sesiones futuras.
     */

        await generarCronogramaRepasos(
        estadoRepasos.actividades
    );

}

/* =========================================================
   FUNCIÓN PÚBLICA PARA REGENERAR
   ========================================================= */

let regeneracionRepasosDebounceTimer =
    null;

let regeneracionRepasosPromesas =
    [];


async function recalcularCronogramaRepasos() {

    if (
        regeneracionRepasosDebounceTimer
    ) {

        clearTimeout(
            regeneracionRepasosDebounceTimer
        );

    }


    const promesa =
        new Promise(
            resolve => {

                regeneracionRepasosPromesas.push(
                    resolve
                );

            }
        );


    regeneracionRepasosDebounceTimer =
        setTimeout(
            async () => {

                regeneracionRepasosDebounceTimer =
                    null;

                try {

                    while (
                        regeneracionRepasosEnCurso
                    ) {

                        await new Promise(
                            resolve =>
                                setTimeout(
                                    resolve,
                                    10
                                )
                        );

                    }


                    /*
                     * Si la regeneración que estaba en curso
                     * ya registró una solicitud pendiente,
                     * esa solicitud será procesada por
                     * regenerarRepasosSeguro().
                     *
                     * No iniciar otra regeneración desde
                     * el debounce para evitar duplicarla.
                     */
                                        const entregasLocales =
                        Array.isArray(
                            estadoRepasos.actividades
                        ) &&
                        estadoRepasos.ultimaGeneracion !== null
                            ? estadoRepasos.actividades
                            : undefined;


                    if (
                        Array.isArray(
                            entregasLocales
                        )
                    ) {

                        await regenerarRepasosSeguro(
                            entregasLocales
                        );

                    }
                    else {

                        await regenerarRepasosSeguro();

                    }

                }
                finally {

                    const promesas =
                        regeneracionRepasosPromesas;

                    regeneracionRepasosPromesas =
                        [];

                    promesas.forEach(
                        resolve => resolve()
                    );

                }

            },
            100
        );


    return promesa;

}

/* =========================================================
   EXPORTACIÓN GLOBAL
   ========================================================= */

if (
    typeof window !== "undefined"
) {

    window.inicializarRepasos =
        inicializarRepasos;

    window.generarCronogramaRepasos =
        generarCronogramaRepasos;

    window.recalcularCronogramaRepasos =
        recalcularCronogramaRepasos;

    window.marcarRepasoCompletado =
        marcarRepasoCompletado;

}

function diagnosticarMotorRepasos() {

    const ahora =
        new Date();


    const actividades =
        estadoRepasos.actividades || [];


    const bloques =
        estadoRepasos.bloquesDisponibles || [];


    const sesiones =
        estadoRepasos.sesiones || [];


    console.group(
        "🧠 Diagnóstico del motor de repasos"
    );


    console.log(
        "Ahora:",
        ahora
    );


    console.log(
        "Actividades:",
        actividades.length
    );


    console.log(
        "Bloques disponibles:",
        bloques.length
    );


    console.log(
        "Sesiones almacenadas:",
        sesiones.length
    );


    console.log(
        "Sesiones pendientes:",
        sesiones.filter(
            sesion =>
                sesion.estado ===
                "pendiente"
        ).length
    );


    console.log(
        "Sesiones completadas:",
        sesiones.filter(
            sesion =>
                sesion.estado ===
                "completado"
        ).length
    );


    bloques.forEach(
        (bloque, indice) => {

            console.log(
                `${indice + 1}.`,
                bloque.origen,
                bloque.tipo,
                bloque.fechaInicio,
                "→",
                bloque.fechaFin
            );

        }
    );


    console.groupEnd();


    return {

        ahora,

        actividades,

        bloques,

        sesiones

    };

}


if (
    typeof window !==
    "undefined"
) {

    window.diagnosticarMotorRepasos =
        diagnosticarMotorRepasos;

}

/* =========================================================
REGENERACIÓN CONTROLADA
========================================================= */

/* =========================================================
REGENERACIÓN CONTROLADA
========================================================= */

let regeneracionRepasosEnCurso =
    false;

let regeneracionRepasosPendiente =
    false;

let regeneracionRepasosEntregasPendientes =
    undefined;

let regeneracionRepasosPromesasPendientes =
    [];


async function regenerarRepasosSeguro(
    entregasDisponibles = null
) {

    if (
        regeneracionRepasosEnCurso
    ) {

        regeneracionRepasosPendiente =
            true;

        regeneracionRepasosEntregasPendientes =
            entregasDisponibles;


        return new Promise(
            (resolve, reject) => {

                regeneracionRepasosPromesasPendientes
                    .push({
                        resolve,
                        reject
                    });

            }
        );
    }


    regeneracionRepasosEnCurso =
        true;


    let primerError =
        null;

    let ultimoError =
        null;


    try {

        let entregasActuales =
            entregasDisponibles;


        do {

            regeneracionRepasosPendiente =
                false;

            regeneracionRepasosEntregasPendientes =
                undefined;


            try {

                await generarCronogramaRepasos(
                    entregasActuales
                );

                ultimoError =
                    null;

            }
            catch (error) {

                if (
                    !primerError
                ) {

                    primerError =
                        error;

                }

                ultimoError =
                    error;

            }


            /*
             * Si llegó una nueva solicitud mientras
             * esta regeneración estaba ejecutándose,
             * no importa si la anterior tuvo éxito
             * o falló: la solicitud pendiente debe
             * ejecutarse.
             */
            if (
                regeneracionRepasosPendiente
            ) {

                entregasActuales =
                    regeneracionRepasosEntregasPendientes;

            }


        } while (
            regeneracionRepasosPendiente
        );


        /*
         * La llamada original conserva el resultado
         * de su propia operación:
         *
         * - si A falló, A rechaza;
         * - aunque B haya podido ejecutarse después.
         */
        if (
            primerError
        ) {

            throw primerError;

        }


    }
    finally {

        regeneracionRepasosEnCurso =
            false;


        const promesasPendientes =
            regeneracionRepasosPromesasPendientes;


        regeneracionRepasosPromesasPendientes =
            [];


        /*
         * Las llamadas pendientes pertenecen a la
         * regeneración posterior.
         *
         * Solo se rechazan si esa regeneración
         * posterior terminó fallando.
         */
        if (
            ultimoError
        ) {

            promesasPendientes.forEach(
                promesa =>
                    promesa.reject(
                        ultimoError
                    )
            );

        }
        else {

            promesasPendientes.forEach(
                promesa =>
                    promesa.resolve()
            );

        }

    }
}


if (
    typeof window !==
    "undefined"
) {

    window.regenerarRepasosSeguro =
        regenerarRepasosSeguro;

}