/* */ 
'use strict';
var Syntax = require('esprima-fb').Syntax;
var utils = require('../src/utils');
function commaAfterLastParen(value) {
  var state = 'normal';
  var commaPos = 0;
  for (var i = 0; i < value.length; ++i) {
    if (state === 'normal') {
      if (value.substr(i, 2) === '//') {
        state = 'singleline';
        i += 1;
      } else if (value.substr(i, 2) === '/*') {
        state = 'multiline';
        i += 1;
      } else if (value.charAt(i).trim() !== '') {
        commaPos = i + 1;
      }
    } else if (state === 'singleline' && value.charAt(i) === '\n') {
      state = 'normal';
    } else if (state === 'multiline' && value.charAt(i) === '*' && i + 1 < value.length && value.charAt(i + 1) === '/') {
      i += 1;
      state = 'normal';
    }
  }
  return value.substring(0, commaPos) + ', ' + trimLeft(value.substring(commaPos));
}
function renderJSXLiteral(object, isLast, state, start, end) {
  var lines = object.value.split(/\r\n|\n|\r/);
  if (start) {
    utils.append(start, state);
  }
  var lastNonEmptyLine = 0;
  lines.forEach(function(line, index) {
    if (line.match(/[^ \t]/)) {
      lastNonEmptyLine = index;
    }
  });
  lines.forEach(function(line, index) {
    var isFirstLine = index === 0;
    var isLastLine = index === lines.length - 1;
    var isLastNonEmptyLine = index === lastNonEmptyLine;
    var trimmedLine = line.replace(/\t/g, ' ');
    if (!isFirstLine) {
      trimmedLine = trimmedLine.replace(/^[ ]+/, '');
    }
    if (!isLastLine) {
      trimmedLine = trimmedLine.replace(/[ ]+$/, '');
    }
    if (!isFirstLine) {
      utils.append(line.match(/^[ \t]*/)[0], state);
    }
    if (trimmedLine || isLastNonEmptyLine) {
      utils.append(JSON.stringify(trimmedLine) + (!isLastNonEmptyLine ? ' + " " +' : ''), state);
      if (isLastNonEmptyLine) {
        if (end) {
          utils.append(end, state);
        }
        if (!isLast) {
          utils.append(', ', state);
        }
      }
      if (trimmedLine && !isLastLine) {
        utils.append(line.match(/[ \t]*$/)[0], state);
      }
    }
    if (!isLastLine) {
      utils.append('\n', state);
    }
  });
  utils.move(object.range[1], state);
}
function renderJSXExpressionContainer(traverse, object, isLast, path, state) {
  utils.move(object.range[0] + 1, state);
  utils.catchup(object.expression.range[0], state);
  traverse(object.expression, path, state);
  if (!isLast && object.expression.type !== Syntax.JSXEmptyExpression) {
    utils.catchup(object.expression.range[1], state, trimLeft);
    utils.catchup(object.range[1] - 1, state, commaAfterLastParen);
  } else {
    utils.catchup(object.range[1] - 1, state, trimLeft);
  }
  utils.move(object.range[1], state);
  return false;
}
function quoteAttrName(attr) {
  if (!/^[a-z_$][a-z\d_$]*$/i.test(attr)) {
    return '"' + attr + '"';
  }
  return attr;
}
function trimLeft(value) {
  return value.replace(/^[ ]+/, '');
}
exports.renderJSXExpressionContainer = renderJSXExpressionContainer;
exports.renderJSXLiteral = renderJSXLiteral;
exports.quoteAttrName = quoteAttrName;
exports.trimLeft = trimLeft;
