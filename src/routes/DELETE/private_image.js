const express = require('express');
const router = express.Router();
const { deleteImage } = require("../../controllers/delete_image");


router.delete('/:imageID', async (req, res) => {
    const result = await deleteImage(req.params.imageID, 'private_files')
    res.status(result.status).send(result);
});

module.exports = router;