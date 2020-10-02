const WhatsAppWeb = require('baileys')
const webscraping = require('../webscraping')

const WA = require('@adiwajshing/baileys')
const MessageType = WA.MessageType;
const Mimetype = WA.Mimetype;
const client = new WhatsAppWeb()
const cheerio = require('cheerio');
const request = require('request-promise');
const fs = require('fs')
const youtubedl = require('youtube-dl')
const output = 'myvideo.mp4'
const sharp = require('sharp');
var ffmpeg = require('fluent-ffmpeg');
const webp = require('webp-converter');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
// const app = require('express');
// const youtube = require('./search/index');
const search = require('../search/index');
const { env } = require('process');

let downloaded = 0

// if (fs.existsSync(output)) {
//     downloaded = fs.statSync(output).size
// }

// CONECTA WHATS - SERVIDOR
module.exports.register = async(req, res) => {
    //     client.connect()
    //         .then(([user, chats, contacts, unread]) => {
    //             console.log("oh hello " + user.name + " (" + user.id + ")")
    //             console.log("you have " + unread.length + " unread messages")
    //             console.log("you have " + chats.length + " chats")
    //             res.jsonp({ mensaje: 'Autenticación exitosa' });
    //         })
    //         .catch(err => console.log(err))
    const client = new WhatsAppWeb()
        // client.connectSlim() // connect first
        //     .then(user => {
        //         const creds = client.base64EncodedAuthInfo() // contains all the keys you need to restore a session
        //         fs.writeFileSync('./auth_info.json', JSON.stringify(creds, null, '\t')) // save JSON to file
        //     })

}

module.exports.conectApi = async(req, res) => {
        // client.connect()
        //     .then(([user, chats, contacts, unread]) => {
        //         console.log("oh hello " + user.name + " (" + user.id + ")")
        //         console.log("you have " + unread.length + " unread messages")
        //         console.log("you have " + chats.length + " chats")

        //         res.jsonp({ mensaje: 'Autenticación exitosa' });
        //     })
        //     .catch(err => console.log(err))

        const cliente = new WhatsAppWeb()
            // let authInfo = fs.readFileSync('./auth_info.json')
            // console.log(JSON.parse(authInfo.toString()));
        const conn = new WA.WAConnection

        let auth = JSON.parse(process.env.AUTH_INFO)
        conn.loadAuthInfo(auth) // will load JSON credentials from file
        await conn.connect()

        const unread = await conn.loadAllUnreadMessages()


        // console.log('oh hello ' + conn.user.name + ' (' + conn.user.jid + ')')
        // console.log('you have ' + conn.chats.length + ' chats & ' + Object.keys(conn.contacts).length + ' contacts')
        // console.log('you have ' + unread.length + ' unread messages')
        this.recibeMessage(conn)



        // cliente.connectSlim(JSON.parse(authInfo.toString())) // will load JSON credentials from file
        //     .then(async user => {
        //         console.log("conectado sin codigo QR");

        //         this.recibeMessage(cliente)
        //     }).catch({})

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

    conn.on('message-new', async(m) => {
        let id = m.key.remoteJid
        if (!m.message) return // if there is no text or media message
        const messageType = Object.keys(m.message)[0] // get what type of message it is -- text, image, video
            // if the message is not a text message
        if (messageType !== MessageType.text && messageType !== MessageType.extendedText) {
            // const buffer = await conn.downloadMediaMessage(m) // to decrypt & use as a buffer

            const savedFilename = await conn.downloadAndSaveMediaMessage(m) // to decrypt & save to file
            console.log(m.key.remoteJid + " sent media, saved at: " + savedFilename)

            if (messageType == 'imageMessage') {
                let imageMessage = m.message.imageMessage;
                console.log(imageMessage);
                let caption = imageMessage.caption.toLocaleLowerCase()
                console.log(caption);
                if (caption == 'sticker') {
                    const result = webp.cwebp(savedFilename, "sticker.webp", "-q 80");
                    result.then((response) => {
                        console.log(response);
                        let buffer = fs.readFileSync('sticker.webp')
                        conn.sendMessage(id, buffer, MessageType.sticker)

                    });
                }
            }


        }
        if (messageType === MessageType.text) {
            let mensaje = m.message.conversation.toLocaleLowerCase()
            console.log(mensaje);
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
                    texto += `\n${contador}. Titulo: ${item.title}\nDescripcion: ${item.description}\n Autor: ${item.channelTitle}\n${contador}:id:${item.id};\n`
                })

                conn.sendMessage(id, texto, MessageType.text);
            }
        }
        if (messageType === MessageType.extendedText) {
            console.log(m);
            let opcion = m.message.extendedTextMessage.text;
            let texto = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
            let videoId
            if (opcion) {
                let fin = texto.slice(texto.indexOf(opcion + ':id:') + 5)
                let indexfin = fin.indexOf(';')
                videoId = fin.slice(0, indexfin);
            }
            if (videoId) {
                const video = youtubedl('https://www.youtube.com/watch?v=' + videoId, ['--format=18'], { start: downloaded, cwd: __dirname })
                    // output = 'myvideo.mp4'
                video.pipe(fs.createWriteStream(output, { flags: 'a' }))
                video.on('end', async function() {
                    let buffer = fs.readFileSync(output)

                    ffmpeg(output).toFormat('mp3').saveToFile('myaudio.mp3').on('end', async() => {
                        let buffer = fs.readFileSync('myaudio.mp3')
                        const options = { mimetype: Mimetype.mp3 }
                        await conn.sendMessage(id, buffer, MessageType.audio, options);
                        if (fs.existsSync(output)) {
                            fs.unlinkSync(output)
                        }
                    }).on('error', (err) => {
                        console.log("error", err);
                    })
                })

            }

        }

        // if (imageMessage && m.key.remoteJid != 'status@broadcast') {

        //     if (imageMessage.caption.toLocaleLowerCase() == 'sticker') {
        //         const savedFilename = await cliente.decodeMediaMessage(m.message, "filename") // extension applied automatically
        //         console.log(m.key.remoteJid + " sent media, saved at: ")
        //         console.log(savedFilename)
        //         let file = fs.readFileSync('filename.jpeg')
        //         console.log(file);

        //         const result = webp.cwebp("filename.jpeg", "filename.webp", "-q 80");
        //         result.then((response) => {
        //             console.log(response);
        //             file = fs.readFileSync('filename.webp')

        //         });
        //     }

        // }
    })



}

