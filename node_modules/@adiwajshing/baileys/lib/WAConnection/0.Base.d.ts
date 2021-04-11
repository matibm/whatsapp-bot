/// <reference types="node" />
import WS from 'ws';
import Encoder from '../Binary/Encoder';
import Decoder from '../Binary/Decoder';
import { AuthenticationCredentials, WAUser, WANode, WATag, MessageLogLevel, DisconnectReason, WAConnectionState, AnyAuthenticationCredentials, WAContact, WAChat, WAQuery, ReconnectMode, WAConnectOptions, MediaConnInfo } from './Constants';
import { EventEmitter } from 'events';
import KeyedDB from '@adiwajshing/keyed-db';
export declare class WAConnection extends EventEmitter {
    /** The version of WhatsApp Web we're telling the servers we are */
    version: [number, number, number];
    /** The Browser we're telling the WhatsApp Web servers we are */
    browserDescription: [string, string, string];
    /** Metadata like WhatsApp id, name set on WhatsApp etc. */
    user: WAUser;
    /** What level of messages to log to the console */
    logLevel: MessageLogLevel;
    /** Should requests be queued when the connection breaks in between; if 0, then an error will be thrown */
    pendingRequestTimeoutMs: number;
    /** The connection state */
    state: WAConnectionState;
    /** New QR generation interval, set to null if you don't want to regenerate */
    regenerateQRIntervalMs: number;
    connectOptions: WAConnectOptions;
    /** When to auto-reconnect */
    autoReconnect: ReconnectMode;
    /** Whether the phone is connected */
    phoneConnected: boolean;
    maxCachedMessages: number;
    chats: KeyedDB<WAChat>;
    contacts: {
        [k: string]: WAContact;
    };
    /** Data structure of tokens & IDs used to establish one's identiy to WhatsApp Web */
    protected authInfo: AuthenticationCredentials;
    /** Curve keys to initially authenticate */
    protected curveKeys: {
        private: Uint8Array;
        public: Uint8Array;
    };
    /** The websocket connection */
    protected conn: WS;
    protected msgCount: number;
    protected keepAliveReq: NodeJS.Timeout;
    protected callbacks: {
        [k: string]: any;
    };
    protected encoder: Encoder;
    protected decoder: Decoder;
    protected pendingRequests: {
        resolve: () => void;
        reject: (error: any) => void;
    }[];
    protected referenceDate: Date;
    protected lastSeen: Date;
    protected qrTimeout: NodeJS.Timeout;
    protected lastDisconnectTime: Date;
    protected lastDisconnectReason: DisconnectReason;
    protected mediaConn: MediaConnInfo;
    constructor();
    /**
     * Connect to WhatsAppWeb
     * @param options the connect options
     */
    connect(): Promise<any>;
    unexpectedDisconnect(error: DisconnectReason): Promise<void>;
    /**
     * base 64 encode the authentication credentials and return them
     * these can then be used to login again by passing the object to the connect () function.
     * @see connect () in WhatsAppWeb.Session
     */
    base64EncodedAuthInfo(): {
        clientID: string;
        serverToken: string;
        clientToken: string;
        encKey: string;
        macKey: string;
    };
    /** Clear authentication info so a new connection can be created */
    clearAuthInfo(): this;
    /**
     * Load in the authentication credentials
     * @param authInfo the authentication credentials or file path to auth credentials
     */
    loadAuthInfo(authInfo: AnyAuthenticationCredentials | string): this;
    /**
     * Register for a callback for a certain function
     * @param parameters name of the function along with some optional specific parameters
     */
    registerCallback(parameters: [string, string?, string?] | string, callback: any): any;
    /**
     * Cancel all further callback events associated with the given parameters
     * @param parameters name of the function along with some optional specific parameters
     */
    deregisterCallback(parameters: [string, string?, string?] | string): any;
    /**
     * Wait for a message with a certain tag to be received
     * @param tag the message tag to await
     * @param json query that was sent
     * @param timeoutMs timeout after which the promise will reject
     */
    waitForMessage(tag: string, json?: Object, timeoutMs?: number): Promise<any>;
    /** Generic function for action, set queries */
    setQuery(nodes: WANode[], binaryTags?: WATag, tag?: string): Promise<{
        status: number;
    }>;
    /**
     * Query something from the WhatsApp servers
     * @param json the query itself
     * @param binaryTags the tags to attach if the query is supposed to be sent encoded in binary
     * @param timeoutMs timeout after which the query will be failed (set to null to disable a timeout)
     * @param tag the tag to attach to the message
     * recieved JSON
     */
    query({ json, binaryTags, tag, timeoutMs, expect200, waitForOpen, longTag }: WAQuery): any;
    /**
     * Send a binary encoded message
     * @param json the message to encode & send
     * @param tags the binary tags to tell WhatsApp what the message is all about
     * @param tag the tag to attach to the message
     * @return the message tag
     */
    protected sendBinary(json: WANode, tags: WATag, tag?: string, longTag?: boolean): string;
    /**
     * Send a plain JSON message to the WhatsApp servers
     * @param json the message to send
     * @param tag the tag to attach to the message
     * @return the message tag
     */
    protected sendJSON(json: any[] | WANode, tag?: string, longTag?: boolean): string;
    /** Send some message to the WhatsApp servers */
    protected send(m: any): void;
    protected waitForConnection(): Promise<void>;
    /**
     * Disconnect from the phone. Your auth credentials become invalid after sending a disconnect request.
     * @see close() if you just want to close the connection
     */
    logout(): Promise<void>;
    /** Close the connection to WhatsApp Web */
    close(): void;
    protected closeInternal(reason?: DisconnectReason, isReconnecting?: boolean): void;
    protected endConnection(): void;
    /**
     * Does a fetch request with the configuration of the connection
     */
    protected fetchRequest: (endpoint: string, method?: string, body?: any) => any;
    generateMessageTag(longTag?: boolean): string;
    protected log(text: any, level: MessageLogLevel): void;
}
