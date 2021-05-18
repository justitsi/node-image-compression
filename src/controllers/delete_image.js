const fs = require('fs-extra');
const path = require('path');

const Logger = require('../modules/Logger');
const log = new Logger();
const { getImageData } = require('./get_image');
const IMAGES_BASE_PATH = path.join(__dirname, '..', '..')

//this should check whether the request is made y the owner in the db
exports.deleteImage = async (imageFileName, imageSubDir, jwtToken, dbInstance) => {
    let result = {
        deleted: false,
        status: 000,
    }

    try {
        const filePath = path.join(IMAGES_BASE_PATH, imageSubDir, imageFileName);
        if (!(await checkUserIsOwner(imageFileName, jwtToken, dbInstance))) {
            result.deleted = false;
            result.status = 403;
            return result;
        }


        if (await checkIfFileExists(filePath)) {
            try {
                if (await deleteEntry(imageFileName, dbInstance)) {
                    await fs.unlink(filePath);
                    result = {
                        deleted: true,
                        status: 200,
                    }
                }
                else throw (`error deleting image data for ${imageFileName}`)
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
    catch (err) {
        log.error(err);
        return {
            status: 500,
            saved: false,
        }
    }
}

const checkIfFileExists = async (fileName) => {
    let exists = false;

    try {
        if (fs.existsSync(fileName)) exists = true;
    } catch (err) { }

    return exists;
}

const checkUserIsOwner = async (imageID, jwtToken, dbInstance) => {
    try {
        let queryRes = await getImageData(dbInstance, imageID)
        queryRes = queryRes.docs[0]

        if (queryRes.belongsTo.toString() === jwtToken.userID.toString()) return true
        else return false
    } catch (err) {
        log.log(err)
        return false;
    }
}

//this function assumes that the owner for the doc was checked 
const deleteEntry = async (imageID, dbInstance) => {
    try {
        let queryRes = await getImageData(dbInstance, imageID)
        queryRes = queryRes.docs[0]
        const status = await dbInstance.destroy(queryRes._id, queryRes._rev)

        return status.ok;
    } catch (err) {
        log.error(err)
        return false;
    }
}
