require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require('cookie-parser');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const mongoosePaginate = require('mongoose-paginate');
const flash = require('express-flash');
const path = require('path');


const app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge:
    36000000000}
}));
app.use(flash());

app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

mongoose.set('useCreateIndex', true);

mongoose.connect(process.env.DBURL, {
  useFindAndModify: false,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

let url = "";
let pageUrl = "";

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  upvote: Number,
  downvote: Number,
  upvoteIds: [],
  downvoteIds: []
});

const secretFearSchema = new mongoose.Schema({
  userID: String,
  secrets: String,
  votes: Number,
  date: Date
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
secretFearSchema.plugin(mongoosePaginate);

const User = new mongoose.model("user", userSchema);
const secretFear = new mongoose.model("secret", secretFearSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://polar-bayou-96804.herokuapp.com/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/secrets");
  } else {
    res.render("home");
  }

});

app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  function(req, res) {
    User.findOne({_id: req.user.id}, function(err, user){

      if(err){
        console.log(err);
      }else{
        if(user){
            let vote = user.upvote;
            let vote1 = user.downvote;
            User.findByIdAndUpdate(req.user.id, {$set: {upvote: vote, downvote: vote1 }, $push: {upvoteIds: [], downvoteIds: []}}, function (err, docss){
                if(err) return console.log(err);
                res.redirect("/secrets");
            });
        }
      }
    });

  });

app.get("/login", function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/secrets");
  } else {
    res.render("login");
  }
});


app.get("/register", function(req, res) {
  if (req.isAuthenticated()) {
      res.redirect("/secrets");
  } else {
    res.render("register", {error: "", email: "", password: ""});
  }
});

  var istrue;

app.get("/secrets", function(req,res){

  req.isAuthenticated() ?  istrue = true : istrue = false
    url = "/secrets";
    pageUrl = "/secrets";
  secretFear.paginate({"secrets": {$ne: null}}, { page: 1, limit: 15 , sort: { date: -1 }}, function(err, result) {
  res.render('secrets', {result:result.docs,total:result.total,limit:result.limit,
    page:result.page,
    pages:result.pages,
    isTrue: istrue,
    pageUrl: pageUrl,

  });
  });
});

app.get("/secrets/:page-:limit", function(req, res) {

var page=req.params.page || 1;
var r_limit=req.params.limit || 15;
var limit=parseInt(r_limit);

req.isAuthenticated() ?  istrue = true : istrue = false
  url = "/secrets/" + page + "-" + limit;
  pageUrl = "/secrets";

  secretFear.paginate({"secrets": {$ne: null}}, { page: page, limit:limit, sort: { date: -1 }}, function(err, result) {
res.render('secrets', { result:result.docs,limit:result.limit,page:page, pages:result.pages, isTrue: istrue, pageUrl: pageUrl
});
});
});






app.get("/UpvotedSecrets", function(req,res){
  req.isAuthenticated() ?  istrue = true : istrue = false
    url = "/UpvotedSecrets";
    pageUrl = "/UpvotedSecrets";
  secretFear.paginate({"secrets": {$ne: null}}, { page: 1, limit: 15 , sort: { votes: -1 }}, function(err, result) {
  res.render('secrets', {result:result.docs,total:result.total,limit:result.limit,
    page:result.page,
    pages:result.pages,
    isTrue: istrue,
    pageUrl: pageUrl
  });
  });
});

app.get("/UpvotedSecrets/:page-:limit", function(req, res) {

var page=req.params.page || 1;
var r_limit=req.params.limit || 15;
var limit=parseInt(r_limit);
  pageUrl = "/UpvotedSecrets";
req.isAuthenticated() ?  istrue = true : istrue = false

 url = "/UpvotedSecrets/" + page + "-" + limit;

  secretFear.paginate({"secrets": {$ne: null}}, { page: page, limit:limit, sort: { votes: -1 }}, function(err, result) {
res.render('secrets', { result:result.docs,limit:result.limit,page:page, pages:result.pages, isTrue: istrue,pageUrl: pageUrl
});
});
});







app.get("/DownvotedSecrets", function(req,res){
  req.isAuthenticated() ?  istrue = true : istrue = false
    url = "/DownvotedSecrets";
    pageUrl = "/DownvotedSecrets";
  secretFear.paginate({"secrets": {$ne: null}}, { page: 1, limit: 15 , sort: { votes: 1 }}, function(err, result) {
  res.render('secrets', {result:result.docs,total:result.total,limit:result.limit,
    page:result.page,
    pages:result.pages,
    isTrue: istrue,
    pageUrl: pageUrl
  });
  });
});

app.get("/DownvotedSecrets/:page-:limit", function(req, res) {

var page=req.params.page || 1;
var r_limit=req.params.limit || 15;
var limit=parseInt(r_limit);
  pageUrl = "/DownvotedSecrets";
req.isAuthenticated() ?  istrue = true : istrue = false

 url = "/DownvotedSecrets/" + page + "-" + limit;

  secretFear.paginate({"secrets": {$ne: null}}, { page: page, limit:limit, sort: { votes: 1 }}, function(err, result) {
res.render('secrets', { result:result.docs,limit:result.limit,page:page, pages:result.pages, isTrue: istrue,pageUrl: pageUrl
});
});
});




