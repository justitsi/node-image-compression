const express = require('express');
const router = express.Router();
const { getImage, getImageAtSize } = require("../../controllers/get_image");

router.get('/:imageID', async (req, res) => {
    const result = await getImage(req.params.imageID, 'public_files', true)

    if (result.fetched === false) {
        res.status(result.status).send(result)
    }
    else {
        res.setHeader('content-type', 'image/webp');
        res.status(result.status).send(result.data);
    }
});

router.get('/:imageID/:sizeStr', async (req, res) => {
    const result = await getImageAtSize(req.params.imageID, 'public_files', true, req.params.sizeStr)

    if (result.fetched === false) {
        res.status(result.status).send(result)
    }
    else {
        res.setHeader('content-type', 'image/webp');
        res.status(result.status).send(result.data);
    }
});

module.exports = router;