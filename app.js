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
//const MULTI_DEVICE = process.env.MULTI_DEVICE || 'true';
const server = require('http').Server(app)

const port = 9000
var client;
app.use('/', require('./routes/web'))

/**
 * Escuchamos cuando entre un mensaje
 */

//[0] respuesta
//[1] motivo
//[2] folio
let i = 0;
let j = 0;
let arreglito = [];
let id_solicitud = 0;
let id_vendedor = 0;
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
    
  //*hola, soy el vendedor 5 ferrer ferrer y acepto la solicitud 11 ¿si o no?* si
    if (mensaje.includes('vendedor')) {
        id_solicitud = 0;
        id_vendedor = 0;
        arreglito = [];
        i = 0;
        j = 0;
        ids = mensaje.split(" ");
        //hola @ id_vendedor id_solicitud
        id_vendedor = ids[4];
        id_solicitud = ids[11];
        arreglito[i] = ids[15];
        console.log(ids)

    }
    if (i == 0) {
        if (arreglito[i] == "si") {
            // let url = "http://45.76.235.21/letrimex_v2/public/tiempo_respuesta/" + id_solicitud;
            // const response2 = await fetch(url, {
            //     method: 'GET',
            //     mode: 'no-cors',
            //     headers: {
            //         Accept: 'application/json',
            //         'Access-Control-Allow-Origin': '*'
            //     }
            // });
            i++;
            // console.log("Status de tiempo_respuesta", response2.status);
            const response = await responseMessages('STEP_2')
            await sendMessage(client, from, response.replyMessage, response.trigger);
            return
        }

        if (arreglito[i] == "no") {
            i++;
            const response = await responseMessages('STEP_3')
            await sendMessage(client, from, response.replyMessage, response.trigger);
            return
        }
    }
  
    if (i == 1) {
        if (arreglito[0] == "si") {
            // console.log("tiempo cliente")
            // url = "http://45.76.235.21/letrimex_v2/public/tiempo_cliente/" + id_solicitud;
            // const response2 = await fetch(url, {
            //     method: 'GET',
            //     mode: 'no-cors',
            //     headers: {
            //         Accept: 'application/json',
            //         'Access-Control-Allow-Origin': '*'
            //     }
            // });
            // console.log("Status de tiempo_cliente", response2.status);
            console.log("validando mensaje");
            if (mensaje == "1" || mensaje == "2") {
                console.log("mensaje correcto")
                i++;
                if (mensaje == "1") {
                    arreglito[1] = "Si, se realizó la cotización";
                    const response = await responseMessages('STEP_2_1')
                    await sendMessage(client, from, response.replyMessage, response.trigger);
                    return
                }
                else if (mensaje == "2") {
                    const response = await responseMessages('STEP_2_2')
                    await sendMessage(client, from, response.replyMessage, response.trigger);
                    j++;
                    return
                }
            }
            else {
                console.log("mensaje incorrecto")
                const response = await responseMessages('DEFAULT')
                await sendMessage(client, from, response.replyMessage, response.trigger);
                return
            }
        }

        if(arreglito[0] == "no"){
            console.log("validando mensaje")
            if (mensaje == "x" || mensaje == "y" || mensaje == "z") {
                i++;
                console.log("mensaje correcto")
                if (mensaje == "x") {
                    arreglito[1] = "Estoy con un cliente"
                }
                if (mensaje == "y") {
                    arreglito[1] = "Estoy fuera de la oficina"
                }
                if (mensaje == "z") {
                    arreglito[1] = "Hora de comida"
                }
            }
            else {
                console.log("mensaje incorrecto")
                const response = await responseMessages('DEFAULT')
                await sendMessage(client, from, response.replyMessage, response.trigger);
                return
            }
        }
    }
   
    if (j == 1){
        console.log("validando mensaje")
        if (mensaje == "1") {
            console.log("mensaje correcto")
            arreglito[1] = "No podemos dar el servicio";
        }
        else if (mensaje == "2") {
            console.log("mensaje correcto")
            arreglito[1] = "No contesto el cliente";
        }
        else if (mensaje == "3") {
            console.log("mensaje correcto")
            arreglito[1] = "Datos de contacto incorrectos";
        }
        else {
            console.log("mensaje incorrecto")
            const response = await responseMessages('DEFAULT')
            await sendMessage(client, from, response.replyMessage, response.trigger);
            return
        }
        j--;
    }

    if (i == 2) {
        if (arreglito[0] == "no") {
            data = {
                'solicitud_id': id_solicitud,
                'motivo': arreglito[1]
            }
            console.log("motivo",arreglito[1])
            console.log("id solicitud", id_solicitud)
            // let url = "http://45.76.235.21/letrimex_v2/public/rechazo";
            // const response2 = await fetch(url, {
            //     method: 'POST',
            //     body: JSON.stringify(data),
            //     headers: {
            //         Accept: 'application/json',
            //         'Content-Length': JSON.stringify(data).length,
            //         'Content-Type': 'application/json'
            //     }
            // });
            // console.log("Status de rechazo", response2.status);
            arreglito[2] = "Sin registro."
        }

        if (arreglito[0] == "si") {
            if (arreglito[1] == "Si, se realizó la cotización") {
                arreglito[2] = mensaje;
            }
            else{
                arreglito[2] = "Sin registro"
            }
            console.log("solicitud", id_solicitud)
            console.log("motivo", arreglito[1])
            console.log("folio", arreglito[2])
            // url = "http://45.76.235.21/letrimex_v2/public/pre_cotizacion/" + id_solicitud + "/" + arreglito[1] + "/" + arreglito[2];
            // const response2 = await fetch(url, {
            //     method: 'GET',
            //     mode: 'no-cors',
            //     headers: {
            //         Accept: 'application/json',
            //         'Access-Control-Allow-Origin': '*'
            //     }
            // });
            // console.log("Status de precotizacion", response2.status);
        }
        const response = await responseMessages('STEP_0')
        await sendMessage(client, from, response.replyMessage, response.trigger);
        return
    }

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

