const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

//route for fetching all blogs
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
  response.json(blogs)
})


//route for adding a new blog
blogsRouter.post('/', async (request, response) => {

  if(!request.body.title || !request.body.url){
    return response.status(400).json({ error: 'title and url are required' })
  }

  const blog = new Blog({
    title: request.body.title,
    author: request.body.author,
    url: request.body.url,
    likes: request.body.likes || 0,
  })



  const savedBlog = await blog.save()
  response.status(201).json(savedBlog)
})

//route for deleting a blog
blogsRouter.delete('/:id', async (request, response) => {
  await Blog.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

module.exports = blogsRouter
