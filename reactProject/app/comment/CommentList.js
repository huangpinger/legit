'use strict';
import React from 'react';
import Comment from './Comment';
class CommentList extends React.Component{
    render(){
        let commentNodes=this.props.data.map(comments =>{
            return(<Comment author={comments.author} date={comments.date}>{comments.text}</Comment>);
        } );
        return(<div>{commentNodes}</div>);
    }
}
export {CommentList as default};