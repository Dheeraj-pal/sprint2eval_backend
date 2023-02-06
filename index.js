const express = require("express");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { connection } = require("./config/db");
const { UserModel } = require("./models/user.model");
const { authenticate } = require("./middleware/authentication");
const { authorise } = require("./middleware/authorise");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("welcome");
});

app.post("/signup", (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    bcrypt.hash(password, 5, async function (err, hash) {
      const user = new UserModel({
        name,
        email,
        password: hash,
        role,
      });
      await user.save();
      res.send("signup successfully");
    });
  } catch (error) {
    res.send(error, "problem while signingup");
    console.log(error, "********problem while signingup********");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      res.send("please SignUp first");
    }
    const hashedpwd = user?.password;
    bcrypt.compare(password, hashedpwd, function (err, result) {
      if (result) {
        const token = jwt.sign(
          {
            userID: user._id,
            role: user.role,
          },
          "NORMAL_SECRET",
          {
            expiresIn: 60,
          }
        );
        const refresh_token = jwt.sign({ userID: user._id }, "REFRESH_SECRET", {
          expiresIn: 300,
        });
        res.send({ msg: "Login Successful", token, refresh_token });
      } else {
        res.send("login failed invalid credentials");
      }
    });
  } catch (error) {
    res.send(error, "problem while logging In");
    console.log(error, "********problem while logging In********");
  }
});

app.get("/logout", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const blacklisteddata = JSON.parse(
    fs.readFileSync("./blacklist.json", "utf-8")
  );

  blacklisteddata.push(token);
  fs.writeFileSync("./blacklist.json", JSON.stringify(blacklisteddata));
  res.send("Logged out successfully");
});

app.get("/goldrate", authenticate, (req, res) => {
  res.send("GoldRates");
});

app.get("/userstats", authenticate, authorise(["manager"]), (req, res) => {
  res.send("here are the UserStats");
});

app.get("/getnewtoken", (req, res) => {
  const refresh_token = req.headers.authorization?.split(" ")[1];

  if (!refresh_token) {
    res.send("login again --- refresh token error");
  }
  jwt.verify(refresh_token, "REFRESH_SECRET", function (err, decoded) {
    if (err) {
      res.send({ message: "please login first", err: err.message });
    } else {
      const token = jwt.sign({ userID: decoded.userID }, "NORMAL_SECRET", {
        expiresIn: 60,
      });
      res.send({ msg: "login Successful", token });
    }
  });
});

app.listen(1999, async () => {
  try {
    await connection;
    console.log("connected to DB");
  } catch (error) {
    console.log(error, "can't connect to DB");
  }
});
