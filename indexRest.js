/*
  indexRest.js is responsible for running the functionalities
  of nodeJS that involve calls to the database.
*/
const express = require('express');
const app = express()
const cors = require('cors')
const db = require('./queries');
const PORT = process.env.PORT || 3000;

app.use(express.json())
app.use(cors())

app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' });
})

app.get('/users/:id', db.getUserById);
app.get('/users/:email/:password_hash', db.getCreds)
app.get('/room/:id', db.getRoomById);
app.get('/reservations/:startRange/:endRange/:userId', db.oneDayCheck)
app.get('/reservations/:userId', db.getReservationsByUser);
app.post('/reservations/', db.createReservation);
app.put('/reservations/:id', db.updateReservation);
app.get('/reservations/:startRange/:endRange/:reservationTime/:capacity',
  db.checkReservationAvailability);
app.get('/reservations/:startRange/:endRange/:userId',
  db.blockCalendarDates);
app.get('/room/:startRange/:endRange/:reservationTime/:capacity', 
  db.getNextAvailableRoom);

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});