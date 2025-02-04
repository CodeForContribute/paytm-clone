const express = require("express");
const zod = require('zod');
const {User, Account} = require("../db");
const {authMiddleware} = require("../middleware");
const jwt = require("jsonwebtoken");
const {JWT_SECRET} = require("../config");

const signUpBody = zod.object({
    username: zod.string().email(),
    firstName: zod.string(),
    lastName: zod.string(),
    password: zod.string(),
});

const router = express.Router();

// 1. signUp - /api/v1/user/signUp
router.post("/signUp", async (req, res) => {
    const {success} = signUpBody.safeParse(req.body);
    if (!success) {
        return res.status(411).json({
            message: "Email already taken Or Incorrect inputs",
        })
    }
    // check if user already exists in DB
    const existingUser = await User.findOne({
        username: req.body.username,
    });

    // if username already exists in db
    if (existingUser) {
        return res.status(411).json({
            message: "Email already taken",
        });
    }
    const user = await User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    });

    const userId = user._id;

    // create a new Account and update the account for a user with some initial val
    const account = await Account.create({
        userId: userId,
        balance:1 + Math.random() * 10000
    })
    console.log(user._id);
    console.log(account._id);
    const token = jwt.sign({userId: userId,}, JWT_SECRET);
    console.log(" token >>>> ", token);
    return res.status(201).json({
        msg: "Sign up successfully",
        token: token,
    })
})

// 2. signIn - /api/v1/user/SignIn
// validate userSign payload
const signInBody = zod.object({
    username: zod.string(),
    password: zod.string(),
});

router.post("/signIn", async (req, res) => {
    const {success} = signInBody.safeParse(req.body);
    if (!success) {
        return res.status(411).json({
            msg: "InValid inputs"
        });
    }

    // check if user exists or not if yes, find the user from db
    const user = await User.findOne({
        username: req.body.username,
        password: req.body.password,
    });

    if (user) {
        const token = jwt.sign({
            userId: user._id,
        }, JWT_SECRET);
        return res.status(200).json({
            msg: "Sign in successfully",
            token: token,
        })
    }
    return res.status(411).json({
        msg: "Error while signing in",
    })
});

// 3. PUT - /api/v1/user
// other auth routes
const updateUserBody = zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
});

router.put('/updateProfile', authMiddleware, async (req, res) => {
    const {success} = updateUserBody.safeParse(req.body);
    if (!success) {
        return res.status(411).json({
            msg: "Error while updating information",
        })
    }
    await User.updateOne({
        _id: req.user.id
    }, req.body);
    res.status(201).json({
        msg: "Profile updated successfully",
    })
});


// 4. route to get users from backend,filterable via firstname/lastname
// GET - /api/v1/user/bulk?filter={firstname/lastname/etc}

router.get('/bulk', async(req,res)=>{
    const filter = req.query.filter || "";
    const users = await User.find({
        $or:[{
            firstName: {
                $regex:filter
            }
        },{
            lastName: {
                $regex:filter
            }
        }]
    });
    return res.status(200).json({
        user:users.map(usr=>({
            username: usr.username,
            firstName: usr.firstName,
            lastName: usr.lastName,
            _id:usr._id,
        }))
    });
});

module.exports = router;