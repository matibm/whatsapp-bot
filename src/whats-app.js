const WhatsAppWeb = require('baileys')

const WA = require('@adiwajshing/baileys')
const MessageType = WA.MessageType;
const client = new WhatsAppWeb()
const fs = require('fs')
const Usuario = require('./../models/usuario')
const path = require('path')

const { env } = require('process');

let downloaded = 0

require('dotenv').config();




module.exports.register = async(req, res) => {

    const client = new WhatsAppWeb()


    client.onReadyForPhoneAuthentication = ([ref, publicKey, clientID]) => {
        const str = ref + "," + publicKey + "," + clientID
        console.log(str);
        res.status(200).json({
            ok: true,
            token: str
        })
    }
    client.connectSlim() // connect first
        .then(async user => {
            const creds = client.base64EncodedAuthInfo() // contains all the keys you need to restore a session
            let str = `AUTH_INFO="${JSON.stringify(creds, null, '\t').toString().replace(/\s/g, '')}"`
            fs.writeFileSync('./.env', str) // save JSON to file 
            const conn = new WA.WAConnection
            conn.loadAuthInfo(creds)
            await conn.connect()
            const unread = await conn.loadAllUnreadMessages()
            this.recibeMessage(conn)

        }).then(r => {

        })



}



module.exports.conectApi = async(req, res) => {

        const cliente = new WhatsAppWeb()

        const conn = new WA.WAConnection
        console.log("pasa", process.env.AUTH_INFO);

        let auth = JSON.parse(process.env.AUTH_INFO)
        conn.loadAuthInfo(auth) // will load JSON credentials from file
        await conn.connect()
        const unread = await conn.loadAllUnreadMessages()

        conn.on('close', async(reason) => {
            console.log("is reconecting:", reason.isReconnecting);
            console.log(reason)
            if (reason.reason === 'lost') {
                conn.close()
                conn.loadAuthInfo(auth)
                conn.connect()
                return {}
            }
            if (reason.reason != 'intentional') {
                console.log('Unable to reconnect')
            }
            if (reason.reason == 'invalid_session') {

            }
            if (reason.reason == 'timed out') {

                this.conectApi()
            }
            if (reason.reason == 'timed_out') {
                this.conectApi()
            }
        })
        conn.on('ws-close', async(reason) => {
            console.log('ws close', reason);
            fs.writeFileSync('./reason', reason) // save JSON to file 
            this.conectApi()
        })
        this.recibeMessage(conn)
        conn.requestPresenceUpdate('595971455095@s.whatsapp.net')
        conn.on('user-presence-update', update => {
            // will only be set if user has last seen enabled
            console.log('user last seen is ')
            console.log(update);
        })
    }
    // ENVIAR MENSAJES

module.exports.sendMessage = async(req, res) => {
    options = {
        quoted: null,
        timestamp: new Date()
    }
    client.sendTextMessage(`${req.body.phone}@s.whatsapp.net`, req.body.body, options)
        .then(res.jsonp({ mensaje: 'Notificación enviada' }))
}

module.exports.recibeMessage = async(conn) => {
    console.log("recibiendo mensajes", new Date());
    conn.on('message-new', async(m) => {
        let id = m.key.remoteJid
        console.log("mi id", id);
        if (!m.message || m.key.remoteJid.indexOf('status@broadcast') != -1) return // if there is no text or media message
        const messageType = Object.keys(m.message)[0] // get what type of message it is -- text, image, video
            // if the message is not a text message

        if (messageType === MessageType.text) {
            let mensaje = m.message.conversation.toLocaleLowerCase()

            if (mensaje == 'nuevo') {
                let jsontxt = {
                    nombre: '',
                    tel: '',
                    email: ''
                }
                let text = `Por favor mande un mensaje en este formato  
[nombre, tel, email]`

                conn.sendMessage(id, text, MessageType.text);

            }
            if (mensaje[0] == "[") {

                let msg = mensaje.replace('[', '')
                msg = msg.replace(']', '')
                let arr = msg.split(', ')
                let obj = {
                    nombre: arr[0],
                    tel: arr[1],
                    email: arr[2]
                }
                let data = await Usuario.insertMany([obj])
                console.log(data);
            }
            if (mensaje.indexOf('consulta-usuario:') >= 0) {
                let tel = mensaje.slice(17)
                tel = tel.trim()
                console.log(tel);
                let user = await Usuario.findOne({ tel: tel }).select('tel nombre email')
                delete user._id
                conn.sendMessage(id, `Nombre: ${user.nombre}\nEmail: ${user.email}`, MessageType.text);

            }
        }
        if (messageType === MessageType.text) {
            let mensaje = m.message.conversation.toLocaleLowerCase()
            if (mensaje.indexOf('buscar: ') != -1) {
                let semicolon = mensaje.indexOf(';');
                let start = mensaje.indexOf('buscar: ') + 8;
                let busqueda = mensaje.slice(start, semicolon)
                let videos = await search(busqueda);

                let id = m.key.remoteJid
                let texto = `Resultados: `
                let contador = 0
                videos.forEach(item => {
                    contador++;
                    texto += `\n${contador}. Titulo: ${item.title};\nDescripcion: ${item.description}\n Autor: ${item.channelTitle}\n${contador}:id:${item.id};\n`
                })

                conn.sendMessage(id, texto, MessageType.text);
            }
        }

    })



}