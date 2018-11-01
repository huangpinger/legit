/* */ 
'use strict';
var assign = require('object-assign');
var visitors = require('../visitors/index');
var jstransform = require('./jstransform');
var typesSyntax = require('../visitors/type-syntax');
var inlineSourceMap = require('./inline-source-map');
var fs = require('fs');
var DEFAULT_OPTIONS = {
  react: false,
  es6: false,
  es7: false,
  harmony: false,
  utility: false,
  target: 'es5',
  stripTypes: false,
  sourceMap: false,
  sourceMapInline: false,
  sourceFilename: 'source.js',
  es6module: false,
  nonStrictEs6module: false
};
function transform(code, options) {
  options = assign({}, DEFAULT_OPTIONS, options);
  var transformOptions = {};
  if (options.sourceMap || options.sourceMapInline) {
    transformOptions.sourceMap = true;
    transformOptions.filename = options.sourceFilename || 'source.js';
  }
  if (options.es6module) {
    transformOptions.sourceType = 'module';
  }
  if (options.nonStrictEs6module) {
    transformOptions.sourceType = 'nonStrictModule';
  }
  transformOptions.es3 = options.target === 'es3';
  transformOptions.es5 = !transformOptions.es3;
  var visitorSets = [];
  if (options.react) {
    visitorSets.push('react');
  }
  if (options.harmony) {
    visitorSets.push('harmony');
  }
  if (options.es6) {
    visitorSets.push('es6');
  }
  if (options.es7) {
    visitorSets.push('es7');
  }
  if (options.utility) {
    visitorSets.push('utility');
  }
  if (options.target === 'es3') {
    visitorSets.push('target:es3');
  }
  if (options.stripTypes) {
    code = jstransform.transform(typesSyntax.visitorList, code, transformOptions).code;
  }
  var visitorList = visitors.getVisitorsBySet(visitorSets);
  var result = jstransform.transform(visitorList, code, transformOptions);
  var output = {
    code: result.code,
    sourceMap: null
  };
  var sourceMap;
  if (result.sourceMap) {
    sourceMap = result.sourceMap.toJSON();
    sourceMap.sources = [transformOptions.filename];
    sourceMap.sourcesContent = [code];
  }
  if (options.sourceMap) {
    output.sourceMap = sourceMap;
  }
  if (options.sourceMapInline) {
    var map = inlineSourceMap(result.sourceMap, code, transformOptions.filename);
    output.code = output.code + '\n' + map;
  }
  return output;
}
function transformFile(file, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = assign({sourceFilename: file}, options);
  fs.readFile(file, 'utf-8', function(err, contents) {
    if (err) {
      return callback(err, null);
    }
    var result = transform(contents, options);
    callback(null, result);
  });
}
function transformFileSync(file, options) {
  options = assign({sourceFilename: file}, options);
  var contents = fs.readFileSync(file, 'utf-8');
  return transform(contents, options);
}
module.exports = {
  transform: transform,
  transformFile: transformFile,
  transformFileSync: transformFileSync
};
