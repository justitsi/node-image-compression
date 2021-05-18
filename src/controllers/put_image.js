const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const path = require('path');
const { getImageData } = require('./get_image');

const Logger = require('../modules/Logger');
const log = new Logger();
const IMAGES_BASE_PATH = path.join(__dirname, '..', '..')

exports.saveImage = async function (imageSubDir, file, fType, jwtToken, settings, isPublic, db_conn, serAccs) {
    let result = {
        status: 000,
        message: "",
        location: null,
        size: - 1,
        saved: false
    }

    try {
        fType = await getFileType(fType, settings)
        const compressionResult = await compressImage(file, fType, settings)
        file = compressionResult.data
        fType = compressionResult.format

        // check file length
        if (file.length > settings.max_file_size_kilobytes * 1024) {
            return {
                status: 413,
                message: "Image too large",
                saved: false,
            }
        }

        const quotaOK = await checkUserQuota(db_conn, jwtToken, file.length, serAccs, settings);
        if (!quotaOK) return {
            status: 413,
            message: "File will exceed user quota",
            saved: false,
        }

        const id = uuidv4() + "." + fType
        const filePath = path.join(IMAGES_BASE_PATH, imageSubDir, `${id}`);
        fs.writeFileSync(filePath, file)

        const saveOK = await addImgDataToDB(db_conn, jwtToken, id, file.length, isPublic);
        if (!saveOK) throw ("Problem saving image metadata to DB server")

        result.status = 200;
        result.message = "saved";
        result.location = id;
        result.saved = true;
        result.size = file.length / 1024;

        return result;
    } catch (err) {
        log.error(err);
        return {
            status: 500,
            message: "An internal server error has occured",
            saved: false,
        }
    }
}

const addImgDataToDB = async (dbInstance, jwtToken, fileID, fileLen, public) => {
    try {
        let accessList;
        if (public) accessList = ["*"];
        else accessList = [];

        await dbInstance.insert({ _id: fileID, belongsTo: jwtToken.userID, size: fileLen, accessList: accessList });
        return true;
    } catch (err) {
        log.error(err);
        return false;
    }
}

const checkUserQuota = async (dbInstance, jwtToken, fileLen, serviceAccs, settings) => {
    try {
        //check if request user is a registered service account
        for (const acc of serviceAccs) {
            if (acc.userID.toString() === jwtToken.userID.toString()) {
                return true;
            }
        }

        const q = {
            selector: {
                belongsTo: { "$eq": jwtToken.userID },
            },
            fields: ["_id", "size"],
            limit: (settings.user_maximum_num_of_files + 10)
        };

        const resultItems = await dbInstance.find(q)

        // check number of files/entries
        if (resultItems.docs.length + 1 >= settings.user_maximum_num_of_files) return false;

        // check file sizes
        let currentBytesUsed = fileLen
        for (const result of resultItems.docs) {
            currentBytesUsed += result.size
        }
        return !(currentBytesUsed / 1024 > settings.user_quota_kilobytes)
    } catch (err) {
        log.error(err);
        return false;
    }
}

const compressImage = async (file, fType, settings) => {
    if (fType == 'jpeg') return { data: await convertImageToJpeg(file, settings), format: fType }
    if (fType == 'png') return { data: await convertImageToPng(file, settings), format: fType }
    if (fType == 'auto') {
        const png = await convertImageToPng(file, settings)
        const jpg = await convertImageToJpeg(file, settings)

        if (png.length < jpg.length) return { data: png, format: 'png' }
        else return { data: jpg, format: 'jpeg' }
    }

    throw ("Invalid picture format selected in settings")
}

const getFileType = async (fType, settings) => {
    //jpeg png
    preffered = settings.preffered_format
    if (preffered == "png" || preffered == "jpeg") return preffered;
    if (preffered == 'preserve' || preffered == "original") return fType;
    if (preffered == 'auto') return 'auto';
}

const convertImageToJpeg = async (file, settings) => {
    const maxSizes = settings.max_resolution.split('x')
    let cRatio = 100;
    let resizeOptions = {}
    if (settings.preffered_format != 'original') {
        cRatio = settings.quality * 100
        resizeOptions = {
            width: parseInt(maxSizes[0]),
            height: parseInt(maxSizes[1]),
            fit: 'inside',
            kernel: sharp.kernel.lanczos2,
        }
    }
    else return file

    const resizedFile = await sharp(file).resize(resizeOptions).jpeg(
        {
            quality: cRatio,
            mozjpeg: true
        }
    ).toBuffer();

    return resizedFile;
}

const convertImageToPng = async (file, settings) => {
    const maxSizes = settings.max_resolution.split('x')
    let cRatio = 100;
    let resizeOptions = {}
    if (settings.preffered_format != 'original') {
        cRatio = settings.quality * 100
        resizeOptions = {
            width: parseInt(maxSizes[0]),
            height: parseInt(maxSizes[1]),
            fit: 'inside',
            kernel: sharp.kernel.lanczos2,
        }
    }
    else return file

    const resizedFile = await sharp(file).resize(resizeOptions).png(
        {
            quality: cRatio,
        }
    ).toBuffer();

    return resizedFile;
}

exports.updateImagePerms = async function (dbInstance, imageID, jwtToken, perms) {
    let result = {
        status: 000,
        message: "",
        updated: false,
    }

    try {
        // get image data
        let queryRes = await getImageData(dbInstance, imageID)
        queryRes = queryRes.docs[0]

        // validate request sender is owner
        if (jwtToken.userID.toString() != queryRes.belongsTo.toString()) {
            result.status = 403;
            result.message = "You are not the owner of this image"
            result.updated = false;
            return result;
        }

        // validate new permissions
        for (const perm of perms.accessList) {
            if (perm.toString() == '*') {
                result.status = 400;
                result.message = "The '*' permission is reserved for public images"
                result.updated = false;
                return result;
            }
        }

        // save updated permissions
        await dbInstance.insert({ _id: queryRes._id, _rev: queryRes._rev, belongsTo: jwtToken.userID, accessList: perms.accessList });

        result.status = 200;
        result.message = "Permissions Updated"
        result.updated = true;
    } catch (err) {
        log.error(err)

        result.status = 500;
        result.message = "Server error"
        result.updated = false;
    }
    return result;
}