const express = require('express');
const userRoute = express.Router();
let errorCode = require('../common/error/errorCode')
let getCode = new errorCode()

userRoute.use('/saveUser',require('../authenticate/validateToken'),require('./saveUser'))
userRoute.use('/saveAddonUser',require('../authenticate/validateToken'),require('./saveAddonUser'))
userRoute.use('/getUsers',require('../authenticate/validateToken'),require('./getUsers'))
userRoute.use('/getUser',require('../authenticate/validateToken'),require('./getUser'))
userRoute.use('/deleteUserClientPartner',require('../authenticate/validateToken'),require('./deleteUserClientPartner'))
userRoute.use('/changeUserStatus',require('../authenticate/validateToken'),require('./changeUserStatus'))
userRoute.use('/getUserClientPartners',require('../authenticate/validateToken'),require('./getUserClientPartners'))
userRoute.use('/getAllocatedManagerUsers',require('../authenticate/validateToken'),require('./getAllocatedManagerUsers'))
userRoute.use('/getUnallocatedUsers',require('../authenticate/validateToken'),require('./getUnallocatedUsers'))
userRoute.use('/allocateDellocateStaff',require('../authenticate/validateToken'),require('./allocateDellocateStaff'))
userRoute.use('/allocateDellocateClient',require('../authenticate/validateToken'),require('./allocateDellocateClient'))
userRoute.use('/saveUserClientPartner',require('../authenticate/validateToken'),require('./saveUserClientPartner'))
userRoute.use('/changeUserClientPartnerStatus',require('../authenticate/validateToken'),require('./changeUserClientPartnerStatus'))
userRoute.use('/updateAssignedManager',require('../authenticate/validateToken'),require('./updateAssignedManager'))


userRoute.use('/',(req,res,next) => 
{
    return res.status(400).json({
        "status_code" : 400,
        "message" : "Something went wrong",
        "status_name" : getCode.getStatus(400),
        "error"     : "Wrong method or api"
    }) 
})
module.exports = userRoute