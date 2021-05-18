const express = require('express');
const router = express.Router();
const { getImage, getImageAtSize } = require("../../controllers/get_image");

router.get('/:imageID', async (req, res) => {
    try {
        const db_conn = req.app.get('db_conn')
        const result = await getImage(req.params.imageID, 'private_files', false, req.decodedJWT, db_conn)

        if (result.fetched === false) {
            res.status(result.status).send(result)
        }
        else {
            res.setHeader('content-type', 'image/webp');
            res.status(result.status).send(result.data);
        }
    } catch (err) {
        res.status(400).send({ status: 400, message: "Bad Request" });
    }
});

router.get('/:imageID/:sizeStr', async (req, res) => {
    try {
        const db_conn = req.app.get('db_conn')
        const result = await getImageAtSize(req.params.imageID, 'private_files', false, req.params.sizeStr, req.decodedJWT, db_conn)

        if (result.fetched === false) {
            res.status(result.status).send(result)
        }
        else {
            res.setHeader('content-type', 'image/webp');
            res.status(result.status).send(result.data);
        }
    } catch (err) {
        res.status(400).send({ status: 400, message: "Bad Request" });
    }
});

module.exports = router;