class Logger {
    log(msg) {
        console.log(msg)
    }
    error(msg) {
        console.error(msg)
    }
    trace(msg) {
        console.trace(msg)
    }
    debug(msg) {
        console.debug(msg)
    }
}

module.exports = Logger;