"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WAConnection = void 0;
const _7_MessagesExtra_1 = require("./7.MessagesExtra");
const Constants_1 = require("../WAConnection/Constants");
const Utils_1 = require("../WAConnection/Utils");
class WAConnection extends _7_MessagesExtra_1.WAConnection {
    constructor() {
        super(...arguments);
        /** Get the metadata of the group */
        this.groupMetadata = (jid) => this.query({ json: ['query', 'GroupMetadata', jid], expect200: true });
        /** Get the metadata (works after you've left the group also) */
        this.groupMetadataMinimal = async (jid) => {
            const query = ['query', { type: 'group', jid: jid, epoch: this.msgCount.toString() }, null];
            const response = await this.query({ json: query, binaryTags: [Constants_1.WAMetric.group, Constants_1.WAFlag.ignore], expect200: true });
            const json = response[2][0];
            const creatorDesc = json[1];
            const participants = json[2] ? json[2].filter(item => item[0] === 'participant') : [];
            const description = json[2] ? json[2].find(item => item[0] === 'description') : null;
            return {
                id: jid,
                owner: creatorDesc === null || creatorDesc === void 0 ? void 0 : creatorDesc.creator,
                creator: creatorDesc === null || creatorDesc === void 0 ? void 0 : creatorDesc.creator,
                creation: parseInt(creatorDesc === null || creatorDesc === void 0 ? void 0 : creatorDesc.create),
                subject: null,
                desc: description ? description[2].toString('utf-8') : null,
                participants: participants.map(item => ({ id: item[1].jid, isAdmin: item[1].type === 'admin' }))
            };
        };
        /**
         * Create a group
         * @param title like, the title of the group
         * @param participants people to include in the group
         */
        this.groupCreate = async (title, participants) => {
            const response = await this.groupQuery('create', null, title, participants);
            await this.chatAdd(response.gid, title);
            return response;
        };
        /**
         * Leave a group
         * @param jid the ID of the group
         */
        this.groupLeave = async (jid) => {
            const response = await this.groupQuery('leave', jid);
            const chat = this.chats.get(jid);
            if (chat)
                chat.read_only = 'true';
            return response;
        };
        /**
         * Update the subject of the group
         * @param {string} jid the ID of the group
         * @param {string} title the new title of the group
         */
        this.groupUpdateSubject = async (jid, title) => {
            const chat = this.chats.get(jid);
            if ((chat === null || chat === void 0 ? void 0 : chat.name) === title)
                throw new Error('redundant change');
            const response = await this.groupQuery('subject', jid, title);
            if (chat)
                chat.name = title;
            return response;
        };
        /**
         * Update the group description
         * @param {string} jid the ID of the group
         * @param {string} title the new title of the group
         */
        this.groupUpdateDescription = async (jid, description) => {
            const metadata = await this.groupMetadata(jid);
            const node = [
                'description',
                { id: Utils_1.generateMessageID(), prev: metadata === null || metadata === void 0 ? void 0 : metadata.descId },
                Buffer.from(description, 'utf-8')
            ];
            const response = await this.groupQuery('description', jid, null, null, [node]);
            return response;
        };
        /**
         * Add somebody to the group
         * @param jid the ID of the group
         * @param participants the people to add
         */
        this.groupAdd = (jid, participants) => this.groupQuery('add', jid, null, participants);
        /**
         * Remove somebody from the group
         * @param jid the ID of the group
         * @param participants the people to remove
         */
        this.groupRemove = (jid, participants) => this.groupQuery('remove', jid, null, participants);
        /**
         * Make someone admin on the group
         * @param jid the ID of the group
         * @param participants the people to make admin
         */
        this.groupMakeAdmin = (jid, participants) => this.groupQuery('promote', jid, null, participants);
        /**
         * Make demote an admin on the group
         * @param jid the ID of the group
         * @param participants the people to make admin
         */
        this.groupDemoteAdmin = (jid, participants) => this.groupQuery('demote', jid, null, participants);
        /**
         * Make demote an admin on the group
         * @param jid the ID of the group
         * @param participants the people to make admin
         */
        this.groupSettingChange = (jid, setting, onlyAdmins) => {
            const node = [setting, { value: onlyAdmins ? 'true' : 'false' }, null];
            return this.groupQuery('prop', jid, null, null, [node]);
        };
    }
    /** Generic function for group queries */
    async groupQuery(type, jid, subject, participants, additionalNodes) {
        const tag = this.generateMessageTag();
        const json = [
            'group',
            {
                author: this.user.jid,
                id: tag,
                type: type,
                jid: jid,
                subject: subject,
            },
            participants ? participants.map(jid => ['participant', { jid }, null]) : additionalNodes,
        ];
        const result = await this.setQuery([json], [Constants_1.WAMetric.group, 136], tag);
        return result;
    }
    /** Get the invite link of the given group */
    async groupInviteCode(jid) {
        const json = ['query', 'inviteCode', jid];
        const response = await this.query({ json, expect200: true });
        return response.code;
    }
}
exports.WAConnection = WAConnection;
