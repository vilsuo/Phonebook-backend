require('dotenv').config()

const mongoose = require('mongoose')

const args = process.argv
if (!(args.length === 2 || args.length === 4)) {
  console.log('give name and number to create new contact')
  process.exit(1)
}

const password = process.argv[2]

const url = process.env.MONGODB_URI
  
mongoose.set('strictQuery',false)
mongoose.connect(url)

const personSchema = new mongoose.Schema({
    name: String,
    number: String,
})

const Person = mongoose.model('Person', personSchema)

const getPersonString = person => 
    `${person.name} number ${person.number}`

if (args.length === 2) {
    Person.find({}).then(result => {
        console.log('phonebook:')
        result.forEach(person => {
            console.log(getPersonString(person))
        })
        mongoose.connection.close()
    })
} else {
    const name = process.argv[2]
    const number = process.argv[3]

    const person = new Person({
        name: name,
        number: number,
    })
    
    person.save()
        .then(result => {
            console.log(`added ${getPersonString(person)} to phonebook`)
            mongoose.connection.close()
        })
}