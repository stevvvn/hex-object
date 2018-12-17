'use strict';
const lib = require('../');

describe('`get`', () => {
	const obj = { 'a': { 'b': 42 }, 'c': true };
	it('returns full object when path is not provided', () => {
		expect(lib.get(obj)).toBe(obj);
	});
	it('returns first-level keys', () => {
		expect(lib.get(obj, 'a')).toBe(obj.a);
		expect(lib.get(obj, 'c')).toBe(obj.c);
	});
	it('returns deep keys', () => {
		expect(lib.get(obj, 'a.b')).toBe(obj.a.b);
	});
	it('returns a default when the path is not set', () => {
		expect(lib.get(obj, 'does not exist', -1)).toBe(-1);
	});
	it('throws when the path is not set and there is no default', () => {
		expect(() => {
			lib.get(obj, 'does not exist');
		}).toThrow();
	})
});

describe('`set`', () => {
	const obj = {};
	it('sets first-level keys', () => {
		lib.set(obj, 'a', 1);
		expect(obj).toEqual({ 'a': 1 });
	});
	it('sets deep keys', () => {
		lib.set(obj, 'b.c', 42);
		expect(obj).toEqual({ 'a': 1, 'b': { 'c': 42 } });
	});
	it('uses a custom setter when provided', () => {
		lib.set(obj, 'b.c', null, (targ, key) => { targ[key] = 40; });
		expect(obj).toEqual({ 'a': 1, 'b': { 'c': 40 } });
	});
});

describe('`push`', () => {
	const obj = {};
	it('can instantiate first-level keys', () => {
		lib.push(obj, 'a', 1);
		expect(obj).toEqual({ 'a': [1] });
	});
	it('can instantiate deep keys', () => {
		lib.push(obj, 'b.c', 2);
		expect(obj).toEqual({ 'a': [1], 'b': { 'c': [2] } });
	});
	it('appends array values', () => {
		lib.push(obj, 'b.c', [3]);
		expect(obj).toEqual({ 'a': [1], 'b': { 'c': [2, [3]] } });
	});
});

describe('`concat`', () => {
	const obj = {};
	it('can instantiate first-level keys', () => {
		lib.concat(obj, 'a', 1);
		expect(obj).toEqual({ 'a': [1] });
	});
	it('can instantiate deep keys', () => {
		lib.concat(obj, 'b.c', 2);
		expect(obj).toEqual({ 'a': [1], 'b': { 'c': [2] } });
	});
	it('merges array values', () => {
		lib.concat(obj, 'b.c', [3]);
		expect(obj).toEqual({ 'a': [1], 'b': { 'c': [2, 3] } });
	});
});

describe('`normalize`', () => {
	it('converts documents with path-style keys into the deep structures they represent', () => {
		const obj = {
			'a': 1,
			'b.c.d': 2,
			'e': { 'f.g': 3 },
			'b.h': 2.5
		};
		lib.normalize(obj);
		expect(obj).toEqual({
			'a': 1,
			'b': {
				'c': { 'd': 2 },
				'h': 2.5
			},
			'e': { 'f': { 'g': 3 } }
		});
	});
});

describe('`wrap`', () => {
	it('allows chaining the other library methods on an object', () => {
		expect(lib.wrap({})
			.set('a', 1)
			.set('b.c', 2)
			.push('d', 3)
			.push('d', 4)
			.concat('d', [5, 6])
			.get())
			.toEqual({
				'a': 1,
				'b': { 'c': 2 },
				'd': [ 3, 4, 5, 6 ]
			});
	});
});

describe('env interactions', () => {
	const doc = lib.wrap({
		't': 'base',
		'dev': { 't': 'dev' },
		'prod': { 't': 'prod' },
		'test': { 't': 'test' }
	});
	const restoreEnv = process.env.NODE_ENV;
	it('overrides key when set in different envs', () => {
		[
			[ 'dev', 'devel', 'development' ],
			[ 'test', 'testing' ],
			[ 'prod', 'production' ]
		].forEach((variants) => {
			variants.forEach((env) => {
				process.env.NODE_ENV = env;
				expect(doc.get('t')).toEqual(variants[0]);
				process.env.NODE_ENV = env.toUpperCase();
				expect(doc.get('t')).toEqual(variants[0]);
			});
		});
	});
	process.env.NODE_ENV = restoreEnv;
});
