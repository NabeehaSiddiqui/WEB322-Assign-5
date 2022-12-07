// var posts = [];
// var categories = [];
// var fs = require("fs");

const Sequelize = require("sequelize");
var sequelize = new Sequelize(
  "defh3epjpclos5",
  "katoxzxdutxeqo",
  "d0ad8d680a88bbf131772fd21f693ba4cc4124c22b5a3a6ecd879a6c81708c14",
  {
    host: "ec2-3-223-213-207.compute-1.amazonaws.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

var PostDB = sequelize.define("Post", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
});

var CategoryDB = sequelize.define("Category", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  category: Sequelize.STRING,
});

PostDB.belongsTo(CategoryDB, { foreignKey: "category" });

module.exports.initialize = () => {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(resolve())
      .catch(reject("Error: unable to sync the database"));
  });
};

module.exports.addPost = (postData) => {
  return new Promise((resolve, reject) => {
    postData.published = postData.published ? true : false;
    for (i in postData) {
      if (postData[i] == "") {
        postData[i] = null;
      }
    }
    PostDB.create({
      body: postData.body,
      title: postData.title,
      featureImage: postData.featureImage,
      postDate: new Date(),
      published: postData.published,
      category: postData.category
    })
      .then(resolve(PostDB))
      .catch(reject("Unable to add post"));
  });
};

module.exports.addCategory = (categoryData) => {
  return new Promise((resolve, reject) => {
    for (i in categoryData) {
      if (categoryData[i] == "") {
        categoryData[i] = null;
      }
    }
    CategoryDB.create({
      id: categoryData.id,
      category: categoryData.category,
    })
      .then(resolve(CategoryDB))
      .catch(reject("Unable to create category"));
  });
};

module.exports.deleteCategoryById = (catid) => {
  return new Promise((resolve, reject) => {
    CategoryDB.destroy({
      where: { id: catid },
    })
      .then(resolve())
      .catch((error) => reject(error));
  });
};

module.exports.deletePostById = (postid) => {
  return new Promise((resolve, reject) => {
    PostDB.destroy({
      where: { id: postid },
    })
      .then(resolve(PostDB.findAll()))
      .catch((error) => reject(error));
  });
};

module.exports.getAllPosts = () => {
  return new Promise((resolve, reject) => {
    PostDB.findAll()
      .then((posts) => {
        resolve(posts);
      })
      .catch((error) => {
        reject("No results returned");
      });
  });
};

module.exports.getPostsByCategory = (postCategory) => {
  return new Promise((resolve, reject) => {
    PostDB.findAll({
      where: {
        category: postCategory
      }
    })
      .then((posts) => {
        resolve(posts);
      })
      .catch((error) => {
        reject("No results returned");
      });
  });
};

module.exports.getPostsByMinDate = (minDate) => {
  return new Promise((resolve, reject) => {
    const { gte } = Sequelize.Op;
    PostDB.findAll({
      where: {
        postDate: {
          [gte]: new Date(minDate),
        },
      },
    })
      .then((posts) => {
        resolve(posts);
      })
      .catch((error) => {
        reject("No results returned");
      });
  });
};

module.exports.getPostById = (postID) => {
  return new Promise((resolve, reject) => {
    PostDB.findAll({
      where: {
        id: postID
      }
    })
      .then((data) => resolve(data[0]))
      .catch((error) => {
        reject("No results returned");
      });
  });
};

module.exports.getCategories = () => {
  return new Promise((resolve, reject) => {
    CategoryDB.findAll()
      .then((category) => {
        resolve(category);
      })
      .catch((error) => {
        reject("Unable to get categories");
      });
  });
};

module.exports.getPublishedPostsByCategory = (postCategory) => {
  return new Promise((resolve, reject) => {
    PostDB.findAll({
      where: {
        category: postCategory,
        published: true,
      },
    })
      .then((posts) => {
        resolve(posts);
      })
      .catch((error) => {
        reject("No results returned");
      });
  });
};

module.exports.getPublishedPosts = () => {
  return new Promise((resolve, reject) => {
    PostDB.findAll({
      where: {
        published: true,
      },
    })
      .then((posts) => {
        resolve(posts);
      })
      .catch((error) => {
        reject("No results returned");
      });
  });
};
