const express = require("express");
const {authMiddleware} = require("../middleware");
const {Account} = require("../db");
const router = express.Router();

// GET - An endpoint for user to get their balance
// /api/v1/account/balance
router.get('/balance', authMiddleware, async (req, res) => {
    const account = await Account.findOne({
        userId: req.userId,
    });
    if (!account) {
        return res.status(200).json({
            "balance": account.balance
        });
    }
    return res.status(411).json({
        msg: `Error in finding balance for user : ${req.userId}`,
    });

})
module.exports = router;