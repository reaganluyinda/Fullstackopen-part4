const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const User = require('../models/user')
const helper = require('./test_helper')
const bcrypt = require('bcrypt')

const { test, after, beforeEach } = require('node:test')

const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('secret', 10)

  const user = new User({
    username: helper.initialUsers[0].username,
    name: helper.initialUsers[0].name,
    passwordHash,
  })
  await user.save()
})

test('a valid user can be created', async () => {
  console.log('user test loaded')

  const usersAtStart = await helper.usersInDb()

  const newUser = {
    username: 'mluukkai',
    name: 'Matti luukkainen',
    password: 'salainen'
  }

  await api
    .post('/api/users')
    .send(newUser)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const usersAtEnd = await helper.usersInDb()
  assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)
})

test('username must be unique', async () => {

  const usersAtStart = await helper.usersInDb()

  const newUser = {
    username: 'root',
    name: 'Superuser',
    password: 'salainen'
  }

  await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const usersAtEnd = await helper.usersInDb()
  assert.strictEqual(usersAtEnd.length, usersAtStart.length)

})

test('username and password must be at least 3 characters long', async () => {
  const usersAtStart = await helper.usersInDb()

  const newUser = {
    username: 'ro',
    name: 'Superuser',
    password: 'sa'
  }

  await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const usersAtEnd = await helper.usersInDb()
  assert.strictEqual(usersAtEnd.length, usersAtStart.length)
})


after(async () => {
  await mongoose.connection.close()
})