const debug = require('diagnostics')('npm-shizzle');
const shelly = require('shelljs');
const fuse = require('fusing');
const path = require('path');

/**
 * Create a human readable interface for interacting with the npm binary that is
 * installed on the host system. This allows us to interact with the npm in the
 * given directory.
 *
 * The beauty of this system is that it allows human readable chaining:
 *
 * ```js
 * npm().install('npm');
 * ```
 *
 * @constructor
 * @param {String} dir The directory in which we should execute these commands.
 * @param {Object} options Default configuration flags.
 * @api public
 */
function NPM(dir, options) {
  if (!this) return new NPM(dir, options);

  this.fuse();
  this.__dirname = dir;
  this._options = options || {};
}

fuse(NPM);

/**
 * List of all commands that are available for git.
 *
 * @type {Array}
 * @private
 */
NPM.commands = [];

/**
 * The path to the `git` binary.
 *
 * @type {String}
 * @public
 */
NPM.path = shelly.which('npm');

//
// This is where all the magic happens. We're going to extract all the commands
// that this `npm` binary supports and introduce them as API's on the prototype.
//
shelly.exec(NPM.path +' -l', {
  silent: true
}).output.split(/[\n|\r]/).map(function map(line) {
  line = (/^\s{4}([\w|\-]+)\s/g.exec(line) || [''])[0].trim();

  return line;
}).filter(Boolean).forEach(function each(cmd) {
  let method = cmd;
  let index;

  //
  // Some these methods contain dashes, it's a pain to write git()['symbolic-ref']
  // so we're transforming these cases to JS compatible method name.
  //
  while (~(index = method.indexOf('-'))) {
    method = [
      method.slice(0, index),
      method.slice(index + 1, index + 2).toUpperCase(),
      method.slice(index + 2)
    ].join('');
  }

  /**
   * Execute the introduced/parsed command.
   *
   * @param {String} params Additional command line flags.
   * @param {Function} fn Completion callback if you want async support.
   * @returns {String}
   * @api public
   */
  NPM.readable(method, function proxycmd(params, fn) {
    const options = this._options;
    let npm = NPM.path +' '+ cmd +' ';
    let res;

    if ('function' === typeof params) fn = params;
    if ('string' === typeof params) npm += params;

    //
    // We have no idea what is added by the user so we need to trim it, and re
    // add the spacing so our flags are correctly added.
    //
    npm = npm.trim() +' ';

    //
    // Add default CLI flags to the command, which should be last..
    //
    if (options.username) {
      npm +='--username '+ options.username +' ';
    }

    if (options.password) {
      npm +='--password '+ options.password +' ';
    }

    if (options.registry) {
      npm +='--registry '+ options.registry +' ';
    }

    if (options.userconfig) {
      npm +='--userconfig'+ options.userconfig + ' ';
    }

    npm +='--always-auth --no-strict-ssl ';

    shelly.cd(this.__dirname);
    debug('executing cmd', npm);

    //
    // We want to give people the option to pipe the output to the stdout
    //
    const opts = Object.assign({}, options.exec || {}, {
      silent: 'silent' in options ? options.silent : true
    });

    res = shelly.exec(npm.trim(), opts, fn ? function cb(code, output) {
      if (+code) return fn(new Error((output || 'Incorrect code #'+ code).trim()));

      fn(undefined, output);
    } : undefined);

    //
    // Make sure we throw a code in sync mode instead of returning the error
    // body.
    //
    if (!fn && +res.code) {
      throw new Error((res.output || 'Incorrect code #'+ res.code).trim());
    }

    return res.output || '';
  });

  NPM.commands.push(cmd);
});

/**
 * CD in to another directory.
 *
 * @type {Function}
 * @returns {NPM}
 * @api public
 */
NPM.readable('cd', function (dir) {
  this.__dirname = path.join(this.__dirname, dir);

  debug('updated the directory to', this.__dirname);
  return this;
});

//
// Expose the module.
//
module.exports = NPM;
