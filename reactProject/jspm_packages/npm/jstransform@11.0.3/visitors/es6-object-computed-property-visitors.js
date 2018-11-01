/* */ 
(function(process) {
  var es6ObjectConciseMethods = require('./es6-object-concise-method-visitors');
  var es7SpreadProperties = require('./es7-spread-property-visitors');
  var Syntax = require('esprima-fb').Syntax;
  var utils = require('../src/utils');
  function process(traverse, node, path, state) {
    utils.catchupWhiteSpace(node.range[0], state);
    traverse(node, path, state);
    utils.catchup(node.range[1], state);
  }
  function es6ObjectComputedProperties(traverse, node, path, state) {
    var obj = utils.injectTempVar(state);
    utils.append('(' + obj + '={}', state);
    for (var ii = 0; ii < node.properties.length; ++ii) {
      var property = node.properties[ii];
      utils.append(',', state);
      if (property.type === Syntax.SpreadProperty) {
        utils.append('Object.assign(' + obj, state);
        var nextComputedPropertyIndex = ii + 1;
        while (nextComputedPropertyIndex < node.properties.length && !node.properties[nextComputedPropertyIndex].computed) {
          nextComputedPropertyIndex += 1;
        }
        utils.catchupWhiteSpace(node.properties[ii].range[0], state);
        var lastWasSpread = es7SpreadProperties.renderSpreadProperties(traverse, node.properties.slice(ii, nextComputedPropertyIndex), path, state, true);
        utils.append((lastWasSpread ? '' : '}') + ')', state);
        ii = nextComputedPropertyIndex - 1;
        continue;
      } else if (property.type === Syntax.Property && property.key.type === Syntax.Identifier && !property.computed) {
        utils.append(obj + '.' + property.key.name + '=', state);
      } else if (property.type === Syntax.Property) {
        utils.append(obj + '[', state);
        process(traverse, property.key, path, state);
        utils.append(']=', state);
      }
      if (property.method === true) {
        utils.catchupWhiteSpace(property.key.range[1], state);
        es6ObjectConciseMethods.renderConciseMethod(traverse, property, path, state);
      }
      process(traverse, property.value, path, state);
    }
    utils.catchupWhiteSpace(node.range[1], state);
    utils.append(',' + obj + ')', state);
    return false;
  }
  es6ObjectComputedProperties.test = function(node, path, state) {
    if (node.type !== Syntax.ObjectExpression) {
      return false;
    }
    for (var ii = 0; ii < node.properties.length; ++ii) {
      if (node.properties[ii].computed) {
        return true;
      }
    }
    return false;
  };
  exports.visitorList = [es6ObjectComputedProperties];
})(require('process'));
