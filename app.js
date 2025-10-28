if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");

const { isLoggedIn } = require("./middleware.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const SuperAdmin = require("./models/superAdmin.js");
const User = require("./models/user.js");
const Branch = require("./models/branch.js");

// ---------- Basic setup ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

//--------------DataBase--------------
const Mongo_Url = "mongodb://127.0.0.1:27017/Techdine";
async function main() {
  await mongoose.connect(Mongo_Url);
}

const sessionOptions = {
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() * 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

main()
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((err) => {
    console.log(err);
  });

app.use(session(sessionOptions));
app.use(flash());

// app.use(passport.initialize());
// app.use(passport.session());
// passport.use(
//   new LocalStrategy({ usernameField: "email" }, User.authenticate())
// );

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// ---------- Passport Setup ----------

app.use(passport.initialize());
app.use(passport.session());

// ---------- Passport Strategies Setup ----------

// For normal users
passport.use(
  "user-local",
  new LocalStrategy({ usernameField: "email" }, User.authenticate())
);

// For super admin
passport.use(
  "admin-local",
  new LocalStrategy({ usernameField: "email" }, SuperAdmin.authenticate())
);

//Serialize and deserialize both user types
passport.serializeUser((user, done) => {
  done(null, { id: user.id, type: user.constructor.modelName });
});

passport.deserializeUser(async (obj, done) => {
  try {
    if (obj.type === "SuperAdmin") {
      const admin = await SuperAdmin.findById(obj.id);
      return done(null, admin);
    } else if (obj.type === "User") {
      const user = await User.findById(obj.id);
      return done(null, user);
    }
  } catch (err) {
    done(err);
  }
});

//Flash + locals middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

//--------------API---------------------

app.get("/Techdine", (req, res) => {
  res.render("./layouts/index.ejs");
});

app.get("/signup", (req, res) => {
  res.render("./users/signup.ejs");
});

app.post("/signup", async (req, res) => {
  try {
    let { restaurantName, username, email, password } = req.body;
    const newUser = new User({ restaurantName, username, email });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      console.log(registeredUser);
      req.flash("success", "User Registered Successfully!");
      res.redirect("/add-branch");
    });
  } catch (err) {
    req.flash("success", err.message);
    res.redirect("/signup");
  }
});

app.get("/login", (req, res) => {
  res.render("./users/login.ejs");
});

app.post("/login", (req, res, next) => {
  const { email } = req.body;

  // Check if this email belongs to a SuperAdmin
  SuperAdmin.findOne({ email }).then((admin) => {
    if (admin) {
      passport.authenticate("admin-local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          req.flash("success", "Invalid credentials for Super Admin");
          return res.redirect("/login");
        }
        req.logIn(user, (err) => {
          if (err) return next(err);
          req.flash("success", `Welcome, Super Admin ${user.name}`);
          return res.redirect("/admin-dashboard");
        });
      })(req, res, next);
    } else {
      // Otherwise, try normal user login
      passport.authenticate("user-local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          req.flash("error", "Invalid credentials for User");
          return res.redirect("/login");
        }
        req.logIn(user, (err) => {
          if (err) return next(err);
          req.flash("success", `Welcome back, ${user.username}`);
          return res.redirect("/dashboard");
        });
      })(req, res, next);
    }
  });
});

// app.post(
//   "/login",
//   passport.authenticate("local", {
//     failureRedirect: "/login",
//     failureFlash: true,
//   }),
//   async (req, res) => {
//     req.flash("success", "User loggedIn Successfully!");
//     res.redirect("/dashboard");
//   }
// );

app.get("/dashboard", isLoggedIn, async (req, res) => {
  if (req.user.role === "superadmin") {
    return res.redirect("/admin-dashboard");
  }

  const ownerId = req.user._id;
  // Fetch all branches owned by this owner and populate owner details
  const branches = await Branch.find({ owner: ownerId }).populate(
    "owner",
    "username restaurantName email"
  );

  res.render("./layouts/dashboard.ejs", { user: req.user, branches });
});

app.get("/add-branch", isLoggedIn, (req, res) => {
  res.render("./branch/addBranch.ejs");
});

// Create Branch
app.post("/add-branch", isLoggedIn, async (req, res) => {
  try {
    const { branchName, country, address, branchHead } = req.body;
    // Assuming the logged-in user is the owner
    const ownerId = req.user._id;

    const newBranch = new Branch({
      branchName,
      country,
      address: address,
      owner: ownerId,
      branchHead: branchHead || null,
    });

    await newBranch.save();
    req.flash("success", "New Branch Created Successfully!");
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    req.flash("success", "Failed to create branch!");
    res.redirect("/add-branch");
  }
});

app.get("/admin-dashboard", isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      req.flash("error", "Access denied!");
      return res.redirect("/login");
    }

    const allUsers = await User.find({})
      .select("restaurantName username email")
      .lean();

    const allBranches = await Branch.find({})
      .populate("owner", "restaurantName username email")
      .lean();

    const usersWithBranchCount = allUsers.map((user) => {
      const count = allBranches.filter(
        (branch) =>
          branch.owner && branch.owner._id.toString() === user._id.toString()
      ).length;

      return { ...user, branchCount: count };
    });

    // Render to EJS
    res.render("./layouts/super-admin-dashboard.ejs", {
      admin: req.user,
      users: usersWithBranchCount,
      branches: allBranches,
    });
  } catch (err) {
    console.error("Error loading admin dashboard:", err);
    req.flash("success", "Something went wrong while loading dashboard!");
    res.redirect("/login");
  }
});

// app.get("/admin-dashboard", isLoggedIn, (req, res) => {
//   if (req.user.role !== "superadmin") {
//     req.flash("success", "Access denied!");
//     return res.redirect("/login");
//   }
//   res.render("super-admin-dashboard.ejs", { admin: req.user });
// });

app.get("/menu", (req, res) => {
  res.render("menu.ejs");
});

app.get("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "User logged Out!");
    res.redirect("/techdine");
  });
});
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
