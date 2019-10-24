require("dotenv").config();
const express = require("express");
const massive = require("massive");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();

massive(process.env.CONNECTION_STRING).then(dbInstance => {
  app.set("db", dbInstance);
  console.log("Database Connected :)");
});

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "super secret",
    cookie: {
      maxAge: 1000 * 60 * 60
    }
  })
);

app.use(express.json());

app.post("/auth/register", async (req, res) => {
  const { username, password, email, phoneNumber } = req.body;
  const db = req.app.get("db");
  const response = await db.checkForTakenUsername(username);
  console.log(+response[0].count);
  if (+response[0].count <= 0) {
    const hash = await bcrypt.hash(password, 10);
    await db.registerUser(username, hash, email, phoneNumber);
    req.session.user = {
      username,
      email,
      phoneNumber
    };
    res.sendStatus(200);
    // db.registerUser(username, password, email, phoneNumber).then(() => {

    // })

    // bcrypt.hash(password, 10).then(hash => {

    // })
  } else {
    res.status(403).json("The username is taken. Please try another.");
  }
  // db.checkForTakenUsername(username).then(response => {

  // })
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const db = req.app.get("db");
  let hash = await db.getPassword(username);
  hash = hash[0].password;
  const areEqual = await bcrypt.compare(password, hash);
  if (areEqual) {
    //put them on session
    res.sendStatus(200);
  } else {
    res.status(401).json("Incorrect Username or Password");
  }
});

app.listen(5051, () => console.log(`Listening on Port 5051`));
