const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');  
const fs = require('fs');
const path = require('path');

const PlacesRoutes = require('./routes/places-routes');
const UsersRoutes = require("./routes/users-routes");
const HttpError = require('./models/http-error');

const mongoUrl = 'mongodb+srv://yashraj021:sandhya21@cluster0-v32ho.mongodb.net/YourPlaces?retryWrites=true&w=majority';

const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')))

app.use((req, res, next)=> {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

app.use('/api/places', PlacesRoutes);

app.use('/api/user', UsersRoutes);

// Error Handeling for bad requests.
app.use((req, res, next) => {
    const error = new HttpError('Could not find this rote.', 404);
    throw error;
});

app.use((error, req, res, next) => {
    if(req.file) {
        fs.unlink(req.file.path, err => {
            console.log(err);
        });
    }
 
    if(res.headerSent) {
        return next(error);
    }

    res.status(error.code || 500);
    res.json({message: error.message || 'An unknown error occured.'})
})

mongoose.connect(mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true}).then(() => 
    app.listen(5000)
).catch(err => 
    console.log(err)
);
