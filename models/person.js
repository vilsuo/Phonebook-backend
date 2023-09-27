// import enviroment variables from .env file
require('dotenv').config()

// Document databases like Mongo are schemaless, meaning that the database 
// itself does not care about the structure of the data that is stored in 
// the database. It is possible to store documents with completely 
// different fields in the same collection.
//
// The idea behind Mongoose is that the data stored in the database is 
// given a schema at the level of the application that defines the shape 
// of the documents stored in any given collection.
const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

const url = process.env.MONGODB_URI

console.log('connecting to', url)

mongoose.connect(url)
  .then(result => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

// Everything in Mongoose starts with a Schema. Each schema maps to a 
// MongoDB collection and defines the shape of the documents within that 
// collection.
//
// Each key in our schema defines a property in our documents which will 
// be cast to its associated SchemaType
const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 3,
    required: true
  },
  number: String,
})

// One way to format the objects returned by Mongoose is to modify the 
// toJSON method of the schema, which is used on all instances of the 
// models produced with that schema.
// 
// To modify the method we need to change the configurable options of the 
// schema, options can be changed using the set method of the schema
personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    // The _id property of Mongoose is an object. Transform it into a 
    // string just to be safe
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id

    // We don't want to return the mongo versioning field __v to the 
    // frontend
    delete returnedObject.__v
  }
})

// A model is a class with which we construct document. Instances of 
// Models are documents
//
// In the model definition, the first parameter is the singular name of 
// the model. The name of the collection will be the lowercase in plural 
// notes

// Defining Node modules differs slightly from the way of defining ES6 
// modules

// The public interface of the module is defined by setting a value to 
// the module.exports variable. We will set the value to be the Note 
// model. The other things defined inside of the module, like the 
// variables mongoose and url will not be accessible or visible to users 
// of the module.
module.exports = mongoose.model('Person', personSchema)