import { WAConnection as Base } from './6.MessagesSend';
import { WAMessageKey, MessageInfo, WAMessage, WAMessageProto } from './Constants';
export declare class WAConnection extends Base {
    loadAllUnreadMessages(): Promise<WAMessageProto.WebMessageInfo[]>;
    /** Get the message info, who has read it, who its been delivered to */
    messageInfo(jid: string, messageID: string): Promise<MessageInfo>;
    /**
     * Marks a chat as read/unread; updates the chat object too
     * @param jid the ID of the person/group whose message you want to mark read
     * @param unread unreads the chat, if true
     */
    chatRead(jid: string, type?: 'unread' | 'read'): Promise<void>;
    /**
     * Sends a read receipt for a given message;
     * does not update the chat do @see chatRead
     * @param jid the ID of the person/group whose message you want to mark read
     * @param messageKey the key of the message
     * @param count number of messages to read, set to < 0 to unread a message
     */
    sendReadReceipt(jid: string, messageKey: {
        id?: string;
        fromMe?: boolean;
    }, count: number): Promise<{
        status: number;
    }>;
    /**
     * Load the conversation with a group or person
     * @param count the number of messages to load
     * @param before the data for which message to offset the query by
     * @param mostRecentFirst retreive the most recent message first or retreive from the converation start
     */
    loadMessages(jid: string, count: number, before?: {
        id?: string;
        fromMe?: boolean;
    }, mostRecentFirst?: boolean): Promise<{
        messages: WAMessageProto.WebMessageInfo[];
        cursor: any;
    }>;
    /**
     * Load the entire friggin conversation with a group or person
     * @param onMessage callback for every message retreived
     * @param chunkSize the number of messages to load in a single request
     * @param mostRecentFirst retreive the most recent message first or retreive from the converation start
     */
    loadAllMessages(jid: string, onMessage: (m: WAMessage) => void, chunkSize?: number, mostRecentFirst?: boolean): Promise<void>;
    /**
     * Find a message in a given conversation
     * @param chunkSize the number of messages to load in a single request
     * @param onMessage callback for every message retreived, if return true -- the loop will break
     */
    findMessage(jid: string, chunkSize: number, onMessage: (m: WAMessage) => boolean): Promise<void>;
    /**
     * Loads all messages sent after a specific date
     */
    messagesReceivedAfter(date: Date, onlyUnrespondedMessages?: boolean): Promise<WAMessageProto.WebMessageInfo[]>;
    /** Load a single message specified by the ID */
    loadMessage(jid: string, messageID: string): Promise<WAMessageProto.WebMessageInfo>;
    /** Query a string to check if it has a url, if it does, return required extended text message */
    generateLinkPreview(text: string): Promise<WAMessageProto.ExtendedTextMessage>;
    /**
     * Search WhatsApp messages with a given text string
     * @param txt the search string
     * @param inJid the ID of the chat to search in, set to null to search all chats
     * @param count number of results to return
     * @param page page number of results (starts from 1)
     */
    searchMessages(txt: string, inJid: string | null, count: number, page: number): Promise<{
        last: boolean;
        messages: WAMessageProto.WebMessageInfo[];
    }>;
    /**
     * Delete a message in a chat for yourself
     * @param messageKey key of the message you want to delete
     */
    clearMessage(messageKey: WAMessageKey): Promise<{
        status: number;
    }>;
    /**
     * Delete a message in a chat for everyone
     * @param id the person or group where you're trying to delete the message
     * @param messageKey key of the message you want to delete
     */
    deleteMessage(id: string, messageKey: WAMessageKey): Promise<WAMessageProto.WebMessageInfo>;
    /**
     * Forward a message like WA does
     * @param id the id to forward the message to
     * @param message the message to forward
     * @param forceForward will show the message as forwarded even if it is from you
     */
    forwardMessage(id: string, message: WAMessage, forceForward?: boolean): Promise<WAMessageProto.WebMessageInfo>;
}
