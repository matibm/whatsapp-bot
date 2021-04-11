"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WAConnection = void 0;
const _5_User_1 = require("./5.User");
const fs_1 = require("fs");
const Constants_1 = require("./Constants");
const Utils_1 = require("./Utils");
const Mutex_1 = require("./Mutex");
class WAConnection extends _5_User_1.WAConnection {
    /**
     * Send a message to the given ID (can be group, single, or broadcast)
     * @param id the id to send to
     * @param message the message can be a buffer, plain string, location message, extended text message
     * @param type type of message
     * @param options Extra options
     */
    async sendMessage(id, message, type, options = {}) {
        const waMessage = await this.prepareMessage(id, message, type, options);
        await this.relayWAMessage(waMessage);
        return waMessage;
    }
    /** Prepares a message for sending via sendWAMessage () */
    async prepareMessage(id, message, type, options = {}) {
        const content = await this.prepareMessageContent(message, type, options);
        const preparedMessage = this.prepareMessageFromContent(id, content, options);
        return preparedMessage;
    }
    /** Prepares the message content */
    async prepareMessageContent(message, type, options) {
        let m = {};
        switch (type) {
            case Constants_1.MessageType.text:
            case Constants_1.MessageType.extendedText:
                if (typeof message === 'string') {
                    m.extendedTextMessage = { text: message };
                }
                else if ('text' in message) {
                    m.extendedTextMessage = message;
                }
                else {
                    throw new Constants_1.BaileysError('message needs to be a string or object with property \'text\'', message);
                }
                break;
            case Constants_1.MessageType.location:
            case Constants_1.MessageType.liveLocation:
                m.locationMessage = message;
                break;
            case Constants_1.MessageType.contact:
                m.contactMessage = message;
                break;
            default:
                m = await this.prepareMessageMedia(message, type, options);
                break;
        }
        return Constants_1.WAMessageProto.Message.create(m);
    }
    /** Prepare a media message for sending */
    async prepareMessageMedia(buffer, mediaType, options = {}) {
        var _a;
        if (mediaType === Constants_1.MessageType.document && !options.mimetype) {
            throw new Error('mimetype required to send a document');
        }
        if (mediaType === Constants_1.MessageType.sticker && options.caption) {
            throw new Error('cannot send a caption with a sticker');
        }
        if (!options.mimetype) {
            options.mimetype = Constants_1.MimetypeMap[mediaType];
        }
        let isGIF = false;
        if (options.mimetype === Constants_1.Mimetype.gif) {
            isGIF = true;
            options.mimetype = Constants_1.MimetypeMap[Constants_1.MessageType.video];
        }
        // generate a media key
        const mediaKey = Utils_1.randomBytes(32);
        const mediaKeys = Utils_1.getMediaKeys(mediaKey, mediaType);
        const enc = Utils_1.aesEncrypWithIV(buffer, mediaKeys.cipherKey, mediaKeys.iv);
        const mac = Utils_1.hmacSign(Buffer.concat([mediaKeys.iv, enc]), mediaKeys.macKey).slice(0, 10);
        const body = Buffer.concat([enc, mac]); // body is enc + mac
        const fileSha256 = Utils_1.sha256(buffer);
        // url safe Base64 encode the SHA256 hash of the body
        const fileEncSha256B64 = Utils_1.sha256(body)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/\=+$/, '');
        await Utils_1.generateThumbnail(buffer, mediaType, options);
        // send a query JSON to obtain the url & auth token to upload our media
        const json = await this.refreshMediaConn();
        const auth = json.auth; // the auth token
        let mediaUrl;
        for (let host of json.hosts) {
            const hostname = `https://${host.hostname}${Constants_1.MediaPathMap[mediaType]}/${fileEncSha256B64}?auth=${auth}&token=${fileEncSha256B64}`;
            try {
                const urlFetch = await this.fetchRequest(hostname, 'POST', body);
                mediaUrl = (_a = (await urlFetch.json())) === null || _a === void 0 ? void 0 : _a.url;
                if (mediaUrl)
                    break;
                else
                    throw new Error(`upload failed`);
            }
            catch (error) {
                const isLast = host.hostname === json.hosts[json.hosts.length - 1].hostname;
                this.log(`Error in uploading to ${host.hostname}${isLast ? '' : ', retrying...'}`, Constants_1.MessageLogLevel.info);
            }
        }
        if (!mediaUrl)
            throw new Error('Media upload failed on all hosts');
        const message = {};
        message[mediaType] = {
            url: mediaUrl,
            mediaKey: mediaKey.toString('base64'),
            mimetype: options.mimetype,
            fileEncSha256: fileEncSha256B64,
            fileSha256: fileSha256.toString('base64'),
            fileLength: buffer.length,
            fileName: options.filename || 'file',
            gifPlayback: isGIF || null,
            caption: options.caption
        };
        return message;
    }
    /** prepares a WAMessage for sending from the given content & options */
    prepareMessageFromContent(id, message, options) {
        if (!options.timestamp)
            options.timestamp = new Date(); // set timestamp to now
        // prevent an annoying bug (WA doesn't accept sending messages with '@c.us')
        id = Utils_1.whatsappID(id);
        const key = Object.keys(message)[0];
        const timestamp = Utils_1.unixTimestampSeconds(options.timestamp);
        const quoted = options.quoted;
        if (options.contextInfo)
            message[key].contextInfo = options.contextInfo;
        if (quoted) {
            const participant = quoted.key.fromMe ? this.user.jid : (quoted.participant || quoted.key.participant || quoted.key.remoteJid);
            message[key].contextInfo = message[key].contextInfo || {};
            message[key].contextInfo.participant = participant;
            message[key].contextInfo.stanzaId = quoted.key.id;
            message[key].contextInfo.quotedMessage = quoted.message;
            // if a participant is quoted, then it must be a group
            // hence, remoteJid of group must also be entered
            if (quoted.key.participant) {
                message[key].contextInfo.remoteJid = quoted.key.remoteJid;
            }
        }
        if (!message[key].jpegThumbnail)
            message[key].jpegThumbnail = options === null || options === void 0 ? void 0 : options.thumbnail;
        const messageJSON = {
            key: {
                remoteJid: id,
                fromMe: true,
                id: Utils_1.generateMessageID(),
            },
            message: message,
            messageTimestamp: timestamp,
            messageStubParameters: [],
            participant: id.includes('@g.us') ? this.user.jid : null,
            status: Constants_1.WA_MESSAGE_STATUS_TYPE.PENDING
        };
        return Constants_1.WAMessageProto.WebMessageInfo.create(messageJSON);
    }
    /** Relay (send) a WAMessage; more advanced functionality to send a built WA Message, you may want to stick with sendMessage() */
    async relayWAMessage(message) {
        const json = ['action', { epoch: this.msgCount.toString(), type: 'relay' }, [['message', null, message]]];
        const flag = message.key.remoteJid === this.user.jid ? Constants_1.WAFlag.acknowledge : Constants_1.WAFlag.ignore; // acknowledge when sending message to oneself
        await this.query({ json, binaryTags: [Constants_1.WAMetric.message, flag], tag: message.key.id, expect200: true });
        await this.chatAddMessageAppropriate(message);
    }
    /**
     * Fetches the latest url & media key for the given message.
     * You may need to call this when the message is old & the content is deleted off of the WA servers
     * @param message
     */
    async updateMediaMessage(message) {
        var _a, _b, _c, _d, _e;
        const content = ((_a = message.message) === null || _a === void 0 ? void 0 : _a.audioMessage) || ((_b = message.message) === null || _b === void 0 ? void 0 : _b.videoMessage) || ((_c = message.message) === null || _c === void 0 ? void 0 : _c.imageMessage) || ((_d = message.message) === null || _d === void 0 ? void 0 : _d.stickerMessage) || ((_e = message.message) === null || _e === void 0 ? void 0 : _e.documentMessage);
        if (!content)
            throw new Constants_1.BaileysError(`given message ${message.key.id} is not a media message`, message);
        const query = ['query', { type: 'media', index: message.key.id, owner: message.key.fromMe ? 'true' : 'false', jid: message.key.remoteJid, epoch: this.msgCount.toString() }, null];
        const response = await this.query({ json: query, binaryTags: [Constants_1.WAMetric.queryMedia, Constants_1.WAFlag.ignore], expect200: true });
        Object.keys(response[1]).forEach(key => content[key] = response[1][key]); // update message
    }
    /**
     * Securely downloads the media from the message.
     * Renews the download url automatically, if necessary.
     */
    async downloadMediaMessage(message) {
        try {
            const buff = await Utils_1.decodeMediaMessageBuffer(message.message, this.fetchRequest);
            return buff;
        }
        catch (error) {
            if (error instanceof Constants_1.BaileysError && error.status === 404) { // media needs to be updated
                this.log(`updating media of message: ${message.key.id}`, Constants_1.MessageLogLevel.info);
                await this.updateMediaMessage(message);
                const buff = await Utils_1.decodeMediaMessageBuffer(message.message, this.fetchRequest);
                return buff;
            }
            throw error;
        }
    }
    /**
     * Securely downloads the media from the message and saves to a file.
     * Renews the download url automatically, if necessary.
     * @param message the media message you want to decode
     * @param filename the name of the file where the media will be saved
     * @param attachExtension should the parsed extension be applied automatically to the file
     */
    async downloadAndSaveMediaMessage(message, filename, attachExtension = true) {
        const buffer = await this.downloadMediaMessage(message);
        const extension = Utils_1.extensionForMediaMessage(message.message);
        const trueFileName = attachExtension ? (filename + '.' + extension) : filename;
        await fs_1.promises.writeFile(trueFileName, buffer);
        return trueFileName;
    }
    async refreshMediaConn() {
        if (!this.mediaConn || (new Date().getTime() - this.mediaConn.fetchDate.getTime()) > this.mediaConn.ttl * 1000) {
            const result = await this.query({ json: ['query', 'mediaConn'] });
            this.mediaConn = result.media_conn;
            this.mediaConn.fetchDate = new Date();
        }
        return this.mediaConn;
    }
}
__decorate([
    Mutex_1.Mutex(message => { var _a; return (_a = message === null || message === void 0 ? void 0 : message.key) === null || _a === void 0 ? void 0 : _a.id; })
], WAConnection.prototype, "updateMediaMessage", null);
__decorate([
    Mutex_1.Mutex(message => { var _a; return (_a = message === null || message === void 0 ? void 0 : message.key) === null || _a === void 0 ? void 0 : _a.id; })
], WAConnection.prototype, "downloadMediaMessage", null);
exports.WAConnection = WAConnection;
