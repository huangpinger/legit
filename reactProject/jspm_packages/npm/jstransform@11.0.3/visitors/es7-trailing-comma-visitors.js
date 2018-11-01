/* */ 
var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');
function visitFunctionCallArguments(traverse, node, path, state) {
  utils.catchup(node.callee.range[0], state);
  traverse(node.callee, [node].concat(path), state);
  var args = node['arguments'];
  for (var index = 0; index < args.length; ++index) {
    utils.catchup(args[index].range[0], state);
    traverse(args[index], [node].concat(path), state);
    utils.catchup(args[index].range[1], state);
  }
  utils.catchup(node.range[1], state, function(value) {
    return value.replace(",", '');
  });
  return false;
}
visitFunctionCallArguments.test = function(node, path, state) {
  return (node.type === Syntax.CallExpression || node.type === Syntax.NewExpression) && (node['arguments'].length > 0);
};
function visitFunctionDefinitionArguments(traverse, node, path, state) {
  var end = node.range[1];
  if (node.type === Syntax.MethodDefinition) {
    node = node.value;
  }
  for (var index = 0; index < node.params.length; ++index) {
    utils.catchup(node.params[index].range[0], state);
    traverse(node.params[index], [node].concat(path), state);
    utils.catchup(node.params[index].range[1], state);
  }
  utils.catchup(node.body.range[0], state, function(value) {
    var commaIndex = value.substr(0, value.indexOf(")")).indexOf(",");
    return commaIndex > -1 ? value.replace(/,/, '') : value;
  });
  traverse(node.body, [node].concat(path), state);
  utils.catchup(end, state);
  return false;
}
visitFunctionDefinitionArguments.test = function(node, path, state) {
  return (node.type === Syntax.FunctionExpression || node.type === Syntax.FunctionDeclaration || node.type === Syntax.MethodDefinition) && (node.params && node.params.length > 0 || node.value && node.value.params.length > 0);
};
exports.visitorList = [visitFunctionCallArguments, visitFunctionDefinitionArguments];
