// The environment variables defined in the .env file can be taken into
// use with the expression
require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()

const Person = require('./models/person')

// Middleware are functions that can be used for handling request and
// response objects. They are called in the order that they're taken
// into use with the express server object's use method
//
// Middleware functions have to be taken into use before routes if we
// want them to be executed before the route event handlers are called.
// There are also situations where we want to define middleware functions
// after routes. In practice, this means that we are defining middleware
// functions that are only called if no route handles the HTTP request.

// To make express show static content, the page index.html and the
// JavaScript, etc., it fetches
//
// whenever express gets an HTTP GET request it will first check if the
// dist directory contains a file corresponding to the request's address.
// If a correct file is found, express will return it.
//
// Now HTTP GET requests to the address www.serversaddress.com/index.html
// or www.serversaddress.com will show the React frontend
app.use(express.static('dist'))

app.use(cors())

// The json-parser takes the raw data from the requests that are stored
// in the request object, parses it into a JavaScript object and assigns
// it to the request object as a new property body.
//
// The json-parser middleware should be among the very first middleware
// loaded into Express
app.use(express.json())

morgan.token('body-content', (req, ) => JSON.stringify(req.body))
app.use(morgan(
  ':method :url :status :res[content-length] - :response-time ms :body-content'
))

app.get('/info', (req, res, next) => {
  Person.estimatedDocumentCount()
    .then(count => {
      const info = `Phonebook has info for ${count} people`
      const date = Date()
      res.send(`${info}<br/>${date}`)
    })
    .catch(error => next(error))
})

app.get('/api/persons', (req, res, next) => {
  Person.find({})
    .then(notes => {
      // Express automatically sets the Content-Type header with the
      // appropriate value of application/json.
      res.json(notes)
    })
    .catch(error => next(error))
})

app.get('/api/persons/:id', (req, res, next) => {
  Person.findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person)
      } else {
        res.status(404).end()
      }
    })

    // Passes the error forward with the next function. The next
    // function is passed to the handler as the third parameter
    //
    // If next was called without a parameter, then the execution
    // would simply move onto the next route or middleware. If the
    // next function is called with a parameter, then the execution
    // will continue to the error handler middleware.
    //
    // Given a malformed id as an argument (id that doesn't match
    // the mongo identifier format), the findById method will throw
    // an error causing the returned promise to be rejected
    .catch(error => next(error))
})

// TODO check for
// - if body contains number
app.post('/api/persons', (req, res, next) => {
  // Without the json-parser, the body property would be undefined.
  // The json-parser takes the JSON data of a request, transforms it
  // into a JavaScript object and then attaches it to the body property
  // of the request object before the route handler is called.
  const body = req.body

  const name = body.name
  const newPerson = new Person({
    name: name,
    number: body.number
  })

  newPerson.save()
    .then(savedPerson => {
      res.json(savedPerson)
    })

    // If we try to store an object in the database that breaks one
    // of the constraints, the operation will throw an exception
    .catch(error => next(error))
})

// does not update name: updates number only
app.put('/api/persons/:id', (req, res, next) => {
  const body = req.body

  /*
  const person = {
    name: body.name,
    number: body.number
  }
  */
  // Notice that the findByIdAndUpdate method receives a regular
  // JavaScript object as its parameter, and not a new person object
  // created with the Person constructor function
  //
  // By default, the event handler receives the original document
  // without the modifications. We add the optional { new: true }
  // parameter, which will cause our event  handler to be called with
  // the new modified document instead of the original.
  //
  // When using findOneAndUpdate and related methods, mongoose doesn't
  // automatically run validation. To trigger this, you need to pass a
  // configuration object. For technical reasons, this plugin requires
  // that you also set the context option to query.
  Person.findByIdAndUpdate(
    req.params.id,
    { number : body.number },
    //{ name: body.name },
    // person,
    { new: true, runValidators: true, context: 'query' }
  ).then(updatedPerson => {
    res.json(updatedPerson)
  }).catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
  Person.findByIdAndRemove(req.params.id)
    .then(() => {
      // returned value is not used so it is not defined?

      // The callback parameter could be used for checking if a
      // resource was actually deleted
      res.status(204).end()
    })
    .catch(error => next(error))
})

// This middleware will be used for catching requests made to non-
// existent routes. For these requests, the middleware will return an
// error message in the JSON format.

// It's also important that the middleware for handling unsupported
// routes is next to the last middleware that is loaded into Express,
// just before the error handler.
const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

// We have written the code for the error handler among the rest of our
// code. This can be a reasonable solution at times, but there are cases
// where it is better to implement all error handling in a single place
//
// Express error handlers are middleware that are defined with a function
// that accepts four parameters
const errorHandler = (error, req, res, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message })
  }
  // In all other error situations, the middleware passes the error
  // forward to the default Express error handler
  next(error)
}
// this has to be the last loaded middleware.
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})