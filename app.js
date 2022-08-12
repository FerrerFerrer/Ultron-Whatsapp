/**
 * ⚡⚡⚡ DECLARAMOS LAS LIBRERIAS y CONSTANTES A USAR! ⚡⚡⚡
 */
require('dotenv').config()
const fs = require('fs');
const express = require('express');
const cors = require('cors')
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const mysqlConnection = require('./config/mysql')
const { middlewareClient } = require('./middleware/client')
const { generateImage, cleanNumber, checkEnvFile, createClient, isValidNumber } = require('./controllers/handle')
const { connectionReady, connectionLost } = require('./controllers/connection')
const { saveMedia } = require('./controllers/save')
const { getMessages, responseMessages, bothResponse } = require('./controllers/flows')
const { sendMedia, sendMessage, lastTrigger, sendMessageButton, readChat } = require('./controllers/send');
// const { url } = require('inspector');
const fetch = require('node-fetch')

const app = express();
app.use(cors())
app.use(express.json())
const MULTI_DEVICE = process.env.MULTI_DEVICE || 'true';
const server = require('http').Server(app)

const port = process.env.PORT || 3000
var client;
app.use('/', require('./routes/web'))

/**
 * Escuchamos cuando entre un mensaje
 */

id_solicitud = 0;
id_vendedor = 0;
motivo = "";
questMotivo = false;
folio = "Sin registro";
rechazo = false;
fin = false;
conmotivo = false;

