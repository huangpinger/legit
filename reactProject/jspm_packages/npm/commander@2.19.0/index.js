/* */ 
(function(process) {
  var EventEmitter = require('events').EventEmitter;
  var spawn = require('child_process').spawn;
  var path = require('path');
  var dirname = path.dirname;
  var basename = path.basename;
  var fs = require('fs');
  require('util').inherits(Command, EventEmitter);
  exports = module.exports = new Command();
  exports.Command = Command;
  exports.Option = Option;
  function Option(flags, description) {
    this.flags = flags;
    this.required = flags.indexOf('<') >= 0;
    this.optional = flags.indexOf('[') >= 0;
    this.bool = flags.indexOf('-no-') === -1;
    flags = flags.split(/[ ,|]+/);
    if (flags.length > 1 && !/^[[<]/.test(flags[1]))
      this.short = flags.shift();
    this.long = flags.shift();
    this.description = description || '';
  }
  Option.prototype.name = function() {
    return this.long.replace('--', '').replace('no-', '');
  };
  Option.prototype.attributeName = function() {
    return camelcase(this.name());
  };
  Option.prototype.is = function(arg) {
    return this.short === arg || this.long === arg;
  };
  function Command(name) {
    this.commands = [];
    this.options = [];
    this._execs = {};
    this._allowUnknownOption = false;
    this._args = [];
    this._name = name || '';
  }
  Command.prototype.command = function(name, desc, opts) {
    if (typeof desc === 'object' && desc !== null) {
      opts = desc;
      desc = null;
    }
    opts = opts || {};
    var args = name.split(/ +/);
    var cmd = new Command(args.shift());
    if (desc) {
      cmd.description(desc);
      this.executables = true;
      this._execs[cmd._name] = true;
      if (opts.isDefault)
        this.defaultExecutable = cmd._name;
    }
    cmd._noHelp = !!opts.noHelp;
    this.commands.push(cmd);
    cmd.parseExpectedArgs(args);
    cmd.parent = this;
    if (desc)
      return this;
    return cmd;
  };
  Command.prototype.arguments = function(desc) {
    return this.parseExpectedArgs(desc.split(/ +/));
  };
  Command.prototype.addImplicitHelpCommand = function() {
    this.command('help [cmd]', 'display help for [cmd]');
  };
  Command.prototype.parseExpectedArgs = function(args) {
    if (!args.length)
      return;
    var self = this;
    args.forEach(function(arg) {
      var argDetails = {
        required: false,
        name: '',
        variadic: false
      };
      switch (arg[0]) {
        case '<':
          argDetails.required = true;
          argDetails.name = arg.slice(1, -1);
          break;
        case '[':
          argDetails.name = arg.slice(1, -1);
          break;
      }
      if (argDetails.name.length > 3 && argDetails.name.slice(-3) === '...') {
        argDetails.variadic = true;
        argDetails.name = argDetails.name.slice(0, -3);
      }
      if (argDetails.name) {
        self._args.push(argDetails);
      }
    });
    return this;
  };
  Command.prototype.action = function(fn) {
    var self = this;
    var listener = function(args, unknown) {
      args = args || [];
      unknown = unknown || [];
      var parsed = self.parseOptions(unknown);
      outputHelpIfNecessary(self, parsed.unknown);
      if (parsed.unknown.length > 0) {
        self.unknownOption(parsed.unknown[0]);
      }
      if (parsed.args.length)
        args = parsed.args.concat(args);
      self._args.forEach(function(arg, i) {
        if (arg.required && args[i] == null) {
          self.missingArgument(arg.name);
        } else if (arg.variadic) {
          if (i !== self._args.length - 1) {
            self.variadicArgNotLast(arg.name);
          }
          args[i] = args.splice(i);
        }
      });
      if (self._args.length) {
        args[self._args.length] = self;
      } else {
        args.push(self);
      }
      fn.apply(self, args);
    };
    var parent = this.parent || this;
    var name = parent === this ? '*' : this._name;
    parent.on('command:' + name, listener);
    if (this._alias)
      parent.on('command:' + this._alias, listener);
    return this;
  };
  Command.prototype.option = function(flags, description, fn, defaultValue) {
    var self = this,
        option = new Option(flags, description),
        oname = option.name(),
        name = option.attributeName();
    if (typeof fn !== 'function') {
      if (fn instanceof RegExp) {
        var regex = fn;
        fn = function(val, def) {
          var m = regex.exec(val);
          return m ? m[0] : def;
        };
      } else {
        defaultValue = fn;
        fn = null;
      }
    }
    if (!option.bool || option.optional || option.required) {
      if (!option.bool)
        defaultValue = true;
      if (defaultValue !== undefined) {
        self[name] = defaultValue;
        option.defaultValue = defaultValue;
      }
    }
    this.options.push(option);
    this.on('option:' + oname, function(val) {
      if (val !== null && fn) {
        val = fn(val, self[name] === undefined ? defaultValue : self[name]);
      }
      if (typeof self[name] === 'boolean' || typeof self[name] === 'undefined') {
        if (val == null) {
          self[name] = option.bool ? defaultValue || true : false;
        } else {
          self[name] = val;
        }
      } else if (val !== null) {
        self[name] = val;
      }
    });
    return this;
  };
  Command.prototype.allowUnknownOption = function(arg) {
    this._allowUnknownOption = arguments.length === 0 || arg;
    return this;
  };
  Command.prototype.parse = function(argv) {
    if (this.executables)
      this.addImplicitHelpCommand();
    this.rawArgs = argv;
    this._name = this._name || basename(argv[1], '.js');
    if (this.executables && argv.length < 3 && !this.defaultExecutable) {
      argv.push('--help');
    }
    var parsed = this.parseOptions(this.normalize(argv.slice(2)));
    var args = this.args = parsed.args;
    var result = this.parseArgs(this.args, parsed.unknown);
    var name = result.args[0];
    var aliasCommand = null;
    if (name) {
      aliasCommand = this.commands.filter(function(command) {
        return command.alias() === name;
      })[0];
    }
    if (this._execs[name] && typeof this._execs[name] !== 'function') {
      return this.executeSubCommand(argv, args, parsed.unknown);
    } else if (aliasCommand) {
      args[0] = aliasCommand._name;
      return this.executeSubCommand(argv, args, parsed.unknown);
    } else if (this.defaultExecutable) {
      args.unshift(this.defaultExecutable);
      return this.executeSubCommand(argv, args, parsed.unknown);
    }
    return result;
  };
  Command.prototype.executeSubCommand = function(argv, args, unknown) {
    args = args.concat(unknown);
    if (!args.length)
      this.help();
    if (args[0] === 'help' && args.length === 1)
      this.help();
    if (args[0] === 'help') {
      args[0] = args[1];
      args[1] = '--help';
    }
    var f = argv[1];
    var bin = basename(f, path.extname(f)) + '-' + args[0];
    var baseDir,
        link = fs.lstatSync(f).isSymbolicLink() ? fs.readlinkSync(f) : f;
    if (link !== f && link.charAt(0) !== '/') {
      link = path.join(dirname(f), link);
    }
    baseDir = dirname(link);
    var localBin = path.join(baseDir, bin);
    var isExplicitJS = false;
    if (exists(localBin + '.js')) {
      bin = localBin + '.js';
      isExplicitJS = true;
    } else if (exists(localBin + '.ts')) {
      bin = localBin + '.ts';
      isExplicitJS = true;
    } else if (exists(localBin)) {
      bin = localBin;
    }
    args = args.slice(1);
    var proc;
    if (process.platform !== 'win32') {
      if (isExplicitJS) {
        args.unshift(bin);
        args = (process.execArgv || []).concat(args);
        proc = spawn(process.argv[0], args, {
          stdio: 'inherit',
          customFds: [0, 1, 2]
        });
      } else {
        proc = spawn(bin, args, {
          stdio: 'inherit',
          customFds: [0, 1, 2]
        });
      }
    } else {
      args.unshift(bin);
      proc = spawn(process.execPath, args, {stdio: 'inherit'});
    }
    var signals = ['SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGINT', 'SIGHUP'];
    signals.forEach(function(signal) {
      process.on(signal, function() {
        if (proc.killed === false && proc.exitCode === null) {
          proc.kill(signal);
        }
      });
    });
    proc.on('close', process.exit.bind(process));
    proc.on('error', function(err) {
      if (err.code === 'ENOENT') {
        console.error('error: %s(1) does not exist, try --help', bin);
      } else if (err.code === 'EACCES') {
        console.error('error: %s(1) not executable. try chmod or run with root', bin);
      }
      process.exit(1);
    });
    this.runningCommand = proc;
  };
  Command.prototype.normalize = function(args) {
    var ret = [],
        arg,
        lastOpt,
        index;
    for (var i = 0,
        len = args.length; i < len; ++i) {
      arg = args[i];
      if (i > 0) {
        lastOpt = this.optionFor(args[i - 1]);
      }
      if (arg === '--') {
        ret = ret.concat(args.slice(i));
        break;
      } else if (lastOpt && lastOpt.required) {
        ret.push(arg);
      } else if (arg.length > 1 && arg[0] === '-' && arg[1] !== '-') {
        arg.slice(1).split('').forEach(function(c) {
          ret.push('-' + c);
        });
      } else if (/^--/.test(arg) && ~(index = arg.indexOf('='))) {
        ret.push(arg.slice(0, index), arg.slice(index + 1));
      } else {
        ret.push(arg);
      }
    }
    return ret;
  };
  Command.prototype.parseArgs = function(args, unknown) {
    var name;
    if (args.length) {
      name = args[0];
      if (this.listeners('command:' + name).length) {
        this.emit('command:' + args.shift(), args, unknown);
      } else {
        this.emit('command:*', args);
      }
    } else {
      outputHelpIfNecessary(this, unknown);
      if (unknown.length > 0) {
        this.unknownOption(unknown[0]);
      }
      if (this.commands.length === 0 && this._args.filter(function(a) {
        return a.required;
      }).length === 0) {
        this.emit('command:*');
      }
    }
    return this;
  };
  Command.prototype.optionFor = function(arg) {
    for (var i = 0,
        len = this.options.length; i < len; ++i) {
      if (this.options[i].is(arg)) {
        return this.options[i];
      }
    }
  };
  Command.prototype.parseOptions = function(argv) {
    var args = [],
        len = argv.length,
        literal,
        option,
        arg;
    var unknownOptions = [];
    for (var i = 0; i < len; ++i) {
      arg = argv[i];
      if (literal) {
        args.push(arg);
        continue;
      }
      if (arg === '--') {
        literal = true;
        continue;
      }
      option = this.optionFor(arg);
      if (option) {
        if (option.required) {
          arg = argv[++i];
          if (arg == null)
            return this.optionMissingArgument(option);
          this.emit('option:' + option.name(), arg);
        } else if (option.optional) {
          arg = argv[i + 1];
          if (arg == null || (arg[0] === '-' && arg !== '-')) {
            arg = null;
          } else {
            ++i;
          }
          this.emit('option:' + option.name(), arg);
        } else {
          this.emit('option:' + option.name());
        }
        continue;
      }
      if (arg.length > 1 && arg[0] === '-') {
        unknownOptions.push(arg);
        if ((i + 1) < argv.length && argv[i + 1][0] !== '-') {
          unknownOptions.push(argv[++i]);
        }
        continue;
      }
      args.push(arg);
    }
    return {
      args: args,
      unknown: unknownOptions
    };
  };
  Command.prototype.opts = function() {
    var result = {},
        len = this.options.length;
    for (var i = 0; i < len; i++) {
      var key = this.options[i].attributeName();
      result[key] = key === this._versionOptionName ? this._version : this[key];
    }
    return result;
  };
  Command.prototype.missingArgument = function(name) {
    console.error("error: missing required argument `%s'", name);
    process.exit(1);
  };
  Command.prototype.optionMissingArgument = function(option, flag) {
    if (flag) {
      console.error("error: option `%s' argument missing, got `%s'", option.flags, flag);
    } else {
      console.error("error: option `%s' argument missing", option.flags);
    }
    process.exit(1);
  };
  Command.prototype.unknownOption = function(flag) {
    if (this._allowUnknownOption)
      return;
    console.error("error: unknown option `%s'", flag);
    process.exit(1);
  };
  Command.prototype.variadicArgNotLast = function(name) {
    console.error("error: variadic arguments must be last `%s'", name);
    process.exit(1);
  };
  Command.prototype.version = function(str, flags) {
    if (arguments.length === 0)
      return this._version;
    this._version = str;
    flags = flags || '-V, --version';
    var versionOption = new Option(flags, 'output the version number');
    this._versionOptionName = versionOption.long.substr(2) || 'version';
    this.options.push(versionOption);
    this.on('option:' + this._versionOptionName, function() {
      process.stdout.write(str + '\n');
      process.exit(0);
    });
    return this;
  };
  Command.prototype.description = function(str, argsDescription) {
    if (arguments.length === 0)
      return this._description;
    this._description = str;
    this._argsDescription = argsDescription;
    return this;
  };
  Command.prototype.alias = function(alias) {
    var command = this;
    if (this.commands.length !== 0) {
      command = this.commands[this.commands.length - 1];
    }
    if (arguments.length === 0)
      return command._alias;
    if (alias === command._name)
      throw new Error('Command alias can\'t be the same as its name');
    command._alias = alias;
    return this;
  };
  Command.prototype.usage = function(str) {
    var args = this._args.map(function(arg) {
      return humanReadableArgName(arg);
    });
    var usage = '[options]' + (this.commands.length ? ' [command]' : '') + (this._args.length ? ' ' + args.join(' ') : '');
    if (arguments.length === 0)
      return this._usage || usage;
    this._usage = str;
    return this;
  };
  Command.prototype.name = function(str) {
    if (arguments.length === 0)
      return this._name;
    this._name = str;
    return this;
  };
  Command.prototype.prepareCommands = function() {
    return this.commands.filter(function(cmd) {
      return !cmd._noHelp;
    }).map(function(cmd) {
      var args = cmd._args.map(function(arg) {
        return humanReadableArgName(arg);
      }).join(' ');
      return [cmd._name + (cmd._alias ? '|' + cmd._alias : '') + (cmd.options.length ? ' [options]' : '') + (args ? ' ' + args : ''), cmd._description];
    });
  };
  Command.prototype.largestCommandLength = function() {
    var commands = this.prepareCommands();
    return commands.reduce(function(max, command) {
      return Math.max(max, command[0].length);
    }, 0);
  };
  Command.prototype.largestOptionLength = function() {
    var options = [].slice.call(this.options);
    options.push({flags: '-h, --help'});
    return options.reduce(function(max, option) {
      return Math.max(max, option.flags.length);
    }, 0);
  };
  Command.prototype.largestArgLength = function() {
    return this._args.reduce(function(max, arg) {
      return Math.max(max, arg.name.length);
    }, 0);
  };
  Command.prototype.padWidth = function() {
    var width = this.largestOptionLength();
    if (this._argsDescription && this._args.length) {
      if (this.largestArgLength() > width) {
        width = this.largestArgLength();
      }
    }
    if (this.commands && this.commands.length) {
      if (this.largestCommandLength() > width) {
        width = this.largestCommandLength();
      }
    }
    return width;
  };
  Command.prototype.optionHelp = function() {
    var width = this.padWidth();
    return this.options.map(function(option) {
      return pad(option.flags, width) + '  ' + option.description + ((option.bool && option.defaultValue !== undefined) ? ' (default: ' + JSON.stringify(option.defaultValue) + ')' : '');
    }).concat([pad('-h, --help', width) + '  ' + 'output usage information']).join('\n');
  };
  Command.prototype.commandHelp = function() {
    if (!this.commands.length)
      return '';
    var commands = this.prepareCommands();
    var width = this.padWidth();
    return ['Commands:', commands.map(function(cmd) {
      var desc = cmd[1] ? '  ' + cmd[1] : '';
      return (desc ? pad(cmd[0], width) : cmd[0]) + desc;
    }).join('\n').replace(/^/gm, '  '), ''].join('\n');
  };
  Command.prototype.helpInformation = function() {
    var desc = [];
    if (this._description) {
      desc = [this._description, ''];
      var argsDescription = this._argsDescription;
      if (argsDescription && this._args.length) {
        var width = this.padWidth();
        desc.push('Arguments:');
        desc.push('');
        this._args.forEach(function(arg) {
          desc.push('  ' + pad(arg.name, width) + '  ' + argsDescription[arg.name]);
        });
        desc.push('');
      }
    }
    var cmdName = this._name;
    if (this._alias) {
      cmdName = cmdName + '|' + this._alias;
    }
    var usage = ['Usage: ' + cmdName + ' ' + this.usage(), ''];
    var cmds = [];
    var commandHelp = this.commandHelp();
    if (commandHelp)
      cmds = [commandHelp];
    var options = ['Options:', '' + this.optionHelp().replace(/^/gm, '  '), ''];
    return usage.concat(desc).concat(options).concat(cmds).join('\n');
  };
  Command.prototype.outputHelp = function(cb) {
    if (!cb) {
      cb = function(passthru) {
        return passthru;
      };
    }
    process.stdout.write(cb(this.helpInformation()));
    this.emit('--help');
  };
  Command.prototype.help = function(cb) {
    this.outputHelp(cb);
    process.exit();
  };
  function camelcase(flag) {
    return flag.split('-').reduce(function(str, word) {
      return str + word[0].toUpperCase() + word.slice(1);
    });
  }
  function pad(str, width) {
    var len = Math.max(0, width - str.length);
    return str + Array(len + 1).join(' ');
  }
  function outputHelpIfNecessary(cmd, options) {
    options = options || [];
    for (var i = 0; i < options.length; i++) {
      if (options[i] === '--help' || options[i] === '-h') {
        cmd.outputHelp();
        process.exit(0);
      }
    }
  }
  function humanReadableArgName(arg) {
    var nameOutput = arg.name + (arg.variadic === true ? '...' : '');
    return arg.required ? '<' + nameOutput + '>' : '[' + nameOutput + ']';
  }
  function exists(file) {
    try {
      if (fs.statSync(file).isFile()) {
        return true;
      }
    } catch (e) {
      return false;
    }
  }
})(require('process'));
