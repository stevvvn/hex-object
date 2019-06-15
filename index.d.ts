declare module 'hex-object';

interface HexObject {
	augment(...args: HexObject[]|{ string: unknown }[]): HexObject
	has(path: string): boolean
	get<T>(path: string, def?: T): T
	getOrCall<T>(path: string, cb: () => T): T
	set(path: string, val: unknown, setter?: (pos: { string: unknown }, key: string) => void): HexObject
	push(path: string, val: unknown): HexObject
	concat(path: string, val: unknown): HexObject
	normalize(): HexObject
}
