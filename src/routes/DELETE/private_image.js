const express = require('express');
const router = express.Router();
const { deleteImage } = require("../../controllers/delete_image");

router.delete('/:imageID', async (req, res) => {
    try {
        const db_conn = req.app.get('db_conn')
        const jwtToken = req.decodedJWT

        const result = await deleteImage(req.params.imageID, 'private_files', jwtToken, db_conn)
        res.status(result.status).send(result);
    } catch (err) {
        res.status(400).send({ status: 400, message: "Bad Request" });
    }
});

module.exports = router;