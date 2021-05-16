const express = require('express');
const router = express.Router();
const { saveImage } = require("../../controllers/put_image");

const multer = require('multer');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })


router.put('/', upload.single('file'), async (req, res) => {
    const SETTINGS = req.app.get('SETTINGS')

    let file = req.file.buffer

    const result = await saveImage('public_files', file, req.cookies[SETTINGS.jwt_cookie_name], SETTINGS, true)

    res.status(result.status).send(result);
});

module.exports = router;