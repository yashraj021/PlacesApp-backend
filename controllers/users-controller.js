const { validationResult } = require('express-validator');


const HttpError = require('../models/http-error');
const User = require('../models/user');


const getUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, '-password')
    } catch(err) {
        const error = new HttpError("Fetching User failed, please try again.", 500);

        return next(error);
    }

    res.json({users: users.map(user => user.toObject({getters: true}))}); 
};

const signUp = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error =  new HttpError("Invalid Input, check data.", 422);
        return next(error);
    }
    const { name, email, password } = req.body;
    let existingUser;

    try {
        existingUser = await User.findOne({email: email});
    } catch(err) {
        const error = new HttpError("Signing Up failed, please try again later.", 500);
        return next(error);

    }

    if(existingUser) {
        const error = new HttpError("User exists. Please login.", 422);
        return next(error);
    }

    const createdUser = new User({
        name,
        password,
        email,
        image: 'https://avatars2.githubusercontent.com/u/47192627?s=460&u=887f008eec63433d4904794be842ce515776bf03&v=4',
        places: []
    });

    try {
        await createdUser.save();
    } catch(err) {
        const error = new HttpError('Signing Up failed, please try again.', 500);
        return next(error);
    }

    res.status(201).json({user: createdUser.toObject({getters: true})});
};

const login = async (req, res, next) => {
    const {email, password} = req.body;

    let existingUser;

    try {
        existingUser = await User.findOne({email: email});
    } catch(err) {
        const error = new HttpError("Logging Up failed, please try again later.", 500);
        return next(error);

    }

    if(!existingUser || existingUser.password !== password) {
        console.log(existingUser);
        const error = new HttpError("Invalid credentials, please check and try again.", 401);
        return next(error);
    }

    res.json({message: 'Logged In'}); 
};

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.login = login;