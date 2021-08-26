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
const getRouteImageInfo = require('./routes/GET/image_info')

const putRoutePrivateImage = require('./routes/PUT/private_image')
const putRoutePublicImage = require('./routes/PUT/public_image')

const deleteRoutePrivateImage = require('./routes/DELETE/private_image')
const deleteRoutePublicImage = require('./routes/DELETE/public_image')


main().catch((err) => log.error(err))
async function main() {
    log.log("Starting up image compression instance")
    const app = express();
    app.use(cookieParser());
    app.use(compression());
    app.use(express.json());

    if (process.env.NODE_ENV !== "production") {
        const cors = require('cors')
        const corsOptions = {
            origin: ['http://localhost:3000', 'http://localhost:8080', 'https://localhost:8443'],
            credentials: true
        }

        app.use(cors(corsOptions))
        log.log("Running with CORS enabled. To disable run in NODE_ENV=production")
    }

    publicCert = (await fetchJWTCert(SETTINGS)).toString();
    app.set('SETTINGS', SETTINGS);
    app.set('SERVICE_ACCOUNTS', SERVICE_ACCOUNTS)
    app.set('publicCert', publicCert);
    app.set('db_conn', await connectToDB(DB_SETTINGS))

    // load API routes
    app.use('/liveliness', routeLiveliness);

    app.use('/get/private', validateJWT, getRoutePrivateImage);
    app.use('/get/public', getRoutePublicImage);
    app.use('/get/imageData', validateJWT, getRouteImageInfo);


    app.use('/put/private', validateJWT, putRoutePrivateImage);
    app.use('/put/public', validateJWT, putRoutePublicImage);

    app.use('/delete/private', validateJWT, deleteRoutePrivateImage);
    app.use('/delete/public', validateJWT, deleteRoutePublicImage);

    log.log("Image compression started, listening on port 8001")
    app.listen(8001);
}