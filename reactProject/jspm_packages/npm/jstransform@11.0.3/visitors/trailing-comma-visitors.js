/* */ 
var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');
function visitArrayOrObjectExpression(traverse, node, path, state) {
  var items = node.elements || node.properties;
  var lastItem = items[items.length - 1];
  path.unshift(node);
  traverse(items, path, state);
  path.shift();
  utils.catchup(lastItem.range[1], state);
  utils.catchup(node.range[1] - 1, state, function(value) {
    return value.replace(/,/g, '');
  });
  return false;
}
visitArrayOrObjectExpression.test = function(node, path, state) {
  return (node.type === Syntax.ArrayExpression || node.type === Syntax.ObjectExpression) && (node.elements || node.properties).length > 0 && !hasTrailingHole(node);
};
function hasTrailingHole(node) {
  return node.elements && node.elements.length > 0 && node.elements[node.elements.length - 1] === null;
}
exports.visitorList = [visitArrayOrObjectExpression];
