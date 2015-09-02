$(function(){
	//unnecessary and unsecure
	var postdate = function(){
		$("#newpost").on("submit", function(event){
			var date = new Date();
			var datePost = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear().toString().substr(2,2);
				console.log(datePost);
			$("#posted").val(datePost);
		})
	}
	var commentdate = function(){
		$("#newcomment").on("submit", function(event){
			var dateC = new Date();
			var dateComment = (dateC.getMonth() + 1) + "/" + dateC.getDate() + "/" + dateC.getFullYear().toString().substr(2,2);
				console.log(dateComment);
			$("#commented").val(dateComment);
		})
	}
//what to do with the profile info?


	//postdate();
	//commentdate();
})