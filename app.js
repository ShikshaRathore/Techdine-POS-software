if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const bcrypt = require("bcrypt");

const { isLoggedIn, attachStatistics } = require("./middleware.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const kotController = require("./controllers/kotController.js");
const posController = require("./controllers/posController.js");
const reservationRoutes = require("./routes/reservation.js");
const customerRoutes = require("./routes/customerRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const deliveryExecutiveRoutes = require("./routes/deliveryExecutiveRoutes");

//-------------- Model -------------------
const SuperAdmin = require("./models/superAdmin.js");
const User = require("./models/user.js");
const Branch = require("./models/branch.js");
const Menu = require("./models/menu.js");
const MenuItem = require("./models/menuItem.js");
const Category = require("./models/category.js");
const Table = require("./models/table.js");
const Area = require("./models/area.js");
const Order = require("./models/order.js");
const KOT = require("./models/kot.js");
const Customer = require("./models/customer.js");
const Staff = require("./models/staff.js");

// This MUST come right after creating the Express app
app.set("trust proxy", 1);

// ---------- Basic setup ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const multer = require("multer");
const { storage } = require("./cloudConfig.js");
const menuItem = require("./models/menuItem.js");
const upload = multer({ storage });

// ---------- Database ----------
const dbUrl = process.env.ATLASDB_URL;
mongoose
  .connect(dbUrl)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err.message));

// ---------- Session ----------
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: { secret: process.env.SECRET },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => console.error("Session Store Error:", err));

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // important for render
  },
};

app.use(session(sessionOptions));
app.use(flash());

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

app.use("/reservations", reservationRoutes);
app.use("/restaurant", customerRoutes);
app.use("/admin-dashboard", superAdminRoutes);
app.use("/deliveryExecutive", deliveryExecutiveRoutes);

//--------------API---------------------

app.get("/", (req, res) => {
  res.render("layouts/index.ejs");
});

app.get("/Techdine", (req, res) => {
  res.render("layouts/index.ejs");
});

app.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

// ========== SIGNUP ROUTE ==========
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
    req.flash("error", err.message);
    res.redirect("/signup");
  }
});

app.get("/login", (req, res) => {
  res.render("users/login");
});

app.post("/login", (req, res, next) => {
  const { email } = req.body;

  // Check if this email belongs to a SuperAdmin
  SuperAdmin.findOne({ email }).then((admin) => {
    if (admin) {
      passport.authenticate("admin-local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          req.flash("error", "Invalid credentials for Super Admin");
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
      passport.authenticate("user-local", async (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          req.flash("success", "Invalid credentials for User");
          return res.redirect("/login");
        }
        req.logIn(user, async (err) => {
          if (err) return next(err);

          // ✅ Find user's first branch after login
          const firstBranch = await Branch.findOne({ owner: user._id });

          if (firstBranch) {
            req.flash("success", `Welcome back, ${user.username}`);
            return res.redirect(`/dashboard/${firstBranch._id}`);
          } else {
            // If no branch exists, redirect to add branch
            req.flash("error", "Please create a branch first");
            return res.redirect("/add-branch");
          }
        });
      })(req, res, next);
    }
  });
});

// ========== DASHBOARD ROUTE ==========
// Old route - redirect to first branch
app.get("/dashboard", isLoggedIn, async (req, res) => {
  try {
    if (req.user.role === "superadmin") return res.redirect("/admin-dashboard");

    const ownerId = req.user._id;
    const firstBranch = await Branch.findOne({ owner: ownerId });

    if (firstBranch) {
      return res.redirect(`/dashboard/${firstBranch._id}`);
    } else {
      req.flash("error", "Please create a branch first");
      return res.redirect("/add-branch");
    }
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.redirect("/");
  }
});

// New route with branchId
app.get(
  "/dashboard/:branchId",
  isLoggedIn,
  attachStatistics,
  async (req, res) => {
    try {
      if (req.user.role === "superadmin")
        return res.redirect("/admin-dashboard");

      const ownerId = req.user._id;
      const { branchId } = req.params;

      // Get all branches for the dropdown
      const branches = await Branch.find({ owner: ownerId }).populate(
        "owner",
        "username restaurantName email"
      );

      // Verify the requested branch belongs to this user
      const branch = await Branch.findOne({ _id: branchId, owner: ownerId });

      if (!branch) {
        req.flash("error", "Branch not found or access denied");
        const firstBranch = branches[0];
        if (firstBranch) {
          return res.redirect(`/dashboard/${firstBranch._id}`);
        }
        return res.redirect("/add-branch");
      }

      res.render("layouts/dashboard.ejs", {
        user: req.user,
        branches,
        branch,
        branchId: branch._id.toString(),
      });
    } catch (err) {
      console.error("Error loading dashboard:", err);
      res.redirect("/");
    }
  }
);

app.get("/add-branch", isLoggedIn, (req, res) => {
  res.render("branch/addBranch.ejs");
});

