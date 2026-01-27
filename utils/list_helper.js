const _ = require('lodash')
const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  if(blogs.length === 0){
    return null
  }

  return blogs.reduce((favorite, blog) => {
    return blog.likes > favorite.likes ? blog : favorite
  })
}

const mostBlogs = (blogs) => {
  if(blogs.length === 0){
    return null
  }

  const groupedByAuthor = _.groupBy(blogs, 'author')

  const authWithCounts = _.map(groupedByAuthor, (blogs, author) => ({ author, blogs: blogs.length }))
  return _.maxBy(authWithCounts, 'blogs')
}


const mostLikes = (blogs) => {
  if(blogs.length === 0){
    return null
  }


  const likesByAuthor = _.groupBy(blogs, 'author')

  const authorsWithLikes = _.map(likesByAuthor, (blogs, author) => ({ author, likes: _.sumBy(blogs, 'likes'), }))

  return _.maxBy(authorsWithLikes, 'likes')
}
module.exports = { dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes }
