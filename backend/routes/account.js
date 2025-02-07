const express = require("express");
const {authMiddleware} = require("../middleware");
const {Account} = require("../db");
const mongoose = require("mongoose");
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

});

// POST - An endpoint for user to transfer money to another account
/* Body
* {
*   to:string,
*   amount:number
* }
* Response -
*    200 OK, msg : Transfer Successful
*    400 BAD REQUEST , msg: Insufficient balance/Invalid Account
*
* */
// router.post('/account/transfer', authMiddleware, async (req, res) => {
//     // bad code - w/o transaction
//     // to - id of the other user to which balance need to be transferred
//     const {to, amount} = req.body;
//     const account = await Account.findOne({
//         userId: req.userId,
//     });
//
//     if (account.balance < amount) {
//         return res.status(400).json({
//             msg: `Insufficient balance for user : ${req.userId}`,
//         });
//     }
//
//     // if to account is not found in db then throw err
//     const toAccount = Account.findOne({
//         userId: to
//     });
//     if (!toAccount) {
//         return res.status(400).json({
//             msg: `Account not found for user : ${to}`,
//         });
//     }
//
//     // update balance for the 2 users
//     await Account.updateOne({
//         userId: req.userId,
//     }, {
//         $inc: {
//             balance: -amount,
//         }
//     });
//
//     await Account.updateOne({
//         userId: to
//     }, {
//         $inc: {
//             balance: amount
//         }
//     });
//
//     return res.status(200).json({
//         msg: `Successfully transferred balance : ${amount} from user : ${req.userId} to user : ${to}`,
//     });
//
// })

// Good solution which uses txn in db
router.post('/account/transfer', authMiddleware, async (req, res) => {

    // transaction started
    const session = await mongoose.startSession();
    session.startTransaction();

    const {to, amount} = req.body;
    // fetch the accounts within transaction
    const account = await Account.findOne({
        userId: req.userId,
    }).session(session);

    if (!account) {
        await session.abortTransaction();
        return res.status(401).json({
            msg: `Could not find account for user : ${req.userId}`,
        });
    }
    if (account.balance < amount) {
        await session.abortTransaction();
        return res.status(401).json({
            msg: `Insufficient balance for user : ${req.userId}`,
        })
    }

    const toAccount = await Account.findOne({
        userId: to
    })
    if (!toAccount) {
        await session.abortTransaction();
        return res.status(401).json({
            msg: `Could not find account for user : ${to}`,
        });
    }
    // found the account for both users, update the balance for both the users
    await Account.updateOne({
        userId: req.userId,
    }, {
        $inc: {
            balance: -amount,
        }
    }).session(session);

    await Account.updateOne({
        userId: to
    }, {
        $inc: {
            balance: amount,
        }
    }).session(session);

    // commit both transaction
    await session.commitTransaction();
    return res.status(200).json({
        msg: `Successfully transferred balance from user : ${req.userId} to user ${to}`,
    });

});


module.exports = router;