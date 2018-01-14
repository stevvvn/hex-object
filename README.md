# hex-object

This is a small collection of utilities for dealing with object manipulation, aimed primarily at the use case of configuration objects.

## "Dotted-path" shortcut keys
This module implements utilities to support a short alternate syntax for deep structures:
```javascript
{
	'login.strategies.twilio.api': {
		'id': 'foo',
		'key': 'bar'
	},
	'login.strategies.local.store': 'redis'
}
// - or -
{
	'login.strategies': {
		'twilio.api': {
			'id': 'foo',
			'key': 'bar'
		},
		'local.store': 'redis'
	}
}
```
can be used in place of the "normalized" JSON equivalent:
```json
{
"login": { "strategies": {
		"twilio": { "api": {
			"id": "foo",
			"key": "bar"
		} },
		"local": { "store": "redis" }
	} }
}
```

This module's `normalize` converts either of the former into the latter. After an object is normalized, you can use `get`, `set`, `push`, and `concat` to operate it on it using shortcuts:

```javascript
const obj = require('hex-object'), conf = require('./login-conf');
obj.normalize(conf);
obj.get(conf, 'login.strategies.local');
// { 'store': 'redis' }
```

### Wrapping
If you want to do more than one operation on an object, it can be helpful to wrap it:
```javascript
const obj = require('hex-object'), conf = obj.wrap(require('./login-conf'));
conf
    .normalize()
    .set('login.strategies.local.store', 'postgres');
    
conf.get('login.strategies.local');
// { 'store': 'postgres' });
```

*Refer to the tests for more usage examples.*

## Overriding & Augmenting

Sometimes it is necessary to combine configuration from various sources in the same key space.

This is how it works:
```javascript
const obj = require('hex-object'),
     conf = require('./conf'),
// { 'port': 8000, 'data-source': 'fs', 'plugins': [ 'a', 'b' ] }
  modConf = require('./mod/conf');
// { 'plugins': [ 'c' ], 'data-source': 'redis' }

obj.augment(conf, modConf);
// {
//     'port': 8000,
//     'data-source': 'redis', // later-declared value "wins"
//     'plugins': [ 'a', 'b', 'c' ] // except in cases of arrays, which get merged
// }

```
