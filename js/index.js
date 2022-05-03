
// imported modules/packages
const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    mongoose = require('mongoose'),
    Models = require('./model.js'),
    bodyParser = require('body-parser');

const app = express();

const { check, validationResult } = require('express-validator');

//import models for user and movie schema
const Movies = Models.Movie;
const Users = Models.User;

// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' })

// middleware functions used
app.use(morgan('common')); //logger for console
app.use(morgan('combined', { stream: accessLogStream })); //logger for log.txt file
app.use(express.static('public')); //serving static files
app.use(bodyParser.json()); //parsing headerbody
app.use(bodyParser.urlencoded({ extended: true})); //parsing headerbody

const cors = require('cors');
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));

let auth = require('./auth')(app); // imports our auth.js file
const passport = require('passport'); // imports passport module
require('./passport'); //imports our passport.js file

mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true }); //connect to database

// API routing

// return list of all movies in database
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(200).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// return data about a single movie by title
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ Title: req.params.title })
        .then((movie) => {  
            if(movie) {
                res.status(200).json(movie);
            }
            else{
                res.status(404).send('Movie is not in the database!');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//return data about a genre by name
app.get('/movies/genres/:genrename', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ 'Genre.Name': req.params.genrename })
        .then((movie) => {
            if(movie) {
                res.status(200).json(movie.Genre);
            }
            else{
                res.status(404).send('Genre is not in the database!');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// return data about a director by name 
app.get('/movies/directors/:name', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.name })
        .then((movie) => {
            if(movie) {
                res.status(200).json(movie.Director)
            }
            else{
                res.status(404).send('Director is not in the database!')
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// register a new user
app.post('/users',
  // Validation logic here for request
  //you can either use a chain of methods like .not().isEmpty()
  //which means "opposite of isEmpty" in plain english "is not empty"
  //or use .isLength({min: 5}) which means
  //minimum value of 5 characters are only allowed
  [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], (req, res) => {
    let hashedPassword = Users.hashedPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username })
        .then((user) => {
            if(user) {
                return res.status(400).send(req.body.Username + ' already exists!');
            }
            else {
                Users.create({
                    Username: req.body.Username,
                    Password: req.body.Password,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                })
                    .then((user) => {res.status(201).json(user)})
                    .catch((err) => {
                        console.error(err);
                        res.status(500).send('Error: ' + err);
                    });
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


// update users information by username
app.put('/users/:username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.username }, {$set: 
        {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        }
    },
    { new: true })
        .then((updatedUser) => {
            if(updatedUser) {
                res.status(200).json(updatedUser);
            }
            else{
                res.status(404).send('User is not in the database!');
            }
        })
        .catch((err) => {
            res.status(500).send('Error: ' + err);
        });

});

// add movie to users list of favorties
app.post('/users/:username/movies/:title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ Title: req.params.title })
        .then((movie) => {
            if(movie) {
                Users.findOneAndUpdate({ Username: req.params.username }, {
                    $addToSet: {FavoriteMovies: movie.id}
                },
                { new: true })
                    .then((updatedUser) => {
                        if(updatedUser) {
                            res.status(200).json(updatedUser);
                        }
                        else{
                            res.status(404).send('User is not in the database!');
                        }
                    })
                    .catch((err) => {
                        res.status(500).send('Error: ' + err);
                    });
            }
            else{
                return res.status(400).send(req.params.title + ' does not exist in the database!');
            }
        })
        .catch((err) => {
            res.status(500).send('Error: ' + err);
        });
});

// remove movie on users list of favorites
app.delete('/users/:username/:movietitle', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ Title: req.params.movietitle })
        .then((movie) => {
            if(movie) {
                Users.findOneAndUpdate({ Username: req.params.username }, {
                    $pull: {FavoriteMovies: movie.id}
                },
                { new: true })
                    .then((updatedUser) => {
                        if(updatedUser) {
                            res.status(200).json(updatedUser);
                        }
                        else{
                            res.status(404).send('User is not in the database!');
                        }
                    })
                    .catch((err) => {
                        res.status(500).send('Error: ' + err);
                    });
            }
            else{
                return res.status(400).send(req.params.movietitle + ' does not exist in the database!');
            }
        })
        .catch((err) => {
            res.status(500).send('Error: ' + err);
        });
});

// remove user from database by username
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndRemove({ Username: req.params.username })
        .then((user) => {
            if(!user) {
                res.status(400).send(req.params.username + ' was not found');
            }
            else {
                res.status(200).send(req.params.username + ' was deleted');
            }
        })
        .catch((err) => {
            res.status(500).send('Error: ' + err);
        });
});

app.get('/', (req, res) => {
    res.sendFile('public/documentation.html', { root: __dirname });
})

// error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});