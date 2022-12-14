/*
  This javascript queries file holds all the SQL commands
  to add, update, and fetch data from the database. This
  is one of the most important files of the project because
  it is the main operating system of the website.
*/
const Pool = require('pg').Pool

// render database
const pool = new Pool({
  connectionString: "postgres://room_reservation_user:tU1Egii2uyTYQ6WBMxtx4ehoEDgF3JqY@dpg-cdp9v9ha6gdooi1r83gg-a.oregon-postgres.render.com/room_reservation?ssl=true"
});

// local database usage
// const pool = new Pool({
//   database: 'Room_Reservation',
//   port: 5432,
// });

const getUserById = (request, response) => {
  const id = parseInt(request.params.id);
  pool.query('SELECT * FROM users WHERE user_id = $1',
     [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getCreds = (request, response) => {
  const email= request.params.email;
  const password = request.params.password_hash;
  pool.query(`SELECT * FROM users 
  WHERE email = $1 AND password_hash = $2`,
   [email, password], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getRoomById = (request, response) => {
  const id = parseInt(request.params.id);
  pool.query('SELECT * FROM rooms WHERE room_id = $1', 
    [id], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  })
}

const getReservationsByUser = (request, response) => {
  const userId = parseInt(request.params.userId);
  pool.query(`SELECT start_time::TIMESTAMP WITH TIME ZONE, 
  end_time::TIMESTAMP WITH TIME ZONE, 
  room_id, is_deleted, reservation_id, 
  created_at::TIMESTAMP WITH TIME ZONE FROM reservations
  WHERE user_id= $1 ORDER BY start_time ASC`, [userId],
   (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  })
}

const createReservation = (request, response) => {
  const { room_id, user_id, start_time, end_time, 
    number_of_people, created_at, is_deleted } = request.body;
  pool.query(`INSERT INTO reservations (room_id, user_id, start_time,  
  end_time, number_of_people, created_at, is_deleted) VALUES
  ($1, $2, $3::TIMESTAMP WITHOUT TIME ZONE, $4::TIMESTAMP WITHOUT TIME ZONE, 
  $5, $6::TIMESTAMP WITHOUT TIME ZONE, $7)`, 
  [ room_id, user_id, start_time, end_time, 
    number_of_people, created_at, is_deleted ], (error, results) => {
    if (error) {
      response.status(500).send(error.message);
    } else {
      response.status(201).send(`Reservation added`);
    }
  })
}

// "deletes" reservation
const updateReservation = (request, response) => {
  const id = parseInt(request.params.id);
  pool.query('UPDATE reservations SET is_deleted = ' + 
  'true WHERE reservation_id = $1', [id], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(201).send(`Reservation updated`);
  })
}

const oneDayCheck = (request, response) => {
  const startRange = request.params.startRange;
  const endRange = request.params.endRange;
  const userID = request.params.userId;
  pool.query(
  `SELECT user_id, start_time, end_time, room_id, is_deleted
   from reservations r 
    WHERE r.start_time >= $1::TIMESTAMP WITHOUT TIME ZONE
    AND r.end_time <= $2::TIMESTAMP WITHOUT TIME ZONE
    AND user_id = $3
    AND is_deleted = false `,
  [startRange, endRange, userID], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  })
}

const checkReservationAvailability = (request, response) => {
  const startRange = request.params.startRange;
  const endRange = request.params.endRange;
  const reservationTime = request.params.reservationTime;
  const capacity = request.params.capacity;
  pool.query(
    `SELECT available_time, series.room_id FROM 
    (
      SELECT start_time, end_time, room_id, is_deleted from reservations r 
      WHERE r.start_time >= $1::TIMESTAMP WITHOUT TIME ZONE
      AND r.end_time <= $2::TIMESTAMP WITHOUT TIME ZONE
      AND is_deleted = false 
      GROUP BY start_time, end_time, room_id, is_deleted
    ) rsv
        RIGHT OUTER JOIN 
    (
      SELECT * from generate_series($1::TIMESTAMP WITH TIME ZONE, 
      $2::TIMESTAMP WITH TIME ZONE,  
      '30 minutes'::interval) available_time,
      (SELECT room_id FROM ROOMS WHERE capacity >= $4) room_id
    ) series
    ON (series.available_time BETWEEN rsv.start_time 
    AND rsv.end_time - interval '30 minute') 
    AND series.room_id = rsv.room_id
    WHERE rsv.start_time IS NULL
    AND (series.available_time + CONCAT($3::INT, ' minutes')::interval) <= 
    $2::TIMESTAMP WITHOUT TIME ZONE + interval '30 minute' 
    ORDER BY available_time`,
    [startRange, endRange, reservationTime, capacity], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  })
}

const blockCalendarDates = (request, response) => {
  const startRange = request.params.startRange;
  const endRange = request.params.endRange;
  const userID = request.params.userId;
  pool.query(
    `SELECT user_id, start_time, is_deleted from reservations r 
      WHERE r.start_time > $1
      AND r.start_time < $2
      AND user_id = $3
      AND is_deleted = false`,
  [startRange, endRange, userID], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  })
}

const getNextAvailableRoom = (request, response) => {
  const startRange = request.params.startRange;
  const endRange = request.params.endRange;
  const reservationTime = request.params.reservationTime;
  const capacity = request.params.capacity;
  pool.query(
    `SELECT available_time, series.room_id FROM 
    (
      SELECT start_time, end_time, room_id, is_deleted from reservations r 
      WHERE r.start_time >= $1::TIMESTAMP WITHOUT TIME ZONE
      AND r.end_time <= $2::TIMESTAMP WITHOUT TIME ZONE
      AND is_deleted = false
      GROUP BY start_time, end_time, room_id, is_deleted
    ) rsv
        RIGHT OUTER JOIN 
    (
      SELECT * from generate_series($1::TIMESTAMP WITH TIME ZONE, 
        $2::TIMESTAMP WITH TIME ZONE,  
      '30 minutes'::interval) available_time, 
      (SELECT room_id FROM ROOMS WHERE capacity >= $4) room_id
    ) series
    ON (series.available_time BETWEEN $1::TIMESTAMP WITHOUT TIME ZONE 
      AND $2::TIMESTAMP WITHOUT TIME ZONE ) 
    AND series.room_id = rsv.room_id
    WHERE rsv.start_time IS NULL 
    AND (series.available_time + CONCAT($3::INT, ' minutes')::interval) <=
    $2::TIMESTAMP WITHOUT TIME ZONE + interval '30 minute' 
    ORDER BY available_time`,
  [startRange, endRange, reservationTime, capacity], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  })
}

module.exports = {
  getUserById,
  getCreds,
  getRoomById,
  oneDayCheck,
  getReservationsByUser,
  createReservation,
  updateReservation,
  checkReservationAvailability,
  blockCalendarDates,
  getNextAvailableRoom,
}