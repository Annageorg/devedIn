import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import formatDate from '../../utils/formatDate'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { addLike, removeLike, deletePost } from '../../actions/post'


const PostItem = ({
    addLike,
    removeLike,
    deletePost,
    auth,
    post: {
        _id,
        text,
        name,
        avatar,
        user,
        likes,
        comments,
        date
    }
}) => {
    return (
        <div className="post bg-white p-1 my-1">
            <div>
                <a href="profile.html">
                    <img
                        className="round-img"
                        src={avatar}
                        alt="User's avatar"
                    />
                    <h4>{name.trim().split(' ')[0]}</h4>
                </a>
            </div>
            <div>
                <p className="my-1">{text}</p>
                <p className="post-date">
                    Posted on {formatDate(date)}
                </p>
                <button 
                    onClick={() => addLike(_id)}
                    type="button" 
                    className="btn btn-light"
                >
                    <i className="fas fa-thumbs-up"></i>
                    {likes.length > 0 && (
                    <span>{' '}{likes.length}</span>
                    )}
                </button>
                <button 
                    onClick={() => removeLike(_id)}
                    type="button" 
                    className="btn btn-light"
                >
                    <i className="fas fa-thumbs-down"></i>
                </button>
                <Link to={`/post/${_id}`} className="btn btn-primary">
                    Discussion 
                    {comments.length > 0 && (
                    <span className='comment-count'>{comments.length}</span>
                    )}
                </Link>

                {!auth.loading && user === auth.user._id && (
                    <button
                        onClick={() => deletePost(_id)} 
                        type="button" 
                        className="btn btn-danger"
                    >
                    <i className="fas fa-times"></i>
                </button>
                )}         
            </div>
        </div>
    )
}

PostItem.propTypes = {
    post: PropTypes.object.isRequired,
    auth: PropTypes.object.isRequired,
    addLike: PropTypes.func.isRequired,
    removeLike: PropTypes.func.isRequired,
    deletePost: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
    auth: state.auth
})

export default connect(mapStateToProps, { addLike, removeLike, deletePost })(PostItem)
