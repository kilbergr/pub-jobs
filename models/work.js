var mongoose = require("mongoose");

var workSchema = new mongoose.Schema({
											title: {
												type: String, 
												required: true
											},
											summary: {
												type: String, 
												required: true
											},
											date: {
												type: String
											},
												user: {
												type: mongoose.Schema.Types.ObjectId,
												ref: "User"
											}
});



var Work = mongoose.model("Work", workSchema);

//making sure models were properly set up--checked so commented out
// Work.find({}).populate('user').exec(function(err, work){
// 	console.log(work.user);
//  });

module.exports = Work;
