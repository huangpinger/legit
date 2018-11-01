/* */ 
'use strict';
var es6ArrowFunction = require('./es6-arrow-function-visitors');
var es6CallSpread = require('./es6-call-spread-visitors');
var es6Class = require('./es6-class-visitors');
var es6Destructuring = require('./es6-destructuring-visitors');
var es6ForOf = require('./es6-for-of-visitors');
var es6ObjectComputedProperty = require('./es6-object-computed-property-visitors');
var es6ObjectConciseMethod = require('./es6-object-concise-method-visitors');
var es6ObjectShortNotation = require('./es6-object-short-notation-visitors');
var es6RestParam = require('./es6-rest-param-visitors');
var es6Template = require('./es6-template-visitors');
var es7SpreadProperty = require('./es7-spread-property-visitors');
var es7TrailingComma = require('./es7-trailing-comma-visitors');
var reactDisplayName = require('./react-display-name-visitors');
var reactJSX = require('./react-jsx-visitors');
var reservedWords = require('./reserved-words-visitors');
var trailingComma = require('./trailing-comma-visitors');
var undefinedToVoid0 = require('./undefined-to-void-0-visitors');
var transformVisitors = {
  'es6-arrow-function': es6ArrowFunction.visitorList,
  'es6-call-spread': es6CallSpread.visitorList,
  'es6-class': es6Class.visitorList,
  'es6-destructuring': es6Destructuring.visitorList,
  'es6-for-of': es6ForOf.visitorList,
  'es6-object-computed-property': es6ObjectComputedProperty.visitorList,
  'es6-object-concise-method': es6ObjectConciseMethod.visitorList,
  'es6-object-short-notation': es6ObjectShortNotation.visitorList,
  'es6-rest-param': es6RestParam.visitorList,
  'es6-template': es6Template.visitorList,
  'es7-spread-property': es7SpreadProperty.visitorList,
  'es7-trailing-comma': es7TrailingComma.visitorList,
  'react-display-name': reactDisplayName.visitorList,
  'react-jsx': reactJSX.visitorList,
  'reserved-words': reservedWords.visitorList,
  'trailing-comma': trailingComma.visitorList,
  'undefined-to-void-0': undefinedToVoid0.visitorList
};
var transformSets = {
  'es6': ['es6-arrow-function', 'es6-call-spread', 'es6-class', 'es6-destructuring', 'es6-for-of', 'es6-object-computed-property', 'es6-object-concise-method', 'es6-object-short-notation', 'es6-rest-param', 'es6-template'],
  'es7': ['es7-spread-property', 'es7-trailing-comma'],
  'react': ['react-jsx', 'react-display-name'],
  'target:es3': ['reserved-words', 'trailing-comma'],
  'utility': ['undefined-to-void-0']
};
transformSets.harmony = transformSets.es6.concat(transformSets.es7);
var transformRunOrder = ['reserved-words', 'es6-destructuring', 'es6-arrow-function', 'es6-object-computed-property', 'es6-object-concise-method', 'es6-object-short-notation', 'es6-class', 'es6-rest-param', 'es6-template', 'es6-call-spread', 'es6-for-of', 'es7-spread-property', 'trailing-comma', 'es7-trailing-comma', 'react-jsx', 'react-display-name', 'undefined-to-void-0'];
function getAllVisitors(excludes) {
  var ret = [];
  for (var i = 0,
      il = transformRunOrder.length; i < il; i++) {
    if (!excludes || excludes.indexOf(transformRunOrder[i]) === -1) {
      ret = ret.concat(transformVisitors[transformRunOrder[i]]);
    }
  }
  return ret;
}
function getVisitorsBySet(sets) {
  var visitorsToInclude = sets.reduce(function(visitors, set) {
    if (!transformSets.hasOwnProperty(set)) {
      throw new Error('Unknown visitor set: ' + set);
    }
    transformSets[set].forEach(function(visitor) {
      visitors[visitor] = true;
    });
    return visitors;
  }, {});
  var visitorList = [];
  for (var i = 0; i < transformRunOrder.length; i++) {
    if (visitorsToInclude.hasOwnProperty(transformRunOrder[i])) {
      visitorList = visitorList.concat(transformVisitors[transformRunOrder[i]]);
    }
  }
  return visitorList;
}
exports.getVisitorsBySet = getVisitorsBySet;
exports.getAllVisitors = getAllVisitors;
exports.transformVisitors = transformVisitors;
