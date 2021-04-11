"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WAConnection = void 0;
const fs = __importStar(require("fs"));
const Utils = __importStar(require("./Utils"));
const Encoder_1 = __importDefault(require("../Binary/Encoder"));
const Decoder_1 = __importDefault(require("../Binary/Decoder"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const Constants_1 = require("./Constants");
const events_1 = require("events");
const keyed_db_1 = __importDefault(require("@adiwajshing/keyed-db"));
const http_1 = require("http");
class WAConnection extends events_1.EventEmitter {
    constructor() {
        super();
        /** The version of WhatsApp Web we're telling the servers we are */
        this.version = [2, 2035, 14];
        /** The Browser we're telling the WhatsApp Web servers we are */
        this.browserDescription = Utils.Browsers.baileys('Chrome');
        /** What level of messages to log to the console */
        this.logLevel = Constants_1.MessageLogLevel.info;
        /** Should requests be queued when the connection breaks in between; if 0, then an error will be thrown */
        this.pendingRequestTimeoutMs = null;
        /** The connection state */
        this.state = 'close';
        /** New QR generation interval, set to null if you don't want to regenerate */
        this.regenerateQRIntervalMs = 30 * 1000;
        this.connectOptions = {
            timeoutMs: 60 * 1000,
            waitForChats: true,
            maxRetries: 5,
            connectCooldownMs: 2250,
            phoneResponseTime: 7500
        };
        /** When to auto-reconnect */
        this.autoReconnect = Constants_1.ReconnectMode.onConnectionLost;
        /** Whether the phone is connected */
        this.phoneConnected = false;
        this.maxCachedMessages = 50;
        this.chats = new keyed_db_1.default(Utils.waChatUniqueKey, value => value.jid);
        this.contacts = {};
        /** Data structure of tokens & IDs used to establish one's identiy to WhatsApp Web */
        this.authInfo = null;
        /** The websocket connection */
        this.conn = null;
        this.msgCount = 0;
        this.callbacks = {};
        this.encoder = new Encoder_1.default();
        this.decoder = new Decoder_1.default();
        this.pendingRequests = [];
        this.referenceDate = new Date(); // used for generating tags
        this.lastSeen = null; // last keep alive received
        this.lastDisconnectTime = null;
        /**
         * Does a fetch request with the configuration of the connection
         */
        this.fetchRequest = (endpoint, method = 'GET', body) => (node_fetch_1.default(endpoint, {
            method,
            body,
            headers: { Origin: Constants_1.DEFAULT_ORIGIN },
            agent: this.connectOptions.agent
        }));
        this.registerCallback(['Cmd', 'type:disconnect'], json => (this.unexpectedDisconnect(json[1].kind || 'unknown')));
    }
    /**
     * Connect to WhatsAppWeb
     * @param options the connect options
     */
    async connect() {
        return null;
    }
    async unexpectedDisconnect(error) {
        const willReconnect = (this.autoReconnect === Constants_1.ReconnectMode.onAllErrors ||
            (this.autoReconnect === Constants_1.ReconnectMode.onConnectionLost && error !== Constants_1.DisconnectReason.replaced)) &&
            error !== Constants_1.DisconnectReason.invalidSession; // do not reconnect if credentials have been invalidated
        this.closeInternal(error, willReconnect);
        willReconnect && this.connect();
    }
    /**
     * base 64 encode the authentication credentials and return them
     * these can then be used to login again by passing the object to the connect () function.
     * @see connect () in WhatsAppWeb.Session
     */
    base64EncodedAuthInfo() {
        return {
            clientID: this.authInfo.clientID,
            serverToken: this.authInfo.serverToken,
            clientToken: this.authInfo.clientToken,
            encKey: this.authInfo.encKey.toString('base64'),
            macKey: this.authInfo.macKey.toString('base64'),
        };
    }
    /** Clear authentication info so a new connection can be created */
    clearAuthInfo() {
        this.authInfo = null;
        return this;
    }
    /**
     * Load in the authentication credentials
     * @param authInfo the authentication credentials or file path to auth credentials
     */
    loadAuthInfo(authInfo) {
        if (!authInfo)
            throw new Error('given authInfo is null');
        if (typeof authInfo === 'string') {
            this.log(`loading authentication credentials from ${authInfo}`, Constants_1.MessageLogLevel.info);
            const file = fs.readFileSync(authInfo, { encoding: 'utf-8' }); // load a closed session back if it exists
            authInfo = JSON.parse(file);
        }
        if ('clientID' in authInfo) {
            this.authInfo = {
                clientID: authInfo.clientID,
                serverToken: authInfo.serverToken,
                clientToken: authInfo.clientToken,
                encKey: Buffer.isBuffer(authInfo.encKey) ? authInfo.encKey : Buffer.from(authInfo.encKey, 'base64'),
                macKey: Buffer.isBuffer(authInfo.macKey) ? authInfo.macKey : Buffer.from(authInfo.macKey, 'base64'),
            };
        }
        else {
            const secretBundle = typeof authInfo.WASecretBundle === 'string' ? JSON.parse(authInfo.WASecretBundle) : authInfo.WASecretBundle;
            this.authInfo = {
                clientID: authInfo.WABrowserId.replace(/\"/g, ''),
                serverToken: authInfo.WAToken2.replace(/\"/g, ''),
                clientToken: authInfo.WAToken1.replace(/\"/g, ''),
                encKey: Buffer.from(secretBundle.encKey, 'base64'),
                macKey: Buffer.from(secretBundle.macKey, 'base64'),
            };
        }
        return this;
    }
    /**
     * Register for a callback for a certain function
     * @param parameters name of the function along with some optional specific parameters
     */
    registerCallback(parameters, callback) {
        if (typeof parameters === 'string') {
            return this.registerCallback([parameters, null, null], callback);
        }
        if (!Array.isArray(parameters)) {
            throw new Error('parameters (' + parameters + ') must be a string or array');
        }
        const func = 'function:' + parameters[0];
        const key = parameters[1] || '';
        const key2 = parameters[2] || '';
        if (!this.callbacks[func]) {
            this.callbacks[func] = {};
        }
        if (!this.callbacks[func][key]) {
            this.callbacks[func][key] = {};
        }
        this.callbacks[func][key][key2] = callback;
    }
    /**
     * Cancel all further callback events associated with the given parameters
     * @param parameters name of the function along with some optional specific parameters
     */
    deregisterCallback(parameters) {
        if (typeof parameters === 'string') {
            return this.deregisterCallback([parameters]);
        }
        if (!Array.isArray(parameters)) {
            throw new Error('parameters (' + parameters + ') must be a string or array');
        }
        const func = 'function:' + parameters[0];
        const key = parameters[1] || '';
        const key2 = parameters[2] || '';
        if (this.callbacks[func] && this.callbacks[func][key] && this.callbacks[func][key][key2]) {
            delete this.callbacks[func][key][key2];
            return;
        }
        this.log('WARNING: could not find ' + JSON.stringify(parameters) + ' to deregister', Constants_1.MessageLogLevel.info);
    }
    /**
     * Wait for a message with a certain tag to be received
     * @param tag the message tag to await
     * @param json query that was sent
     * @param timeoutMs timeout after which the promise will reject
     */
    async waitForMessage(tag, json = null, timeoutMs = null) {
        let promise = Utils.promiseTimeout(timeoutMs, (resolve, reject) => (this.callbacks[tag] = { queryJSON: json, callback: resolve, errCallback: reject }))
            .catch((err) => {
            delete this.callbacks[tag];
            throw err;
        });
        return promise;
    }
    /** Generic function for action, set queries */
    async setQuery(nodes, binaryTags = [Constants_1.WAMetric.group, Constants_1.WAFlag.ignore], tag) {
        const json = ['action', { epoch: this.msgCount.toString(), type: 'set' }, nodes];
        const result = await this.query({ json, binaryTags, tag, expect200: true });
        return result;
    }
    /**
     * Query something from the WhatsApp servers
     * @param json the query itself
     * @param binaryTags the tags to attach if the query is supposed to be sent encoded in binary
     * @param timeoutMs timeout after which the query will be failed (set to null to disable a timeout)
     * @param tag the tag to attach to the message
     * recieved JSON
     */
    async query({ json, binaryTags, tag, timeoutMs, expect200, waitForOpen, longTag }) {
        waitForOpen = typeof waitForOpen === 'undefined' ? true : waitForOpen;
        if (waitForOpen)
            await this.waitForConnection();
        if (binaryTags)
            tag = await this.sendBinary(json, binaryTags, tag, longTag);
        else
            tag = await this.sendJSON(json, tag, longTag);
        const response = await this.waitForMessage(tag, json, timeoutMs);
        if (expect200 && response.status && Math.floor(+response.status / 100) !== 2) {
            // read here: http://getstatuscode.com/599
            if (response.status === 599) {
                this.unexpectedDisconnect(Constants_1.DisconnectReason.badSession);
                const response = await this.query({ json, binaryTags, tag, timeoutMs, expect200, waitForOpen });
                return response;
            }
            const message = http_1.STATUS_CODES[response.status] || 'unknown';
            throw new Constants_1.BaileysError(`Unexpected status in '${json[0] || 'generic query'}': ${http_1.STATUS_CODES[response.status]}(${response.status})`, { query: json, message, status: response.status });
        }
        return response;
    }
    /**
     * Send a binary encoded message
     * @param json the message to encode & send
     * @param tags the binary tags to tell WhatsApp what the message is all about
     * @param tag the tag to attach to the message
     * @return the message tag
     */
    sendBinary(json, tags, tag = null, longTag = false) {
        const binary = this.encoder.write(json); // encode the JSON to the WhatsApp binary format
        let buff = Utils.aesEncrypt(binary, this.authInfo.encKey); // encrypt it using AES and our encKey
        const sign = Utils.hmacSign(buff, this.authInfo.macKey); // sign the message using HMAC and our macKey
        tag = tag || this.generateMessageTag(longTag);
        buff = Buffer.concat([
            Buffer.from(tag + ','),
            Buffer.from(tags),
            sign,
            buff,
        ]);
        this.send(buff); // send it off
        return tag;
    }
    /**
     * Send a plain JSON message to the WhatsApp servers
     * @param json the message to send
     * @param tag the tag to attach to the message
     * @return the message tag
     */
    sendJSON(json, tag = null, longTag = false) {
        tag = tag || this.generateMessageTag(longTag);
        this.send(`${tag},${JSON.stringify(json)}`);
        return tag;
    }
    /** Send some message to the WhatsApp servers */
    send(m) {
        this.msgCount += 1; // increment message count, it makes the 'epoch' field when sending binary messages
        return this.conn.send(m);
    }
    async waitForConnection() {
        if (this.state === 'open')
            return;
        await Utils.promiseTimeout(this.pendingRequestTimeoutMs, (resolve, reject) => this.pendingRequests.push({ resolve, reject }));
    }
    /**
     * Disconnect from the phone. Your auth credentials become invalid after sending a disconnect request.
     * @see close() if you just want to close the connection
     */
    async logout() {
        this.authInfo = null;
        if (this.state === 'open') {
            //throw new Error("You're not even connected, you can't log out")
            await new Promise(resolve => this.conn.send('goodbye,["admin","Conn","disconnect"]', null, resolve));
        }
        this.user = null;
        this.close();
    }
    /** Close the connection to WhatsApp Web */
    close() {
        this.closeInternal(Constants_1.DisconnectReason.intentional);
    }
    closeInternal(reason, isReconnecting = false) {
        this.log(`closed connection, reason ${reason}${isReconnecting ? ', reconnecting in a few seconds...' : ''}`, Constants_1.MessageLogLevel.info);
        this.qrTimeout && clearTimeout(this.qrTimeout);
        this.keepAliveReq && clearInterval(this.keepAliveReq);
        this.state = 'close';
        this.msgCount = 0;
        this.phoneConnected = false;
        this.lastDisconnectReason = reason;
        this.lastDisconnectTime = new Date();
        this.endConnection();
        if (reason === 'invalid_session' || reason === 'intentional') {
            this.pendingRequests.forEach(({ reject }) => reject(new Error(reason)));
            this.pendingRequests = [];
        }
        // reconnecting if the timeout is active for the reconnect loop
        this.emit('close', { reason, isReconnecting });
    }
    endConnection() {
        var _a, _b, _c;
        (_a = this.conn) === null || _a === void 0 ? void 0 : _a.removeAllListeners('close');
        (_b = this.conn) === null || _b === void 0 ? void 0 : _b.removeAllListeners('message');
        //this.conn?.close ()
        (_c = this.conn) === null || _c === void 0 ? void 0 : _c.terminate();
        this.conn = null;
        this.lastSeen = null;
        Object.keys(this.callbacks).forEach(key => {
            if (!key.includes('function:')) {
                this.log(`cancelling message wait: ${key}`, Constants_1.MessageLogLevel.info);
                this.callbacks[key].errCallback(new Error('close'));
                delete this.callbacks[key];
            }
        });
    }
    generateMessageTag(longTag = false) {
        const seconds = Utils.unixTimestampSeconds(this.referenceDate);
        return `${longTag ? seconds : (seconds % 1000)}.--${this.msgCount}`;
    }
    log(text, level) {
        (this.logLevel >= level) && console.log(`[Baileys][${new Date().toLocaleString()}] ${text}`);
    }
}
exports.WAConnection = WAConnection;
