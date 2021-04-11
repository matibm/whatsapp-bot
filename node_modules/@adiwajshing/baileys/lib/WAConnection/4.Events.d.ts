import { WAConnection as Base } from './3.Connect';
import { WAMessageStatusUpdate, WAMessage, WAChat, WA_MESSAGE_STATUS_TYPE, PresenceUpdate, BaileysEvent, DisconnectReason, WAOpenResult } from './Constants';
export declare class WAConnection extends Base {
    constructor();
    /** Get the URL to download the profile picture of a person/group */
    getProfilePicture(jid: string | null): Promise<string>;
    protected forwardStatusUpdate(update: WAMessageStatusUpdate): void;
    /** inserts an empty chat into the DB */
    protected chatAdd(jid: string, name?: string): Promise<WAChat>;
    /** find a chat or return an error */
    protected assertChatGet: (jid: any) => WAChat;
    /** Adds the given message to the appropriate chat, if the chat doesn't exist, it is created */
    protected chatAddMessageAppropriate(message: WAMessage): Promise<void>;
    protected chatAddMessage(message: WAMessage, chat: WAChat): void;
    protected chatUpdatedMessage(messageIDs: string[], status: WA_MESSAGE_STATUS_TYPE, chat: WAChat): void;
    protected chatUpdateTime: (chat: any) => void;
    /** sets the profile picture of a chat */
    protected setProfilePicture(chat: WAChat): Promise<void>;
    /** when the connection has opened successfully */
    on(event: 'open', listener: (result: WAOpenResult) => void): this;
    /** when the connection is opening */
    on(event: 'connecting', listener: () => void): this;
    /** when the connection has closed */
    on(event: 'close', listener: (err: {
        reason?: DisconnectReason | string;
        isReconnecting: boolean;
    }) => void): this;
    /** when a new QR is generated, ready for scanning */
    on(event: 'qr', listener: (qr: string) => void): this;
    /** when the connection to the phone changes */
    on(event: 'connection-phone-change', listener: (state: {
        connected: boolean;
    }) => void): this;
    /** when a user's presence is updated */
    on(event: 'user-presence-update', listener: (update: PresenceUpdate) => void): this;
    /** when a user's status is updated */
    on(event: 'user-status-update', listener: (update: {
        jid: string;
        status?: string;
    }) => void): this;
    /** when a new chat is added */
    on(event: 'chat-new', listener: (chat: WAChat) => void): this;
    /** when a chat is updated (archived, deleted, pinned) */
    on(event: 'chat-update', listener: (chat: Partial<WAChat> & {
        jid: string;
    }) => void): this;
    /** when a new message is relayed */
    on(event: 'message-new', listener: (message: WAMessage) => void): this;
    /** when a message object itself is updated (receives its media info or is deleted) */
    on(event: 'message-update', listener: (message: WAMessage) => void): this;
    /** when a message's status is updated (deleted, delivered, read, sent etc.) */
    on(event: 'message-status-update', listener: (message: WAMessageStatusUpdate) => void): this;
    /** when participants are added to a group */
    on(event: 'group-participants-add', listener: (update: {
        jid: string;
        participants: string[];
        actor?: string;
    }) => void): this;
    /** when participants are removed or leave from a group */
    on(event: 'group-participants-remove', listener: (update: {
        jid: string;
        participants: string[];
        actor?: string;
    }) => void): this;
    /** when participants are promoted in a group */
    on(event: 'group-participants-promote', listener: (update: {
        jid: string;
        participants: string[];
        actor?: string;
    }) => void): this;
    /** when participants are demoted in a group */
    on(event: 'group-participants-demote', listener: (update: {
        jid: string;
        participants: string[];
        actor?: string;
    }) => void): this;
    /** when the group settings is updated */
    on(event: 'group-settings-update', listener: (update: {
        jid: string;
        restrict?: string;
        announce?: string;
        actor?: string;
    }) => void): this;
    /** when the group description is updated */
    on(event: 'group-description-update', listener: (update: {
        jid: string;
        description?: string;
        actor?: string;
    }) => void): this;
    /** when WA sends back a pong */
    on(event: 'received-pong', listener: () => void): this;
    emit(event: BaileysEvent, ...args: any[]): boolean;
}
