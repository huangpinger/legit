'use strict';

require('semantic-ui/semantic.min.css!');

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _CommentBox = require('./comment/CommentBox');

var _CommentBox2 = _interopRequireDefault(_CommentBox);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//模拟从服务器获取到的json格式的数据
// var comment=[
//     {"author":"王皓","date":"5分钟前","text":"我们去玩吧"},
//     {"author":"小红","date":"3分钟前","text":"今天天气真好！"},
//     {"author":"陆超","date":"1分钟前","text":"今天很适合郊游`~"},
// ]

_reactDom2.default.render(
//<CommentBox data={comment}/>,//利用数组模拟数据
//<CommentBox url="app/comment.json"/>,//模拟从服务器端返回的json文件
document.getElementById('app'));
//# sourceMappingURL=main.js.map