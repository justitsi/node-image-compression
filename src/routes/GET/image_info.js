const express = require('express');
const router = express.Router();
const { getUserImageIDs, getImageInfo } = require("../../controllers/get_image");

router.get('/byOwner', async (req, res) => {
    try {
        const db_conn = req.app.get('db_conn')
        const SETTINGS = req.app.get('SETTINGS')
        const result = await getUserImageIDs(db_conn, req.decodedJWT, SETTINGS)

        res.status(result.status).send(result);

    } catch (err) {
        res.status(400).send({ status: 400, message: "Bad Request" });
    }
});

router.get('/byImageId/:imageID', async (req, res) => {
    try {
        const db_conn = req.app.get('db_conn')
        const result = await getImageInfo(req.params.imageID, db_conn, req.decodedJWT)

        res.status(result.status).send(result);

    } catch (err) {
        res.status(400).send({ status: 400, message: "Bad Request" });
    }
})

module.exports = router;