/// <reference types="node" />
import { WAConnection as Base } from './4.Events';
import { Presence, WABroadcastListInfo, WAProfilePictureChange, WAChat, ChatModification } from './Constants';
import { WAMessage } from '../WAConnection/Constants';
export declare class WAConnection extends Base {
    /** Query whether a given number is registered on WhatsApp */
    isOnWhatsApp: (jid: string) => any;
    /**
     * Tell someone about your presence -- online, typing, offline etc.
     * @param jid the ID of the person/group who you are updating
     * @param type your presence
     */
    updatePresence: (jid: string | null, type: Presence) => Promise<{
        status: number;
    }>;
    /** Request an update on the presence of a user */
    requestPresenceUpdate: (jid: string) => Promise<any>;
    /** Query the status of the person (see groupMetadata() for groups) */
    getStatus(jid?: string): Promise<{
        status: string;
    }>;
    setStatus(status: string): Promise<{
        status: number;
    }>;
    /** Get your contacts */
    getContacts(): Promise<any>;
    /** Get the stories of your contacts */
    getStories(): Promise<{
        unread: number;
        count: number;
        messages: WAMessage[];
    }[]>;
    /** Fetch your chats */
    getChats(): Promise<any>;
    /** Query broadcast list info */
    getBroadcastListInfo(jid: string): Promise<WABroadcastListInfo>;
    /** Delete the chat of a given ID */
    deleteChat(jid: string): Promise<{
        status: number;
    }>;
    /**
     * Load chats in a paginated manner + gets the profile picture
     * @param before chats before the given cursor
     * @param count number of results to return
     * @param searchString optionally search for users
     * @returns the chats & the cursor to fetch the next page
     */
    loadChats(count: number, before: number | null, filters?: {
        searchString?: string;
        custom?: (c: WAChat) => boolean;
    }): Promise<{
        chats: WAChat[];
        cursor: number;
    }>;
    /**
     * Update the profile picture
     * @param jid
     * @param img
     */
    updateProfilePicture(jid: string, img: Buffer): Promise<WAProfilePictureChange>;
    /**
     * Modify a given chat (archive, pin etc.)
     * @param jid the ID of the person/group you are modifiying
     * @param durationMs only for muting, how long to mute the chat for
     */
    modifyChat(jid: string, type: ChatModification, durationMs?: number): Promise<{
        status: number;
    }>;
}
