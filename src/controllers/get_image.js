const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

const Logger = require('../modules/Logger');
const log = new Logger();
const IMAGES_BASE_PATH = path.join(__dirname, '..', '..')

// this should check for permissions
exports.getImage = async function (imageFileName, imageSubDir, public, jwtToken, dbInstance) {
    let result = {
        fetched: false,
        status: 000,
        data: null
    }

    const filePath = path.join(IMAGES_BASE_PATH, imageSubDir, imageFileName);

    // check permissions here
    if (!public) {
        const permsOK = await checkUserHasAccess(dbInstance, imageFileName, jwtToken)
        if (!permsOK) {
            result.fetched = false;
            result.status = 403;
            return result;
        }
    }

    if (await checkIfFileExists(filePath)) {
        try {
            const data = await fs.readFile(filePath)
            result = {
                fetched: true,
                status: 200,
                data: data
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

exports.getImageAtSize = async function (imageFName, imageSubDir, public, sizeStr, jwtToken, dbInstance) {
    const result = await exports.getImage(imageFName, imageSubDir, public, jwtToken, dbInstance)

    if (result.fetched === false) return result;
    else {
        try {
            const sizes = sizeStr.split('x')
            sizes[0] = parseInt(sizes[0])
            sizes[1] = parseInt(sizes[1])

            result.data = await sharp(result.data).resize({
                kernel: sharp.kernel.lanczos2,
                fit: 'inside',
                width: sizes[0],
                height: sizes[1]
            }).toBuffer()

            return result;
        } catch (err) {
            log.error(err)
            result.fetched = false;
            result.status = 500;
            return result;
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

exports.getImageData = async function (dbInstance, imageID) {
    const q = {
        selector: {
            _id: { "$eq": imageID },
        },
        fields: ["_id", "_rev", "belongsTo", "size", "accessList"],
        limit: (1)
    };
    return await dbInstance.find(q)
}

const checkUserHasAccess = async function (dbInstance, imageID, jwtToken) {
    try {
        let queryRes = await exports.getImageData(dbInstance, imageID)
        queryRes = queryRes.docs[0]

        for (const allowed of queryRes.accessList) {
            if (allowed.toString() === jwtToken.userID.toString())
                return true;
        }

        return false;
    } catch (err) {
        log.log(err)
        return false;
    }
}