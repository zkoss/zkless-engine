const fs = require('fs');

module.exports = function (port, initialMessage) {
    const app = require('http').createServer(handler);
    app.listen(port);
    function handler(req, res) {
        fs.readFile(__dirname + '/zklessLiveReload.js',
            function (err, data) {
                if (err) {
                    res.writeHead(500);
                    return res.end('Error loading /zklessLiveUpdate.js');
                }
                res.writeHead(200);
                res.end(data);
            });
    }

    const io = require('socket.io')(app);
    const notifyLifeUpdate = msg => io.emit(msg);
    io.once("connection", () => {
        notifyLifeUpdate(initialMessage)
    });

    return notifyLifeUpdate;
}