app.get("/LatestSecrets", function(req,res){
  req.isAuthenticated() ?  istrue = true : istrue = false
    url = "/LatestSecrets";
    pageUrl = "/LatestSecrets";
  secretFear.paginate({"secrets": {$ne: null}}, { page: 1, limit: 15 , sort: { date: -1 }}, function(err, result) {
  res.render('secrets', {result:result.docs,total:result.total,limit:result.limit,
    page:result.page,
    pages:result.pages,
    isTrue: istrue,
    pageUrl: pageUrl
  });
  });
});

app.get("/LatestSecrets/:page-:limit", function(req, res) {

var page=req.params.page || 1;
var r_limit=req.params.limit || 15;
var limit=parseInt(r_limit);
  pageUrl = "/LatestSecrets";
req.isAuthenticated() ?  istrue = true : istrue = false

 url = "/LatestSecrets/" + page + "-" + limit;

  secretFear.paginate({"secrets": {$ne: null}}, { page: page, limit:limit, sort: { date: -1 }}, function(err, result) {
res.render('secrets', { result:result.docs,limit:result.limit,page:page, pages:result.pages, isTrue: istrue,pageUrl: pageUrl
});
});
});







app.get("/OldestSecrets", function(req,res){
  req.isAuthenticated() ?  istrue = true : istrue = false
    url = "/OldestSecrets";
    pageUrl = "/OldestSecrets";
  secretFear.paginate({"secrets": {$ne: null}}, { page: 1, limit: 15 , sort: { date: 1 }}, function(err, result) {
  res.render('secrets', {result:result.docs,total:result.total,limit:result.limit,
    page:result.page,
    pages:result.pages,
    isTrue: istrue,
    pageUrl: pageUrl
  });
  });
});

app.get("/OldestSecrets/:page-:limit", function(req, res) {

var page=req.params.page || 1;
var r_limit=req.params.limit || 15;
var limit=parseInt(r_limit);
  pageUrl = "/OldestSecrets";
req.isAuthenticated() ?  istrue = true : istrue = false

 url = "/OldestSecrets/" + page + "-" + limit;

  secretFear.paginate({"secrets": {$ne: null}}, { page: page, limit:limit, sort: { date: 1 }}, function(err, result) {
res.render('secrets', { result:result.docs,limit:result.limit,page:page, pages:result.pages, isTrue: istrue,pageUrl: pageUrl,
});
});
});






app.get("/submit", function(req, res) {

  if (req.isAuthenticated()) {
    res.render("submit", {
      added: false
    });
  } else {
    res.redirect("/login");
  }

});


app.get("/mysecretsandfears", function(req, res) {

  if (req.isAuthenticated()) {
    secretFear.find({userID: req.user.id }, function(err, foundSecrets) {
          if(err) return console.log(err);
          User.findOne({_id: req.user.id}, function(err, user){
          res.render("mysecretsandfears", {secrets: foundSecrets, userdetails: user});
        });
          });
  } else {
    res.redirect("/login");
  }

});


app.get("/logout", function(req, res) {
  req.logout();
  req.session.destroy();
  res.redirect("/");
});


app.post('/login',
  passport.authenticate('local', { successRedirect: '/secrets',failureRedirect: '/login', failureFlash: true })
);



app.post("/register", function(req, res) {

  User.register({username: req.body.username, upvote: 0, downvote: 0, upvoteIds: [], downvoteIds: []}, req.body.password, function(err, user) {
    if (err) {
      res.render("register", {error: "Email already taken!", email: req.body.username, password: req.body.password});
    } else {
      console.log("Registered successfully");
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });

    }
  });


});




app.post("/secrets",function(req,res){
  res.redirect("/secrets");
});




