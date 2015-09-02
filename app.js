var express = require("express"),
app = express(),
methodOverride = require('method-override'),
bodyParser = require("body-parser");
session = require("cookie-session"),

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));

app.get('/', function(req,res){
  res.render('index');
});


app.listen(3000, function(){
  "Server is listening on port 3000";
});