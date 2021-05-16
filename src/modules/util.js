const fs = require('fs-extra');
const JWT = require('jsonwebtoken');
const Logger = require('./Logger')
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

    try {
        if (req.cookies) {
            if (req.cookies[SETTINGS.jwt_cookie_name]) {
                const token = exports.decodeJWT(req.cookies[SETTINGS.jwt_cookie_name], publicCert)
                if (token['userID'])
                    if (token['issued'])
                        if (token['expires']) {
                            const issued = Date.parse(token['issued']);
                            const expires = Date.parse(token['expires']);

                            if (issued < expires)
                                valid = true;
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
    else next();
}