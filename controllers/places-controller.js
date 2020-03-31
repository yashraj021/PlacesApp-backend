const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');

let DUMMY_PLACES = [
    {
      id: 'p1',
      title: 'Empire State Building',
      description: 'One of the most famous sky scrapers in the world!',
      location: {
        lat: 40.7484474,
        lng: -73.9871516
      },
      address: '20 W 34th St, New York, NY 10001',
      creator: 'u1'
    }
  ];

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

    const { title, description, address, creator } = req.body;

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
        creator,
        image: 'https://avatars2.githubusercontent.com/u/47192627?s=460&u=887f008eec63433d4904794be842ce515776bf03&v=4'
    })

    try {
        await createdPlace.save();
    } catch(err) {
        const error = new HttpError('Creating place failed, please try again.', 500);
        return next(error);
    }

    res.status(201).json({place: createdPlace});
};

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        throw new HttpError("Invalid Input, check data.", 422);
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
        place = await Place.findById(placeId)
    } catch (err) {
        const error = new HttpError("Something went wrong, couldn't delete place.", 500);
        return next(error);
    }

    try {
        await place.remove();

    } catch(err) {
        const error = new HttpError("Something went wrong, couldn't delete place.", 500);
        return next(error);
    }
    res.status(200).json({ message: "DELETED!"})
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;