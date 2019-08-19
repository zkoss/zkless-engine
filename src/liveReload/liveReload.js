const fs = require('fs');
const path = require('path');

module.exports = function (port, initialMessage) {
    if (port <= 0) {
        console.log("Live reload - disabled -> port was:", port);
        return () => { };
    }
    const app = require('http').createServer(handler);
    app.listen(port);
    function handler(req, res) {
        const templatePath = path.resolve(__dirname, 'templates', req.url.substring(1));
        fs.readFile(path.resolve(__dirname, 'templates', templatePath), 'utf8',
            function (err, liveReloadScript) {
                if (err) {
                    res.writeHead(500);
                    return res.end('Error loading ' + req.url);
                }
                liveReloadScript = liveReloadScript.replace('{{port}}', port)
                res.writeHead(200);
                res.end(liveReloadScript);
            });
    }

    const io = require('socket.io')(app);
    const notifyLifeUpdate = msg => io.emit(msg);
    io.once("connection", () => {
        notifyLifeUpdate(initialMessage)
    });

    console.log("Live reload - listening on port:", port);
    return notifyLifeUpdate;
}
