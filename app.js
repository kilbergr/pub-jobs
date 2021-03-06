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

//search routes
app.get('/search', function(req,res){
  res.render('users/search');
});

app.get('/searchresults', function(req,res){
 var result = req.query.searchresults;

  db.User.find({ firstName: result }, function (err, users) {
           	if(err){
				console.log(err);
				//TODO: figure out what to do with errors 
				res.render("errors/404")
			}
			else{
				res.render("users/index", {users:users});

			}

	})
})
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
      res.redirect("/users");
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
      res.redirect("/users");
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


//ROOT
app.get('/', function(req, res){
	res.redirect("/users");
});

//index
app.get('/users', function(req, res){

		db.User.find({}, function(err, users){
			if(err){
				console.log(err);
				//TODO: figure out what to do with errors 
				res.render("errors/404")
			}
			else{
				res.render("users/index", {users:users});

			}
	
	})
})


//show
app.get('/users/:id', function(req, res){
			db.User.findById(req.params.id)
			.populate('works')
			.exec(function(err, user){
				if(err){
					console.log(err);
					//TODO: error handling
					res.render('users/index')
				}
				else{
					res.render("users/show", {user:user})
				}

		});
});

//edit
app.get('/users/:id/edit', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectUser, function(req, res){
			db.User.findById(req.params.id)
			.populate('comments')
			.exec(function(err, user){
				if(err){
					console.log(err);
					//TODO: error handling
					res.render('users/show')
				}
				else{
					res.render('users/edit', {user:user})
				}
			});
});

//update
app.put('/users/:id', routeMiddleware.ensureLoggedIn, function(req, res){
	db.User.findByIdAndUpdate(req.params.id, req.body.user, function(err, user){
		if(err){
			console.log(err);
			//TODO: error handling
			res.render('users/edit');
		}
		else{
			res.redirect('/users');
		}
	});
});

//destroy
app.delete('/users/:id', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectUser, function(req, res){
	db.User.findByIdAndRemove(req.params.id, function(err, user){
		if(err){
			console.log(err);
			//TODO: error handling
			res.render('users/show');
		}
		else{
			user.remove();
			res.redirect('/users');
		}
	});
});

// works routes

//new
app.get('/users/:user_id/works/new', routeMiddleware.ensureLoggedIn, function(req, res){
	req.currentUser(function(err,user){
		db.User.findById(req.params.user_id)
		.populate('works')
		.exec(function(err, user){
			if(err){
				//TODO: error handling
				console.log(err);
				res.render('/users');
			}
			else{
				res.render('works/new', {user:user});
			}
		});
	});
});

//create
app.post('users/:id/works', routeMiddleware.ensureLoggedIn, function(req, res){
	db.Work.create(req.body.work, function(err, work){
		if(err){
			console.log(err);
			//TODO: better error handling
			res.render("works/new");
		}
		else{
			debugger;
			req.currentUser(function(err,user){
				//add user to works
				work.user = user._id;
				//user.works.push(work);
				work.save();
				//user.save();
				res.redirect('/user/:id');
			})
		}
	});
});

// //destroy
app.delete('/users/:user_id/works/:id', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectUser, function(req, res){
	db.Comment.findByIdAndRemove(req.params.id, function(err, work){
		if(err){
			//TODO: error handling
			console.log(err);
			res.render('user/:user_id');
		}
		else{
			res.redirect('/users/' + work.user);
		}
	});
});


//COMMENT routes
//index
// app.get('/posts/:post_id/comments', function(req, res){
// 	req.currentUser(function(err,user){
// 		db.Post.findById(req.params.post_id)
// 		.populate('comments')
// 		.exec(function(err, post){
// 			if(err){
// 				//TODO: error handling
// 				console.log(err);
// 				res.render('/posts');
// 			}
// 			else{
// 				res.render('comments/index', {post:post, user:user});
// 			}
// 		});
// 	});
// });



// //show
// app.get('/posts/:post_id/comments/:id', function(req, res){
// 		db.Comment.findById(req.params.id)
// 		.populate('post')
// 		.exec(function(err, comment){
// 			if(err){
// 			//TODO: error handling
// 				console.log(err);
// 				res.render('comments');
// 			}
// 			else
// 			res.render('comments/show', {comment:comment, post:comment.post});
// 		});
// });

// //edit
// app.get('/posts/:post_id/comments/:id/edit', routeMiddleware.ensureLoggedIn, routeMiddleware.ensureCorrectCommenter, function(req, res){
// 	db.Comment.findById(req.params.id, function(err, comment){
// 		res.render('comments/edit', {comment:comment});
// 	});
// });

// //update
// app.put('/posts/:post_id/comments/:id', routeMiddleware.ensureLoggedIn, function(req, res){
// 	db.Comment.findByIdAndUpdate(req.params.id, req.body.comment, function(err, comment){
// 		if(err){
// 			//TODO: error handling
// 			console.log(err);
// 			res.render('comments/edit');
// 		}
// 		else{
// 			res.redirect('/posts/' + comment.post + "/comments");
// 		}
// 	});
// });


//remaining errors
app.get('*', function(req, res){
	res.render('errors/404');
});

//start server
app.listen(8000, function(){
	console.log("server listening on 8000");
});