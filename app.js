const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertMoviesNameToPascalCase = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

//Returns a list of all movie names in the movie table
app.get("/movies/", async (request, response) => {
  const getAllMoviesNamesQuery = `
    SELECT  * 
    FROM movie;
    `;
  const moviesNameArray = await db.all(getAllMoviesNamesQuery);
  response.send(
    moviesNameArray.map((movieName) => convertMoviesNameToPascalCase(movieName))
  );
});

//Creates a new movie in the movie table. `movie_id` is auto-incremented
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
    INSERT INTO
    movie (director_Id, movie_Name, lead_Actor)
    VALUES (
        ${directorId},
        '${movieName}',
        '${leadActor}'
    );
    `;
  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

//to convert to pascalcase
const convertDbObjectToResponseObject = (dbObjet) => {
  return {
    movieId: dbObjet.movie_id,
    directorId: dbObjet.director_id,
    movieName: dbObjet.movie_name,
    leadActor: dbObjet.lead_actor,
  };
};

//Returns a movie based on the movie ID
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT * 
    FROM movie
    WHERE 
    movie_id = ${movieId};
    `;
  const movie = await db.get(getMovieQuery);
  response.send(convertDbObjectToResponseObject(movie));
});

//Updates the details of a movie in the movie table based on the movie ID
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
    UPDATE movie
    SET 
    director_Id= ${directorId},
    movie_Name = '${movieName}',
    lead_Actor = '${leadActor}';
    
    `;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//Deletes a movie from the movie table based on the movie ID
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM movie
    WHERE movie_id = ${movieId};
    `;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//convert director table to pascal case
const convertDirectorDetailsToPascalCase = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//Returns a list of all directors in the director table
app.get("/directors/", async (request, response) => {
  const getAllDirectorQuery = `
    SELECT * 
    FROM director;
    `;
  const directorArray = await db.all(getAllDirectorQuery);
  response.send(
    directorArray.map((director) =>
      convertDirectorDetailsToPascalCase(director)
    )
  );
});

const convertMovieNameToPascalCase = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

//Returns a list of all movie names directed by a specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMovieQuery = `
    SELECT movie_name
    FROM director INNER JOIN movie
    ON director.director_id = movie.director_id
    WHERE 
    director.director_id = ${directorId};
    `;
  const directedMovies = await db.all(getDirectorMovieQuery);
  console.log(directorId);
  response.send(
    directedMovies.map((moviesNames) =>
      convertMovieNameToPascalCase(moviesNames)
    )
  );
});

module.exports = app;
