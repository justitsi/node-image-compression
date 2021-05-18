const fs = require('fs-extra');
const JWT = require('jsonwebtoken');
const Logger = require('./Logger');
const log = new Logger();

exports.fetchJWTCert = async (settingsObj) => {
    const useLocal = settingsObj.use_local_public_cert;
    const certLocation = settingsObj.public_cert_location;
    let serverCert;

    if (useLocal) {
        try {
            serverCert = fs.readFileSync(certLocation);
        }
        catch (err) {
            log.log('error reading certificate file');
            log.trace(err)
        }
    }
    else {
        log.error("Remote certs not supported yet")
    }
    return (serverCert);
}

exports.decodeJWT = (token, cert) => {
    let result = false;

    try {
        result = JWT.verify(token, cert);
    }
    catch (err) { log.log(err) }

    return result;
}

exports.validateJWT = async (req, res, next) => {
    const SETTINGS = req.app.get('SETTINGS')
    const publicCert = req.app.get('publicCert')
    let valid = false;
    let decodedJWT;

    try {
        if (req.cookies) {
            if (req.cookies[SETTINGS.jwt_cookie_name]) {
                const token = exports.decodeJWT(req.cookies[SETTINGS.jwt_cookie_name], publicCert)
                if (token['userID'])
                    if (token['issued'])
                        if (token['expires']) {
                            const issued = Date.parse(token['issued']);
                            const expires = Date.parse(token['expires']);

                            if (issued < expires) {
                                valid = true;
                                decodedJWT = token;
                            }
                        }
            }
        }
    } catch (err) {
        log.error(err)
    }

    if (valid === false) {
        const message = {
            message: 'Bad JWT token',
            status: 500
        }
        res.status(500).send(message)
    }
    else {
        req.decodedJWT = decodedJWT;
        next();
    }
}

exports.connectToDB = async (dbSettings) => {
    const dbUrl = `${dbSettings.protocol}://${dbSettings.username}:${dbSettings.password}@${dbSettings.address}:${dbSettings.port}`
    const nano = require('nano')(dbUrl);

    let db;
    try {
        const result = await nano.db.create(dbSettings.table_name);
        log.log('Trying to create db')
        log.log(result)
        db = nano.db.use(dbSettings.table_name);
    }
    catch (err) {
        try {
            db = nano.db.use(dbSettings.table_name);
        } catch (err) {
            log.error(err);
        }
    }
    return db
}