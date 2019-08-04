(function () {
    var socket = io.connect('http://localhost:4444');
    socket.on("zkless-success", function () {
        window.location.reload();
    });
    socket.on("zkless-failure", function () {
        console.error("zkless compile failure");
    });
}())
