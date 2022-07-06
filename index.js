const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { v4 } = require("uuid");
const fs = require("fs");
const bcrypt = require("bcrypt");

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

let AllUsers = [];
let userId = 0;
let secretKey = "TOP SECRET KEY";

// classes
const User = require("./views/user");

class JwtToken {
  constructor(username, role) {
    this.username = username;
    // this.password = password;
    this.role = role;
  }

  createToken() {
    return jwt.sign(JSON.stringify(this), secretKey);
  }
}

function validateToken(req) {
  let token = req.cookies["Manish"];
  if (!token) {
    return "";
  }
  return jwt.verify(token, secretKey);
}

function findUser(username) {
  let isUserPresent = false;
  let indexOfUser = -1;

  for (let i = 0; i < AllUsers.length; i++) {
    if (AllUsers[i].credentials.username == username) {
      isUserPresent = true;
      indexOfUser = i;
    }
  }

  return [isUserPresent, indexOfUser];
}

// api

app.post("/login", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let role = req.body.role;

  // enc password
  // const enc_password = await bcrypt.hash(password, 10);

  // compare passwords
  let [isUserPresent, indexOfUser] = findUser(username);

  if (!isUserPresent) {
    res.status(401).send("No user found");
  }

  const storedPassword = AllUsers[indexOfUser].credentials.password;
  const isCorrectPassword = await bcrypt.compare(password, storedPassword);

  if (!isCorrectPassword) {
    res.status(401).send("Passwords are not matching");
    return;
  }
  let user = AllUsers[indexOfUser];
  let jwttoken = new JwtToken(username, user.role);
  let newToken = jwttoken.createToken();

  res.cookie("Manish", newToken);
  res.status(200).send(AllUsers[indexOfUser]);
});

app.get("/logout", (req, res) => {
  res.clearCookie("Manish");
  res.send("Logout successful");
});

// function to write user data
let fileName = "./file.txt";
function writeUserData(user) {
  let data = user.firstname;

  fs.appendFile(fileName, JSON.stringify(user) + "\n", (err) => {
    // console.log("Write failed");
    return;
  });

  console.log("Write success");
  return;
}

app.post("/createuser", async (req, res) => {
  let check = validateToken(req);
  console.log(check);
  if (check == "") {
    res.status(400).send("User is invalid");
    return;
  }
  if (check.role != "admin") {
    res.status(400).send("User is not admin");
    return;
  }

  let id = v4();
  let credentials = req.body.credentials;
  let firstname = req.body.firstname;
  let lastname = req.body.lastname;
  let role = req.body.role;
  let experience = req.body.experience;

  console.log(firstname);
  console.log(lastname);

  // unique username
  let [isUserPresent, indexOfUser] = findUser(credentials.username);

  if (isUserPresent) {
    res.status(400).send("Username is already used");
    return;
  }

  // enc password
  const enc_password = await bcrypt.hash(credentials.password, 10);

  credentials = {
    username: credentials.username,
    password: enc_password,
  };

  let newUser = new User(
    id,
    credentials,
    firstname,
    lastname,
    role,
    experience
  );
  AllUsers.push(newUser);

  // file write function
  writeUserData(JSON.stringify(newUser));
  console.log("FRONTEND: New user is created");
  console.log(newUser);
  res.status(200).send(newUser);
});

// get all users
app.get(`/getuser/:username`, (req, res) => {
  let check = validateToken(req);

  if (check == "") {
    res.status(400).send("User is invalid");
  }

  if (check.role != "admin") {
    res.status(400).send("User is not admin");
  }

  let username = req.params.username;

  let [isUserPresent, indexOfUser] = findUser(username);

  if (!isUserPresent) {
    res.status(403).send("User not present");
  }

  let data = AllUsers[indexOfUser];

  res.status(200).send(data);
});

app.get("/getallusers", (req, res) => {
  let check = validateToken(req);

  if (check == "") {
    res.status(400).send("User is invalid");
  }
  res.status(200).send(AllUsers);
});

app.post("/updateuser", (req, res) => {
  let { username, firstname, lastname, role, experience } = req.body;
  console.log(experience);
  let [isUserPresent, indexOfUser] = findUser(username);

  if (!isUserPresent) {
    res.status(400).send("user cannot update");
    return;
  }

  let user = AllUsers[indexOfUser];

  if (firstname != "") {
    user.firstname = firstname;
  }
  if (lastname != "") {
    user.lastname = lastname;
  }

  if (role != "") {
    user.role = role;
  }

  if (experience != -1) {
    user.experience = experience;
  }
  console.log(user);
  res.status(200).send(user);
});

app.listen(8000, async () => {
  console.log("Server is running on 9000");

  // creating first user

  let enc_password = await bcrypt.hash("myPassword", 10);
  // console.log(enc_password);

  let admin = {
    if: v4(),
    isActive: true,
    credentials: {
      username: "Bhupesh",
      password: enc_password,
    },
    firstname: "Bhupesh",
    lastname: "Jha",
    role: "admin",
    experience: 4,
  };

  AllUsers.push(admin);
  console.log("admin is created");

  let staff = {
    if: v4(),
    isActive: true,
    credentials: {
      username: "Om",
      password: enc_password,
    },
    firstname: "Om",
    lastname: "Jha",
    role: "staff",
    experience: 2,
  };

  AllUsers.push(staff);
  console.log("staff is created");
});
