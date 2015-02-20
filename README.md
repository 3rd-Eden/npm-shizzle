# npm-shizzle

`npm-shizzle` is a wrapper around the `npm` binary that is installed on the
system. Interaction with npm has never been easier as we support both async and
sync API calls.

## Installation

This module was designed for Node.js and can be installed from the public npm
registry:

```
npm install --save npm-shizzle
```

## Usage

In all of the following examples we assume that you've required the library as
following:

```js
'use strict';

var npm = require('npm-shizzle');
```

We export `npm` as a constructor but the API that we're using in examples allows
chaining which results in more readable code. So to create a new `npm` instance
you can do:

```js
npm();
```

Or:

```js
new npm();
```

The constructor does allow for a few optional arguments:

1. The directory that we have to operate in, should be an absolute path.
2. Options object which allows you to pre-configure some common npm cli flags:
  - **registry** The npm registry you want to use
  - **username** Your npm username
  - **password** Your npm password

```js
npm(__dirname, { registry: 'https://registry.nodejitsu.com' }).install('foo');
```

To `install` a module we can simply call the `install` method as illustrated
above. We can pass in command line flags as arguments to the function:

```js
npm().install('--global jslint');
```

As stated in the introduction text of this document we support both async and
sync API's. To trigger the different modes you need to supply a completion
callback as last argument if you want to use the **async** mode.

```js
npm().install('--save modulename', function (err, output) {
  console.log(arguments);
});
```

If you are using sync functions and something bad happens we will **throw** an
error. 

## API

The API methods depend on the `npm` binary that is installed on your system. We
parse out `npm -l` command for available commands and introduce those in the
prototype. Commands that contain a dash like `run-script` are also aliased with
a camel case alternative so it can be used as `runScript`.

## Debugging

This library is instrumented with the [diagnostics] so you can set the
`DIAGNOSTICS` or `DEBUG` environment variable to `DEBUG=npm-shizzle` to receive
the debug output of this module. 

## License

MIT

[diagnostics]: https://github.com/3rd-Eden/diagnostics
