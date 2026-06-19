const express = require('express'); // Importing the Express framework
const authRoute = express.Router(); // Creating a router object for authentication-related routes
let errorCode = require('../common/error/errorCode') // Importing the errorCode module to handle error codes
let getCode = new errorCode() // Creating a new instance of errorCode to fetch error status names

// Adding different authentication-related route handlers

authRoute.use('/login', require('./login')); // Route for handling user login
authRoute.use('/spsnLogin', require('./spsnLogin')); // Route for handling spsn login
authRoute.use('/sendOtpToRegisteredUser', require('./sendOtpToRegisteredUser')); // Route for sending OTP to a registered user
authRoute.use('/sendOtpToRegisteredSpsn', require('./sendOtpToRegisteredSpsn')); // Route for sending OTP to a registered spsn

// Middleware for validating token before proceeding with logout and change password routes
authRoute.use('/logout', require('./validateToken'), require('./logout')); // Route for handling user logout, with token validation
authRoute.use('/changePassword', require('./validateToken'), require('./changePassword')); // Route for changing user password, with token validation

// Commented out routes for password reset functionality
// authRoute.use('/sendResetLink',require('./sendResetLink')); // Route to send a reset link to the user's email
// authRoute.use('/getResetLinkData',require('./getResetLinkData')); // Route to fetch reset link data
// authRoute.use('/resetPassword',require('./resetPassword')); // Route to reset the user's password using the reset link

// Default route handler for undefined or incorrect routes
authRoute.use('/', (req, res, next) => {
    return res.status(400).json({
        "status_code": 400, // HTTP status code for Bad Request
        "message": "Something went wrong", // Generic error message
        "status_name": getCode.getStatus(400), // Fetching the status name corresponding to the 400 status code
        "error": "Wrong method or api" // Error description indicating an incorrect API route or method was used
    });
});

module.exports = authRoute; // Exporting the authRoute module for use in other parts of the application
