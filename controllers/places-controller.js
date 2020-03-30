const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');

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

const getPlaceById = (req, res, next) => {
    const placeId = req.params.pid;
    const place = DUMMY_PLACES.find( place => {
        return place.id === placeId
    })

    if(!place) {
        throw new HttpError("Couldn't find place for provided place id.", 404);
    }

    res.json({place});
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

    const createdPlace = {
        id: uuidv4(),
        title,
        description,
        location: coords,
        address,
        creator
    }

    DUMMY_PLACES.push(createdPlace);

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