// ========== ADD BRANCH ROUTE ==========
app.post("/add-branch", isLoggedIn, async (req, res) => {
  try {
    const { branchName, country, address, branchHead } = req.body;
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
    // ✅ Redirect to the new branch dashboard
    res.redirect(`/dashboard/${newBranch._id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to create branch!");
    res.redirect("/add-branch");
  }
});

// app.get("/admin-dashboard", isLoggedIn, async (req, res) => {
//   try {
//     if (req.user.role !== "superadmin") {
//       req.flash("error", "Access denied!");
//       return res.redirect("/login");
//     }

//     const allUsers = await User.find({})
//       .select("restaurantName username email")
//       .lean();

//     const allBranches = await Branch.find({})
//       .populate("owner", "restaurantName username email")
//       .lean();

//     const usersWithBranchCount = allUsers.map((user) => {
//       const count = allBranches.filter(
//         (branch) =>
//           branch.owner && branch.owner._id.toString() === user._id.toString()
//       ).length;

//       return { ...user, branchCount: count };
//     });

//     // Render to EJS
//     res.render("./layouts/super-admin-dashboard.ejs", {
//       admin: req.user,
//       users: usersWithBranchCount,
//       branches: allBranches,
//     });
//   } catch (err) {
//     console.error("Error loading admin dashboard:", err);
//     req.flash("success", "Something went wrong while loading dashboard!");
//     res.redirect("/login");
//   }
// });

app.get("/showMenu/:id", async (req, res) => {
  try {
    const branchId = req.params.id;
    const menus = await Menu.find({ branch: branchId }).populate("branch");
    const menuIds = menus.map((m) => m._id);

    const items = await MenuItem.find({ menu: { $in: menuIds } })
      .populate("menu")
      .populate("category")
      .populate("branch");

    res.render("./dashboard/showMenu.ejs", { menus, items, branchId });
  } catch (err) {
    console.error("Error fetching menus:", err);
    res.status(500).send("Server error");
  }
});

app.get("/addMenu/:id", (req, res) => {
  const branchId = req.params.id;
  res.render("./dashboard/addMenu.ejs", { branchId });
});

app.post("/addMenu/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { menuName } = req.body;

    // Validation
    if (!menuName || menuName.trim() === "") {
      req.flash("error", "Menu name is required"); // If using flash messages
      return res.redirect(`/dashboard/${branchId}`);
    }

    // Validate branchId
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      req.flash("error", "Invalid branch ID");
      return res.redirect("/dashboard");
    }

    // Check for duplicate menu name in the same branch
    const existingMenu = await Menu.findOne({
      branch: branchId,
      menuName: { $regex: new RegExp(`^${menuName.trim()}$`, "i") }, // Case-insensitive
    });

    if (existingMenu) {
      req.flash(
        "error",
        "A menu with this name already exists for this branch"
      );
      return res.redirect(`/dashboard/${branchId}`);
    }

    // Create and save new menu
    const newMenu = await Menu.create({
      branch: branchId,
      menuName: menuName.trim(),
    });

    req.flash("success", `Menu "${menuName}" added successfully!`);
    res.redirect(`/dashboard/${branchId}`);
  } catch (err) {
    console.error("Error adding menu:", err);
    req.flash("error", "Failed to add menu!");
    if (branchId) {
      res.redirect(`/dashboard/${branchId}`);
    } else {
      res.redirect("/dashboard"); // Fallback if branchId wasn't set
    }
  }
});

app.get("/showMenuItems/:id", async (req, res) => {
  try {
    const branchId = req.params.id;
    const menus = await Menu.find({ branch: branchId }).populate("branch");
    const menuIds = menus.map((m) => m._id);
    const categories = await Category.find({ menu: { $in: menuIds } });

    const menuItems = await MenuItem.find({ branch: branchId })
      .populate("menu", "menuName")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .lean();

    // DON'T transform category - keep it as object
    menuItems.forEach((item) => {
      if (!item.menuItemImage) {
        item.menuItemImage = { url: "", filename: "" };
      }
      // Add fallback for missing category
      if (!item.category) {
        item.category = { name: "No Category" };
      }
    });

    res.render("dashboard/showMenuItems.ejs", {
      menus,
      branchId,
      menuItems,
      categories,
      title: "Menu Items",
    });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.render("dashboard/showMenuItems.ejs", {
      menus: [],
      menuItems: [],
      categories: [],
      title: "Menu Items",
    });
  }
});

app.get("/addMenuItem/:branchId", isLoggedIn, async (req, res) => {
  try {
    const { branchId } = req.params;

    // Find branch
    const branch = await Branch.findById(branchId);
    if (!branch) {
      req.flash("error", "Branch not found");
      return res.redirect("/dashboard");
    }

    // Find menu for this branch
    const menus = await Menu.find({ branch: branchId });
    if (!menus) {
      req.flash("error", "Menu not found for this branch");
      return res.redirect(`/dashboard/${branchId}`);
    }

    // ✅ Fetch categories for this menu
    const categories = await Category.find({ menu: menus._id }).sort({
      name: 1,
    });

    res.render("dashboard/addMenuItem.ejs", {
      branchId,
      branch,
      menus,
      categories, // ✅ Pass categories to view
    });
  } catch (err) {
    console.error("Error loading add menu item page:", err);
    req.flash("error", "Failed to load page");
    res.redirect("/dashboard");
  }
});

// ✅ POST Route - Add Menu Item to Selected Menu
app.post(
  "/addMenuItem/:branchId",
  isLoggedIn,
  upload.single("menuItemImage"),
  async (req, res) => {
    try {
      const { branchId } = req.params;
      const { category, itemName, price, description, type, menu } = req.body;

      if (!menu) throw new Error("Please select a menu!");

      // Get Cloudinary upload info
      const url = req.file?.path;
      const filename = req.file?.filename;

      // Validate branch and menu
      const branch = await Branch.findById(branchId);
      const menuDoc = await Menu.findById(menu);
      if (!branch || !menuDoc) {
        throw new Error("Branch or Menu not found.");
      }

      // Validate category
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        throw new Error("Selected category does not exist.");
      }

      // Create new menu item
      const newMenuItem = new MenuItem({
        itemName,
        price,
        description,
        type,
        category: categoryDoc._id,
        menuItemImage: url && filename ? { url, filename } : undefined,
        branch: branchId,
        menu: menuDoc._id,
      });

      await newMenuItem.save();

      req.flash("success", "Menu Item Added Successfully!");
      res.redirect(`/dashboard/${branchId}`);
    } catch (err) {
      console.error("Error adding menu item:", err);
      req.flash("error", `Failed to add menu item: ${err.message}`);
      res.redirect(`/addMenuItem/${req.params.branchId}`);
    }
  }
);

// ---------------------------------
// ✅ Fetch categories for selected menu
app.get("/getCategories/:menuId", isLoggedIn, async (req, res) => {
  try {
    const { menuId } = req.params;
    const categories = await Category.find({ menu: menuId });
    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});
//-------------------------------------

app.get("/dashboard/menu-items/edit/:id", async (req, res) => {
  let { id } = req.params;
  const menuItem = await MenuItem.findById(id);
  const categories = await Category.find({});
  if (!menuItem) {
    req.flash("success", "Menu Item you requested for doesn't exist!");
    res.redirect("/dashboard");
  }
  res.render("dashboard/menuItemEdit.ejs", { menuItem, categories });
});

app.post(
  "/dashboard/menu-items/edit/:id",
  isLoggedIn,
  upload.single("menuItemImage"),
  async (req, res) => {
    let branchId = null; // Declare outside try block

    try {
      const { id } = req.params;

      const existingMenuItem = await MenuItem.findById(id).populate({
        path: "menu",
        populate: { path: "branch" },
      });

      if (!existingMenuItem) {
        req.flash("error", "Menu item not found!");
        return res.redirect("/dashboard");
      }

      branchId = existingMenuItem.menu.branch._id; // Assign value

      const menuItem = await MenuItem.findByIdAndUpdate(
        id,
        { ...req.body },
        { new: true }
      );

      if (req.file) {
        const url = req.file.path;
        const filename = req.file.filename;
        menuItem.menuItemImage = { url, filename };
        await menuItem.save();
      }

      req.flash("success", "Menu Item Updated!");
      res.redirect(`/dashboard/${branchId}`);
    } catch (err) {
      console.error("Error updating menu item:", err);
      req.flash("error", "Failed to update menu item!");

      if (branchId) {
        res.redirect(`/dashboard/${branchId}`);
      } else {
        res.redirect("/dashboard"); // Fallback if branchId wasn't set
      }
    }
  }
);

app.get("/dashboard/menu-items/delete/:id", async (req, res) => {
  let { id } = req.params;
  const menuItem = await MenuItem.findById(id);
  if (!menuItem) {
    req.flash("success", "Menu Item you requested for doesn't exist!");
    res.redirect("/dashboard");
  }
  res.render("dashboard/menuItemDelete.ejs", { menuItem });
});

app.post("/dashboard/menu-items/delete/:id", async (req, res) => {
  let { id } = req.params;
  let deletedMenuItem = await MenuItem.findByIdAndDelete(id);
  console.log(deletedMenuItem);
  req.flash("success", "Menu Item Deleted!");
  res.redirect("/dashboard");
});

app.get("/showItemCategories/:id", async (req, res) => {
  try {
    const branchId = req.params.id;

    // Find menus for this branch
    const menus = await Menu.find({ branch: branchId });
    const menuIds = menus.map((m) => m._id);

    // Find categories for those menus
    const categories = await Category.find({ menu: { $in: menuIds } }).lean();

    // Count menu items for each category in this branch
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const totalItems = await MenuItem.countDocuments({
          category: category._id,
          branch: branchId,
        });
        return {
          _id: category.name, // Use category name as _id to match template
          categoryId: category._id, // Keep actual ID for actions
          totalItems: totalItems,
        };
      })
    );

    // Sort alphabetically
    categoryStats.sort((a, b) => a._id.localeCompare(b._id));

    res.render("dashboard/showItemCategories.ejs", {
      branchId,
      categoryStats,
      title: "Item Categories",
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.render("dashboard/showItemCategories.ejs", {
      categoryStats: [],
      title: "Item Categories",
    });
  }
});

app.get("/addItemCategory/:branchId", isLoggedIn, async (req, res) => {
  try {
    const { branchId } = req.params;
    const menus = await Menu.find({ branch: branchId });

    if (!menus || menus.length === 0) {
      req.flash("error", "No menus found for this branch!");
    }

    res.render("dashboard/addItemCategory.ejs", { branchId, menus });
  } catch (err) {
    console.error("Error loading addItemCategory page:", err);
    req.flash("error", "Failed to load category form");
    res.redirect("/dashboard");
  }
});

app.post("/addCategory/:branchId", isLoggedIn, async (req, res) => {
  try {
    const { branchId } = req.params;
    const { categoryName, menu } = req.body;

    if (!categoryName || !menu || categoryName.trim() === "") {
      req.flash("error", "Please provide both menu and category name!");
      return res.redirect(`/addItemCategory/${branchId}`);
    }

    const menuDoc = await Menu.findById(menu);
    if (!menuDoc) {
      req.flash("error", "Selected menu not found!");
      return res.redirect(`/addItemCategory/${branchId}`);
    }

    // Check for duplicate category name within same menu
    const existingCategory = await Category.findOne({
      name: categoryName.trim(),
      menu: menu,
    });

    if (existingCategory) {
      req.flash("error", "Category already exists for this menu!");
      return res.redirect(`/addItemCategory/${branchId}`);
    }

    // Create and save new category
    const newCategory = new Category({
      name: categoryName.trim(),
      menu: menuDoc._id,
    });

    await newCategory.save();

    req.flash("success", "New category added successfully!");
    res.redirect(`/dashboard/${branchId}`);
  } catch (err) {
    console.error("Error adding category:", err);
    req.flash("error", "Failed to add category!");
    res.redirect(`/addItemCategory/${req.params.branchId}`);
  }
});

// -------------------- areas ---------------------------------

app.get("/showAreas/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params; // ✅ take from URL params

    const branch = await Branch.findById(branchId);
    if (!branch) {
      req.flash("error", "Branch not found!");
      return res.redirect("/dashboard");
    }

    const areas = await Area.find({ branch: branchId });
    res.render("dashboard/showAreas.ejs", { branch, branchId, areas });
  } catch (err) {
    console.error("Error loading areas:", err);
    req.flash("error", "Unable to load areas!");
  }
});

app.get("/addArea/:branchId", (req, res) => {
  const branchId = req.params;
  res.render("dashboard/addArea.ejs", branchId);
});

app.post("/addArea/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { areaName } = req.body;

    // Validate
    if (!areaName || areaName.trim() === "") {
      req.flash("error", "Area name cannot be empty!");
      return res.redirect(`/dashboard/${branchId}`);
    }

    // Find the branch
    const branch = await Branch.findById(branchId);
    if (!branch) {
      req.flash("error", "Branch not found!");
      return res.redirect("/dashboard");
    }

    // Create new area
    const newArea = new Area({
      name: areaName.trim(),
      branch: branchId,
    });

    await newArea.save();

    req.flash("success", "New area added successfully!");
    res.redirect(`/dashboard/${branchId}`);
  } catch (err) {
    console.error("Error adding area:", err);
    req.flash("error", "Something went wrong while adding area!");
    res.redirect("/dashboard");
  }
});

// ---------------------tables-------------------------

app.get("/showTables/:id", async (req, res) => {
  try {
    const branchId = req.params.id;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      req.flash("error", "Branch not found!");
      return res.redirect("/dashboard");
    }

    const areas = await Area.find({ branch: branchId }).populate("tables");

    res.render("dashboard/showTables.ejs", {
      branch,
      branchId,
      areas,
    });
  } catch (err) {
    console.error("Error loading tables:", err);
    req.flash("error", "Unable to load tables at this moment.");
    res.redirect("/dashboard");
  }
});

app.get("/addTable/:branchId", async (req, res) => {
  const { branchId } = req.params;
  const areas = await Area.find({ branch: branchId }).lean();
  res.render("dashboard/addTable.ejs", { branchId, areas });
});

app.post("/addTable/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params;
    const { area, tableCode, seatingCapacity, availabilityStatus, status } =
      req.body;

    if (!area || !tableCode || !seatingCapacity) {
      req.flash("error", "Please fill all required fields!");
      return res.redirect(`/addTable/${branchId}`);
    }

    const areaDoc = await Area.findOne({ _id: area, branch: branchId });
    if (!areaDoc) {
      req.flash("error", "Selected area not found for this branch!");
      return res.redirect(`/addTable/${branchId}`);
    }

    const existingTable = await Table.findOne({
      area,
      tableCode: tableCode.trim(),
    });
    if (existingTable) {
      req.flash(
        "error",
        "A table with this code already exists in the selected area!"
      );
      return res.redirect(`/addTable/${branchId}`);
    }

    const newTable = new Table({
      area,
      tableCode: tableCode.trim(),
      seatingCapacity: parseInt(seatingCapacity),
      availabilityStatus: availabilityStatus || "Available",
      status: status || "Active",
    });

    await newTable.save();
    await Area.findByIdAndUpdate(area, { $push: { tables: newTable._id } });

    req.flash("success", "New table added successfully!");
    res.redirect(`/dashboard/${branchId}`);
  } catch (err) {
    console.error("Error adding table:", err);
    req.flash("error", "Failed to add table!");
    res.redirect(`/dashboard/${branchId}`);
  }
});

// ---------------------tables-------------------------

app.get("/pos/:id", async (req, res) => {
  try {
    const branchId = req.params.id;
    const orderId = req.query.orderId; // optional existing order

    // Find branch
    const branch = await Branch.findById(branchId);
    if (!branch) {
      req.flash("error", "Branch not found!");
      return res.redirect("/dashboard");
    }

    const menus = await Menu.find({ branch: branchId });
    const menuIds = menus.map((m) => m._id);
    const categories = await Category.find({ menu: { $in: menuIds } });

    const menuItems = await MenuItem.find({ branch: branchId })
      .populate("category")
      .lean();

    const areas = await Area.find({ branch: branchId }).populate("tables");

    // If orderId provided → fetch existing order
    let existingOrder = null;
    if (orderId) {
      existingOrder = await Order.findById(orderId)
        .populate("customer")
        .populate("items.menuItem", "itemName price")
        .lean();
    }

    // Render POS page
    res.render("dashboard/showPos.ejs", {
      branch,
      branchId,
      areas,
      menus,
      categories,
      menuItems,
      orderNumber: existingOrder
        ? existingOrder.orderNumber
        : Math.floor(Math.random() * 1000),
      existingOrder: existingOrder || null,
    });
  } catch (err) {
    console.error("POS Load Error:", err);
    req.flash("error", "Unable to load POS page at this moment.");
    res.redirect("/dashboard");
  }
});

// ---------------------------------------------------------

// app.get("/pos/:id", async (req, res) => {
//   try {
//     const branchId = req.params.id;

//     // 1️⃣ Find branch
//     const branch = await Branch.findById(branchId);
//     if (!branch) {
//       req.flash("error", "Branch not found!");
//       return res.redirect("/dashboard");
//     }

//     // 2️⃣ Find menu for this branch
//     const menu = await Menu.findOne({ branch: branchId });
//     if (!menu) {
//       req.flash("error", "Menu not found for this branch!");
//       return res.redirect("/dashboard");
//     }

//     // 3️⃣ Find all categories linked to this menu
//     const categories = await Category.find({ menu: menu._id });

//     // 4️⃣ Find all menu items linked to these categories
//     const categoryIds = categories.map((c) => c._id);
//     const menuItems = await MenuItem.find({
//       category: { $in: categoryIds },
//     }).populate("category");

//     // 5️⃣ Find areas (optional — for table selection)
//     const areas = await Area.find({ branch: branchId }).populate("tables");

//     // 6️⃣ Render POS page
//     res.render("dashboard/showPos.ejs", {
//       branch,
//       branchId,
//       areas,
//       categories,
//       menuItems,
//       orderNumber: Math.floor(Math.random() * 1000),
//     });
//   } catch (err) {
//     console.error("POS Load Error:", err);
//     req.flash("error", "Unable to load POS page at this moment.");
//     res.redirect("/dashboard");
//   }
// });

app.post("/createOrderKOT", isLoggedIn, posController.createOrderKOT);

app.get("/showKOT/:id", kotController.renderKOTDashboard);

app.post("/dashboard/kot/:id/ready", kotController.markAsReady);

app.post("/dashboard/kot/:id/served", kotController.markAsServed);

app.post("/dashboard/kot/:id/delete", kotController.deleteKOT);

app.get("/showOrders/:id", async (req, res) => {
  try {
    const branchId = req.params.id;

    // Get filter values from query (optional)
    const {
      dateFilter = "today",
      startDate,
      endDate,
      statusFilter = "all",
      orderType = "all",
    } = req.query;

    // --- Build dynamic filter object ---
    let filter = { branch: branchId };

    // Apply date filter
    const now = new Date();
    let fromDate, toDate;

    switch (dateFilter) {
      case "today":
        fromDate = new Date(now.setHours(0, 0, 0, 0));
        toDate = new Date();
        break;
      case "yesterday":
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 1);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(fromDate);
        toDate.setHours(23, 59, 59, 999);
        break;
      case "week":
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 7);
        toDate = new Date();
        break;
      case "month":
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        toDate = new Date();
        break;
      case "custom":
        if (startDate && endDate) {
          fromDate = new Date(startDate);
          toDate = new Date(endDate);
          toDate.setHours(23, 59, 59, 999);
        }
        break;
    }

    if (fromDate && toDate) {
      filter.createdAt = { $gte: fromDate, $lte: toDate };
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filter.status = statusFilter;
    }

    //  Apply order type filter
    if (orderType !== "all") {
      filter.orderType = orderType;
    }

    // --- Fetch orders ---
    const orders = await Order.find(filter)
      .populate("customer", "name")
      .populate("table", "tableCode")
      .populate("items.menuItem", "itemName price")
      .sort({ createdAt: -1 });

    // --- Render EJS with all required data ---
    res.render("dashboard/showOrders.ejs", {
      orders,
      branchId,
      dateFilter,
      startDate,
      endDate,
      statusFilter,
      orderType,
    });
  } catch (err) {
    console.error("Error loading orders:", err);
    res.status(500).send("Server Error");
  }
});

app.post("/updateOrderStatus/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log("🔵 Updating order status:", orderId, status);

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status,
        billedAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    console.log("✅ Order status updated:", order);
    res.json({ success: true, order });
  } catch (err) {
    console.error("❌ Error updating order status:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Complete payment
app.post("/completePayment/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, amountPaid, totalAmount } = req.body;

    console.log("🔵 Processing payment:", {
      orderId,
      paymentMethod,
      amountPaid,
      totalAmount,
    });

    // Determine payment status
    const paymentStatus = amountPaid >= totalAmount ? "Paid" : "Partial";
    const paymentDue = amountPaid < totalAmount;

    // Update order with payment details
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: paymentStatus === "Paid" ? "Paid" : "Billed",
        paymentStatus,
        paymentMethod,
        paymentDue,
        deliveredAt: paymentStatus === "Paid" ? new Date() : null,
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Update KOT status to "Food is Served" if payment is complete
    if (paymentStatus === "Paid") {
      await KOT.updateMany(
        { order: orderId },
        {
          status: "Food is Served",
          servedAt: new Date(),
        }
      );
    }

    console.log("✅ Payment completed:", order);
    res.json({ success: true, order });
  } catch (err) {
    console.error("❌ Error completing payment:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------------------------------------------------//

// GET single order details
app.get("/api/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("customer")
      .populate("items.menuItem")
      .lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// PATCH update order status
app.patch("/api/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      "KOT",
      "Billed",
      "Paid",
      "Payment Due",
      "Out For Delivery",
      "Delivered",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Update order
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status,
        // Auto-update payment status based on order status
        ...(status === "Paid" && { paymentStatus: "Paid" }),
        ...(status === "Cancelled" && { paymentStatus: "Cancelled" }),
      },
      { new: true, runValidators: true }
    )
      .populate("customer")
      .populate("items.menuItem");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// POST generate bill
app.post("/api/orders/:orderId/bill", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if already billed
    if (order.status === "Billed" || order.status === "Paid") {
      return res.status(400).json({ error: "Order already billed" });
    }

    // Update order status to Billed
    order.status = "Billed";
    order.billedAt = new Date();

    await order.save();

    // Populate for response
    await order.populate("customer");
    await order.populate("items.menuItem");

    res.json(order);
  } catch (error) {
    console.error("Error generating bill:", error);
    res.status(500).json({ error: "Failed to generate bill" });
  }
});

// POST add payment
app.post("/api/orders/:orderId/payment", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, amount } = req.body;

    // Validate payment method
    const validMethods = ["Cash", "Card", "UPI", "Wallet"];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify payment amount matches order total
    if (Math.abs(amount - order.totalAmount) > 0.01) {
      return res
        .status(400)
        .json({ error: "Payment amount does not match order total" });
    }

    // Update order with payment details
    order.paymentMethod = paymentMethod;
    order.paymentStatus = "Paid";
    order.status = "Paid";
    order.paidAt = new Date();

    await order.save();

    // Populate for response
    await order.populate("customer");
    await order.populate("items.menuItem");

    res.json(order);
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
});

// GET print document (KOT/Bill/Receipt)
app.get("/api/orders/:orderId/print/:type", async (req, res) => {
  try {
    const { orderId, type } = req.params;

    // Validate print type
    const validTypes = ["KOT", "bill", "receipt"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid print type" });
    }

    const order = await Order.findById(orderId)
      .populate("customer")
      .populate("items.menuItem")
      .populate("branch");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Generate print template based on type
    let template;

    switch (type) {
      case "KOT":
        template = generateKOTTemplate(order);
        break;
      case "bill":
        template = generateBillTemplate(order);
        break;
      case "receipt":
        template = generateReceiptTemplate(order);
        break;
    }

    res.send(template);
  } catch (error) {
    console.error("Error generating print document:", error);
    res.status(500).json({ error: "Failed to generate print document" });
  }
});

// Helper functions for print templates
function generateKOTTemplate(order) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>KOT - ${order.orderNumber}</title>
      <style>
        body { font-family: monospace; padding: 20px; max-width: 300px; }
        h2 { text-align: center; margin: 10px 0; }
        .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
        .item { display: flex; justify-content: space-between; margin: 5px 0; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <h2>KITCHEN ORDER TICKET</h2>
      <div class="divider"></div>
      <p><strong>Order #:</strong> ${order.orderNumber}</p>
      <p><strong>Table:</strong> ${order.tableNumber || "N/A"}</p>
      <p><strong>Time:</strong> ${new Date(
        order.createdAt
      ).toLocaleString()}</p>
      <div class="divider"></div>
      ${order.items
        .map(
          (item) => `
        <div class="item">
          <span>${item.quantity}x ${item.name}</span>
        </div>
        ${
          item.notes
            ? `<p style="margin-left: 20px; font-size: 12px;">Note: ${item.notes}</p>`
            : ""
        }
      `
        )
        .join("")}
      <div class="divider"></div>
      <button onclick="window.print()">Print KOT</button>
    </body>
    </html>
  `;
}

function generateBillTemplate(order) {
  // Calculate subtotal from items
  const subtotal = order.items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  const tax = order.tax || 0;
  const discount = order.discount || 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bill - ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
        h2 { text-align: center; margin: 10px 0; }
        .divider { border-bottom: 1px solid #000; margin: 10px 0; }
        .item { display: flex; justify-content: space-between; margin: 5px 0; }
        .total { font-weight: bold; font-size: 18px; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <h2>${order.branch?.branchName || "Restaurant"}</h2>
      <p style="text-align: center;">${order.branch?.address || ""}</p>
      <div class="divider"></div>
      <p><strong>Bill #:</strong> ${order.orderNumber}</p>
      <p><strong>Date:</strong> ${new Date(
        order.createdAt
      ).toLocaleString()}</p>
      <p><strong>Customer:</strong> ${order.customer?.name || "Walk-in"}</p>
      <p><strong>Order Type:</strong> ${order.orderType || "Dine In"}</p>
      <div class="divider"></div>
      ${order.items
        .map(
          (item) => `
        <div class="item">
          <span>${item.quantity}x ${
            item.menuItem?.itemName || item.name || "Item"
          }</span>
          <span>₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `
        )
        .join("")}
      <div class="divider"></div>
      <div class="item">
        <span>Subtotal:</span>
        <span>₹${subtotal.toFixed(2)}</span>
      </div>
      ${
        tax > 0
          ? `
        <div class="item">
          <span>Tax:</span>
          <span>₹${tax.toFixed(2)}</span>
        </div>
      `
          : ""
      }
      ${
        discount > 0
          ? `
        <div class="item">
          <span>Discount:</span>
          <span>-₹${discount.toFixed(2)}</span>
        </div>
      `
          : ""
      }
      <div class="divider"></div>
      <div class="item total">
        <span>TOTAL:</span>
        <span>₹${order.totalAmount.toFixed(2)}</span>
      </div>
      <div class="divider"></div>
      <p style="text-align: center; margin-top: 20px;">Thank you for your visit!</p>
      <button onclick="window.print()" style="width: 100%; padding: 10px; margin-top: 20px;">Print Bill</button>
    </body>
    </html>
  `;
}

function generateReceiptTemplate(order) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
        h2 { text-align: center; margin: 10px 0; }
        .divider { border-bottom: 1px solid #000; margin: 10px 0; }
        .item { display: flex; justify-content: space-between; margin: 5px 0; }
        .total { font-weight: bold; font-size: 18px; }
        .paid-stamp { color: green; font-weight: bold; text-align: center; font-size: 24px; margin: 20px 0; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <h2>${order.branch?.name || "Restaurant"}</h2>
      <p style="text-align: center;">${order.branch?.address || ""}</p>
      <div class="divider"></div>
      <p><strong>Receipt #:</strong> ${order.orderNumber}</p>
      <p><strong>Date:</strong> ${new Date(
        order.paidAt || order.createdAt
      ).toLocaleString()}</p>
      <p><strong>Customer:</strong> ${order.customer?.name || "Walk-in"}</p>
      <div class="divider"></div>
      ${order.items
        .map(
          (item) => `
        <div class="item">
          <span>${item.quantity}x ${item.name}</span>
          <span>₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `
        )
        .join("")}
      <div class="divider"></div>
      <div class="item">
        <span>Subtotal:</span>
        <span>₹${order.subtotal.toFixed(2)}</span>
      </div>
      ${
        order.tax
          ? `
        <div class="item">
          <span>Tax:</span>
          <span>₹${order.tax.toFixed(2)}</span>
        </div>
      `
          : ""
      }
      ${
        order.discount
          ? `
        <div class="item">
          <span>Discount:</span>
          <span>-₹${order.discount.toFixed(2)}</span>
        </div>
      `
          : ""
      }
      <div class="divider"></div>
      <div class="item total">
        <span>TOTAL:</span>
        <span>₹${order.totalAmount.toFixed(2)}</span>
      </div>
      <div class="item">
        <span>Payment Method:</span>
        <span>${order.paymentMethod || "N/A"}</span>
      </div>
      <div class="paid-stamp">★ PAID ★</div>
      <div class="divider"></div>
      <p style="text-align: center; margin-top: 20px;">Thank you for your business!</p>
      <button onclick="window.print()" style="width: 100%; padding: 10px; margin-top: 20px;">Print Receipt</button>
    </body>
    </html>
  `;
}

// -------------------------- Customer Dashboard----------------------------------//

// app.get("/customer-dashboard/:id", async (req, res) => {
//   try {
//     const branchId = req.params.id;

//     // Find branch by ID
//     const branch = await Branch.findById(branchId);
//     if (!branch) {
//       req.flash("error", "Branch not found!");
//       return res.redirect("/dashboard");
//     }

//     // Find menu for this branch
//     const menu = await Menu.findOne({ branch: branchId });

//     // Find all menu items for this branch, populate category
//     const menuItems = await MenuItem.find({ branch: branchId })
//       .populate("category")
//       .populate("menu")
//       .sort({ category: 1, itemName: 1 }); // Sort by category, then name

//     res.render("./layouts/customer-dashboard.ejs", {
//       branch,
//       menu,
//       menuItems,
//     });
//   } catch (err) {
//     console.error("Error loading customer dashboard:", err);
//     req.flash("error", "Failed to load customer dashboard!");
//     res.redirect("/dashboard");
//   }
// });

// // Add this route BEFORE your app.listen() line in app.js

// app.post("/api/customer/place-order", async (req, res) => {
//   try {
//     const { branchId, orderType, items, totalAmount, specialInstructions } =
//       req.body;

//     // Validate required fields
//     if (
//       !branchId ||
//       !orderType ||
//       !items ||
//       items.length === 0 ||
//       !totalAmount
//     ) {
//       return res.status(400).json({
//         success: false,
//         error: "Missing required fields",
//       });
//     }

//     // Validate branch exists
//     const branch = await Branch.findById(branchId);
//     if (!branch) {
//       return res.status(404).json({
//         success: false,
//         error: "Branch not found",
//       });
//     }

//     // Generate unique order number
//     const orderCount = await Order.countDocuments({ branch: branchId });
//     const orderNumber = `${orderCount + 1}`;

//     // Create the order
//     const newOrder = new Order({
//       orderNumber: orderNumber,
//       branch: branchId,
//       orderType: orderType,
//       items: items,
//       totalAmount: totalAmount,
//       specialInstructions: specialInstructions || "",
//       status: "KOT",
//       paymentStatus: "Unpaid",
//       kotGenerated: true,
//       customer: req.user?._id || null, // If user is logged in
//     });

//     await newOrder.save();

//     // Generate KOT number
//     const kotCount = await KOT.countDocuments({ branch: branchId });
//     const kotNumber = `KOT-${kotCount + 1}`;

//     // Create KOT
//     const newKOT = new KOT({
//       kotNumber: kotNumber,
//       order: newOrder._id,
//       branch: branchId,
//       items: items.map((item) => ({
//         menuItem: item.menuItem,
//         quantity: item.quantity,
//         notes: specialInstructions || "",
//       })),
//       status: "In Kitchen",
//       createdBy: req.user?._id || newOrder._id, // Use order ID if customer not logged in
//       createdByModel: "Customer",
//       startedAt: new Date(),
//     });

//     await newKOT.save();

//     // Populate order details for response
//     await newOrder.populate("items.menuItem");

//     console.log("✅ Order Created:", newOrder.orderNumber);
//     console.log("✅ KOT Created:", newKOT.kotNumber);

//     res.json({
//       success: true,
//       message: "Order placed successfully!",
//       order: {
//         _id: newOrder._id,
//         orderNumber: newOrder.orderNumber,
//         orderType: newOrder.orderType,
//         totalAmount: newOrder.totalAmount,
//         status: newOrder.status,
//         items: newOrder.items,
//         createdAt: newOrder.createdAt,
//       },
//       kot: {
//         _id: newKOT._id,
//         kotNumber: newKOT.kotNumber,
//         status: newKOT.status,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error placing order:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to place order. Please try again.",
//     });
//   }
// });

// -------------------------- Customer Dashboard----------------------------------//

// -----------------Staff----------------

// GET - Display staff list page for specific branch
app.get("/showStaff/:branchId", isLoggedIn, async (req, res) => {
  try {
    const branchId = req.params.branchId;

    // Verify user has access to this branch (optional - add your own logic)
    // For example, check if user is admin or belongs to this branch

    // Fetch staff for the specific branch
    const staff = await Staff.find({ branch: branchId })
      .select("-password")
      .sort({ createdAt: -1 });

    // Fetch branch details
    const branch = await Branch.findById(branchId);

    // Fetch all branches for dropdown (if needed)
    const branches = await Branch.find({});

    res.render("dashboard/showStaff.ejs", {
      staff: staff,
      currentUserId: req.user._id.toString(),
      currentUser: req.user,
      branchId: branchId,
      branch: branch,
      branches: branches,
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    req.flash("error", "Error loading staff page");
    res.redirect("/dashboard");
  }
});

// POST - Add new staff member to specific branch
app.post("/staff/add/:branchId", isLoggedIn, async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const branchId = req.params.branchId;

    // Validate required fields
    if (!name || !email || !phone || !password || !role) {
      req.flash("error", "All fields are required");
      return res.redirect(`/dashboard/${branchId}`);
    }

    // Validate phone number
    if (isNaN(phone)) {
      req.flash("error", "Phone number must be numeric");
      return res.redirect(`/showStaff/${branchId}`);
    }

    // Check if email already exists
    const existingStaff = await Staff.findOne({ email: email.toLowerCase() });
    if (existingStaff) {
      req.flash("error", "Email already exists");
      return res.redirect(`/dashboard/${branchId}`);
    }

    // Verify branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      req.flash("error", "Branch not found");
      return res.redirect("/dashboard");
    }

    // Create new staff member using Passport's register method
    const newStaff = new Staff({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      username: email.toLowerCase().trim(), // Set username same as email
      phone: parseInt(phone),
      role,
      branch: branchId,
      active: true,
    });

    // Register the user with passport-local-mongoose (this handles hashing)
    await Staff.register(newStaff, password);

    req.flash("success", "Staff member added successfully");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error("Error adding staff:", error);

    // Handle specific passport-local-mongoose errors
    if (error.name === "UserExistsError") {
      req.flash("error", "Email already exists");
    } else {
      req.flash("error", "Error adding staff member");
    }

    res.redirect(`/dashboard/${branchId}`);
  }
});

// POST - Update staff member in specific branch
app.post("/staff/update/:branchId/:staffId", isLoggedIn, async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const { branchId, staffId } = req.params;

    // Validate required fields
    if (!name || !email || !phone || !role) {
      req.flash("error", "All fields except password are required");
      return res.redirect(`/dashboard/${branchId}`);
    }

    // Validate phone number
    if (isNaN(phone)) {
      req.flash("error", "Phone number must be numeric");
      return res.redirect(`/dashboard/${branchId}`);
    }

    // Verify staff member exists and belongs to the branch
    const staffToUpdate = await Staff.findById(staffId);
    if (!staffToUpdate) {
      req.flash("error", "Staff member not found");
      return res.redirect(`/dashboard/${branchId}`);
    }

    if (staffToUpdate.branch.toString() !== branchId) {
      req.flash("error", "Unauthorized to update this staff member");
      return res.redirect(`/dashboard/${branchId}`);
    }

    // Check if email is being changed and if it already exists
    if (email.toLowerCase() !== staffToUpdate.email) {
      const existingEmail = await Staff.findOne({
        email: email.toLowerCase(),
        _id: { $ne: staffId },
      });
      if (existingEmail) {
        req.flash("error", "Email already exists");
        return res.redirect(`/dashboard/${branchId}`);
      }
    }

    // Update basic fields
    staffToUpdate.name = name.trim();
    staffToUpdate.email = email.toLowerCase().trim();
    staffToUpdate.username = email.toLowerCase().trim();
    staffToUpdate.phone = parseInt(phone);
    staffToUpdate.role = role;

    // Update password if provided using passport-local-mongoose method
    if (password && password.trim() !== "") {
      await staffToUpdate.setPassword(password);
    }

    await staffToUpdate.save();

    req.flash("success", "Staff member updated successfully");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error("Error updating staff:", error);
    req.flash("error", "Error updating staff member");
    res.redirect(`/dashboard/${branchId}`);
  }
});

// POST - Update staff role only in specific branch (AJAX)
app.post(
  "/staff/update-role/:branchId/:staffId",
  isLoggedIn,
  async (req, res) => {
    try {
      const { role } = req.body;
      const { branchId, staffId } = req.params;

      // Validate role
      const validRoles = ["Hotel-Admin", "Branch Head", "Chef", "Waiter"];
      if (!validRoles.includes(role)) {
        return res.json({ success: false, message: "Invalid role" });
      }

      // Check if trying to update own role
      if (staffId === req.user._id.toString()) {
        return res.json({
          success: false,
          message: "Cannot change your own role",
        });
      }

      // Verify staff member belongs to the branch
      const staffToUpdate = await Staff.findById(staffId);
      if (!staffToUpdate) {
        return res.json({ success: false, message: "Staff member not found" });
      }

      if (staffToUpdate.branch.toString() !== branchId) {
        return res.json({
          success: false,
          message: "Unauthorized to update this staff member",
        });
      }

      await Staff.findByIdAndUpdate(staffId, { role });
      res.json({ success: true, message: "Role updated successfully" });
    } catch (error) {
      console.error("Error updating role:", error);
      res.json({ success: false, message: "Error updating role" });
    }
  }
);

// DELETE - Delete staff member from specific branch (AJAX)
app.delete("/staff/delete/:branchId/:staffId", isLoggedIn, async (req, res) => {
  try {
    const { branchId, staffId } = req.params;

    // Check if trying to delete own account
    if (staffId === req.user._id.toString()) {
      return res.json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    // Verify staff member belongs to the branch
    const staffToDelete = await Staff.findById(staffId);
    if (!staffToDelete) {
      return res.json({ success: false, message: "Staff member not found" });
    }

    if (staffToDelete.branch.toString() !== branchId) {
      return res.json({
        success: false,
        message: "Unauthorized to delete this staff member",
      });
    }

    // Delete the staff member
    await Staff.findByIdAndDelete(staffId);
    res.json({ success: true, message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff:", error);
    res.json({ success: false, message: "Error deleting staff member" });
  }
});

// Optional: Route to toggle staff active status
app.post(
  "/staff/toggle-status/:branchId/:staffId",
  isLoggedIn,
  async (req, res) => {
    try {
      const { branchId, staffId } = req.params;

      // Check if trying to deactivate own account
      if (staffId === req.user._id.toString()) {
        return res.json({
          success: false,
          message: "Cannot change your own status",
        });
      }

      const staffMember = await Staff.findById(staffId);
      if (!staffMember) {
        return res.json({ success: false, message: "Staff member not found" });
      }

      if (staffMember.branch.toString() !== branchId) {
        return res.json({ success: false, message: "Unauthorized" });
      }

      await Staff.findByIdAndUpdate(staffId, { active: !staffMember.active });
      res.json({
        success: true,
        message: `Staff member ${
          staffMember.active ? "deactivated" : "activated"
        } successfully`,
        newStatus: !staffMember.active,
      });
    } catch (error) {
      console.error("Error toggling status:", error);
      res.json({ success: false, message: "Error updating status" });
    }
  }
);

app.get("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "User logged Out!");
    res.redirect("/Techdine");
  });
});
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
