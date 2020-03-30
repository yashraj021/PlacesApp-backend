const express = require('express');

const {getPlaceById, getPlaceByUserId} =require('../controllers/places-controller');

const router = express.Router();


router.get("/:pid", getPlaceById);

router.get("/user/:uid", getPlaceByUserId);

module.exports = router;