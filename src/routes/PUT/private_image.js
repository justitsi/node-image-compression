const express = require('express');
const router = express.Router();
const { saveImage } = require("../../controllers/put_image");

const multer = require('multer');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })


router.put('/', upload.single('file'), async (req, res) => {
    const SETTINGS = req.app.get('SETTINGS')
    const SERVICE_ACCOUNTS = req.app.get('SERVICE_ACCOUNTS')
    const db_conn = req.app.get('db_conn')

    const file = req.file.buffer
    const fType = req.file.mimetype.split('/')[1]

    const result = await saveImage('private_files', file, fType, req.decodedJWT, SETTINGS, false, db_conn, SERVICE_ACCOUNTS)
    res.status(result.status).send(result);
});

// this will be used to set the permissions to read
router.post('/:imageID', async (req, res) => {

});

module.exports = router;