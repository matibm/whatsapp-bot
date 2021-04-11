/// <reference types="node" />
import { WAConnection as Base } from './5.User';
import { MessageOptions, MessageType, WALocationMessage, WAContactMessage, WATextMessage, WAMessageContent, WAMessage, WAMessageProto, MediaConnInfo } from './Constants';
export declare class WAConnection extends Base {
    /**
     * Send a message to the given ID (can be group, single, or broadcast)
     * @param id the id to send to
     * @param message the message can be a buffer, plain string, location message, extended text message
     * @param type type of message
     * @param options Extra options
     */
    sendMessage(id: string, message: string | WATextMessage | WALocationMessage | WAContactMessage | Buffer, type: MessageType, options?: MessageOptions): Promise<WAMessageProto.WebMessageInfo>;
    /** Prepares a message for sending via sendWAMessage () */
    prepareMessage(id: string, message: string | WATextMessage | WALocationMessage | WAContactMessage | Buffer, type: MessageType, options?: MessageOptions): Promise<WAMessageProto.WebMessageInfo>;
    /** Prepares the message content */
    prepareMessageContent(message: string | WATextMessage | WALocationMessage | WAContactMessage | Buffer, type: MessageType, options: MessageOptions): Promise<WAMessageProto.Message>;
    /** Prepare a media message for sending */
    prepareMessageMedia(buffer: Buffer, mediaType: MessageType, options?: MessageOptions): Promise<WAMessageProto.IMessage>;
    /** prepares a WAMessage for sending from the given content & options */
    prepareMessageFromContent(id: string, message: WAMessageContent, options: MessageOptions): WAMessageProto.WebMessageInfo;
    /** Relay (send) a WAMessage; more advanced functionality to send a built WA Message, you may want to stick with sendMessage() */
    relayWAMessage(message: WAMessage): Promise<void>;
    /**
     * Fetches the latest url & media key for the given message.
     * You may need to call this when the message is old & the content is deleted off of the WA servers
     * @param message
     */
    updateMediaMessage(message: WAMessage): Promise<void>;
    /**
     * Securely downloads the media from the message.
     * Renews the download url automatically, if necessary.
     */
    downloadMediaMessage(message: WAMessage): Promise<Buffer>;
    /**
     * Securely downloads the media from the message and saves to a file.
     * Renews the download url automatically, if necessary.
     * @param message the media message you want to decode
     * @param filename the name of the file where the media will be saved
     * @param attachExtension should the parsed extension be applied automatically to the file
     */
    downloadAndSaveMediaMessage(message: WAMessage, filename: string, attachExtension?: boolean): Promise<string>;
    protected refreshMediaConn(): Promise<MediaConnInfo>;
}
