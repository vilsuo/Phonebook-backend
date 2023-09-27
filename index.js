// The environment variables defined in the .env file can be taken into 
// use with the expression
require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()

const Person = require('./models/person')

// Middleware are functions that can be used for handling request and response 
// objects. They are called in the order that they're taken into use with
// the express server object's use method
// 
// Middleware functions have to be taken into use before routes if we want 
// them to be executed before the route event handlers are called. There 
// are also situations where we want to define middleware functions after 
// routes. In practice, this means that we are defining middleware functions 
// that are only called if no route handles the HTTP request.

/*
To make express show static content, the page index.html and the 
JavaScript, etc., it fetches

whenever express gets an HTTP GET request it will first check if the dist 
directory contains a file corresponding to the request's address. If a 
correct file is found, express will return it.

Now HTTP GET requests to the address www.serversaddress.com/index.html or 
www.serversaddress.com will show the React frontend
*/
app.use(express.static('dist'))

app.use(cors())

/*
The json-parser takes the raw data from the requests that are stored in 
the request object, parses it into a JavaScript object and assigns it to 
the request object as a new property body.

The json-parser middleware should be among the very first middleware 
loaded into Express
*/
app.use(express.json())

morgan.token('body-content', (req, res) => JSON.stringify(req.body))
app.use(morgan(
    ':method :url :status :res[content-length] - :response-time ms :body-content'
))

// TODO show collection size
app.get('/info', (request, response) => {
    //const info = `Phonebook has info for ${persons.length} people`
    const date = Date()
    response.send(`${info}<br/>${date}`)
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then(notes => {
        // Express automatically sets the Content-Type header with the 
        // appropriate value of application/json.
        response.json(notes)
    })
})

app.get('/api/persons/:id', (req, res, next) => {
    Person.findById(req.params.id)
        .then(person => {
            if (person) {
                res.json(person)
            } else {
                response.status(404).end()
            }
        })

        // passes the error forward with the next function. The next function 
        // is passed to the handler as the third parameter
        //
        // If next was called without a parameter, then the execution would 
        // simply move onto the next route or middleware. If the next function
        // is called with a parameter, then the execution will continue to 
        // the error handler middleware.
        .catch(error => next(error))

        /*
        // Given a malformed id as an argument (id that doesn't match 
        // the mongo identifier format), the findById method will throw 
        // an error causing the returned promise to be rejected
        .catch(error => {
            console.log(error)

            // The appropriate status code for the situation is 400 Bad 
            // Request because the situation fits the description 
            // perfectly: The request could not be understood by the 
            // server due to malformed syntax. The client SHOULD NOT 
            // repeat the request without modifications.
            res.status(400).end({ error: "malformatted id" })
        })
        */
})

// TODO not check for
// - dublicate names
// - errors in db
app.post('/api/persons', (req, res) => {
    const body = req.body

    if (!body.name || !body.number) {
        return res.status(400).json({
            error : 'person must have a name and a number'
        })
    }

    const name = body.name
    /*
    if (nameExists(name)) {
        return res.status(400).json({
            error : `person with name ${name} already exists`
        })
    }
    */

    const newPerson = new Person({
        name: name,
        number: body.number
    })

    newPerson.save()
        .then(savedPerson => {
            res.json(savedPerson)
        })
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndRemove(request.params.id)
      .then(result => {
        // The callback parameter could be used for checking if a resource 
        // was actually deleted
        response.status(204).end()
      })
      .catch(error => next(error))
  })

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

// This middleware will be used for catching requests made to non-existent 
// routes. For these requests, the middleware will return an error message 
// in the JSON format.

// It's also important that the middleware for handling unsupported 
// routes is next to the last middleware that is loaded into Express, 
// just before the error handler.
app.use(unknownEndpoint)


// We have written the code for the error handler among the rest of our 
// code. This can be a reasonable solution at times, but there are cases 
// where it is better to implement all error handling in a single place
//
// Express error handlers are middleware that are defined with a function
// that accepts four parameters
const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
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