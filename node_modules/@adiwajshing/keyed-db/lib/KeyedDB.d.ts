declare type PaginationMode = 'before' | 'after';
export default class KeyedDB<T> {
    private array;
    private dict;
    private key;
    private idGetter;
    /**
     *
     * @param key Return the unique key used to sort items
     * @param id The unique ID for the items
     */
    constructor(key: (v: T) => number, id?: (v: T) => string);
    get length(): number;
    toJSON(): T[];
    insert(value: T): void;
    slice(start: number, end: number): KeyedDB<T>;
    delete(value: T): T;
    clear(): void;
    get(id: string): T;
    all(): T[];
    updateKey(value: T, update: (value: T) => void): void;
    filter(predicate: (value: T, index: number) => boolean): KeyedDB<T>;
    /**
     * Get the values of the data in a paginated manner
     * @param value the value itself beyond which the content is to be retreived
     * @param limit max number of items to retreive
     * @param predicate optional filter
     * @param mode whether to get the content `before` the cursor or `after` the cursor; default=`after`
     */
    paginatedByValue(value: T | null, limit: number, predicate?: (value: T, index: number) => boolean, mode?: PaginationMode): T[];
    /**
     * Get the values of the data in a paginated manner
     * @param value the cursor beyond which the content is to be retreived
     * @param limit max number of items to retreive
     * @param predicate optional filter
     * @param mode whether to get the content `before` the cursor or `after` the cursor; default=`after`
     */
    paginated(cursor: number | null, limit: number, predicate?: (value: T, index: number) => boolean, mode?: PaginationMode): T[];
    private filtered;
    private firstIndex;
}
/**
 *
 * @param array the array to search in
 * @param predicate return a value of < 0, if the item you're looking for should come before, 0 if it is the item you're looking for
 */
export declare function binarySearch<T>(array: T[], predicate: (T: any) => number): number;
export {};
