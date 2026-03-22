const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const { userExtractor } = require('../utils/middleware')

//route for fetching all blogs
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})


//route for adding a new blog
blogsRouter.post('/', userExtractor, async (request, response) => {

  if(!request.body.title || !request.body.url){
    return response.status(400).json({ error: 'title and url are required' })
  }

  const user = request.user

  if(!user){
    return response.status(400).json({ error: 'userId missing or not valid' })
  }

  const blog = new Blog({
    title: request.body.title,
    author: request.body.author,
    url: request.body.url,
    likes: request.body.likes || 0,
    user: user._id
  })

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()
  response.status(201).json(savedBlog)
})

//route for deleting a blog
blogsRouter.delete('/:id', userExtractor, async (request, response) => {

  const blog = await Blog.findById(request.params.id)

  const user = request.user

  if(!blog){
    return response.status(404).end()
  }

  if(blog.user.toString() !== user.id.toString()){
    return response.status(403).json({ error: 'only creator can delete this blog' })
  }

  await Blog.findByIdAndDelete(request.params.id)
  response.status(204).end()
})


//route for updating a blog
blogsRouter.put('/:id', async (request, response) => {
  const body = request.body

  const updatedBlog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: body.user
  }

  const result = await Blog.findByIdAndUpdate(request.params.id, updatedBlog, { new: true }).populate('user', { username: 1, name: 1 })
  response.json(result)
})

module.exports = blogsRouter
