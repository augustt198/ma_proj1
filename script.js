var SIZE = 500;
var CTX = document.getElementById("draw").getContext("2d");

/*
{
    var ratio = (function () {
        var ctx = CTX,
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;
        return dpr / bsr;
    })();
    var canvas = document.getElementById("draw");
    canvas.width = SIZE * ratio;
    canvas.height = SIZE * ratio;
    canvas.style.width = SIZE + "px";
    canvas.style.height = SIZE + "px";
    CTX.setTransform(ratio, 0, 0, ratio, 0, 0);
}
*/

CTX.fillStyle = "black";
CTX.fillRect(0, 0, SIZE, SIZE);

// direction faux enum
var DIR = Object.freeze({
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
});

var GRID_SIZE = 20;
var GRID = new Array(GRID_SIZE);
for (var i = 0; i < GRID.length; i++)
    GRID[i] = new Array(GRID_SIZE);

// adjacency matrix. |V| = (grid size)^2
var ADJ_MATRIX = new Array(GRID_SIZE * GRID_SIZE);
for (var i = 0; i < GRID.length; i++)
    ADJ_MATRIX[i] = new Array(GRID_SIZE * GRID_SIZE);

// Always negative width/height,
//
function betterRect(x, y, w, h) {
    if (w < 0) {
        x += w;
        w *= -1;
    }
    if (h < 0) {
        y += h;
        h *= -1;
    }

    CTX.fillStyle = "gray";
    CTX.fillRect(x, y, w, h);
}


function validDir(x, y, dir) {
    switch (dir) {
        case DIR.UP:
            return y - 1 > 3;
        case DIR.DOWN:
            return y + 1 < GRID_SIZE - 4;
        case DIR.LEFT:
            return x - 1 > 3;
        case DIR.RIGHT:
            return x + 1 < GRID_SIZE - 4;
    }
}
function oppositeDir(dir) {
    switch (dir) {
        case DIR.UP:
            return DIR.DOWN;
        case DIR.DOWN:
            return DIR.UP;
        case DIR.LEFT:
            return DIR.RIGHT;
        case DIR.RIGHT:
            return DIR.LEFT;
    }
}

function randomDir(x, y, prevDir) {
    var opp = oppositeDir(prevDir);
    var any = false;
    for (var i = 1; i <= 3; i++) {
        var newDir = (opp + i) % 4;
        if (validDir(x, y, newDir))
            any = true;
    }
    if (!any)
        return undefined;

    var n = Math.floor(Math.random() * 4);
    while (n == opp || !validDir(x, y, n))
        n = Math.floor(Math.random() * 4);

    return n;
}

function drawJoint(x, y) {
    PAPER.rect(x * 100 - 10, y * 100 - 10, 20, 20)
        .attr('fill', '#BFBFBF')
        .attr('stroke-width', 0);
}

function validateRect(x, y, newX, newY, dir) {
    console.log("validating ", x, y, newX, newY);
    var startX = Math.max(Math.min(x, newX) - 1, 0);
    var endX   = Math.min(Math.max(x, newX) + 2, 19);
    var startY = Math.max(Math.min(y, newY) - 1, 0);
    var endY   = Math.min(Math.max(y, newY) + 2, 19);
    if (dir == DIR.RIGHT) {
        startX += 2;
    } else if (dir == DIR.LEFT) {
        startX -= 2;
    } else if (dir == DIR.DOWN) {
        startY += 2;
    } else if (dir == DIR.UP) {
        startY -= 2;
    }

    // CTX.fillStyle = "rgba(0, 0, 200, 0.25)";
    // CTX.fillRect(startX * 25, startY * 25, (endX - startX) * 25, (endY - startY) * 25);

    for (var i = startX; i <= endX; i++) {
        for (var j = startY; j <= endY; j++) {
            if (GRID[i][j] !== undefined) {
                console.log("nope", x, y, newX, newY);

                return false;
            }
        }
    }

    console.log(">>", Math.max(Math.min(x, newX), 0), Math.min(Math.max(x, newX), 19), Math.max(Math.min(y, newY), 0), Math.min(Math.max(y, newY), 19));
    for (var i = Math.max(Math.min(x, newX), 0); i <= Math.min(Math.max(x, newX), 19); i++) {
        for (var j = Math.max(Math.min(y, newY), 0); j <= Math.min(Math.max(y, newY), 19); j++) {
            console.log("setting ", i, j);
            GRID[i][j] = 1;
        }
    }
    return true;
}

var JOINTS = [];

