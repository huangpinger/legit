/* */ 
var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');
function visitIdentifierUndefined(traverse, node, path, state) {
  utils.catchup(node.range[1], state, function(value) {
    return '(void 0)';
  });
}
visitIdentifierUndefined.test = function(node, path, state) {
  if (node.type === Syntax.Identifier && node.name === 'undefined' && !utils.identWithinLexicalScope('undefined', state)) {
    if (path[0]) {
      switch (path[0].type) {
        case Syntax.FunctionDeclaration:
        case Syntax.FunctionExpression:
        case Syntax.ArrowFunctionExpression:
          if (node !== path[0].body) {
            return false;
          }
          break;
        case Syntax.AssignmentExpression:
          if (node === path[0].left) {
            throw new Error('Illegal assignment to `undefined`. ' + 'This breaks assumptions of the transform.');
          }
          break;
        case Syntax.MemberExpression:
          if (node === path[0].property && !path[0].computed) {
            return false;
          }
          break;
        case Syntax.VariableDeclarator:
          if (node !== path[0].init) {
            return false;
          }
          break;
        case Syntax.Property:
          if (node === path[0].key) {
            return false;
          }
          break;
      }
    }
    return true;
  }
  return false;
};
exports.visitorList = [visitIdentifierUndefined];
