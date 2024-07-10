// Simple web server
const express = require('express')
const app = express()
app.use(express.static('.'))    // load the index.html from current directory
app.listen(5555)
console.log("Server running at http://localhost:5555")