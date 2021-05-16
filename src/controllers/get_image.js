const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

const Logger = require('../modules/Logger');
const log = new Logger();
const IMAGES_BASE_PATH = path.join(__dirname, '..', '..')

// this should check for permissions
exports.getImage = async function (imageFileName, imageSubDir, public) {
    let result = {
        fetched: false,
        status: 000,
        data: null
    }

    const filePath = path.join(IMAGES_BASE_PATH, imageSubDir, imageFileName);

    // check permissions here
    if (!public) { }

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

exports.getImageAtSize = async function (imageFName, imageSubDir, public, sizeStr) {
    const result = await exports.getImage(imageFName, imageSubDir, public)

    if (result.fetched === false) return getImageResult;
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
            return getImageResult;
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
