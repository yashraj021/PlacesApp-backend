const express = require('express');
const { check } = require('express-validator');

const {
    getUsers, 
    signUp, 
    login
} = require('../controllers/users-controller');

const router = express.Router();

router.get("/", getUsers);

router.post(
    "/signup", 
    [
        check('name').not().isEmpty(),
        check('email').isEmail(),
        check('password').isLength({min: 8}) 
    ], 
    signUp
);

router.post("/login", login );

module.exports = router;