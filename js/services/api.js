/* =========================================================
   API / NOTION
========================================================= */


// api.js

/* =========================================================
   API / NOTION
========================================================= */


/**
 * Ejecuta una petición contra el Cloudflare Worker.
 *
 * El frontend solamente conoce las operaciones
 * permitidas por el Worker.
 */
async function request(
    endpoint,
    options = {}
) {

    const response =
        await fetch(
            CONFIG.notion.workerUrl +
            endpoint,
            {
                ...options,

                headers: {

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})

                }

            }
        );


    if (!response.ok) {

        let mensaje =
            `Error ${response.status}`;


        try {

            const errorData =
                await response.json();


            if (
                errorData &&
                errorData.message
            ) {

                mensaje =
                    errorData.message;

            }

        }
        catch (error) {

            console.warn(
                "No fue posible interpretar " +
                "la respuesta de error del Worker.",
                error
            );

        }


        throw new Error(
            mensaje
        );

    }


    return await response.json();

}


/**
 * Obtiene todas las actividades.
 *
 * La paginación existente se conserva:
 * - page_size
 * - start_cursor
 * - has_more
 * - next_cursor
 */
async function obtenerEntregas() {

    const endpoint =
        "/query";


    const entregas = [];

    let siguienteCursor =
        undefined;


    do {

        const cuerpo = {

            page_size: 100

        };


        if (
            siguienteCursor
        ) {

            cuerpo.start_cursor =
                siguienteCursor;

        }


        const respuesta =
            await request(
                endpoint,
                {

                    method: "POST",

                    body:
                        JSON.stringify(
                            cuerpo
                        )

                }
            );


        entregas.push(
            ...(respuesta.results || [])
        );


        siguienteCursor =
            respuesta.has_more
                ? respuesta.next_cursor
                : undefined;


    } while (
        siguienteCursor
    );


    return entregas.map(
        mapearEntrega
    );

}


/**
 * Convierte una página de Notion
 * al modelo interno de la aplicación.
 */
function mapearEntrega(
    page
) {

    const props =
        page.properties || {};


    return {

        id:
            page.id,


        actividad:
            props["Actividad"]
                ?.title?.[0]
                ?.plain_text
            ?? "",


        materia:
            props["Materia"]
                ?.select?.name
            ?? "Sin materia",


        tipo:
            props["Tipo"]
                ?.select?.name
            ?? "Tarea",


        importancia:
            props["Importancia"]
                ?.select?.name
            ?? "Sin prioridad",


        /* Alias interno.
           Evita que el resto de la aplicación
           tenga que manejar dos nombres diferentes. */
        prioridad:
            props["Importancia"]
                ?.select?.name
            ?? "Sin prioridad",


        fechaEntrega:
            props["Fecha de Entrega"]
                ?.date?.start
            ?? null,


        completada:
            false

    };

}


/**
 * Crea una nueva actividad en Notion.
 */
async function crearEntregaEnNotion(
    datos
) {

    const payload = {

        properties: {

            "Actividad": {

                title: [

                    {

                        text: {

                            content:
                                datos.actividad

                        }

                    }

                ]

            },


            "Materia": {

                select: {

                    name:
                        datos.materia

                }

            },


            "Tipo": {

                select: {

                    name:
                        datos.tipo

                }

            },


            "Importancia": {

                select: {

                    name:
                        datos.importancia

                }

            },


            "Fecha de Entrega": {

                date: {

                    start:
                        datos.fechaEntrega

                }

            }

        }

    };


    return await request(
        "/pages",
        {

            method: "POST",

            body:
                JSON.stringify(
                    payload
                )

        }
    );

}


/**
 * Actualiza la fecha de entrega
 * de una actividad.
 */
async function actualizarFechaEntrega(
    pageId,
    nuevaFecha
) {

    if (
        !pageId ||
        !nuevaFecha
    ) {

        throw new Error(
            "Faltan datos para actualizar la fecha."
        );

    }


    const endpoint =
        `/pages/${formatearUuid(pageId)}/date`;


    const payload = {

        properties: {

            "Fecha de Entrega": {

                date: {

                    start:
                        nuevaFecha

                }

            }

        }

    };


    return await request(
        endpoint,
        {

            method: "PATCH",

            body:
                JSON.stringify(
                    payload
                )

        }
    );

}


/**
 * Archiva una página de Notion.
 *
 * Posteriormente será utilizada por
 * completarYEliminar().
 */
async function archivarEntrega(
    pageId
) {

    if (!pageId) {

        throw new Error(
            "No se recibió el ID de la actividad."
        );

    }


    const endpoint =
        `/pages/${formatearUuid(pageId)}/archive`;


    return await request(
        endpoint,
        {

            method: "PATCH",

            body:
                JSON.stringify({

                    archived: true

                })

        }
    );

}