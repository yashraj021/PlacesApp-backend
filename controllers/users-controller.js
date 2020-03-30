const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');


const HttpError = require('../models/http-error');

const DUMMY_USERS = [
    {
        id: 'u1',
        name: 'Yash Srivastava',
        email: 'yash.raj021@gmail.com',
        password: 'sandhya21'
    }
]

const getUsers = (req, res, next) => {
    res.json({users: DUMMY_USERS})
};

const signUp = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        throw new HttpError("Invalid Input, check data.", 422);
    }
    const { name, email, password } = req.body;

    const existingUser = DUMMY_USERS.find(user => user.email === email);
    if(existingUser) 
        throw new HttpError("Email Id already exists.", 422);

    const createdUser = {
        id: uuidv4(),
        name,
        password,
        email
    };

    DUMMY_USERS.push(createdUser);

    res.status(201).json({user: createdUser});
};

const login = (req, res, next) => {
    const {email, password} = req.body;

    const identifiedUser = DUMMY_USERS.find(user => user.email === email);
    if(!identifiedUser || identifiedUser.password !== password) {
        throw new HttpError("Please check your credentials.", 401);
    }

    res.json({message: 'Logged In'}); 
};

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.login = login;