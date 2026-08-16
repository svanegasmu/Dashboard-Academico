const NOTION_DATABASE_ID = "x";

const NOTION_API =
    "https://api.notion.com/v1";

const NOTION_VERSION =
    "2022-06-28";


function corsHeaders() {

    return {

        "Access-Control-Allow-Origin":
            "https://academic-hub.pages.dev",

        "Access-Control-Allow-Methods":
            "POST, PATCH, OPTIONS",

        "Access-Control-Allow-Headers":
            "Content-Type",

        "Content-Type":
            "application/json"

    };

}


function jsonResponse(
    body,
    status = 200
) {

    return new Response(
        JSON.stringify(body),
        {
            status,

            headers:
                corsHeaders()
        }
    );

}


async function llamarNotion(
    env,
    endpoint,
    options = {}
) {

    try {

        const response =
            await fetch(
                NOTION_API + endpoint,
                {

                    ...options,

                    headers: {

                        "Authorization":
                            `Bearer ${env.NOTION_TOKEN}`,

                        "Content-Type":
                            "application/json",

                        "Notion-Version":
                            NOTION_VERSION

                    }

                }
            );


        const texto =
            await response.text();


        let body;


        try {

            body =
                texto
                    ? JSON.parse(texto)
                    : {};

        }
        catch {

            body = {
                message:
                    "Notion devolvió una respuesta no JSON."
            };

        }


        return {

            status:
                response.status,

            body

        };

    }
    catch (error) {

        console.error(
            "Error al comunicarse con Notion:",
            error
        );

        return {

            status: 502,

            body: {

                message:
                    "No fue posible comunicarse con Notion."

            }

        };

    }

}

export default {

    async fetch(
        request,
        env
    ) {

        if (
            request.method ===
            "OPTIONS"
        ) {

            return new Response(
                null,
                {
                    status: 204,
                    headers:
                        corsHeaders()
                }
            );

        }


        const url =
            new URL(
                request.url
            );


        /* =================================================
           OPERACIÓN 1 — CONSULTAR ENTREGAS
        ================================================= */

        if (
            request.method === "POST" &&
            url.pathname === "/query"
        ) {

            let body = {};


            try {

                body =
                    await request.json();

            }
            catch {

                return jsonResponse(
                    {
                        message:
                            "Cuerpo JSON inválido."
                    },
                    400
                );

            }


            const queryBody = {

                page_size:
                    body.page_size || 100

            };


            if (
                body.start_cursor
            ) {

                queryBody.start_cursor =
                    body.start_cursor;

            }


            const resultado =
                await llamarNotion(
                    env,

                    `/databases/${NOTION_DATABASE_ID}/query`,

                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                queryBody
                            )
                    }
                );


            return jsonResponse(
                resultado.body,
                resultado.status
            );

        }


        /* =================================================
           OPERACIÓN 2 — CREAR ENTREGA
        ================================================= */

        if (
            request.method === "POST" &&
            url.pathname === "/pages"
        ) {

            let body;


            try {

                body =
                    await request.json();

            }
            catch {

                return jsonResponse(
                    {
                        message:
                            "Cuerpo JSON inválido."
                    },
                    400
                );

            }


            const payload = {

                parent: {

                    database_id:
                        NOTION_DATABASE_ID

                },

                properties:
                    body.properties

            };


            const resultado =
                await llamarNotion(
                    env,

                    "/pages",

                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            return jsonResponse(
                resultado.body,
                resultado.status
            );

        }


        /* =================================================
           OPERACIÓN 3 — ACTUALIZAR FECHA
        ================================================= */

        const dateMatch =
            url.pathname.match(
                /^\/pages\/([^/]+)\/date$/
            );


        if (
            request.method === "PATCH" &&
            dateMatch
        ) {

            const pageId =
                dateMatch[1];


            let body;


            try {

                body =
                    await request.json();

            }
            catch {

                return jsonResponse(
                    {
                        message:
                            "Cuerpo JSON inválido."
                    },
                    400
                );

            }


            const resultado =
                await llamarNotion(
                    env,

                    `/pages/${pageId}`,

                    {
                        method: "PATCH",

                        body:
                            JSON.stringify({
                                properties:
                                    body.properties
                            })
                    }
                );


            return jsonResponse(
                resultado.body,
                resultado.status
            );

        }


        /* =================================================
           OPERACIÓN 4 — ARCHIVAR
        ================================================= */

        const archiveMatch =
            url.pathname.match(
                /^\/pages\/([^/]+)\/archive$/
            );


        if (
            request.method === "PATCH" &&
            archiveMatch
        ) {

            const pageId =
                archiveMatch[1];


            const resultado =
                await llamarNotion(
                    env,

                    `/pages/${pageId}`,

                    {
                        method: "PATCH",

                        body:
                            JSON.stringify({
                                archived: true
                            })
                    }
                );


            return jsonResponse(
                resultado.body,
                resultado.status
            );

        }


        /* =================================================
           OPERACIÓN NO PERMITIDA
        ================================================= */

        return jsonResponse(
            {
                message:
                    "Operación no permitida."
            },
            404
        );

    }

};