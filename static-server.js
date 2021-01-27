const express = require('express')
const app = express()
app.use(express.static(__dirname))
app.listen(process.env.PORT || 4444, () => {
    console.log('Started static server')
})