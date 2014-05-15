
/*
 * GET home page.
 */

var url = require('url');
var path = require('path');
var redis = require('redis');
var db = redis.createClient();
 
exports.index = function(req, res){

  if(req.session.email) {
      res.render('index', { email: req.session.email });
  }
  else{
      res.render('index', { email: null });
  }
};

exports.signup = function(req, res){
  
  // Get user email
  var email = req.body.email;
  // Store in session
  req.session.email = email;
  
  res.redirect('/');
};



