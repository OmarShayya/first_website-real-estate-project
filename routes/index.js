var express = require("express");
var router = express.Router();
var lands = require("../models/lands");
var user = require("../models/user");
const multer = require("multer");
var fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const e = require("express");
const { isMainThread } = require("worker_threads");
const bodyParser = require("body-parser");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.get("/", function (req, res, next) {
  if (!req.session.isLogged) req.session.isLogged = false;
  if (!req.session.isAdmin) req.session.isAdmin = false;
  if (!req.session.userId) req.session.userId = -1;

  console.log(req.session.isLogged);
  console.log(req.session.isAdmin);
  res.render("index.ejs", {
    isLogged: req.session.isLogged,
    isAdmin: req.session.isAdmin,
  });
});
+router.post("/signup", async function (req, res, next) {
  console.log(req.body);
  var personInfo = req.body;

  const saltRounds = 10;
  var encryptedPassword = await bcrypt.hash(req.body.password, 10);

  if (
    !personInfo.email ||
    !personInfo.username ||
    !personInfo.password ||
    !personInfo.passwordConf
  ) {
    res.send();
    return;
  }

  if (personInfo.password != personInfo.passwordConf) {
    res.send({ Success: "password is not matched" });
    return;
  }

  user.findOne({ email: personInfo.email }, function (err, data) {
    if (data) {
      res.send({ Success: "Email is already used. :(" });
      return;
    }
    var c;
    user
      .findOne({}, function (err, data) {
        if (data) {
          console.log("if");
          c = data.unique_id + 1;
        } else {
          c = 1;
        }

        var newPerson = {
          unique_id: c,
          email: personInfo.email,
          username: personInfo.username,
          password: encryptedPassword,

          // pp: {
          //   data: fs.readFileSync(
          //     path.join(__dirname + "/uploads/" + req.file.filename)
          //   ),
          //   contentType: "image/png",
          // },
        };

        console.log("abc");
        user.create(newPerson, (err, item) => {
          if (err) {
            console.log(err);
          }
        });
      })
      .sort({ _id: -1 })
      .limit(1);
    req.session.isLogged = true;
    res.send({ Success: "Success!" });
  });
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/view", (req, res) => {
  // lands.find({}, (err, items) => {
  //   if (err) {
  //     console.log(err);
  //     res.send(err);
  //   } else {
  //     res.render("view", {items });
  //   }
  // });

  lands.find({}, (err, items) => {
    if (err) {
      console.log(err);
      res.send(err);
    } else
      res.render("view", {
        items,
        ID: req.session.userId,
        name: req.session.username,
        isLogged: req.session.isLogged
      });
  });
});

  router.get("/viewmine", (req, res) => {
    console.log(req.session.userId);
    lands.find({ ownerid: req.session.userId}, (err, items) => {
      if (err) {
        console.log(err);
        res.send(err);
      } else res.render("view", { items, isLogged: req.session.isLogged, ID: req.session.userId,
        name: req.session.username, });
    });
  });

router.post("/deletecard/:id", async function (req, res) {
  await lands.findByIdAndDelete(req.params.id);
  res.redirect("/view");
});

router.post("/login", function (req, res, next) {
  console.log(req.body);
  if (req.session.isLogged == true) {
    res.send({ Success: "already signed in" });
    return;
  }
  user.findOne({ username: req.body.username }, function (err, data) {
    if (data) {
      bcrypt.compare(req.body.password, data.password, function (err, result) {
        if (result) {
          //console.log("Done Login");
          req.session.userId = data.unique_id;
          req.session.username = data.username;
          req.session.isLogged = true;
          req.session.isAdmin = data.isAdmin;
          //console.log(req.session.userId);
          res.send({ Success: "Success!" });
        } else {
          res.send({ Success: "Wrong password!" });
        }
      });
    } else {
      res.send({ Success: "Username is not regestered!" });
    }
  });
});

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    console.log("abc");
    console.log(file);
    console.log("abc");
    cb(null, file.fieldname + "-" + Date.now());
  },
});

var upload = multer({ storage: storage });

router.post("/view", upload.single("image"), async (req, res) => {
  console.log(req.file);
  var ext = "image/";
  findExt(req.file.originalname, req.file.originalname.length - 1);
  function findExt(origName, index) {
    if (origName[index] == ".") return;
    findExt(origName, index - 1);
    ext += origName[index];
  }

  
  var newHouse = {
    ownerid: req.session.userId,
    Title: req.body.title,
    Description: req.body.desc,
    Price: req.body.price,
    image: {
      data: fs.readFileSync(
        path.join(__dirname + "/../uploads/" + req.file.filename)
      ),
      contentType: ext,
    },
    Bedrooms: req.body.beds,
    Bathrooms: req.body.baths,
    SquareFt: req.body.space,
    Type: req.body.type,
  };

  await lands.create(newHouse, (err, item) => {
    if (err) {
      console.log(err);
    } else {
      // newHouse.bro.id = user.id;
      // newHouse.bro.username = user.username;
      res.redirect("view");
    }
  });
});

router.get("/users", function (req, res) {
  user.find({}, (err, items) => {
    if (err) {
      console.log(err);
      res.send(err);
    } else res.render("users", { items });
  });
});

router.get("/insert", function (req, res) {
  res.render("insert");
});

router.get("/contact", function (req, res) {
  res.render("contactus");
});

// router.post("/view", upload.single("HouseImage"), function (req, res) {
//   console.log(req.file);

//   const newHouse = new lands({
//     Title: req.body.title,
//     Description: req.body.desc,
//     Price: req.body.price,
//     image: {
//       data: fs.readFileSync(
//         path.join(__dirname + "/uploads/" + req.file.filename)
//       ),
//       contentType: "image/png",
//     },
//     Bedrooms: req.body.beds,
//     Bathrooms: req.body.baths,
//     SquareFt: req.body.space,
//     Type: req.body.type,
//   });

//   newHouse
//     .save()
//     .then(() => res.send("successfully uploaded"))
//     .catch((err) => console.log(err));

//   res.redirect("view");
// });

router.post("/delete/:id", async (req, res) => {
  await user.findByIdAndDelete(req.params.id);
  res.redirect("/users");
});

router.post("/update/:id", async (req, res) => {
  var x;
  const person = await user.findById(req.params.id);
  if (person.isAdmin) {
    x = false;
  } else x = true;

  await user.findByIdAndUpdate(req.params.id, { isAdmin: x });
  res.redirect("/users");
});

router.post("/logout", function (req, res, next) {
  console.log("logout");

  if (req.session) {
    // delete session object

    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect("login");
      }
    });
  }
});

router.get("/logout", function (req, res, next) {
  console.log("logout");

  if (req.session) {
    // delete session object
    console.log("hi");
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        console.log("hi");
        res.redirect("login");
      }
    });
  }
});

module.exports = router;
