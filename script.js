var PAPER = Raphael("canvas");

// direction faux enum
var DIR = Object.freeze({
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
});

var GRID_SIZE = 6;
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
    return PAPER.rect(x, y, w, h);
}


function validDir(x, y, dir) {
    switch (dir) {
        case DIR.UP:
            return y - 1 > 0;
        case DIR.DOWN:
            return y + 1 < GRID_SIZE - 1;
        case DIR.LEFT:
            return x - 1 > 0;
        case DIR.RIGHT:
            return x + 1 < GRID_SIZE - 1;
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
        newY--;
        if (GRID[newX][newY] !== undefined) return;
        rect = betterRect(x * 100 - 10, y * 100, 20, -100);
        GRID[newX][newY] = 1;
    } else if (dir == DIR.DOWN) {
        newY++;
        if (GRID[newX][newY] !== undefined) return;
        rect = betterRect(x * 100 - 10, y * 100, 20, 100);
        GRID[newX][newY] = 1;
    } else if (dir == DIR.LEFT) {
        newX--;
        if (GRID[newX][newY] !== undefined) return;
        rect = betterRect(x * 100, y * 100 - 10, -100, 20);
        GRID[newX][newY] = 1;
    } else if (dir == DIR.RIGHT) {
        newX++;
        if (GRID[newX][newY] !== undefined) return;
        rect = betterRect(x * 100, y * 100 - 10, 100, 20);
        GRID[newX][newY] = 1;
    }
    rect.attr({
        'fill': 'white',
        'stroke-width': '2px',
        'stroke': 'gray'
    });

    genWall(newX, newY, dir, prb / 1.2);
}

function seedWalk() {
    return 1 + Math.floor(Math.random() * 4);
}

genWall(seedWalk(), 0, undefined, 1.0);
genWall(seedWalk(), GRID_SIZE - 1, undefined, 1.0);
genWall(0, seedWalk(), undefined, 1.0);
genWall(GRID_SIZE - 1, seedWalk(), undefined, 1.0);

for (var i = 0; i <= 5; i++) {
    for (var j = 0; j <= 5; j++) {
        PAPER.circle(i * 100, j * 100, 10).attr('fill', 'blue');
    }
}

