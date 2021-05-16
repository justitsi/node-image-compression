const fs = require('fs-extra');
const path = require('path');

const Logger = require('../modules/Logger');
const log = new Logger();
const IMAGES_BASE_PATH = path.join(__dirname, '..', '..')

//this should check whether the request is made y the owner in the db
exports.deleteImage = async (imageFileName, imageSubDir) => {
    let result = {
        deleted: false,
        status: 000,
    }

    const filePath = path.join(IMAGES_BASE_PATH, imageSubDir, imageFileName);

    if (await checkIfFileExists(filePath)) {
        try {
            await fs.unlink(filePath);
            result = {
                deleted: true,
                status: 200,
            }
        } catch (err) {
            log.error(err)
            result.status = 500;
        }
    }
    else {
        result.status = 404;
    }

    return result;
}

const checkIfFileExists = async (fileName) => {
    let exists = false;

    try {
        if (fs.existsSync(fileName)) exists = true;
    } catch (err) { }

    return exists;
}
