/*********************************************************************************
 *  WEB322 – Assignment 05
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part
 *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Nabeeha Siddiqui Student ID: 129947214 Date: 25-11-2022
 *
 *  Online (Heroku) Link: https://hidden-lowlands-71425.herokuapp.com/blog
 ********************************************************************************/
const express = require("express");
const stripJs = require("strip-js");
const multer = require("multer");

const HTTP_PORT = process.env.PORT || 8080;
const path = require("path");
const app = express();
const exphbs = require("express-handlebars");
const blogData = require(path.join(__dirname, "/blog-service.js"));
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const upload = multer(); // no { storage: storage } since we are not using disk storage

app.engine(".hbs", exphbs.engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");

cloudinary.config({
  cloud_name: "ddd55ykf6",
  api_key: "316926127964727",
  api_secret: "CRsYQRfooLOB5Q9NzdPJboPkZsk",
  secure: true,
});

function onHttpStart() {
  console.log("Express http servicer listening on " + HTTP_PORT);
}

app.use(express.urlencoded({extended: true}));

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute ? ' class="active" ' : "") +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      safeHTML: function (context) {
        return stripJs(context);
      },
      formatDate: function(dateObj){
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
    },    
    },
  })
);

blogData
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch((errmsg) => {
    console.error("Message from server: " + errmsg);
  });

app.get("/", (req, res) => {
  res.redirect("/blog");
});

app.get("/blog", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let post = posts[0];

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
    viewData.post = post;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData });
});

app.get("/blog/:id", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogData.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogData.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the post by "id"
    viewData.post = await blogData.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData });
});

app.get("/about", (req, res) => {
  res.render(path.join(__dirname + "/views/about.hbs"));
});

app.get("/posts/add", (req, res) => {
  blogData.getCategories().then((data) => {
  res.render(path.join(__dirname + "/views/addPosts.hbs"),{categories: data})})});

app.post("/posts/add", upload.single("featureImage"), (req, res) => {
  let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });
      try {
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      } catch (err) {
        err = "Upload an image with your blog post"
        res.render("404", { message: err });
      };
    });
  };
  async function upload(req) {
    let result = await streamUpload(req);
    console.log(result);
    return result;
  }
  upload(req).then((uploaded) => {
    req.body.featureImage = uploaded.url;
    blogData.addPost(req.body).then(() => {
      res.redirect("/posts");
    });
  });
});

app.get("/posts", (req, res) => {
  if (req.query.category) {
    blogData
      .getPostsByCategory(req.query.category)
      .then((data) => {
        if (data.length > 0) {
          res.render("posts", {posts: data});
        } else {
          res.render("posts", { message: "no results" });
        }
      })
      .catch((errmsg) => {
        res.render("posts", {categories: []}); 
      });
  } else if (req.query.minDate) {
    blogData
      .getPostsByMinDate(req.query.minDate)
      .then((data) => {
        if (data.length > 0) {
          res.render("posts", { posts: data });
        } else {
          res.render("posts", { message: "no results" });
        }
      })
      .catch((errmsg) => {
        if (data.length > 0) {
          res.render("posts", { posts: data });
        } else {
          res.render("posts", { message: "no results" });
        }
      });
  } else {
    blogData
      .getAllPosts()
      .then((data) => {
        if (data.length > 0) {
          res.render("posts", { posts: data });
        } else {
          res.render("posts", { message: "no results" });
        }
      })
      .catch((errmsg) => {
        if (data.length > 0) {
          res.render("posts", { posts: data });
        } else {
          res.render("posts", { message: "no results" });
        }
      });
  }
});

app.get("/post/:value", (req, res) => {
  blogData
    .getPostById(req.params.value)
    .then((postData) => {
      res.status(200).json(postData);
    })
    .catch((errmsg) => {
      res.status(500);
      res.json({ message: errmsg });
    });
});

app.get("/categories", (req, res) => {
  blogData
    .getCategories()
    .then((data) => {        
      if (data.length > 0) {
        res.render("categories", { categories: data });
      } else {
        res.render("categories", { message: "no results" });
      }
    })
    .catch((errmsg) => {
      res.render("categories", { message: "no results" });
    });
});

app.get("/categories/add", (req, res) => {
  res.render(path.join(__dirname + "/views/addCategory.hbs"));
});

app.post("/categories/add", (req, res) => {
    blogData.addCategory(req.body).then(() => {
      res.redirect("/categories");
    });
  });

app.get("/categories/delete/:id", (req, res) => {
  blogData
    .deleteCategoryById(req.params.id)
    .then(res.redirect("/categories"))
    .catch((error) =>
        res.status(500).send("Unable to Remove Category / Category not found")
    );
});

app.get("/posts/delete/:id", (req, res) => {
  blogData
    .deletePostById(req.params.id)
    .then(res.redirect("/posts"))
    .catch((error) =>
        res.status(500).send("Unable to Remove Post / Post not found")
    );
});

app.get("*", (req, res) => {
  res.render("404", { message: "Page not found!" });
});
