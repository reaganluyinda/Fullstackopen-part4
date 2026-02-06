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

test.only('blogs have an id property', async () => {
  const response = await api.get('/api/blogs')
  const blog = response.body[0]

  assert(blog.id)
  assert.strictEqual(blog._id, undefined)
  console.log(response.body)

})