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


const getPlacesByUserId = (req, res, next) => {
    const userId = req.params.uid;
    const places = DUMMY_PLACES.filter( place => {
        return place.creator === userId
    })

    if(!places || places.length === 0) {
        return next(new HttpError("Couldn't find places for provided user id.", 404));
    }

    res.json({places});
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

const updatePlace = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        throw new HttpError("Invalid Input, check data.", 422);
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;

    const updatedPlace = {...DUMMY_PLACES.find(place => place.id === placeId )};
    const placeIndex = DUMMY_PLACES.findIndex(place => place.id === placeId);

    updatedPlace.title = title;
    updatedPlace.description = description;
    
    DUMMY_PLACES[placeIndex] = updatedPlace;
    
    res.status(200).json({place: updatedPlace})
};

const deletePlace = (req, res, next) => {
    const placeId = req.params.pid;
    
    if(!DUMMY_PLACES.find(place => place.id === placeId)){
        throw new HttpError("Couldn't find the Id.", 404);
    }

    DUMMY_PLACES = DUMMY_PLACES.filter(place => place.id !== placeId);
    res.status(200).json({ message: "DELETED!"})
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;