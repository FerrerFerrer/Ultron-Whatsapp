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
 
 const port = 9000
 var client;
 app.use('/', require('./routes/web'))
 
 /**
  * Escuchamos cuando entre un mensaje
  */
 
 id_solicitud = 0;
 id_vendedor = 0;
 motivo = "";
 sigueMotivo = false;
 folio = "Sin registro";
 rechazo = false;
 fin = false;
 conmotivo = false;
 respuesta = "";
 contadorRechazo = 0;
 contadorAcepto = 0;
 folioboo = false;
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
 
     if (mensaje.includes('vendedor')) {
         //hola @ id_vendedor id_solicitud
         //limpiar variables
         id_solicitud = 0;
         id_vendedor = 0;
         motivo = "";
         sigueMotivo = false;
         folio = "Sin registro";
         rechazo = false;
         fin = false;
         conmotivo = false;
         respuesta = "";
         contadorRechazo = 0;
         contadorAcepto = 0;
         folioboo = false;
         ids = mensaje.split(" ");
         //limpiar variables
         id_vendedor = ids[4];
         id_solicitud = ids[11];
         respuesta = ids[15];
         console.log(ids)
     }
     //*hola, soy el vendedor 5 y acepto la solicitud 11 ¿si o no?* si
     if (sigueMotivo == true) {
         if (rechazo == false) {
            // console.log("tiempo cliente")
             url = "http://45.76.235.21/letrimex_v2/public/tiempo_cliente/" + id_solicitud;
             const response2 = await fetch(url, {
                 method: 'GET',
                 mode: 'no-cors',
                 headers: {
                     Accept: 'application/json',
                     'Access-Control-Allow-Origin': '*'
                 }
             });
             console.log("Status de tiempo_cliente", response2.status);
         }
         //Comprobar si es un motivo valido
         if (contadorAcepto == 1) {
             conmotivo = true;
             console.log("validando mensaje")
            // console.log("contador se hizo 0"
             if (mensaje == "1" || mensaje == "2" || mensaje == "3" || mensaje == "4") {
                 console.log("mensaje correcto")
                 contadorAcepto = 0;
                 siguemotivo = false;
                 if (mensaje == "1") {
                     folioboo = true;
                     motivo = "Si, se realizó la cotización";
                     const response = await responseMessages('STEP_2_1')
                     await sendMessage(client, from, response.replyMessage, response.trigger);
                     return
                 }
                 if (mensaje == "2") {
                     motivo = "No podemos dar el servicio"
                     //console.log("mensaje 4")
                 }
                 if (mensaje == "3") {
                     motivo = "No contesto el cliente"
                    // console.log("mensaje 4")
                 }
                 if (mensaje == "4") {
                     motivo = "Datos de contacto incorrectos"
                    // console.log("mensaje 4")
                 }
 
             }
             else {
                 console.log("se equivoco")
                 const response = await responseMessages('DEFAULT')
                 await sendMessage(client, from, response.replyMessage, response.trigger);
                 return
             }
         }
         if (contadorRechazo == 1) {
             console.log("validando mensaje")
             if (mensaje == "x" || mensaje == "y" || mensaje == "z") {
                 console.log("mensaje correcto")
                 siguemotivo = false;
                 contadorRechazo = 0;
                 if (mensaje == "x") {
                     motivo = "Estoy con un cliente"
                 }
                 if (mensaje == "y") {
                     motivo = "Estoy fuera de la oficina"
                 }
                 if (mensaje == "z") {
                     motivo = "Hora de comida"
                 }       
             }
             else {
                 const response = await responseMessages('DEFAULT')
                 await sendMessage(client, from, response.replyMessage, response.trigger);
                 return
             }
         }
         sigueMotivo = false;
         if (rechazo == false) {
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
             // if (mensaje == "1") {
             //     console.log("mensaje 1")
             //     const response = await responseMessages('STEP_2_1')
             //     await sendMessage(client, from, response.replyMessage, response.trigger);
             //     return
             // }
             // if (mensaje == "2" || mensaje == "3" || mensaje == "4") {
             //     console.log("mensaje 234")
             //     const response = await responseMessages('STEP_0')
             //     await sendMessage(client, from, response.replyMessage, response.trigger);
             //     return
             // }
 
         }
     }
 
     if (respuesta == "si" || respuesta == "no") {
         sigueMotivo = true;
         if (respuesta == "si") {
             respuesta = ""
             contadorAcepto += 1;
             console.log("coontador", contadorAcepto)
             let url = "http://45.76.235.21/letrimex_v2/public/tiempo_respuesta/" + id_solicitud;
             const response2 = await fetch(url, {
                 method: 'GET',
                 mode: 'no-cors',
                 headers: {
                     Accept: 'application/json',
                     'Access-Control-Allow-Origin': '*'
                 }
             });
             console.log("Status de tiempo_respuesta", response2.status);
             const response = await responseMessages('STEP_2')
             await sendMessage(client, from, response.replyMessage, response.trigger);
             return
         }
         if (respuesta == "no") {
             contadorRechazo += 1;
             respuesta = ""
             fin = true;
             rechazo = true;
             const response = await responseMessages('STEP_3')
             await sendMessage(client, from, response.replyMessage, response.trigger);
             return
         }
     }
 
     if (fin == true || folioboo == true || conmotivo == true) {
         if (folioboo == true) {
             folio = mensaje;
         }
         if (rechazo == true) {
             data = {
                 'solicitud_id': id_solicitud,
                 'motivo': motivo
             }
 
             console.log("motivo", motivo)
             console.log("id solicitud", id_solicitud)
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
             console.log("Status de rechazo", response2.status);
         }
 
         if (rechazo == false) {
             console.log("motivo",motivo)
             console.log("solicitud",id_solicitud)
             console.log("folio",folio)
             url = "http://45.76.235.21/letrimex_v2/public/pre_cotizacion/" + id_solicitud + "/" + motivo + "/" + folio;
             const response2 = await fetch(url, {
                 method: 'GET',
                 mode: 'no-cors',
                 headers: {
                     Accept: 'application/json',
                     'Access-Control-Allow-Origin': '*'
                 }
             });
             console.log("Status de precotizacion", response2.status);
         }
         id_solicitud = 0;
         id_vendedor = 0;
         motivo = "";
         sigueMotivo = false;
         folio = "Sin registro";
         rechazo = false;
         fin = false;
         conmotivo = false;
         respuesta = "";
         contadorRechazo = 0;
         contadorAcepto = 0;
         folioboo = false;
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
 
 