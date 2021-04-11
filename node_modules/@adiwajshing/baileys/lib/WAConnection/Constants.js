"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MimetypeMap = exports.MediaPathMap = exports.GroupSettingChange = exports.Mimetype = exports.HKDFInfoKeys = exports.ChatModification = exports.MessageType = exports.Presence = exports.WAFlag = exports.STORIES_JID = exports.WAMetric = exports.MessageLogLevel = exports.DisconnectReason = exports.UNAUTHORIZED_CODES = exports.ReconnectMode = exports.CancelledError = exports.TimedOutError = exports.BaileysError = exports.WA_MESSAGE_STUB_TYPES = exports.WA_MESSAGE_STATUS_TYPE = exports.WA_MESSAGE_STUB_TYPE = exports.WAMessageProto = exports.KEEP_ALIVE_INTERVAL_MS = exports.DEFAULT_ORIGIN = exports.WS_URL = void 0;
const WAMessage_1 = require("../../WAMessage/WAMessage");
Object.defineProperty(exports, "WAMessageProto", { enumerable: true, get: function () { return WAMessage_1.proto; } });
exports.WS_URL = 'wss://web.whatsapp.com/ws';
exports.DEFAULT_ORIGIN = 'https://web.whatsapp.com';
exports.KEEP_ALIVE_INTERVAL_MS = 20 * 1000;
exports.WA_MESSAGE_STUB_TYPE = WAMessage_1.proto.WebMessageInfo.WEB_MESSAGE_INFO_STUBTYPE;
exports.WA_MESSAGE_STATUS_TYPE = WAMessage_1.proto.WebMessageInfo.WEB_MESSAGE_INFO_STATUS;
/** Reverse stub type dictionary */
exports.WA_MESSAGE_STUB_TYPES = function () {
    const types = exports.WA_MESSAGE_STUB_TYPE;
    const dict = {};
    Object.keys(types).forEach(element => dict[types[element]] = element);
    return dict;
}();
class BaileysError extends Error {
    constructor(message, context) {
        super(message);
        this.name = 'BaileysError';
        this.status = context.status;
        this.context = context;
    }
}
exports.BaileysError = BaileysError;
exports.TimedOutError = () => new BaileysError('timed out', { status: 408 });
exports.CancelledError = () => new BaileysError('cancelled', { status: 500 });
var ReconnectMode;
(function (ReconnectMode) {
    /** does not reconnect */
    ReconnectMode[ReconnectMode["off"] = 0] = "off";
    /** reconnects only when the connection is 'lost' or 'close' */
    ReconnectMode[ReconnectMode["onConnectionLost"] = 1] = "onConnectionLost";
    /** reconnects on all disconnects, including take overs */
    ReconnectMode[ReconnectMode["onAllErrors"] = 2] = "onAllErrors";
})(ReconnectMode = exports.ReconnectMode || (exports.ReconnectMode = {}));
exports.UNAUTHORIZED_CODES = [401, 419];
/** Types of Disconnect Reasons */
var DisconnectReason;
(function (DisconnectReason) {
    /** The connection was closed intentionally */
    DisconnectReason["intentional"] = "intentional";
    /** The connection was terminated either by the client or server */
    DisconnectReason["close"] = "close";
    /** The connection was lost, called when the server stops responding to requests */
    DisconnectReason["lost"] = "lost";
    /** When WA Web is opened elsewhere & this session is disconnected */
    DisconnectReason["replaced"] = "replaced";
    /** The credentials for the session have been invalidated, i.e. logged out either from the phone or WA Web */
    DisconnectReason["invalidSession"] = "invalid_session";
    /** Received a 500 result in a query -- something has gone very wrong */
    DisconnectReason["badSession"] = "bad_session";
    /** No idea, can be a sign of log out too */
    DisconnectReason["unknown"] = "unknown";
    /** Well, the connection timed out */
    DisconnectReason["timedOut"] = "timed out";
})(DisconnectReason = exports.DisconnectReason || (exports.DisconnectReason = {}));
var MessageLogLevel;
(function (MessageLogLevel) {
    MessageLogLevel[MessageLogLevel["none"] = 0] = "none";
    MessageLogLevel[MessageLogLevel["info"] = 1] = "info";
    MessageLogLevel[MessageLogLevel["unhandled"] = 2] = "unhandled";
    MessageLogLevel[MessageLogLevel["all"] = 3] = "all";
})(MessageLogLevel = exports.MessageLogLevel || (exports.MessageLogLevel = {}));
var WAMetric;
(function (WAMetric) {
    WAMetric[WAMetric["debugLog"] = 1] = "debugLog";
    WAMetric[WAMetric["queryResume"] = 2] = "queryResume";
    WAMetric[WAMetric["liveLocation"] = 3] = "liveLocation";
    WAMetric[WAMetric["queryMedia"] = 4] = "queryMedia";
    WAMetric[WAMetric["queryChat"] = 5] = "queryChat";
    WAMetric[WAMetric["queryContact"] = 6] = "queryContact";
    WAMetric[WAMetric["queryMessages"] = 7] = "queryMessages";
    WAMetric[WAMetric["presence"] = 8] = "presence";
    WAMetric[WAMetric["presenceSubscribe"] = 9] = "presenceSubscribe";
    WAMetric[WAMetric["group"] = 10] = "group";
    WAMetric[WAMetric["read"] = 11] = "read";
    WAMetric[WAMetric["chat"] = 12] = "chat";
    WAMetric[WAMetric["received"] = 13] = "received";
    WAMetric[WAMetric["picture"] = 14] = "picture";
    WAMetric[WAMetric["status"] = 15] = "status";
    WAMetric[WAMetric["message"] = 16] = "message";
    WAMetric[WAMetric["queryActions"] = 17] = "queryActions";
    WAMetric[WAMetric["block"] = 18] = "block";
    WAMetric[WAMetric["queryGroup"] = 19] = "queryGroup";
    WAMetric[WAMetric["queryPreview"] = 20] = "queryPreview";
    WAMetric[WAMetric["queryEmoji"] = 21] = "queryEmoji";
    WAMetric[WAMetric["queryVCard"] = 29] = "queryVCard";
    WAMetric[WAMetric["queryStatus"] = 30] = "queryStatus";
    WAMetric[WAMetric["queryStatusUpdate"] = 31] = "queryStatusUpdate";
    WAMetric[WAMetric["queryLiveLocation"] = 33] = "queryLiveLocation";
    WAMetric[WAMetric["queryLabel"] = 36] = "queryLabel";
    WAMetric[WAMetric["queryQuickReply"] = 39] = "queryQuickReply";
})(WAMetric = exports.WAMetric || (exports.WAMetric = {}));
exports.STORIES_JID = 'status@broadcast';
var WAFlag;
(function (WAFlag) {
    WAFlag[WAFlag["ignore"] = 128] = "ignore";
    WAFlag[WAFlag["acknowledge"] = 64] = "acknowledge";
    WAFlag[WAFlag["available"] = 32] = "available";
    WAFlag[WAFlag["unavailable"] = 16] = "unavailable";
    WAFlag[WAFlag["expires"] = 8] = "expires";
    WAFlag[WAFlag["skipOffline"] = 4] = "skipOffline";
})(WAFlag = exports.WAFlag || (exports.WAFlag = {}));
/** set of statuses visible to other people; see updatePresence() in WhatsAppWeb.Send */
var Presence;
(function (Presence) {
    Presence["available"] = "available";
    Presence["unavailable"] = "unavailable";
    Presence["composing"] = "composing";
    Presence["recording"] = "recording";
    Presence["paused"] = "paused";
})(Presence = exports.Presence || (exports.Presence = {}));
/** Set of message types that are supported by the library */
var MessageType;
(function (MessageType) {
    MessageType["text"] = "conversation";
    MessageType["extendedText"] = "extendedTextMessage";
    MessageType["contact"] = "contactMessage";
    MessageType["location"] = "locationMessage";
    MessageType["liveLocation"] = "liveLocationMessage";
    MessageType["image"] = "imageMessage";
    MessageType["video"] = "videoMessage";
    MessageType["sticker"] = "stickerMessage";
    MessageType["document"] = "documentMessage";
    MessageType["audio"] = "audioMessage";
    MessageType["product"] = "productMessage";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
var ChatModification;
(function (ChatModification) {
    ChatModification["archive"] = "archive";
    ChatModification["unarchive"] = "unarchive";
    ChatModification["pin"] = "pin";
    ChatModification["unpin"] = "unpin";
    ChatModification["mute"] = "mute";
    ChatModification["unmute"] = "unmute";
})(ChatModification = exports.ChatModification || (exports.ChatModification = {}));
exports.HKDFInfoKeys = {
    [MessageType.image]: 'WhatsApp Image Keys',
    [MessageType.audio]: 'WhatsApp Audio Keys',
    [MessageType.video]: 'WhatsApp Video Keys',
    [MessageType.document]: 'WhatsApp Document Keys',
    [MessageType.sticker]: 'WhatsApp Image Keys'
};
var Mimetype;
(function (Mimetype) {
    Mimetype["jpeg"] = "image/jpeg";
    Mimetype["png"] = "image/png";
    Mimetype["mp4"] = "video/mp4";
    Mimetype["gif"] = "video/gif";
    Mimetype["pdf"] = "application/pdf";
    Mimetype["ogg"] = "audio/ogg; codecs=opus";
    Mimetype["mp4Audio"] = "audio/mp4";
    /** for stickers */
    Mimetype["webp"] = "image/webp";
})(Mimetype = exports.Mimetype || (exports.Mimetype = {}));
var GroupSettingChange;
(function (GroupSettingChange) {
    GroupSettingChange["messageSend"] = "announcement";
    GroupSettingChange["settingsChange"] = "locked";
})(GroupSettingChange = exports.GroupSettingChange || (exports.GroupSettingChange = {}));
// path to upload the media
exports.MediaPathMap = {
    imageMessage: '/mms/image',
    videoMessage: '/mms/video',
    documentMessage: '/mms/document',
    audioMessage: '/mms/audio',
    stickerMessage: '/mms/image',
};
// gives WhatsApp info to process the media
exports.MimetypeMap = {
    imageMessage: Mimetype.jpeg,
    videoMessage: Mimetype.mp4,
    documentMessage: Mimetype.pdf,
    audioMessage: Mimetype.ogg,
    stickerMessage: Mimetype.webp,
};
