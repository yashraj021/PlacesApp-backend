const { validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

    let hashedPassword;

    try {

    } catch (err) {
        const error= new HttpError("Could not create user, please try again later.", 500);
        return next(error);
    }

    hashedPassword = await bcrypt.hash(password, 12);

    const createdUser = new User({
        name,
        password: hashedPassword,
        email,
        image: req.file.path,
        places: []
    });

    try {
        await createdUser.save();
    } catch(err) {
        const error = new HttpError('Signing Up failed, please try again.', 500);
        return next(error);
    }
    let token;
    try {
        token = jwt.sign(
            {userId: createdUser.id, email: createdUser.email}, 
            'sandhya21',
            {expiresIn: '1h'}
        );

    } catch(err) {
        const error = new HttpError('Signing Up failed, please try again.', 500);
        return next(error);
    }

    res.status(201).json({userId: createdUser.id, email: createdUser.email, token: token});
};

const login = async (req, res, next) => {
    const { email, password } = req.body;
  
    let existingUser;
  
    try {
      existingUser = await User.findOne({ email: email });
    } catch (err) {
      const error = new HttpError(
        'Logging in failed, please try again later.',
        500
      );
      return next(error);
    }
  
    if (!existingUser) {
      const error = new HttpError(
        'Invalid credentials, could not log you in.',
        403
      );
      return next(error);
    }
  
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
      const error = new HttpError(
        'Could not log you in, please check your credentials and try again.',
        500
      );
      return next(error);
    }
  
    if (!isValidPassword) {
      const error = new HttpError(
        'Invalid credentials, could not log you in.',
        401
      );
      return next(error);
    }
  
    let token;
    try {
      token = jwt.sign(
        { userId: existingUser.id, email: existingUser.email },
        'sandhya21',
        { expiresIn: '1h' }
      );
    } catch (err) {
      const error = new HttpError(
        'Logging in failed, please try again later.',
        500
      );
      return next(error);
    }
  
    res.json({
      userId: existingUser.id,
      email: existingUser.email,
      token: token
    });
};
  
exports.getUsers = getUsers;
exports.signUp = signUp;
exports.login = login;