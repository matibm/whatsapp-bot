"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WAConnection = void 0;
const _4_Events_1 = require("./4.Events");
const Constants_1 = require("./Constants");
const Constants_2 = require("../WAConnection/Constants");
const Utils_1 = require("./Utils");
const Mutex_1 = require("./Mutex");
// All user related functions -- get profile picture, set status etc.
class WAConnection extends _4_Events_1.WAConnection {
    constructor() {
        super(...arguments);
        /** Query whether a given number is registered on WhatsApp */
        this.isOnWhatsApp = (jid) => this.query({ json: ['query', 'exist', jid] }).then((m) => m.status === 200);
        /**
         * Tell someone about your presence -- online, typing, offline etc.
         * @param jid the ID of the person/group who you are updating
         * @param type your presence
         */
        this.updatePresence = (jid, type) => this.query({
            json: [
                'action',
                { epoch: this.msgCount.toString(), type: 'set' },
                [['presence', { type: type, to: jid }, null]],
            ],
            binaryTags: [Constants_2.WAMetric.group, Constants_2.WAFlag.acknowledge],
            expect200: true
        });
        /** Request an update on the presence of a user */
        this.requestPresenceUpdate = async (jid) => this.query({ json: ['action', 'presence', 'subscribe', jid] });
    }
    /** Query the status of the person (see groupMetadata() for groups) */
    async getStatus(jid) {
        const status = await this.query({ json: ['query', 'Status', jid || this.user.jid] });
        return status;
    }
    async setStatus(status) {
        const response = await this.setQuery([
            [
                'status',
                null,
                Buffer.from(status, 'utf-8')
            ]
        ]);
        this.emit('user-status-update', { jid: this.user.jid, status });
        return response;
    }
    /** Get your contacts */
    async getContacts() {
        const json = ['query', { epoch: this.msgCount.toString(), type: 'contacts' }, null];
        const response = await this.query({ json, binaryTags: [6, Constants_2.WAFlag.ignore], expect200: true }); // this has to be an encrypted query
        return response;
    }
    /** Get the stories of your contacts */
    async getStories() {
        const json = ['query', { epoch: this.msgCount.toString(), type: 'status' }, null];
        const response = await this.query({ json, binaryTags: [30, Constants_2.WAFlag.ignore], expect200: true });
        if (Array.isArray(response[2])) {
            return response[2].map(row => {
                var _a, _b;
                return ({
                    unread: (_a = row[1]) === null || _a === void 0 ? void 0 : _a.unread,
                    count: (_b = row[1]) === null || _b === void 0 ? void 0 : _b.count,
                    messages: Array.isArray(row[2]) ? row[2].map(m => m[2]) : []
                });
            });
        }
        return [];
    }
    /** Fetch your chats */
    async getChats() {
        const json = ['query', { epoch: this.msgCount.toString(), type: 'chat' }, null];
        return this.query({ json, binaryTags: [5, Constants_2.WAFlag.ignore], expect200: true }); // this has to be an encrypted query
    }
    /** Query broadcast list info */
    async getBroadcastListInfo(jid) { return this.query({ json: ['query', 'contact', jid], expect200: true }); }
    /** Delete the chat of a given ID */
    async deleteChat(jid) {
        const response = await this.setQuery([['chat', { type: 'delete', jid: jid }, null]], [12, Constants_2.WAFlag.ignore]);
        const chat = this.chats.get(jid);
        if (chat) {
            this.chats.delete(chat);
            this.emit('chat-update', { jid, delete: 'true' });
        }
        return response;
    }
    /**
     * Load chats in a paginated manner + gets the profile picture
     * @param before chats before the given cursor
     * @param count number of results to return
     * @param searchString optionally search for users
     * @returns the chats & the cursor to fetch the next page
     */
    async loadChats(count, before, filters) {
        const chats = this.chats.paginated(before, count, filters && (chat => {
            var _a, _b;
            return ((typeof (filters === null || filters === void 0 ? void 0 : filters.custom) !== 'function' || (filters === null || filters === void 0 ? void 0 : filters.custom(chat))) &&
                (typeof (filters === null || filters === void 0 ? void 0 : filters.searchString) === 'undefined' || ((_a = chat.name) === null || _a === void 0 ? void 0 : _a.includes(filters.searchString)) || ((_b = chat.jid) === null || _b === void 0 ? void 0 : _b.startsWith(filters.searchString))));
        }));
        await Promise.all(chats.map(async (chat) => (chat.imgUrl === undefined && await this.setProfilePicture(chat))));
        const cursor = (chats[chats.length - 1] && chats.length >= count) ? Utils_1.waChatUniqueKey(chats[chats.length - 1]) : null;
        return { chats, cursor };
    }
    /**
     * Update the profile picture
     * @param jid
     * @param img
     */
    async updateProfilePicture(jid, img) {
        jid = Utils_1.whatsappID(jid);
        const data = await Utils_1.generateProfilePicture(img);
        const tag = this.generateMessageTag();
        const query = [
            'picture',
            { jid: jid, id: tag, type: 'set' },
            [
                ['image', null, data.img],
                ['preview', null, data.preview]
            ]
        ];
        const response = await this.setQuery([query], [Constants_2.WAMetric.picture, 136], tag);
        if (jid === this.user.jid)
            this.user.imgUrl = response.eurl;
        else if (this.chats.get(jid)) {
            this.chats.get(jid).imgUrl = response.eurl;
            this.emit('chat-update', { jid, imgUrl: response.eurl });
        }
        return response;
    }
    /**
     * Modify a given chat (archive, pin etc.)
     * @param jid the ID of the person/group you are modifiying
     * @param durationMs only for muting, how long to mute the chat for
     */
    async modifyChat(jid, type, durationMs) {
        jid = Utils_1.whatsappID(jid);
        const chat = this.assertChatGet(jid);
        let chatAttrs = { jid: jid };
        if (type === Constants_1.ChatModification.mute && !durationMs) {
            throw new Error('duration must be set to the timestamp of the time of pinning/unpinning of the chat');
        }
        durationMs = durationMs || 0;
        switch (type) {
            case Constants_1.ChatModification.pin:
            case Constants_1.ChatModification.mute:
                const strStamp = (Utils_1.unixTimestampSeconds() + Math.floor(durationMs / 1000)).toString();
                chatAttrs.type = type;
                chatAttrs[type] = strStamp;
                break;
            case Constants_1.ChatModification.unpin:
            case Constants_1.ChatModification.unmute:
                chatAttrs.type = type.replace('un', ''); // replace 'unpin' with 'pin'
                chatAttrs.previous = chat[type.replace('un', '')];
                break;
            default:
                chatAttrs.type = type;
                break;
        }
        const response = await this.setQuery([['chat', chatAttrs, null]]);
        if (chat) {
            if (type.includes('un')) {
                type = type.replace('un', '');
                delete chat[type.replace('un', '')];
                this.emit('chat-update', { jid, [type]: false });
            }
            else {
                chat[type] = chatAttrs[type] || 'true';
                this.emit('chat-update', { jid, [type]: chat[type] });
            }
        }
        return response;
    }
}
__decorate([
    Mutex_1.Mutex(jid => jid)
], WAConnection.prototype, "updateProfilePicture", null);
__decorate([
    Mutex_1.Mutex((jid, type) => jid + type)
], WAConnection.prototype, "modifyChat", null);
exports.WAConnection = WAConnection;
