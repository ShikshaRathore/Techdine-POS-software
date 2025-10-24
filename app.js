if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");

const path = require("path");
const ownerSchema = require("./models/user");

// ---------- Basic setup ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));

//--------------DataBase--------------
const Mongo_Url = "mongodb://127.0.0.1:27017/Techdine";
async function main() {
  await mongoose.connect(Mongo_Url);
}
main()
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((err) => {
    console.log(err);
  });

//--------------API---------------------

app.get("/Techdine", (req, res) => {
  res.render("index.ejs");
});

app.get("/Techdine/signup", (req, res) => {
  res.render("signup.ejs");
});

app.post("/Techdine/signup", async (req, res) => {
  try {
    const { error, value } = ownerSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((e) => e.message) });

    const existingOwner = await owner.findOne({ email: value.email });
    if (existingOwner)
      return res.status(400).json({ error: "Email already registered" });

    const owner = await Owner.create(value);
    res.status(201).json({ message: "Signup successful", ownerId: owner._id });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.get("/Techdine/login", (req, res) => {
  res.render("login.ejs");
});
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
