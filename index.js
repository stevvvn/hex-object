'use strict';
//@flow

/*:: type map = { [ string ]: any }; */

/**
 * Combine the given objects, given preference to values defined to the right.
 *
 * Arrays are concatenated rather than receiving the right-hand side value.
 *
 * This is used primarily for configuration object with multiple sources, for
 * example merging different apps that both want to enable plugins given by a
 * certain array key, respecting both.
 */
const augment = (...args /*: Array<map>*/) /*: map */ => {
	for (let idx = 1; idx < args.length; ++idx) {
		const v = augment2(args[0], args[idx]);
		if (Array.isArray(v)) {
			throw new Error('attempt to augment an object and an array');
		}
		args[0] = v;
	}
	return args[0];
};
function augment2(a /*: map|Array<any> */, b /*: map|Array<any> */) /*: map|Array<any> */ {
	if (Array.isArray(a) || Array.isArray(b)) {
		return [].concat(a, b);
	}
	for (let k in b ) {
		if (b[k] !== null && typeof(a[k]) === 'object' && typeof(b[k]) === 'object') {
			a[k] = augment2(a[k], b[k]);
		}
		else {
			a[k] = b[k];
		}
	}
	return a;
}

/**
 * Get a given (possibly deep) key from the object.
 *
 * Deep keys use periods to indicate depth:
 *
 * get({ a: { b: 42 } }, 'a.b') === 42
 *
 * If the path to the desired value is not provided, the entire object is
 * returned (useful in wrapped mode, below).
 *
 * You can provide a default for the third parameter. If the path is not set
 * and no default is provided, it is considered an error. Supply `null` for
 * the default to prevent raising this error.
 */
function get(obj /*: map */, path /*: ?string */, def /*: ?any */) /*: any */ {
	if (!path) {
		return obj;
	}
	const keys = path.split('.');
	let val = obj;

	keys.every((key) => {
		if (!val || val[key] === undefined) {
			val = def;
			return false;
		}
		val = val[key];
		return true;
	});
	if (def === undefined && val === undefined) {
		throw new Error(`${path} unset`);
	}
	return val;
}

/**
 * Set a given (possibly deep) key in an object
 *
 * const ex = {};
 * set(ex, 'a.b', 42);
 * console.log(ex); // { a: { b: 42 } }
 *
 * You can provide `setter` as a callback that inserts the desired value into
 * the object at the specified location, though it's mostly for internal use.
 */
function set(obj /*: map */, path /*: string */, val /*: ?any */, setter /*: ?(any, string) => void = null */) /*: void */ {
	if (!setter) {
		setter = (targ, key) => { targ[key] = val; };
	}
	const keys = path.split('.');
	let targ = obj;
	keys.forEach((key, idx) => {
		if (idx === keys.length - 1) {
			setter && setter(targ, key);
		}
		else {
			if (!targ[key]) {
				targ[key] = {};
			}
			targ = targ[key];
		}
	});
}

/**
 * Like `set`, but combines values in array context
 *
 * const ex = { a: [1], b: 1, c: [1] };
 * push(ex, 'a', 2);
 * push(ex, 'b', 2);
 * push(ex, 'c', [2]);
 * console.log(ex); // { a: [ 1, 2 ], b: [ 1, 2 ], c: [ 1, [ 2 ] ] }
 */
function push(obj /*: map */, path /*: string */, val /*: ?any */) /*: void */ {
	return set(obj, path, null, (targ, key) => {
		if (!targ[key]) {
			targ[key] = [];
		}
		else if (!targ[key].constructor || targ[key].constructor !== Array) {
			targ[key] = [ targ[key] ];
		}
		targ[key].push(val);
	});
}

/**
 * Like `push`, but flattens a single level of the arrays on merge.
 *
 * const ex = { a: [1], b: 1, c: [1] };
 * concat(ex, 'a', 2);
 * concat(ex, 'b', 2);
 * concat(ex, 'c', [2]);
 * console.log(ex); // { a: [ 1, 2 ], b: [ 1, 2 ], c: [ 1, 2 ] }
 */
function concat(obj /*: map */, path /*: string */, val /*: ?any */) /*: void */ {
	if (!val || !val.constructor || val.constructor !== Array) {
		val = [ val ];
	}
	return set(obj, path, null, (targ, key) => {
		if (!targ[key]) {
			targ[key] = [];
		}
		else if (!targ[key].constructor || targ[key].constructor !== Array) {
			targ[key] = [ targ[key] ];
		}
		targ[key] = targ[key].concat(val);
	});
}

/**
 * Recursively converts an object with "deep" key shortcuts into the deep
 * structure it represents.
 *
 * const t3 = { 'a.key': { 'is.deep': 42 } };
 * iface.normalize(t3);
 * console.log(t3); // { a: { key: { is: { deep: 42 } } } }
 */
function normalize(obj /*: map */) /*: void */ {
	for (let k in obj) {
		if (obj[k].constructor === Object) {
			normalize(obj[k]);
		}
		set(obj, k, obj[k]);
		if (k.indexOf('.') > -1) {
			delete obj[k];
		}
	}
}

function empty() {
	return wrap({});
}

let iface;
/**
 * Wrap an object for chaining of the other methods in this module. Call `get`
 * to get the value.
 *
 * console.log(wrap({}).set('a', 1).set('deep.value', 42).push('b', 'b').get());
 * // { a: 1, deep: { value: 42 }, b: [ 'b' ] }
 */
function wrap(obj /*: map */) /*: map */ {
	const rv = {};
	for (let fun in iface) {
		if (fun === 'empty') {
			continue;
		}
		rv[fun] = (...args /*: [ any ] */) /*: any */ => {
			/// $FlowFixMe can't type-check generic wrappers liek this, need to write 'em for each method
			const res = iface[fun].apply(null, [ obj ].concat(args));
			return fun === 'get' ? res : rv;
		}
	}
	return rv;
}

iface = module.exports = {
	augment, get, set, push, concat, wrap, normalize, empty
};
