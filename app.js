const express = require('express');
const bodyParser = require('body-parser');

const PlacesRoutes = require('./routes/places-routes');
const UsersRoutes = require("./routes/users-routes");

const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());

app.use('/api/places', PlacesRoutes);

app.use('/api/user', UsersRoutes);

// Error Handeling for bad requests.
app.use((req, res, next) => {
    const error = new HttpError('Could not find this rote.', 404);
    throw error;
});

app.use((error, req, res, next) => {
    if(res.headerSent) {
        return next(error);
    }

    res.status(error.code || 500);
    res.json({message: error.message || 'An unknown error occured.'})
})

app.listen(5000);