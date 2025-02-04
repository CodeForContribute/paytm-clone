/*
*     Express - HTTP Server
      mongoose - ODM to connect to MongoDB
    * zod - Input validation
*
*
* */
//  all call for /api/v1 - will go through this router
const express = require('express');
const userRouter = require('./user');
const accountRouter = require('./account');
const router = express.Router();
router.use("/user",userRouter);
router.use("/account",accountRouter);
module.exports = router;