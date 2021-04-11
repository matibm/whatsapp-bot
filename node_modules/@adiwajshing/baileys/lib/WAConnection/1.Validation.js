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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WAConnection = void 0;
const Curve = __importStar(require("curve25519-js"));
const Utils = __importStar(require("./Utils"));
const _0_Base_1 = require("./0.Base");
const Constants_1 = require("./Constants");
class WAConnection extends _0_Base_1.WAConnection {
    /** Authenticate the connection */
    async authenticate(reconnect) {
        var _a, _b, _c;
        // if no auth info is present, that is, a new session has to be established
        // generate a client ID
        if (!((_a = this.authInfo) === null || _a === void 0 ? void 0 : _a.clientID)) {
            this.authInfo = { clientID: Utils.generateClientID() };
        }
        const canLogin = ((_b = this.authInfo) === null || _b === void 0 ? void 0 : _b.encKey) && ((_c = this.authInfo) === null || _c === void 0 ? void 0 : _c.macKey);
        this.referenceDate = new Date(); // refresh reference date
        const initQueries = [
            (async () => {
                var _a;
                const { ref } = await this.query({
                    json: ['admin', 'init', this.version, this.browserDescription, (_a = this.authInfo) === null || _a === void 0 ? void 0 : _a.clientID, true],
                    expect200: true,
                    waitForOpen: false,
                    longTag: true
                });
                if (!canLogin) {
                    const result = await this.generateKeysForAuth(ref);
                    return result;
                }
            })()
        ];
        if (canLogin) {
            // if we have the info to restore a closed session
            initQueries.push((async () => {
                var _a, _b, _c, _d;
                const json = [
                    'admin',
                    'login',
                    (_a = this.authInfo) === null || _a === void 0 ? void 0 : _a.clientToken,
                    (_b = this.authInfo) === null || _b === void 0 ? void 0 : _b.serverToken,
                    (_c = this.authInfo) === null || _c === void 0 ? void 0 : _c.clientID,
                ];
                if (reconnect)
                    json.push(...['reconnect', reconnect.replace('@s.whatsapp.net', '@c.us')]);
                else
                    json.push('takeover');
                let response = await this.query({ json, tag: 's1', waitForOpen: false, expect200: true, longTag: true }); // wait for response with tag "s1"
                // if its a challenge request (we get it when logging in)
                if ((_d = response[1]) === null || _d === void 0 ? void 0 : _d.challenge) {
                    await this.respondToChallenge(response[1].challenge);
                    response = await this.waitForMessage('s2', []);
                }
                return response;
            })());
        }
        const validationJSON = (await Promise.all(initQueries)).slice(-1)[0]; // get the last result
        this.user = await this.validateNewConnection(validationJSON[1]); // validate the connection
        this.log('validated connection successfully', Constants_1.MessageLogLevel.info);
        const response = await this.query({ json: ['query', 'ProfilePicThumb', this.user.jid], waitForOpen: false, expect200: false });
        this.user.imgUrl = (response === null || response === void 0 ? void 0 : response.eurl) || '';
        this.sendPostConnectQueries();
        this.log('sent init queries', Constants_1.MessageLogLevel.info);
    }
    /**
     * Send the same queries WA Web sends after connect
     */
    sendPostConnectQueries() {
        this.sendBinary(['query', { type: 'contacts', epoch: '1' }, null], [Constants_1.WAMetric.queryContact, Constants_1.WAFlag.ignore]);
        this.sendBinary(['query', { type: 'chat', epoch: '1' }, null], [Constants_1.WAMetric.queryChat, Constants_1.WAFlag.ignore]);
        this.sendBinary(['query', { type: 'status', epoch: '1' }, null], [Constants_1.WAMetric.queryStatus, Constants_1.WAFlag.ignore]);
        this.sendBinary(['query', { type: 'quick_reply', epoch: '1' }, null], [Constants_1.WAMetric.queryQuickReply, Constants_1.WAFlag.ignore]);
        this.sendBinary(['query', { type: 'label', epoch: '1' }, null], [Constants_1.WAMetric.queryLabel, Constants_1.WAFlag.ignore]);
        this.sendBinary(['query', { type: 'emoji', epoch: '1' }, null], [Constants_1.WAMetric.queryEmoji, Constants_1.WAFlag.ignore]);
        this.sendBinary(['action', { type: 'set', epoch: '1' }, [['presence', { type: Constants_1.Presence.available }, null]]], [Constants_1.WAMetric.presence, 160]);
    }
    /**
     * Refresh QR Code
     * @returns the new ref
     */
    async generateNewQRCodeRef() {
        const response = await this.query({ json: ['admin', 'Conn', 'reref'], expect200: true, waitForOpen: false, longTag: true });
        return response.ref;
    }
    /**
     * Once the QR code is scanned and we can validate our connection, or we resolved the challenge when logging back in
     * @private
     * @param {object} json
     */
    validateNewConnection(json) {
        // set metadata: one's WhatsApp ID [cc][number]@s.whatsapp.net, name on WhatsApp, info about the phone
        const onValidationSuccess = () => ({
            jid: Utils.whatsappID(json.wid),
            name: json.pushname,
            phone: json.phone,
            imgUrl: null
        });
        if (!json.secret) {
            // if we didn't get a secret, we don't need it, we're validated
            return onValidationSuccess();
        }
        const secret = Buffer.from(json.secret, 'base64');
        if (secret.length !== 144) {
            throw new Error('incorrect secret length received: ' + secret.length);
        }
        // generate shared key from our private key & the secret shared by the server
        const sharedKey = Curve.sharedKey(this.curveKeys.private, secret.slice(0, 32));
        // expand the key to 80 bytes using HKDF
        const expandedKey = Utils.hkdf(sharedKey, 80);
        // perform HMAC validation.
        const hmacValidationKey = expandedKey.slice(32, 64);
        const hmacValidationMessage = Buffer.concat([secret.slice(0, 32), secret.slice(64, secret.length)]);
        const hmac = Utils.hmacSign(hmacValidationMessage, hmacValidationKey);
        if (!hmac.equals(secret.slice(32, 64))) {
            // if the checksums didn't match
            throw new Constants_1.BaileysError('HMAC validation failed', json);
        }
        // computed HMAC should equal secret[32:64]
        // expandedKey[64:] + secret[64:] are the keys, encrypted using AES, that are used to encrypt/decrypt the messages recieved from WhatsApp
        // they are encrypted using key: expandedKey[0:32]
        const encryptedAESKeys = Buffer.concat([
            expandedKey.slice(64, expandedKey.length),
            secret.slice(64, secret.length),
        ]);
        const decryptedKeys = Utils.aesDecrypt(encryptedAESKeys, expandedKey.slice(0, 32));
        // set the credentials
        this.authInfo = {
            encKey: decryptedKeys.slice(0, 32),
            macKey: decryptedKeys.slice(32, 64),
            clientToken: json.clientToken,
            serverToken: json.serverToken,
            clientID: this.authInfo.clientID,
        };
        return onValidationSuccess();
    }
    /**
     * When logging back in (restoring a previously closed session), WhatsApp may challenge one to check if one still has the encryption keys
     * WhatsApp does that by asking for us to sign a string it sends with our macKey
     */
    respondToChallenge(challenge) {
        const bytes = Buffer.from(challenge, 'base64'); // decode the base64 encoded challenge string
        const signed = Utils.hmacSign(bytes, this.authInfo.macKey).toString('base64'); // sign the challenge string with our macKey
        const json = ['admin', 'challenge', signed, this.authInfo.serverToken, this.authInfo.clientID]; // prepare to send this signed string with the serverToken & clientID
        this.log('resolving login challenge', Constants_1.MessageLogLevel.info);
        return this.query({ json, expect200: true, waitForOpen: false });
    }
    /** When starting a new session, generate a QR code by generating a private/public key pair & the keys the server sends */
    async generateKeysForAuth(ref) {
        this.curveKeys = Curve.generateKeyPair(Utils.randomBytes(32));
        const publicKey = Buffer.from(this.curveKeys.public).toString('base64');
        const emitQR = () => {
            const qr = [ref, publicKey, this.authInfo.clientID].join(',');
            this.emit('qr', qr);
        };
        const regenQR = () => {
            this.qrTimeout = setTimeout(() => {
                if (this.state === 'open')
                    return;
                this.log('regenerated QR', Constants_1.MessageLogLevel.info);
                this.generateNewQRCodeRef()
                    .then(newRef => ref = newRef)
                    .then(emitQR)
                    .then(regenQR)
                    .catch(err => this.log(`error in QR gen: ${err}`, Constants_1.MessageLogLevel.info));
            }, this.regenerateQRIntervalMs);
        };
        emitQR();
        if (this.regenerateQRIntervalMs)
            regenQR();
        const json = await this.waitForMessage('s1', []);
        this.qrTimeout && clearTimeout(this.qrTimeout);
        this.qrTimeout = null;
        return json;
    }
}
exports.WAConnection = WAConnection;