/*
module.exports.recibeMessage = async(cliente) => {


    cliente.setOnUnreadMessage(async m => {

        const [notificationType, messageType] = cliente.getNotificationType(m) // get what type of notification it is -- message, group add notification etc.
            // console.log("got notification of type: " + notificationType) // message, groupAdd, groupLeave
            // console.log("message type: " + messageType) // conversation, imageMessage, videoMessage, contactMessage etc.
        let imageMessage = m.message.imageMessage;

        // console.log(m.message.extendedTextMessage.contextInfo);
        let mensaje = m.message.conversation;
        if (imageMessage && m.key.remoteJid != 'status@broadcast') {

            if (imageMessage.caption.toLocaleLowerCase() == 'sticker') {
                const savedFilename = await cliente.decodeMediaMessage(m.message, "filename") // extension applied automatically
                console.log(m.key.remoteJid + " sent media, saved at: ")
                console.log(savedFilename)
                let file = fs.readFileSync('filename.jpeg')
                console.log(file);

                const result = webp.cwebp("filename.jpeg", "filename.webp", "-q 80");
                result.then((response) => {
                    console.log(response);
                    file = fs.readFileSync('filename.webp')

                    cliente.sendMediaMessage(m.key.remoteJid, file, WhatsAppWeb.MessageType.sticker).finally(() => {
                        console.log("enviado");
                    })
                });
            }

        }
        mensaje = mensaje.toLocaleLowerCase()
        if (mensaje.indexOf('buscar: ') != -1) {
            let semicolon = mensaje.indexOf(';');
            let start = mensaje.indexOf('buscar: ') + 8;
            let busqueda = mensaje.slice(start, semicolon)
            let videos = await search(busqueda);

            console.log(videos);
            let id = m.key.remoteJid
            let texto = `Resultados: `
            let contador = 0
            videos.forEach(item => {
                contador++;
                texto += `\n${contador}. Titulo: ${item.title}\nDescripcion: ${item.description}\n Autor: ${item.channelTitle}\n${contador}:id:${item.id};\n`
            })

            console.log(texto);

            // cliente.sendTextMessage(`${m.key.remoteJid}@s.whatsapp.net`, texto, options)

            cliente.sendTextMessage(id, texto)
        }

        if (m.message.extendedTextMessage) {
            if (m.message.extendedTextMessage.contextInfo) {

                let texto = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
                let id
                let opcion = m.message.extendedTextMessage.text;
                if (opcion) {
                    let fin = texto.slice(texto.indexOf(opcion + ':id:') + 5)
                    let indexfin = fin.indexOf(';')
                    id = fin.slice(0, indexfin);
                }
                if (id) {
                    const video = youtubedl('https://www.youtube.com/watch?v=' + id,
                        // Optional arguments passed to youtube-dl.
                        ['--format=18'],

                        // start will be sent as a range header
                        { start: downloaded, cwd: __dirname })


                    video.pipe(fs.createWriteStream(output, { flags: 'a' }))
                    video.on('end', function() {
                        console.log('finished downloading!')
                        let file = fs.readFileSync('myvideo.mp4')

                        cliente.sendMediaMessage(m.key.remoteJid, file, WhatsAppWeb.MessageType.audio).finally(() => {
                            console.log("enviado");
                            if (fs.existsSync(output)) {
                                fs.unlinkSync(output)
                            }
                            // if (fs.existsSync('myaudio.mp3')) {
                            //     fs.unlinkSync('myaudio.mp3')
                            // }
                        })


                        // ffmpeg(output).toFormat('ogg').saveToFile('myaudio.ogg').on('end', () => {
                        //     console.log("convertido");
                        //     // const options = { mimetype: Mimetype.ogg }

                        // }).on('error', (err) => {
                        //     console.log("error", err);
                        // })


                        // var process = new ffmpeg(output);
                        // process.then(function(video) {
                        //     // Callback mode
                        //     video.fnExtractSoundToMP3('./myaudio.mp3', function(error, file) {
                        //         if (!error)
                        //             console.log('Audio file: ' + file);
                        //     });
                        // }, function(err) {
                        //     console.log('Error: ' + err);
                        // });



                    })

                }
            }
        }



    }, false)
}*/

// const video = youtubedl('http://www.youtube.com/watch?v=90AiXO1pAiA',
//     // Optional arguments passed to youtube-dl.
//     ['--format=18'],
//     // Additional options can be given for calling `child_process.execFile()`.
//     { cwd: __dirname })

// Will be called when the download starts.