/* */ 
(function(process) {
  var Syntax = require('esprima-fb').Syntax;
  var utils = require('../src/utils');
  function process(traverse, node, path, state) {
    utils.move(node.range[0], state);
    traverse(node, path, state);
    utils.catchup(node.range[1], state);
  }
  function visitForOfStatement(traverse, node, path, state) {
    var iter = utils.injectTempVar(state);
    var isArray = utils.injectTempVar(state);
    var k = utils.injectTempVar(state);
    var variable;
    if (node.left.type === Syntax.VariableDeclaration) {
      variable = node.left.declarations[0].id.name;
      utils.append('var ' + variable + ';', state);
    } else {
      variable = node.left.name;
    }
    utils.append('for(', state);
    utils.append(iter + '=', state);
    process(traverse, node.right, path, state);
    utils.append(',' + isArray + '=Array.isArray(' + iter + '),' + k + '=0,' + iter + '=' + isArray + '?' + iter + ':' + iter + '[/*global Symbol*/typeof Symbol=="function"' + '?Symbol.iterator:"@@iterator"]();;', state);
    if (node.body.type === Syntax.BlockStatement) {
      utils.catchup(node.body.range[0] + 1, state);
    } else {
      utils.catchup(node.body.range[0], state);
      utils.append('{', state);
    }
    utils.append('if(' + isArray + '){' + 'if(' + k + '>=' + iter + '.length) break;', state);
    utils.append(variable + '=' + iter + '[' + k + '++];', state);
    utils.append('}else{' + k + '=' + iter + '.next();' + 'if(' + k + '.done) break;', state);
    utils.append(variable + '=' + k + '.value;}', state);
    traverse(node.body, path, state);
    utils.catchup(node.body.range[1], state);
    if (node.body.type !== Syntax.BlockStatement) {
      utils.append('}', state);
    }
    return false;
  }
  visitForOfStatement.test = function(node, path, state) {
    return node.type === Syntax.ForOfStatement;
  };
  exports.visitorList = [visitForOfStatement];
})(require('process'));
