const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')
const helper = require('./test_helper')
const { test, after, beforeEach, describe } = require('node:test')
const bcrypt = require('bcrypt')



const api = supertest(app)

let token

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  await Blog.insertMany(helper.initialBlogs)

  const passwordHash = await bcrypt.hash('maguire123', 10)
  const user = new User({ username: 'maguire', passwordHash })
  await user.save()

  const result = await api
    .post('/api/login')
    .send({ username: 'maguire', password: 'maguire123' })

  token = result.body.token

})

//test for get and json
test('blogs are returned as json and the correct amount', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
  assert.strictEqual(response.body.length, helper.initialBlogs.length)
  //   console.log(response.body)

})


//test for id property
test('blogs have an id property', async () => {
  const response = await api.get('/api/blogs')
  const blog = response.body[0]

  assert(blog.id)
  assert.strictEqual(blog._id, undefined)
  //   console.log(response.body)

})

//test for adding a new blog
test('a valid blog can be added', async () => {

  const newBlog = {
    title: 'Test Blog',
    author: 'Reagan Beckams',
    url: 'http://www.testblog.com',
    likes: 10,
  }

  const blogsAtStart = await helper.blogInDb()

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
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

//test for adding a blog without token fails
test('a blog cannot be added without token', async () => {
  const newBlog = {
    title: 'Test Blog Without Token',
    author: 'Reagan Beckams',
    url: 'http://www.testblogwithouttoken.com',
    likes: 10,
  }

  const blogsAtStart = await helper.blogInDb()

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(401)

  const blogsAtEnd = await helper.blogInDb()
  assert.strictEqual(blogsAtEnd.length, blogsAtStart.length)

})

//test blog missing likes
test('if likes property is missing, it defaults to 0', async () => {
  const newBlog = {
    title: 'Test Blog Without Likes',
    author: 'Reagan Beckams',
    url: 'http://www.testblogwithoutlikes.com',
  }

  const response = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)



  assert.strictEqual(response.body.likes, 0)
})

//test for blog missing title and url
describe('test a blog without title and url', () => {
  test('blog without title is not added', async () => {
    const newBlog = {
      author: 'reagan beckams',
      url: 'http://www.testblogwithouttitleandurl.com',
      likes: 5,
    }

    const blogsAtStart = await helper.blogInDb()

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400)

    const blogsAtEnd = await helper.blogInDb()

    assert.strictEqual(blogsAtEnd.length, blogsAtStart.length)


  })


  test('blog without url is not added', async () => {
    const newBlog = {
      title: 'Test Blog Without URL',
      author: 'Reagan Beckams',
      likes: 5,
    }

    const blogsAtStart = await helper.blogInDb()

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400)

    const blogsAtEnd = await helper.blogInDb()

    assert.strictEqual(blogsAtEnd.length, blogsAtStart.length)


  })
})

describe('test deleting a blog', () => {
  test('a blog can be deleted', async () => {

    const blogsAtStart = await Blog.find({})
    // const blogToDelete = blogsAtStart[0]

    const newBlog = {
      title: 'Blog to be deleted',
      author: 'tester',
      url: 'http://www.blogtobedeleted.com',
      likes: 5,
    }

    const response = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogToDelete = response.body

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    const blogsAtEnd = await Blog.find({})

    assert.strictEqual(blogsAtEnd.length, blogsAtStart.length)

    const titles = blogsAtEnd.map(blog => blog.title)

    assert(!titles.includes(blogToDelete.title))
  })

  test('a blog cannot be deleted by another user', async () => {

    const blogsAtStart = await Blog.find({})

    const newBlog = {
      title: 'Blog to be deleted',
      author: 'tester',
      url: 'http://www.blogtobedeleted.com',
      likes: 5,
    }

    const response = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogToDelete = response.body

    const passwordHash = await bcrypt.hash('user123', 10)
    const otherUser = new User({ username: 'user2', passwordHash })
    await otherUser.save()

    const user2LoginResponse = await api
      .post('/api/login')
      .send({ username: 'user2', password: 'user123' })

    const otherUserToken = user2LoginResponse.body.token
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .expect(403)

    const blogsAtEnd = await Blog.find({})

    assert.strictEqual(blogsAtEnd.length, blogsAtStart.length + 1)
  })
})

test('a blog can be updated', async () => {

  const blogsAtStart = await Blog.find({})
  const blogToUpdate = blogsAtStart[0]
  const updatedBlog = {
    ...blogToUpdate.toJSON(),
    likes: blogToUpdate.likes + 10,
  }

  const response = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(updatedBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.body.likes, blogToUpdate.likes + 10)

})

after(async () => {
  await mongoose.connection.close()
})