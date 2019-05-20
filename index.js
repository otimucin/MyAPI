require('dotenv').config()

const path = require('path')

const express = require('express')
const request = require('request')
const cors = require('cors')
const session = require('express-session')
const config = require('./config')

const app = express()

const vehiclesUrl =
  'https://api.mercedes-benz.com/experimental/connectedvehicle/v1/vehicles'

app.use(express.static(path.join(__dirname, 'views')))
app.use(cors())

// If secure set to true the cookie will only be set with HTTPS
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.get('/oauth/redirect', (req, res) => {
  const requestToken = req.query.code;
  const clientID = config.CLIENT_ID;
  const clientSecret = config.SECRET_CLIENT_ID;
  const credential = Buffer.from(clientID + ':' + clientSecret).toString('base64');
  const options = {
    method: 'POST',
    url: 'https://api.secure.mercedes-benz.com/oidc10/auth/oauth/v2/token',
    headers: { 'content-type': 'application/x-www-form-urlencoded', credential },
    form: {
      grant_type: 'authorization_code',
      client_id: clientID,
      client_secret: clientSecret,
      code: requestToken,
      redirect_uri: 'http://localhost:8080/oauth/redirect'
    },
    json: true
  };


  request(options, function (error, response, body) {
    if (error) throw new Error(error)

    const accessToken = body.access_token
    req.session.accessToken = accessToken
    res.redirect('/vehicles.html')
  })
})

app.get('/vehicles', (req, res) => {
  const accessToken = req.session.accessToken
  
  const options = {
    method: 'GET',
    url: vehiclesUrl,
    headers: {
      authorization: 'Bearer ' + accessToken,
      'content-type': 'application/json'
    }
  }
  console.log(accessToken)

  request(options, function (error, response, body) {
    if (error) throw new Error(error)

    res.send(body)
  })
})

app.get('/vehicles/:vehicleId', (req, res) => {
  const vehicleId = req.params.vehicleId
  const accessToken = req.session.accessToken

  const options = {
    method: 'GET',
    url: vehiclesUrl + '/' + vehicleId,
    headers: {
      authorization: 'Bearer ' + accessToken,
      'content-type': 'application/json'
    }
  }

  request(options, function (error, response, body) {
    if (error) throw new Error(error)

    res.send(body)
  })
})

app.get('/vehicles/:vehicleId/doors', (req, res) => {
  const vehicleId = req.params.vehicleId
  const accessToken = req.session.accessToken

  const options = {
    method: 'GET',
    url: vehiclesUrl + '/' + vehicleId + '/doors',
    headers: {
      authorization: 'Bearer ' + accessToken,
      'content-type': 'application/json'
    }
  }

  request(options, function (error, response, body) {
    if (error) throw new Error(error)

    res.send(body)
  })
})

app.post('/vehicles/:vehicleId/doors', (req, res) => {
  const vehicleId = req.params.vehicleId
  const accessToken = req.session.accessToken
  const command = req.query.command

  const dataString = `{ "command": "${command}"}`

  const options = {
    method: 'POST',
    url: vehiclesUrl + '/' + vehicleId + '/doors',
    headers: {
      authorization: 'Bearer ' + accessToken,
      'content-type': 'application/json'
    },
    form: dataString
  }

  request(options, function (error, response, body) {
    if (error) throw new Error(error)

    res.send(body)
  })
})
var port = process.env.PORT != null ? process.env.PORT : 8080;
app.listen(port, () =>
  console.log(`Server is opened at ${port}`)
)
