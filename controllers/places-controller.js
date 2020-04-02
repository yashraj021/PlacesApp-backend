const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs');
const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');


const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;
    
    let place;

    try {
      place = await Place.findById(placeId);
    } catch(err) {
        const error = new HttpError("Something went wrong, couldn't find place.", 500);
        return next(error);
    }

    if(!place) {
        const error = new HttpError("Couldn't find place for provided place id.", 404);
        return next(error);
    }

    res.json({place: place.toObject({getters: true})});
};


const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    let places;
    try{
        places = await Place.find({ creator: userId});
    } catch(err) {
        const error = new HttpError("Fetching Places failed, please try again.", 500);
        
        return next(error);
    }

    if(!places || places.length === 0) {
        return next(new HttpError("Couldn't find places for provided user id.", 404));
    }

    res.json({places: places.map(place => place.toObject({getters: true}))});
};

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return next(new HttpError("Invalid Input, check data.", 422));
    }

    const { title, description, address } = req.body;

    let coords;
    try {
        coords = await getCoordsForAddress(address);
    } catch(error) { 
        return next(error);
    }

    const createdPlace = new Place({
        title,
        description,
        location: coords,
        address,
        creator: req.userData.userId,
        image: req.file.path
    })

    let user;

    try {
        user = await User.findById(req.userData.userId);
    } catch(err) {
        const error = new HttpError("Creating place please try again.", 500);

        return next(error);
    }

    if(!user) {
        const error = new HttpError("Couldn't find user for provided id.", 404);

        return next(error);
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({ session: sess });
        user.places.push(createdPlace);
        await user.save({ session: sess});
        await sess.commitTransaction();

    } catch(err) {
        const error = new HttpError('Creating place failed, please try again.', 500);
        return next(error);
    }

    res.status(201).json({place: createdPlace});
};

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new HttpError("Invalid Input, check data.", 422);
        return next(error);
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;
    let place;

    try {
        place = await Place.findById(placeId);
    } catch(err) {
        const error = new HttpError("Something went wrong, couldn't update place,", 500);
        return next(error);
    }

    if (place.creator.toString() !== req.userData.userId) {
        const error = new HttpError("You aren't allowed to update place,", 401);
        return next(error);
    }

    place.title = title;
    place.description = description;

    try {
        await place.save();
    } catch(err) {
        const error = new HttpError("Something went wrong, couldn't save the updated place,", 500);
        return next(error);
    }
    
    res.status(200).json({place: place.toObject({getters: true})})
};

const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId).populate('creator')
    } catch (err) {
        const error = new HttpError("Something went wrong, couldn't delete place.", 500);
        return next(error);
    }
    if(!place) {
        const error = new HttpError("Couldn't find place with this id.", 404);
        return next(error);
    }

    if(place.creator.id !== req.userData.userId) {
        const error = new HttpError("You aren't allowed to update place,", 401);
        return next(error);
    }

    const imagePath = place.image;

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        place.remove({session: sess});
        place.creator.places.pull(place);
        await place.creator.save({session: sess});
        await sess.commitTransaction();
    } catch(err) {
        const error = new HttpError("Something went wrong, couldn't delete place.", 500);
        return next(error);
    }

    fs.unlink(imagePath, err => {
        console.log(err)
    });

    res.status(200).json({ message: "DELETED!"})
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;