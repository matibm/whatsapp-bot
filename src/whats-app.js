const WhatsAppWeb = require('baileys')

const WA = require('@adiwajshing/baileys')
const MessageType = WA.MessageType;
const client = new WhatsAppWeb()
const fs = require('fs')
const Usuario = require('./../models/usuario')
const Producto = require('./../models/producto')
const Sub = require('./../models/subscripcion')
const path = require('path')
const bcrypt = require('bcrypt');

const { env } = require('process');
const producto = require('./../models/producto');

let downloaded = 0

require('dotenv').config();




module.exports.register = async(req, res) => {

    const client = new WhatsAppWeb()


    client.onReadyForPhoneAuthentication = ([ref, publicKey, clientID]) => {
        const str = ref + "," + publicKey + "," + clientID
            //g(str);
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
            //g("pasa", process.env.AUTH_INFO);

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
            // conn.requestPresenceUpdate('595971455095@s.whatsapp.net')
            // conn.on('user-presence-update', update => {
            //     // will only be set if user has last seen enabled
            //     console.log('user last seen is ')
            //     console.log(update);
            // })
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
    conn.on('chat-update', async(m) => {
        let id = m.jid
        let mensaje
        console.log(m);
        if (m.messages && m.count) {
            const message = m.messages.all()[0]
                // console.log(message)
            mensaje = message.message.conversation.toLocaleLowerCase()
        } else { console.log(m, "returning"); return } // if (m.kez
        if (id.indexOf('status@broadcast') != -1) return // if there is no text or media message

        const messageType = Object.keys(m.messages.all()[0])[0] // get what type of message it is -- text, image, video
            // if the message is not a text message
            // console.log(messageType);
        console.log(mensaje);
        if (messageType === 'messageStubParameters') {
            console.log("es un texto");

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
                    //g(data);
            }
            if (mensaje.indexOf("-np[") != -1) {

                let msg = mensaje.replace('-np[', '')
                msg = msg.replace(']', '')

                let arr = msg.split(', ')

                let obj = {
                        tipo: arr[0],
                        marca: arr[1],
                        precio: arr[2],
                        email: arr[3],
                        pass: arr[4]
                    }
                    //g(obj);
                let data = await Producto.insertMany([obj])
                    //g(data);
                conn.sendMessage(id, `Producto creado✅`, MessageType.text);

            }
            if (mensaje.indexOf('consulta-usuario:') >= 0) {
                let tel = mensaje.slice(17)
                tel = tel.trim()
                    //g(tel);
                let user = await Usuario.findOne({ tel: tel }).select('-_id tel nombre email')

                conn.sendMessage(id, `Nombre: ${user.nombre}\nEmail: ${user.email}`, MessageType.text, );

            }
            if (mensaje.indexOf('lista') >= 0) {
                let tel = mensaje.slice(17)
                tel = tel.trim()
                console.log(tel);
                let productos = await Producto.find()

                let txt = `Responda a este mensaje con el numero del servicio que desea:\n`
                for (let i = 0; i < productos.length; i++) {
                    const element = productos[i];

                    txt +=
                        `${i + 1}.
      tipo: ${element.tipo},
      marca: ${element.marca},
      precio: ${element.precio},
      id:${i + 1}${element._id}


    `
                }

                console.log(id);
                let hash = bcrypt.hashSync(id, 10)
                txt += `token:${hash}`
                conn.sendMessage(id, txt, MessageType.text);

            }
            if (mensaje.indexOf('nuevo-producto') >= 0) {
                let txt = `Para crear un producto escriba \n En el siguiente formato: \n -np[tipo, marca, precio, email, pass]`
                conn.sendMessage(id, txt, MessageType.text);

            }

            if (mensaje.indexOf('-rp') >= 0) {

                let config = getConfig()
                console.log(config);
                config.principal = id
                updateConfig(config)
                conn.sendMessage(id, 'numero guardado correctamente', MessageType.text);

            } else if (mensaje.indexOf('-r') >= 0) {
                let txt = `Por favor registre sus datos \n En el siguiente formato: \n [nombre, marca, precio, email, pass]`
                conn.sendMessage(id, txt, MessageType.text);

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
        if (m.messages) {
            if (m.messages.array[0]) {
                if (m.messages.array[0].message) {
                    if (m.messages.array[0].message.extendedTextMessage) {
                        if (m.messages.array[0].message.extendedTextMessage.contextInfo) {
                            if (m.messages.array[0].message.extendedTextMessage.contextInfo.quotedMessage) {


                                let mensajeExtended = m.messages.array[0].message.extendedTextMessage.contextInfo.quotedMessage.conversation
                                try {
                                    let s = ''
                                    s.toLocaleLowerCase()
                                    let mensaje = m.messages.array[0].message.extendedTextMessage.text.toLocaleLowerCase()
                                    let context = mensajeExtended

                                    if ('ok' == mensaje) {
                                        let caption = m.messages.array[0].message.extendedTextMessage.contextInfo.quotedMessage.imageMessage.caption

                                        let idsub = caption.slice(caption.indexOf('id:') + 3)
                                        console.log(idsub);
                                        let sub = await Sub.findById(idsub).populate('producto usuario')
                                        console.log(sub);
                                        let jid = sub.usuario.jid
                                        let texto = `pago aprobado\nEmail: ${sub.producto.email}\nContraseña: ${sub.producto.pass}`
                                        conn.sendMessage(jid, texto, MessageType.text);

                                    }


                                    if (!isNaN(mensaje)) {
                                        // console.log("es un numero", mensaje);
                                        let textExtended = mensajeExtended
                                        let token = textExtended.slice(textExtended.indexOf('token:') + 6)
                                        console.log(token);
                                        let permission = bcrypt.compareSync(id, token)
                                        if (!permission) {
                                            console.log("coinciden");
                                            return;
                                        }
                                        let usuario = await Usuario.findOne({ jid: id })
                                        if (!usuario) {
                                            usuario = new Usuario({ jid: id }).save()
                                        }
                                        let id_product = textExtended.slice(
                                            textExtended.indexOf('id:' + mensaje) + 3 + mensaje.toString().length,
                                            textExtended.indexOf('id:' + mensaje) + 3 + mensaje.toString().length + 24)

                                        let product = await Producto.findById(id_product)
                                        console.log(usuario);
                                        let subs = await new Sub({
                                            producto: product._id,
                                            usuario: usuario._id

                                        }).save()
                                        console.log(subs);
                                        let texto =
                                            `Elegiste ${product.marca} ${product.tipo}\nPor favor realiza el pago: (${product.precio} Gs)\nLuego seleccione y responde este mensaje con la imagen del ticket\nid:${subs._id}`
                                        conn.sendMessage(id, texto, MessageType.text);

                                    }
                                } catch (error) {
                                    console.log(error);
                                }

                            }

                        }

                    }
                    if (m.messages.array[0].message.imageMessage) {
                        if (m.messages.array[0].message.imageMessage.contextInfo) {
                            if (m.messages.array[0].message.imageMessage.contextInfo.quotedMessage) {
                                try {
                                    console.log(m.messages.array[0].message.imageMessage.contextInfo.quotedMessage);
                                    var savedFilename = await conn.downloadAndSaveMediaMessage(m.messages.array[0], 'undefined.jpeg', false) // to decrypt & save to file
                                    let folderpath = `/../tickets/${id.slice(0, 10)}`
                                    let filename = `${Date.now()}.jpeg`
                                    if (!fs.existsSync(path.join(__dirname, folderpath))) {
                                        fs.mkdirSync(path.join(__dirname, folderpath))
                                    }
                                    fs.copyFileSync(path.join(__dirname, `/../${savedFilename}`), path.join(__dirname, `/../tickets/${id.slice(0, 10)}/${filename}`))
                                    let txt = m.messages.array[0].message.imageMessage.contextInfo.quotedMessage.conversation
                                    let idsub = txt.slice(txt.indexOf('id:') + 3)
                                    if (!idsub) {
                                        return
                                    }
                                    let sub = await Sub.findById(idsub).populate('producto usuario')
                                    let producto = sub.producto
                                    console.log(producto);
                                    let texto = `Nuevo Ticket por el producto: \ntipo: ${producto.tipo},\nmarca: ${producto.marca},\nprecio: ${producto.precio},\nid:${sub._id}`

                                    let options = { mimetype: 'image/jpeg', caption: texto, filename: "file.jpeg" };

                                    let buffer = fs.readFileSync(path.join(__dirname, `/../tickets/${id.slice(0, 10)}/${filename}`))
                                    let config = getConfig()
                                    console.log(config);
                                    conn.sendMessage(config.principal, buffer, MessageType.image, options);

                                } catch (error) {
                                    console.log(error);
                                }
                            }
                        }
                    }
                }

            }

        }

        if (messageType === MessageType.image) {

            if (m.message.imageMessage.contextInfo) {
                if (m.message.imageMessage.contextInfo.quotedMessage) {
                    if (m.message.imageMessage.contextInfo.quotedMessage.conversation) {
                        try {
                            var savedFilename = await conn.downloadAndSaveMediaMessage(m) // to decrypt & save to file
                            console.log(savedFilename);
                            let folderpath = `/../tickets/${id.slice(0, 10)}`
                            let filename = `${Date.now()}.jpeg`
                            if (!fs.existsSync(path.join(__dirname, folderpath))) {
                                fs.mkdirSync(path.join(__dirname, folderpath))
                            }
                            fs.copyFileSync(path.join(__dirname, `/../${savedFilename}`), path.join(__dirname, `/../tickets/${id.slice(0, 10)}/${filename}`))
                            let txt = m.message.imageMessage.contextInfo.quotedMessage.conversation
                            let idsub = txt.slice(txt.indexOf('id:') + 3)
                            if (!idsub) {
                                return
                            }
                            let sub = await Sub.findById(idsub).populate('producto usuario')
                            let producto = sub.producto
                            console.log(producto);
                            let texto = `Nuevo Ticket por el producto: \ntipo: ${producto.tipo},\nmarca: ${producto.marca},\nprecio: ${producto.precio},\nid:${sub._id}`

                            let options = { mimetype: 'image/jpeg', caption: texto, filename: "file.jpeg" };

                            let buffer = fs.readFileSync(path.join(__dirname, `/../tickets/${id.slice(0, 10)}/${filename}`))
                            let config = getConfig()
                            conn.sendMessage(config.principal, buffer, MessageType.image, options);

                        } catch (error) {
                            console.log(error);
                        }
                    }
                }
            }
        }

    })



}

function getConfig() {
    let config = JSON.parse(fs.readFileSync(path.join(__dirname, '/../config.json')))
    return config
}

function updateConfig(config) {
    fs.writeFileSync(path.join(__dirname, '/../config.json'), JSON.stringify(config))


}