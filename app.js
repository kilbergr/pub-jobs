var express = require("express"),
app = express(),
morgan = require("morgan"),
bodyParser = require("body-parser"),
methodOverride = require("method-override"),
db = require("./models"),
session = require("cookie-session"),
loginMiddleware = require("./middleware/loginHelper"),
routeMiddleware = require("./middleware/routeHelper");

app.set("view engine", "ejs");
app.use(morgan("tiny"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(__dirname + '/public'));
app.use(loginMiddleware);

//cookie set
app.use(session({
	maxAge: 3600000,
	secret: 'canyoukeepit',
	name: 'snickerdoodle'
}));


//LOGIN RELATED ROUTES
//signup page
app.get('/signup', routeMiddleware.preventLoginSignup, function(req,res){
  res.render('users/signup');
});

//create new user
app.post("/signup", function (req, res) {
  var newUser = req.body.user;
  db.User.create(newUser, function (err, user) {
    if (user) {
      req.login(user);
      res.redirect("/posts");
    } else {
      console.log(err);
      // TODO - handle errors in ejs!
      res.render("users/signup");
    }
  });
});

//login page for existing users
app.get("/login", routeMiddleware.preventLoginSignup, function (req, res) {
  res.render("users/login");
});

app.post("/login", function (req, res) {
  db.User.authenticate(req.body.user,
  function (err, user) {
    if (!err && user !== null) {
      req.login(user);
      res.redirect("/posts");
    } else {
      // TODO - handle errors in ejs!
      res.render("users/login");
    }
  });
});

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
})

//POST routes
//ROOT
app.get('/', function(req, res){
	res.redirect("/posts");
});

//index
app.get('/posts', function(req, res){

		db.Post.find({}, function(err, posts){
			if(err){
				console.log(err);
				//TODO: figure out what to do with errors 
				res.render("errors/404")
			}
			else{
				res.render("posts/index", {posts:posts});

			}
	
	})
})

//new
app.get('/posts/new', routeMiddleware.ensureLoggedIn, function(req, res){
	req.currentUser(function(err,user){
		res.render('posts/new', {user:user});
	});
})

//create
app.post('/posts', routeMiddleware.ensureLoggedIn, function(req, res){
	db.Post.create(req.body.post, function(err, post){
		if(err){
			console.log(err);
			//TODO: error handling
			res.render("posts/new");
		}
		else{
			req.currentUser(function(err,user){
				//add user to post
				post.user = user._id;
				//user.posts.push(post);
				post.save();
				//user.save();
				res.redirect('/posts');
			})
		}
	});
});

//show
app.get('/posts/:id', function(req, res){
		
			db.Post.findById(req.params.id)
			.populate('comments')
			.exec(function(err, post){
				if(err){
					console.log(err);
					//TODO: error handling
					res.render('posts/index')
				}
				else{
					res.render("posts/show", {post:post})
				}

		});
});

//edit
app.get('/posts/:id/edit', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectPoster, function(req, res){
			db.Post.findById(req.params.id)
			.populate('comments')
			.exec(function(err, post){
				if(err){
					console.log(err);
					//TODO: error handling
					res.render('posts/show')
				}
				else{
					res.render('posts/edit', {post:post})
				}
			});
});

//update
app.put('/posts/:id', routeMiddleware.ensureLoggedIn, function(req, res){
	db.Post.findByIdAndUpdate(req.params.id, req.body.post, function(err, post){
		if(err){
			console.log(err);
			//TODO: error handling
			res.render('posts/edit');
		}
		else{
			res.redirect('/posts');
		}
	});
});

//destroy
app.delete('/posts/:id', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectPoster, function(req, res){
	db.Post.findByIdAndRemove(req.params.id, function(err, post){
		if(err){
			console.log(err);
			//TODO: error handling
			res.render('posts/show');
		}
		else{
			post.remove();
			res.redirect('/posts');
		}
	});
});

//COMMENT routes
//index
app.get('/posts/:post_id/comments', function(req, res){
	req.currentUser(function(err,user){
		db.Post.findById(req.params.post_id)
		.populate('comments')
		.exec(function(err, post){
			if(err){
				//TODO: error handling
				console.log(err);
				res.render('/posts');
			}
			else{
				res.render('comments/index', {post:post, user:user});
			}
		});
	});
});

//new
app.get('/posts/:post_id/comments/new', routeMiddleware.ensureLoggedIn, function(req, res){
	req.currentUser(function(err,user){
		db.Post.findById(req.params.post_id)
		.populate('comments')
		.exec(function(err, post){
			if(err){
				//TODO: error handling
				console.log(err);
				res.render('/posts');
			}
			else{
				res.render('comments/new', {post:post, user:user});
			}
		});
	});
});

//create
app.post('/posts/:post_id/comments', routeMiddleware.ensureLoggedIn, function(req, res){
	db.Comment.create(req.body.comment, function (err, comment){
		if(err){
			//TODO: error handling
			console.log(err);
			res.render('comments/new');
		}
		else{
			req.currentUser(function(err,user){
				db.Post.findById(req.params.post_id, function(err, post){
				//add user to comment
				post.comments.push(comment);
				comment.post = post._id;
				comment.user = user._id;
				comment.save();
				post.save();
				res.redirect('/posts/' + req.params.post_id + "/comments");
				});
			});
		}
	});
});

//show
app.get('/posts/:post_id/comments/:id', function(req, res){
		db.Comment.findById(req.params.id)
		.populate('post')
		.exec(function(err, comment){
			if(err){
			//TODO: error handling
				console.log(err);
				res.render('comments');
			}
			else
			res.render('comments/show', {comment:comment, post:comment.post});
		});
});

//edit
app.get('/posts/:post_id/comments/:id/edit', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectCommenter, function(req, res){
	db.Comment.findById(req.params.id, function(err, comment){
		res.render('comments/edit', {comment:comment});
	});
});

//update
app.put('/posts/:post_id/comments/:id', routeMiddleware.ensureLoggedIn, function(req, res){
	db.Comment.findByIdAndUpdate(req.params.id, req.body.comment, function(err, comment){
		if(err){
			//TODO: error handling
			console.log(err);
			res.render('comments/edit');
		}
		else{
			res.redirect('/posts/' + comment.post + "/comments");
		}
	});
});

//destroy
app.delete('/posts/:post_id/comments/:id', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectCommenter, function(req, res){
	db.Comment.findByIdAndRemove(req.params.id, function(err, comment){
		if(err){
			//TODO: error handling
			console.log(err);
			res.render('comments/index');
		}
		else{
			res.redirect('/posts/' + comment.post + '/comments');
		}
	});
});

//remaining errors
app.get('*', function(req, res){
	res.render('errors/404');
});

//start server
app.listen(8000, function(){
	console.log("server listening on 8000");
});