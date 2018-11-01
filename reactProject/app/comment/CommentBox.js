'use strict';
import  React from 'react';//从react中导入react组件
import CommentList from './CommentList';
import CommentFrom from  './CommentForm';
class CommentBox extends React.Component{
    //请求数据放到状态中
    constructor(props){
        super(props);
        this.state={data:[]};
    }
    render(){
        return(<div className="ui comments">
            <h1>评论</h1>
            <div className="ui divider"></div>
            <CommentList data={this.state.data}/>
            <CommentFrom/>
            </div>);
    }
}
export {CommentBox as default};//导出该评论组件