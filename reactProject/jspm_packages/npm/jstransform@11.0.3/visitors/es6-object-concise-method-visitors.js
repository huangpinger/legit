/* */ 
var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');
var reservedWordsHelper = require('./reserved-words-helper');
function visitObjectConciseMethod(traverse, node, path, state) {
  var isGenerator = node.value.generator;
  if (isGenerator) {
    utils.catchupWhiteSpace(node.range[0] + 1, state);
  }
  if (reservedWordsHelper.isReservedWord(node.key.name)) {
    utils.catchup(node.key.range[0], state);
    utils.append('"', state);
    utils.catchup(node.key.range[1], state);
    utils.append('"', state);
  }
  utils.catchup(node.key.range[1], state);
  utils.append(':', state);
  renderConciseMethod(traverse, node, path, state);
  return false;
}
function renderConciseMethod(traverse, property, path, state) {
  if (property.computed) {
    var closingSquareBracketIndex = state.g.source.indexOf(']', property.key.range[1]);
    utils.catchup(closingSquareBracketIndex, state);
    utils.move(closingSquareBracketIndex + 1, state);
  }
  utils.append("function" + (property.value.generator ? "*" : ""), state);
  path.unshift(property);
  traverse(property.value, path, state);
  path.shift();
}
visitObjectConciseMethod.test = function(node, path, state) {
  return node.type === Syntax.Property && node.value.type === Syntax.FunctionExpression && node.method === true;
};
exports.renderConciseMethod = renderConciseMethod;
exports.visitorList = [visitObjectConciseMethod];
