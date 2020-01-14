(function () {
    var socket = io.connect('http://localhost:{{port}}');
    socket.on("zkless-success", function () {
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            if(link.href.indexOf(window.location.origin) === 0) {
                link.href = link.href.replace(/\?.*|$/, '?t=' + Date.now());
            }
        });
        setTimeout(() => zUtl.fireSized(zkdt().firstChild), 1000);
    });
    socket.on("zkless-failure", function () {
        console.error("zkless compile failure");
    });
}())
