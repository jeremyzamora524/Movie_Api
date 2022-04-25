const morgan = require("morgan");
const express = require("express"),
   app = express();
const bodyParser = require("body-parser");
const uuid = require("uuid");

app.use(morgan("common"));
app.use(bodyParser.json());

let users = [
  {
    id: 1,
    name: "Jeremy",
    favoriteMovies: [],
  },
];

let movies = [
  {
    title: "Blood and Bone",
    year: "2009",
    director:{
      name: "Ben Ramsey"
    },
    genre: {
      name: "action"
    },
  },
  {
    title: "Project X",
    year: "2012",
    director: {
      name:  "Nima Nourizadeh",
    },
    genre: {
      name: "comedy",
    },
  },
  {
    title: 'The Wold of Wall Street',
    year: "2013",
    director: {
      name: 'Martin Scorsese',
    },
    genre: {
      name: 'drama/comedy',
    },
  },
];

app.post("/users", (req,res) => {
  const newUser = req.body;

  if (newUser.name){
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    res.status(400).send("users need names");
  }
});

app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.name = updatedUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send("no such user");
  }
});

app.post("/users/:id/:movieTitle", (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favoriteMovies.push(movieTitle);
    res.status(200).send(`${movieTitle}has been added to user ${id}'s array`);
  } else {
    res.status(400).send("no such user");
  }
});

app.delete("/users/:id/:movieTitle", (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favoriteMovies = user.favoriteMovies.filter(
      (title) => title !== movieTitle
    );
    res
      .status(200)
      .send(`${movieTitle}has been removed from user ${id}'s array`);
  } else {
    res.status(400).send("no such user");
  }
});

app.delete("/users/:id", (req, res) => {
  const { id } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    users = users.filter((user) => user.id != id);
    res.status(200).send(`user ${id} has been deleted`);
  } else {
    res.status(400).send("no such user");
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to my MyMovies site");
});

app.get("/movies", (req, res) => {
  res.status(200).json(movies);
});

app.get("/movies/:title", (req, res) => {
  const { title } = req.params;
  const movie = movies.find((movie) => movie.title === title);
  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send("no such movie");
  }
});

app.get("/movies/genre/:genreName", (req, res) => {
  const { genreName } = req.params;
  const genre = movies.find((movie) => movie.genre.name === genreName).genre;
  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send("no such genre");
  }
});

app.get("/movies/directors/:directorName", (req, res) => {
  const { directorName } = req.params;
  const director = movies.find(
    (movie) => movie.director.name === directorName
  ).director;
  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send("no such director");
  }
});


app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});