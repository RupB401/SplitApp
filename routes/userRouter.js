var express = require('express');
var controller = require('../components/user')
var apiAuth = require('../helper/apiAuthentication')
var passport = require('passport')
var jwt = require('jsonwebtoken')

var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

//User Registeration router
router.post('/v1/register', controller.userReg)

//User Login router 
router.post('/v1/login', controller.userLogin)

// Initiate Google OAuth
router.get('/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
}))

// Google OAuth callback
router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login' }),
    (req, res) => {
        try {
            // Generate JWT token
            const token = jwt.sign(
                { userId: req.user._id, emailId: req.user.emailId },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '7d' }
            )
            
            // Prepare user data
            const userData = {
                userId: req.user._id,
                emailId: req.user.emailId,
                firstName: req.user.firstName || req.user.name,
                lastName: req.user.lastName || '',
                profilePicture: req.user.profilePicture,
                accessToken: token
            }
            
            // Redirect to frontend with token
            const redirectUrl = `http://localhost:3000/login/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`
            res.redirect(redirectUrl)
        } catch (error) {
            res.redirect('http://localhost:3000/login?error=authentication_failed')
        }
    }
)

// Logout
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' })
        }
        res.json({ message: 'Logged out successfully' })
    })
})

//View User router 
router.post('/v1/view', apiAuth.validateToken,controller.viewUser)

//Edit User router
router.post('/v1/edit', apiAuth.validateToken, controller.editUser)

//Delete User router 
router.delete('/v1/delete', apiAuth.validateToken,controller.deleteUser)

//Update Password router
router.post('/v1/updatePassword',apiAuth.validateToken, controller.updatePassword)

//Get all User Emalil Id 
router.get('/v1/emailList',apiAuth.validateToken, controller.emailList)

module.exports = router;