const fs = require('fs-extra');
const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const SETTINGS = JSON.parse(fs.readFileSync('./../misc/settings.json'));
const DB_SETTINGS = JSON.parse(fs.readFileSync('./../misc/database_settings.json'));
const SERVICE_ACCOUNTS = JSON.parse(fs.readFileSync('./../misc/service_accounts.json'));

const { fetchJWTCert, validateJWT, connectToDB } = require('./modules/util');
let publicCert = null;
const Logger = require('./modules/Logger');
const log = new Logger();

const routeLiveliness = require('./routes/liveliness')
const getRoutePrivateImage = require('./routes/GET/private_image')
const getRoutePublicImage = require('./routes/GET/public_image')

const putRoutePrivateImage = require('./routes/PUT/private_image')
const putRoutePublicImage = require('./routes/PUT/public_image')

const deleteRoutePrivateImage = require('./routes/DELETE/private_image')
const deleteRoutePublicImage = require('./routes/DELETE/public_image')


main().catch((err) => log.error(err))
async function main() {
    const app = express();
    app.use(cookieParser());
    app.use(compression());

    publicCert = (await fetchJWTCert(SETTINGS)).toString();
    app.set('SETTINGS', SETTINGS);
    app.set('SERVICE_ACCOUNTS', SERVICE_ACCOUNTS)
    app.set('publicCert', publicCert);
    app.set('db_conn', await connectToDB(DB_SETTINGS))

    // load API routes
    app.use('/liveliness', routeLiveliness);

    app.use('/get/private', validateJWT, getRoutePrivateImage);
    app.use('/get/public', getRoutePublicImage);

    app.use('/put/private', validateJWT, putRoutePrivateImage);
    app.use('/put/public', validateJWT, putRoutePublicImage);

    app.use('/delete/private', validateJWT, deleteRoutePrivateImage);
    app.use('/delete/public', validateJWT, deleteRoutePublicImage);

    app.listen(8001);
}

