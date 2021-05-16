const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const health = {
        message: 'OK',
        time: Date.now(),
        uptime: process.uptime()
    }
    res.send(health);
});

module.exports = router;