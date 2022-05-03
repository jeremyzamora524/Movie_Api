const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
//const Genres = Models.Genre;
//const Directors = Models.Director;

mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });



const morgan = require("morgan");
const express = require("express"),
   app = express();
const bodyParser = require("body-parser");
const uuid = require("uuid");

app.use(morgan("common"));
app.use(bodyParser.json());


app.get('/', (req, res) => {
  res.send('Welcome to my FlixApp!');
});

app.get('/documentation', (req, res) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });
});

app.get('/movies', (req, res) =>{
  Movies.find()
  .then((movies) => {
      res.status(201).json(movies);
  })
  .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + error);
  });
});

app.get('/movies/:Title', (req, res) =>{
  Movies.findOne({ Title: req.params.Title })
  .then((movie) => {
    res.json(movie);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + error);
  });
});

app.get('/users', function (req, res) {
  Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.get('/genre/:Name', (req, res) => {
  Movies.findOne({ 'Genre.Name': req.params.Name })
    .then((movie) => {
         res.json(movie.Genre.Description);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + error);
    });
});

app.get ('/director/:Name', (req, res) =>{
  Movies.findOne({ 'Director.Name': req.params.Name })
  .then((movie) => {
      res.json(movie.Director.Bio);
  })
  .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + error);
  });
});

app.post('/users', (req, res) =>{
  Users.findOne({ Userame: req.body.Username })
    .then((user) => {
      if(user){

      return res.status(400).send(req.body.Username + "  has been created ! ");

      } else {
        Users
          .create({
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday,

        })
          .then((user) => {
          res.status(201).json(user);
          })
          .catch((err) => {
              console.error(err);
              res.status(500).send('Error: ' + error);
            })
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error ' + err);
    });
});

app.put ('/users/:Username', (req, res) =>{
  Users.findOneAndUpdate({ User: req.params.Username }, { 
    $set:
      {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday,
      }
    },
    { new:true }) 
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error ' + err);
    });
  });

 
 app.post('/users/:Username/movies/:MovieID', (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, 
    {
     $push: { 
       FavoriteMovies: req.params.MovieID }
    },
    { new: true }, 
    (err, updatedUser) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

app.delete('/users/:Username/movies/:MovieID', (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, 
      { $pull: { FavoriteMovies: req.params.MovieID }
  },
  { new: true }, 
    (err, updatedUser) => {
      if (err) {
          console.error(err);
          res.status(500).send('Error: ' + err);
      } else {
          res.json(updatedUser);
      }
  });
});

app.delete('/users/:Username', (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


app.use(express.static('public')); 

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
	