const listenMessage = () => client.on('message', async msg => {
    const { from, body, hasMedia } = msg;

    if (!isValidNumber(from)) {
        return
    }

    // Este bug lo reporto Lucas Aldeco Brescia para evitar que se publiquen estados
    if (from === 'status@broadcast') {
        return
    }
    message = body.toLowerCase();
    console.log('BODY', message)
    const number = cleanNumber(from)
    await readChat(number, message)
    mensaje = message;


    // vendedor= 12 solicitud= 12
    // if (mensaje.includes('@')) {
    if (mensaje.includes('vendedor')) {
        //hola @ id_vendedor id_solicitud
        ids = mensaje.split(" ");
        console.log(ids);
        id_vendedor = ids[1];
        id_solicitud = ids[3];
        const response = await responseMessages('STEP_1')
        await sendMessage(client, from, response.replyMessage, response.trigger);
        // await sendMessageButton({
        //     "title": "¿Que te interesa ver?",
        //     "message": "Recuerda todo este contenido es gratis y estaria genial que me siguas!",
        //     "footer": "Gracias",
        //     "buttons": [
        //         { "body": "😎 Cursos" },
        //         { "body": "👉 Youtube" },
        //         { "body": "😁 Telegram" }
        //     ]
        // })
        return
    }

    if (mensaje == "se contacto" || mensaje == "se contactó") {
        mensaje = "Si, se realizó la cotización";
    }

    if (mensaje == "no podemos dar el servicio" || mensaje == "no podemos dar el servicio" || mensaje == "no contesto el cliente" || mensaje == "datos de contacto incorrectos") {

        conmotivo = true;
    }

    if (questMotivo == true) {
        motivo = mensaje;
        questMotivo = false;
        // url = "http://45.76.235.21/letrimex_v2/public/tiempo_cliente/" + id_solicitud;
        if (rechazo == false) {
            url = "http://45.76.235.21/letrimex_v2/public/tiempo_cliente/" + id_solicitud;
            const response2 = await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                headers: {
                    Accept: 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }

    if (mensaje == "si" || mensaje == "no") {

        questMotivo = true;
        if (mensaje == "si") {
            let url = "http://45.76.235.21/letrimex_v2/public/tiempo_respuesta/" + id_solicitud;
            const response2 = await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                headers: {
                    Accept: 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        if (mensaje == "no") {
            fin = true;
            rechazo = true;
            const response = await responseMessages('STEP_3')
            await sendMessage(client, from, response.replyMessage, response.trigger);
            return
        }
    }

    if (fin == true || !isNaN(mensaje) || conmotivo == true) {
        if (!isNaN(mensaje)) {
            folio = mensaje;
            console.log("folio", folio);
        }
        if (rechazo == true) {
            motivo = mensaje;

            data = {
                'solicitud_id': id_solicitud,
                'motivo': motivo
            }

            let url = "http://45.76.235.21/letrimex_v2/public/rechazo";
            const response2 = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    Accept: 'application/json',
                    'Content-Length': JSON.stringify(data).length,
                    'Content-Type': 'application/json'
                }
            });
            console.log(response2);
        }

        if (rechazo == false) {
            url = "http://45.76.235.21/letrimex_v2/public/pre_cotizacion/" + id_solicitud + "/" + motivo + "/" + folio;
            const response2 = await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                headers: {
                    Accept: 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
            console.log("Status ", response2.status);

            const respuesta = await response2.json();

            //console.log(respuesta);




            const obtenerZona = idZona => {
                switch (idZona) {
                    case 1:
                        return 'Saltillo';
                    case 2:
                        return 'Monterrey';
                    case 3:
                        return 'Otra';
                }
            }

            const enviarHubspot = async (correo, nombre, apellido, telefono, necesidad, localidad, otraLocalidad = 'Sin especificar', nombreVendedor, idSolicitud) => {
                const formJson = {
                    "fields": [
                        {
                            "objectTypeId": "0-1",
                            "name": "email",
                            "value": correo
                        },
                        {
                            "objectTypeId": "0-1",
                            "name": "firstname",
                            "value": nombre
                        },
                        {
                            "objectTypeId": "0-1",
                            "name": "lastname",
                            "value": apellido
                        },
                        {
                            "objectTypeId": "0-1",
                            "name": "phone",
                            "value": telefono
                        },
                        {
                            "objectTypeId": "0-1",
                            "name": "cual_es_la_necesidad_inmediata_",
                            "value": necesidad
                        },
                        {
                            "objectTypeId": "0-1",
                            "name": "localidad_de_solicitud",
                            "value": localidad
                        },
                        {
                            "objectTypeId": "0-1",
                            "name": "vendedor",
                            "value": nombreVendedor
                        },
                        {
                            "objectTypeId": "0-1",
                            "name": "no__cotizacion",
                            "value": idSolicitud
                        }
                    ]
                }

                // Set method and headers
                const init = {
                    method: 'POST',
                    body: JSON.stringify(formJson),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Content-Length': JSON.stringify(formJson).length
                    }
                }

                // Send request to Letrimex Backend
                let req = await fetch('https://api.hsforms.com/submissions/v3/integration/submit/20638481/6fd6d78b-1dc7-462b-a409-137be0665542', init);
            }
            await enviarHubspot(respuesta.solicitud.correo_contacto, respuesta.solicitud.nombre_contacto.split(' ')[0], respuesta.solicitud.nombre_contacto.split(' ')[1] ?? '', respuesta.solicitud.telefono_contacto, respuesta.solicitud.equipo, obtenerZona(respuesta.solicitud.zona), 'Sin especificar', respuesta.vendor.nombre_completo, respuesta.solicitud.id);
        }


        id_solicitud = 0;
        id_vendedor = 0;
        motivo = "";
        questMotivo = false;
        folio = "Sin registro";
        rechazo = false;
        fin = false;
        conmotivo = false;
        const response = await responseMessages('STEP_0')
        await sendMessage(client, from, response.replyMessage, response.trigger);
        return
    }
    /**
     * Guardamos el archivo multimedia que envia
     */
    // if (process.env.SAVE_MEDIA && hasMedia) {
    //     const media = await msg.downloadMedia();
    //     saveMedia(media);
    // }

    /**
     * Si estas usando dialogflow solo manejamos una funcion todo es IA
     */

    // if (process.env.DATABASE === 'dialogflow') {
    //     if(!message.length) return;
    //     const response = await bothResponse(message);
    //     await sendMessage(client, from, response.replyMessage);
    //     if (response.media) {
    //         sendMedia(client, from, response.media);
    //     }
    //     return
    // }

    /**
    * Ver si viene de un paso anterior
    * Aqui podemos ir agregando más pasos
    * a tu gusto!
    */

    const lastStep = await lastTrigger(from) || null;
    if (lastStep) {
        const response = await responseMessages(lastStep)
        await sendMessage(client, from, response.replyMessage);
    }

    /**
     * Respondemos al primero paso si encuentra palabras clave
     */
    const step = await getMessages(message);

    if (step) {
        const response = await responseMessages(step);

        /**
         * Si quieres enviar botones
         */

        await sendMessage(client, from, response.replyMessage, response.trigger);

        if (response.hasOwnProperty('actions')) {
            const { actions } = response;
            await sendMessageButton(client, from, null, actions);
            return
        }

        if (!response.delay && response.media) {
            sendMedia(client, from, response.media);
        }
        if (response.delay && response.media) {
            setTimeout(() => {
                sendMedia(client, from, response.media);
            }, response.delay)
        }
        return
    }

    //Si quieres tener un mensaje por defecto
    if (process.env.DEFAULT_MESSAGE === 'true') {
        const response = await responseMessages('DEFAULT')
        await sendMessage(client, from, response.replyMessage, response.trigger);

        /**
         * Si quieres enviar botones
         */
        if (response.hasOwnProperty('actions')) {
            const { actions } = response;
            await sendMessageButton(client, from, null, actions);
        }
        return
    }
});



client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

client.on('qr', qr => generateImage(qr, () => {
    qrcode.generate(qr, { small: true });

    console.log(`Ver QR http://localhost:${port}/qr`)
    socketEvents.sendQR(qr)
}))

client.on('ready', (a) => {
    connectionReady()
    listenMessage()
    // socketEvents.sendStatus(client)
});

client.on('auth_failure', (e) => {
    // console.log(e)
    // connectionLost()
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.initialize();



/**
 * Verificamos si tienes un gesto de db
 */

if (process.env.DATABASE === 'mysql') {
    mysqlConnection.connect()
}

server.listen(port, () => {
    console.log(`El server esta listo por el puerto ${port}`);
})
checkEnvFile();

