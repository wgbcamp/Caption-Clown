var db = require("../models")
const bcrypt = require("bcryptjs")
const passport = require("passport")
const upload = require('../server')

//saving image path for uploading caption value

module.exports = function (app) {

    // This will add the currently logged in user's username to the account/{username} URL and redirect them to it
    // The "Account" link in the navbar uses this route
    app.get("/api/acctredirect", function (req, res) {
        let username = req.user.username
        res.redirect("/account/" + username)
    })


    // CREATE User Route
    app.post("/api/register", function (req, res) {
        console.log(req.body)
        // Bring in the reqs so that we can do some checks here (we could move this to another file later)
        const { username, password, password2 } = req.body;
        let errors = [];
        // Check that fields are filled
        if (!username || !password || !password2) {
            errors.push( {msg: 'Please fill in all fields'} )
        };
        // Check that password match
        if (password !== password2) {
            errors.push({ msg: 'Password must match!' })
        };
        // Check password length
        if (password.length < 6) {
            errors.push({ msg: 'Password must contain at least 6 characters' })
        };
        // If there are errors, send back the errors and username
        // This is useless for now, but we can add a partials folder with an 'errors' file inside and call that on the register page
        // We can pass the object from this res.render to show those error messages above on the page when a user makes an error
        if (errors.length > 0) {
            res.render("error", {
                errors
            });
            // Otherwise log success and create a new row on the users table
        } else {
            // Check if the username exists
            db.Users.findOne({
                where: {
                    username: username
                }
            }).then(function (user) {
                if (user) {
                    // If the username exists, let the user know
                    // Just like above, this won't work without a partials folder and errors file
                    errors.push({ msg: 'This username already exists' });
                    res.render("error", {
                        errors
                    })
                }
                else {
                    // Password encryption
                    // This generates an encrytion 'salt' whatever that means
                    bcrypt.genSalt(10, function (err, salt) {
                        // This uses that 'salt' and creates a hashed password
                        bcrypt.hash(password, salt, function (err, hash) {
                            if (err) throw err;
                            // Post to the Users table and use the hash as the password
                            db.Users.create({
                                username,
                                password: hash
                            }).then(function () {
                                // Send the user to the login page
                                res.redirect("/login")
                            })
                        })
                    })
                }
            })
        }
    });
    // Login authentication
    app.post("/api/login", function (req, res, next) {
        passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/login'
        })(req, res, next)
    });

    // UPDATE Passwords Route
    app.put("/api/users", function (req, res) {
        // Password encryption
        // This generates an encrytion 'salt' whatever that means
        bcrypt.genSalt(10, function (err, salt) {
            // This uses that 'salt' and creates a hashed password
            bcrypt.hash(req.body.newPassword, salt, function (err, hash) {
                if (err) throw err;
                // Post to the Users table and use the hash as the password
                db.Users.update({
                    password: hash
                }, {
                    where: {
                        username: req.user.username
                    }
                },
                ).then(function () {
                    // Go back to account page
                    res.redirect("/api/acctredirect")
                })
            })
        })
    })

    // CREATE post route
    // POST request to send images to client webpage
    app.post('/uploadimage', (req, res) => {
        upload(req, res, (err) => {
            if (err) {
                res.render('newPost', {
                    msg: err
                });
            } else {
                if (req.file == undefined) {
                    res.render('newPost', {
                        msg: 'Error: No File Selected!'
                    });
                } else {
                    res.render('newPost', {
                        msg: 'File Uploaded!',
                        file: `/assets/images/${req.file.filename}`
                    });
                }
  
    //page for users to upload captions after clicking on a post
    app.post('/newCaption', (req, res) => {
        db.Posts.findAll({
            include: [db.Captions]
        })
            .then(posts => {
                res.render('newCaption', {
                    posts
                });
                console.log(posts);
            });
        });

            }
        });
    });

     //allows user to add title to post and sends post info to database
     app.post('/uploadtitle', (req, res) => {     
        db.Posts.create({
            title: req.body.title,
            image: req.body.image,
            totalVotes: 0,
            author: req.user.username,
            UserId: req.user.id
        })
        .then(function () {
        // Send the user back to main page
        res.redirect("/")
    })
     });

     //allows posting of captions to database
    app.post('/postcaption', (req, res) => {
        db.Captions.create({
            text: req.body.text,
            noOfVotes: 0,
            author: req.user.username,
            PostId: "notsureyet",
            UserId: req.user.id
        })
    })
}
    

// Still need:


// Create/Update Captions Routes
// db.Captions.create caption  ---- so users can create new captions

// db.Captions.update noOfVotes  ---- to update votes when a user votes on a caption



// Create/Update Votes Routes
// db.Votes.create vote  ---- will create a new vote when a user clicks the button

// db.Votes.update (just update. it has foreign keys that will change without any extra code from us) ---- if a user votes on a different caption



// Delete Routes
// db.Users.destroy user 

// db.Posts.destroy post

// db.Captions.destroy captions
