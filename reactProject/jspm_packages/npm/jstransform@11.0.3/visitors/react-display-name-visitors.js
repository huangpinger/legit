/* */ 
'use strict';
var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');
function shouldAddDisplayName(object) {
  if (object && object.type === Syntax.CallExpression && object.callee.type === Syntax.MemberExpression && object.callee.object.type === Syntax.Identifier && object.callee.object.name === 'React' && object.callee.property.type === Syntax.Identifier && object.callee.property.name === 'createClass' && object.arguments.length === 1 && object.arguments[0].type === Syntax.ObjectExpression) {
    var properties = object.arguments[0].properties;
    var safe = properties.every(function(property) {
      var value = property.key.type === Syntax.Identifier ? property.key.name : property.key.value;
      return value !== 'displayName';
    });
    return safe;
  }
  return false;
}
function flattenIdentifierOrMemberExpression(expr) {
  if (expr.type === Syntax.Identifier) {
    return [expr.name];
  } else if (expr.type === Syntax.MemberExpression) {
    if (!expr.computed && expr.property.type === Syntax.Identifier) {
      var flattenedObject = flattenIdentifierOrMemberExpression(expr.object);
      if (flattenedObject) {
        flattenedObject.push(expr.property.name);
        return flattenedObject;
      } else {
        return [expr.property.name];
      }
    }
  }
  return null;
}
function visitReactDisplayName(traverse, object, path, state) {
  var left,
      right;
  if (object.type === Syntax.AssignmentExpression) {
    left = object.left;
    right = object.right;
  } else if (object.type === Syntax.Property) {
    left = object.key;
    right = object.value;
  } else if (object.type === Syntax.VariableDeclarator) {
    left = object.id;
    right = object.init;
  }
  if (right && shouldAddDisplayName(right)) {
    var displayNamePath = flattenIdentifierOrMemberExpression(left);
    if (displayNamePath) {
      if (displayNamePath.length > 1 && displayNamePath[0] === 'exports') {
        displayNamePath.shift();
      }
      var displayName = displayNamePath.join('.');
      utils.catchup(right.arguments[0].range[0] + 1, state);
      utils.append('displayName: "' + displayName + '",', state);
    }
  }
}
visitReactDisplayName.test = function(object, path, state) {
  return (object.type === Syntax.AssignmentExpression || object.type === Syntax.Property || object.type === Syntax.VariableDeclarator);
};
exports.visitorList = [visitReactDisplayName];