// x: starting grid x
// y: starting grid y
// prevDir: previous direction taken
// prb: probability of creating wall
function genWall(x, y, prevDir, prb) {
    if (Math.random() > prb) return;

    var dir;
    if (prevDir === undefined) {
        if (y == 0)
            dir = DIR.DOWN;
        else if (y == GRID_SIZE - 1)
            dir = DIR.UP;
        else if (x == 0)
            dir = DIR.RIGHT;
        else if (x == GRID_SIZE - 1)
            dir = DIR.LEFT;
    } else {
        dir = randomDir(x, y, prevDir);
        if (dir === undefined)
            return;
    }

    console.log("le dir", dir);
    var newX = x, newY = y;
    var rect;
    if (dir == DIR.UP) {
        newY -= 4;
        if (!validateRect(x, y, newX, newY, dir)) return;
        // if (GRID[newX][newY] !== undefined) return;
        rect = betterRect(x * 25, y * 25 + 25, 25, -5 * 25);
        GRID[newX][newY] = 1;
        JOINTS.push([newX, newY]);
    } else if (dir == DIR.DOWN) {
        newY += 4;
        if (!validateRect(x, y, newX, newY, dir)) return;
        // if (GRID[newX][newY] !== undefined) return;
        rect = betterRect(x * 25, y * 25, 25, 5 * 25);
        GRID[newX][newY] = 1;
        JOINTS.push([newX, newY]);
    } else if (dir == DIR.LEFT) {
        x += 1;
        newX -= 4;
        if (!validateRect(x, y, newX, newY, dir)) return;
        // if (GRID[newX][newY] !== undefined) return;
        rect = betterRect(x * 25, y * 25, -5 * 25, 25);
        GRID[newX][newY] = 1;
        JOINTS.push([newX, newY]);
    } else if (dir == DIR.RIGHT) {
        newX += 4;
        if (!validateRect(x, y, newX, newY, dir)) return;
        // if (GRID[newX][newY] !== undefined) return;
        rect = betterRect(x * 25, y * 25, 5 * 25, 25);
        GRID[newX][newY] = 1;
        JOINTS.push([newX, newY]);
    }

    genWall(newX, newY, dir, prb / 1.2);
}

function drawGrid() {
    for (var i = 0; i < 20; i++) {
        CTX.strokeStyle = '#BDBDBD';
        CTX.beginPath();
        CTX.moveTo(i * 25, 0);
        CTX.lineTo(i * 25, SIZE);
        CTX.stroke();

        CTX.beginPath();
        CTX.moveTo(0, i * 25);
        CTX.lineTo(500, i * 25);
        CTX.stroke();
    }
}

//drawGrid();

function seedWalk() {
    return 3 + Math.floor(Math.random() * (GRID_SIZE - 6));
}

genWall(seedWalk(), 0, undefined, 1.0);
genWall(seedWalk(), GRID_SIZE - 1, undefined, 1.0);
genWall(0, seedWalk(), undefined, 1.0);
genWall(GRID_SIZE - 1, seedWalk(), undefined, 1.0);

for (var i = 0; i <= 5; i++) {
    for (var j = 0; j <= 5; j++) {
        // PAPER.circle(i * 100, j * 100, 10).attr('fill', 'blue');
    }
}

var VERTICES = [];
for (var i = 0; i < JOINTS.length; i++) {
    var x = JOINTS[i][0], y = JOINTS[i][1];

    // outer
    if (GRID[x - 1][y] === undefined && GRID[x - 1][y - 1] === undefined && GRID[x][y - 1] === undefined) {
        VERTICES.push([x, y]);
    }
    if (GRID[x + 1][y] === undefined && GRID[x + 1][y - 1] === undefined && GRID[x][y - 1] === undefined) {
        VERTICES.push([x + 1, y]);
    }
    if (GRID[x - 1][y] === undefined && GRID[x - 1][y + 1] === undefined && GRID[x][y + 1] === undefined) {
        VERTICES.push([x, y + 1]);
    }
    if (GRID[x + 1][y] === undefined && GRID[x + 1][y + 1] === undefined && GRID[x][y + 1] === undefined) {
        VERTICES.push([x + 1, y + 1]);
    }

    // inner
    if (GRID[x - 1][y] !== undefined && GRID[x - 1][y - 1] === undefined && GRID[x][y - 1] !== undefined) {
        VERTICES.push([x, y]);
    }
    if (GRID[x + 1][y] !== undefined && GRID[x + 1][y - 1] === undefined && GRID[x][y - 1] !== undefined) {
        VERTICES.push([x + 1, y]);
    }
    if (GRID[x - 1][y] !== undefined && GRID[x - 1][y + 1] === undefined && GRID[x][y + 1] !== undefined) {
        VERTICES.push([x, y + 1]);
    }
    if (GRID[x + 1][y] !== undefined && GRID[x + 1][y + 1] === undefined && GRID[x][y + 1] !== undefined) {
        VERTICES.push([x + 1, y + 1]);
    }
}

