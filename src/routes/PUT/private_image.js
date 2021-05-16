const express = require('express');
const router = express.Router();
const { saveImage } = require("../../controllers/put_image");

const multer = require('multer');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })


router.put('/', upload.single('file'), async (req, res) => {
    const SETTINGS = req.app.get('SETTINGS')

    const file = req.file.buffer
    const fType = req.file.mimetype.split('/')[1]

    const result = await saveImage('private_files', file, fType, req.cookies[SETTINGS.jwt_cookie_name], SETTINGS, false)
    res.status(result.status).send(result);
});

module.exports = router;