app.post("/upvote",function(req,res){
  const id = req.body.upvote;
  let checkID = "";

  if(req.isAuthenticated()){

//This tries to find the secret/fear with its id from upvote icon
    secretFear.findOne({ _id: id }, function (err, foundSecret){
        if(err) return console.log(err);
        let votes = foundSecret.votes;
        let ID = foundSecret.userID;
        votes = votes + 1;

//This tries to find User from the above secret/fear with attribute 'userID'
    User.findOne({_id: req.user.id}, function(err, user){
      let upvoteIds = user.upvoteIds;
      if(err) return res.redirect(url);
    if(upvoteIds.length > 0){
      // This loops through the user attribute upvotesIds array
      for(var i = 0; i <= upvoteIds.length; i++){
        if(id === upvoteIds[i]){
          checkID = upvoteIds[i];
          break;
        }else{
          checkID = "";
        }
      }
        if(checkID === ""){
          //This finds secret/fear with Id and increment the votes attribute
                            secretFear.findByIdAndUpdate(id, {votes: votes }, function (err, docs) {
                                if (err){console.log(err)}
                                else{
          //This finds user with the userID from the secret/fear(i.e creator of secret/fear)
                                  User.findOne({_id: ID}, function(err, userr){

                                    if(err){
                                      console.log(err);
                                    }else{
                                      if(userr){
                                          let vote = userr.upvote;
                                          vote = vote + 1;
          //This find user and increment upvote
                                          User.findByIdAndUpdate(ID, {$set: {upvote: vote }}, function (err, docss){
                                              if(err) return console.log(err);
                                              user.upvoteIds.push(id);
                                              user.save(function(){
                                                user.downvoteIds.pull(id);
                                                user.save(function(){
                                                  checkID = "";
                                                      res.redirect(url);
                                                });
                                          });

                                      });
                                      }
                                    }
                                  });
                                }
                          });
        }else{
          res.redirect(url);
        }

    }else{

      secretFear.findByIdAndUpdate(id, {votes: votes }, function (err, docs) {
          if (err){console.log(err)}
          else{
            User.findOne({_id: ID}, function(err, userr){
              if(err){
                console.log(err);
              }else{
                if(userr){
                    let vote = userr.upvote;
                    vote = vote + 1;

                    User.findByIdAndUpdate(ID, {upvote: vote }, function (err, docss){
                        if(err) return console.log(err);
                        user.upvoteIds.push(id);
                        user.save(function(){
                          user.downvoteIds.pull(id);
                          user.save(function(){
                              res.redirect(url);
                          });
                    });

                });
                }
              }
            });
          }
    });

    }

      });
    });
  }else{
    req.flash("upvote","You need to login before Upvoting a secret/fear. Please Login or Register.");
    res.redirect(url);
  }


});


app.post("/downvote",function(req,res){
  const id = req.body.downvote;
  let checkID = "";

  if(req.isAuthenticated()){

    secretFear.findOne({ _id: id }, function (err, foundSecret){
        if(err) return console.log(err);
        let votes = foundSecret.votes;
        let ID = foundSecret.userID;
        votes = votes - 1;

    User.findOne({_id: req.user.id}, function(err, user){
      downvoteIds = user.downvoteIds;
      if(err) return res.redirect(url);
    if(downvoteIds.length > 0){

      // This loops through the user attribute downvotesIds array
      for(var i = 0; i <= downvoteIds.length; i++){
        if(id === downvoteIds[i]){
          checkID = downvoteIds[i];
          break;
        }else{
          checkID = "";
        }
      }
        if(checkID === ""){
          //This finds secret/fear with Id and decrement the votes attribute
                            secretFear.findByIdAndUpdate(id, {votes: votes }, function (err, docs) {
                                if (err){console.log(err)}
                                else{
          //This finds user with the userID from the secret/fear(i.e creator of secret/fear)
                                  User.findOne({_id: ID}, function(err, userr){

                                    if(err){
                                      console.log(err);
                                    }else{
                                      if(userr){
                                          let vote = userr.downvote;
                                          vote = vote + 1;
          //This find user and increment downvote
                                          User.findByIdAndUpdate(ID, {$set: {downvote: vote }}, function (err, docss){
                                              if(err) return console.log(err);
                                              user.downvoteIds.push(id);
                                              user.save(function(){
                                                user.upvoteIds.pull(id);
                                                user.save(function(){
                                                  checkID = "";
                                                      res.redirect(url);
                                                });
                                          });

                                      });
                                      }
                                    }
                                  });
                                }
                          });
        }else{
          res.redirect(url);
        }

    }else{

      secretFear.findByIdAndUpdate(id, {votes: votes }, function (err, docs) {
          if (err){console.log(err)}
          else{
            User.findOne({_id: ID}, function(err, userr){

              if(err){
                console.log(err);
              }else{
                if(userr){
                    let vote = userr.downvote;
                    vote = vote + 1;

                    User.findByIdAndUpdate(ID, {downvote: vote }, function (err, docss){
                        if(err) return console.log(err);
                        user.downvoteIds.push(id);
                        user.save(function(){
                          user.upvoteIds.pull(id);
                          user.save(function(){
                              res.redirect(url);
                          });

                    });
                    });
                }
              }
            });
          }
    });

    }

      });
    });
  }else{
  req.flash("downvote","You need to login before Downvoting a secret/fear. Please Login or Register.")
    res.redirect(url);
  }

});


app.post("/submit", function(req, res) {

let secret = new secretFear({
  secrets: req.body.secret,
  userID: req.user.id,
  votes: 0,
  date: Date()
});
secret.save(function(err) {

  if (err) return console.log(err);
  res.render("submit", {
    added: true
  });
});

});


app.post("/delete", function(req, res) {

  let deleteSecret = req.body.check;

  secretFear.findByIdAndRemove(deleteSecret, function(err) {
    if(err)
    {
      console.log(err);
    }
    else{
      res.redirect("/mysecretsandfears");
    }

  });


});



app.listen(process.env.PORT || 3000, function() {
  console.log("app is listening to port 3000 ");
})