CTX.fillStyle = "blue";
/*
for (var i = 0; i < VERTICES.length; i++) {
    var x = VERTICES[i][0], y = VERTICES[i][1];

    CTX.beginPath();
    CTX.arc(x * 25, y * 25, 5, 0, Math.PI * 2);
    CTX.closePath();
    CTX.fill();
}
*/

var colors = ["yellow", "green", "red"]
var color_idx = 0;

var elem = document.getElementById("draw");
elem.addEventListener('click', function (e) {
    var cx = e.offsetX, cy = e.offsetY;
    console.log("Clicked at", cx, cy);
    VERTICES.forEach(function (v) {
        var x = v[0] * 25, y = v[1] * 25;
        if (Math.pow(x - cx, 2) + Math.pow(y - cy, 2) <= 25) {
            console.log("Matches vertex!");
            highlight(v[0], v[1]);
        }
    });
});

function highlight(x, y) {
    var color = colors[color_idx++ % 3];
    CTX.strokeStyle = color;

    var data = CTX.getImageData(0, 0, SIZE, SIZE).data;

    var xOff = x * 25, yOff = y * 25;

    var epsilon = 0.002;
    for (var d = -Math.PI / 2 + epsilon; d <= Math.PI / 2 - epsilon; d += 0.002) {
        m = Math.tan(d);
        var xi = 0, yi = 0;
        var xf = 500, yf = Math.round(500 * m);

        var dx = Math.abs(xf - xi), sx = xi < xf ? 1 : -1;
        var dy = Math.abs(yf - yi), sy = yi < yf ? 1 : -1;
        var err = (dx>dy ? dx : -dy)/2;

        while (true) {

            var idx = 4 * ((yOff + yi) * SIZE + xOff + xi);
            if ((xOff + xi >= SIZE) || data[idx] == 128) {
                console.log("HIT!");
                CTX.beginPath();
                CTX.moveTo(xOff, yOff);
                CTX.lineTo(xOff + xi, yOff + yi);
                CTX.stroke();
                break;
            }


            if (xi === xf && yi === yf) break;
            var e2 = err;
            if (e2 > -dx) { err -= dy; xi += sx; }
            if (e2 < dy) { err += dx; yi += sy; }
        }

        /* code graveyard
        for (var x2 = 1; x2 < 500; x2 += 1) {
            var y2 = m * x2;

            var idx = 4 * ((yOff + Math.floor(y2)) * SIZE + xOff + Math.floor(x2));
            if ((xOff + x2 >= SIZE || yOff + y2 >= SIZE) || (data[idx] == 128)) {
                CTX.strokeStyle = color;
                CTX.beginPath();
                CTX.moveTo(xOff, yOff);

                CTX.lineTo(xOff + Math.floor(x2), yOff + Math.floor(y2));
                CTX.stroke();
                break;
            }
        }*/
        /*
        for (var x2 = -1; x2 > -500; x2--) {
            var y2 = m * x2;

            var idx = 4 * ((yOff + Math.floor(y2)) * SIZE + xOff + Math.floor(x2));
            //if ((xOff + x2 >= SIZE || yOff + y2 >= SIZE) || (data[idx] == 128)) {
                console.log("ey");
                CTX.beginPath();
                CTX.moveTo(xOff, yOff);

                CTX.lineTo(xOff + Math.floor(x2), yOff + Math.floor(y2));
                CTX.stroke();
                break;
            //}
        }*/
        /*
        for (var x2 = 1; x2 > -500; x2 -= 1){

            var y2 = -m * x2;
            /*
            CTX.strokeStyle = "white";
            CTX.beginPath();
            CTX.moveTo(xOff, yOff);
            CTX.lineTo(xOff + x2, yOff + y2);
            CTX.stroke();
            */
            /*
            var idx = 4 * ((yOff + Math.ceil(y2)) * SIZE + xOff + Math.ceil(x2));
            if ((xOff + x2 >= SIZE || yOff + y2 >= SIZE) || (data[idx] == 128)) {
                console.log("hit w/ offset ", x2, y2);
                CTX.strokeStyle = color;
                CTX.beginPath();
                CTX.moveTo(xOff, yOff);

                CTX.lineTo(xOff + Math.floor(x2), yOff + Math.floor(y2));
                CTX.stroke();
                break;
            }
        }
        /*
        x2 = -500;
        y2 = m * x2;
        console.log(y2);

        */
    }
}
