const express = require('express');
const app = express();

const morgan = require('morgan');

app.use(morgan('common'));

let topMovies = [
  {
    name: 'Movie 1',
    director: 'Director 1'
  },
  {
    name: 'Movie 2',
    director: 'Director 2'
  },
  {
    name: 'Movie 3',
    director: 'Director 3'
  }
];

app.get('/movies', (req,res) => {
  res.json(topMovies);
});

app.get("/", (req,res) => {
  res.send('Welcome to the myMovies App!');
});

app.use(express.static('public'));


app.use((err,req,res,next) => {
  console.error(err.stack);
  res.status(500).send('Something isnt working');
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});