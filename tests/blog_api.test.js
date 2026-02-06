const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const helper = require('./test_helper')
const { test, after, beforeEach } = require('node:test')


const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

//test for get and json
test('blogs are returned as json and the correct amount', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
  assert.strictEqual(response.body.length, helper.initialBlogs.length)
  console.log(response.body)

})

after(async () => {
  await mongoose.connection.close
})

//test for id property
test('blogs have an id property', async () => {
  const response = await api.get('/api/blogs')
  const blog = response.body[0]

  assert(blog.id)
  assert.strictEqual(blog._id, undefined)
  console.log(response.body)

})

//test for adding a new blog
test.only('a valid blog can be added', async () => {
  const newBlog = {
    title: 'Test Blog',
    author: 'Reagan Beckams',
    url: 'http://www.testblog.com',
    likes: 10,
  }

  const blogsAtStart = await helper.blogInDb()

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogInDb()
  assert.strictEqual(blogsAtEnd.length, blogsAtStart.length + 1)


  const response = await api.get('/api/blogs')

  const titles = response.body.map(blog => blog.title)

  assert(titles.includes('Test Blog'))
  //   console.log(response.body)

})