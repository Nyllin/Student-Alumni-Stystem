const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mysql = require("mysql");
const cors = require("cors");
const port = 8000;
const saltRound = 10;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    key: "userId",
    secret: "123IAT",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 60 * 60 * 24,
    },
  })
);

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "onlinealumnisystem",
  password: "",
});

app.listen(port, () => {
  console.log("Server is listening on port", port);
});

// Alumni
app.get("/alumnis/login", (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.alumni });
  } else {
    res.send({ loggedIn: false });
  }
});

app.post("/alumnis/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const sql = "SELECT * FROM alumni WHERE Email = ?;";

  db.query(sql, [email], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "An error occurred during login." });
    }

    if (data.length === 0) {
      console.log("Incorrect Username and/or Password!");

      return res
        .status(401)
        .json({ error: "Incorrect username and/or password." });
    }

    if (data.length > 0) {
      console.log(data);
      const hashedPassword = data[0].Password;

      bcrypt.compare(password, hashedPassword, (err, result) => {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ error: "An error occurred during login." });
        }
        if (result) {
          req.session.alumni = data[0];
          console.log(req.session.alumni);
          return res.status(200).json(data);
        } else {
          console.log("Incorrect Username and/or Password!");
          return res
            .status(401)
            .json({ error: "Incorrect username and/or password." });
        }
      });
    }
  });
});

app.post("/alumnis/register", (req, res) => {
  const { name, email, career, industry, password, confirmPassword } = req.body;

  if (
    !name ||
    !email ||
    !career ||
    !industry ||
    !password ||
    !confirmPassword
  ) {
    return res.status(400).json({ error: "Please fill out every field!" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Password does not match" });
  }

  bcrypt.hash(password, saltRound, (err, hash) => {
    if (err) {
      console.log(err);
    }
    const sql =
      "INSERT INTO alumni (Name, Email, Career, Industry, Password) VALUES (?, ?, ?, ?, ?)";
    const values = [name, email, career, industry, hash];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ error: "An error occurred during registration" });
      }
      res.status(200).json({ message: "Alumni registration successful" });
    });
  });
});

// Students

app.get("/students/login", (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.student });
  } else {
    res.send({ loggedIn: false });
  }
});
app.post("/students/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  const sql =
    "SELECT * FROM student WHERE Email = ? AND Password = ? AND Status = ?";

  if (email && password) {
    db.query(sql, [email, password, "active"], (err, data) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ error: "An error occurred during login." });
      } else {
        if (data.length > 0) {
          req.session.student = data[0];
          console.log(req.session.student);
          return res.status(200).json(data);
        } else {
          console.log("Incorrect Email and/or Password!");
          return res
            .status(401)
            .json({ error: "Incorrect username and/or password." });
        }
      }
    });
  } else {
    return res.status(400).json({ error: "Email and password are required." });
  }
});

// app.post("/students/register", (req, res) => {
//     const { name, email, password, confirmPassword } = req.body;

//     if (!name || !email || !password || !confirmPassword) {
//       return res.status(400).json({ error: "Please fill out every field!" });
//     }

//     if (password !== confirmPassword) {
//       return res.status(400).json({ error: "Password does not match" });
//     }

//     const sql = "INSERT INTO student (Name, Email, Password) VALUES (?, ?, ?)";
//     const values = [name, email, password];

//     db.query(sql, values, (err, result) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).json({ error: "An error occurred during registration" });
//       }
//       res.status(200).json({ message: "Registration successful" });
//     });
//   });

// Blog

app.get("/blogs", (req, res) => {
  const sql = "SELECT * FROM blog WHERE Status = ?";
  db.query(sql, ["no approve"], (err, data) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "An error occurred during registration" });
    }
    return res.status(200).json(data);
  });
});


app.get("/blogs/:id", (req, res) => {
  const id = req.params.id;
  console.log(id);
  
  const sql = "SELECT * FROM blog WHERE Status = ? AND blog_ID = ?";
  db.query(sql, ["no approve",id], (err, data) => {
    if (err) {
      console.error(err);
      return res
  .status(500)
  .json({ error: "An error occurred while fetching the blog post" });
    }
    return res.status(200).json(data);
  });
});
