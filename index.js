const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const router = express.Router();

// app.use(bodyParser.json())

const whatsapp = require('./src/whats-app');
// var youtube = require('./search/index');

app.get('/whatsapp/register', whatsapp.register);
// app.post('/whatsapp/sendmessage', whatsapp.sendMessage);
// app.use('/search', youtube);

// app.post('/whatsapp/recibe', whatsapp.recibeMessage);
whatsapp.conectApi()
    // whatsapp.recibeMessage()
app.listen(3001, () => {
    console.log('conectado')
})