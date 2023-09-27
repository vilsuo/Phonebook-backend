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
*/
app.use(express.json())

morgan.token('body-content', (req, res) => JSON.stringify(req.body))
app.use(morgan(
    ':method :url :status :res[content-length] - :response-time ms :body-content'
))

let persons = [
    { 
      "id": 1,
      "name": "Arto Hellas", 
      "number": "040-123456"
    },
    { 
      "id": 2,
      "name": "Ada Lovelace", 
      "number": "39-44-5323523"
    },
    { 
      "id": 3,
      "name": "Dan Abramov", 
      "number": "12-43-234345"
    },
    { 
      "id": 4,
      "name": "Mary Poppendieck", 
      "number": "39-23-6423122"
    }
]

const generateRandomId = () => {
    return Math.floor(100000 * Math.random())
}

const nameExists = name => {
    return persons.find(person => person.name === name) !== undefined
}

app.get('/info', (request, response) => {
    const info = `Phonebook has info for ${persons.length} people`
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

// TODO how to hande error?
app.get('/api/persons/:id', (req, res) => {
    Person.findById(req.params.id).then(person => {
        res.json(person)
    })
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
    if (nameExists(name)) {
        return res.status(400).json({
            error : `person with name ${name} already exists`
        })
    }

    const newPerson = new Person({
        name: name,
        number: body.number
    })

    newPerson.save()
        .then(savedPerson => {
            res.json(savedPerson)
        })
})

app.delete('/api/persons/:id', (req, res) => {
    const id = Number(req.params.id)

    persons = persons.filter(person => person.id !== id)
    res.status(204).end()
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

// This middleware will be used for catching requests made to non-existent 
// routes. For these requests, the middleware will return an error message 
// in the JSON format.
app.use(unknownEndpoint)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})