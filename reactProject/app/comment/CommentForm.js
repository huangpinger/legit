'use strict';
import React from 'react';
class CommentForm extends React.Component{
    render(){
        return(<from className="ui reply form">
            <div className="field">
                <input type="text" placeholder="姓名"/>
            </div>
            <div className="field">
                <textarea placeholder="说点什么..."></textarea>
            </div>
            <button type="submit" className="ui blue button">添加评论</button>
        </from>);
    }
}
export {CommentForm as default};