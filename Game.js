fetch("CHANGELOG.md")
    .then(response => response.text())
    .then(text => {
        console.log(text);
    });

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const keypressed = {};
const enemylist = [];
const bulletlist = [];
let reloading = 0;
let timeSinceLastShot = 0;
let guntype = 1;
let currentGun = null
let currentReloadTime = 0
const canvasSect = {
    arenaWidth: null,
    arenaHeight: null,
    uiWidth: null,
    uiHeight: null
}

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }
    div(n) {
        this.x /= n;
        this.y /= n;
        return this;
    }
    mag() {
        return Math.hypot(this.x, this.y);
    }
    normalize() {
        const m = this.mag();
        if (m !== 0) {
            this.x /= m
            this.y /= m
        }
        return this;
    };
}


class Bullet {
    constructor(preset, x, y, speed, damage, size, time, count, spread, target, colour) {
        if (preset == 0) {
            speed = guns.god.bulletSetup.speed
            damage = guns.god.bulletSetup.damage
            size = guns.god.bulletSetup.size
            time = guns.god.bulletSetup.time
            count = guns.god.bulletSetup.count
            spread = guns.god.bulletSetup.spread
            target = new Vector(player.mouse.x, player.mouse.y)
            colour = guns.god.bulletSetup.colour
        }
        if (preset == 1) {
            speed = guns.pistol.bulletSetup.speed
            damage = guns.pistol.bulletSetup.damage
            size = guns.pistol.bulletSetup.size
            time = guns.pistol.bulletSetup.time
            count = guns.pistol.bulletSetup.count
            spread = guns.pistol.bulletSetup.spread
            target = new Vector(player.mouse.x, player.mouse.y)
            colour = guns.pistol.bulletSetup.colour
        }
        if (preset == 2) {
            speed = guns.shotgun.bulletSetup.speed
            damage = guns.shotgun.bulletSetup.damage
            size = guns.shotgun.bulletSetup.size
            time = guns.shotgun.bulletSetup.time
            count = guns.shotgun.bulletSetup.count
            spread = guns.shotgun.bulletSetup.spread
            target = new Vector(player.mouse.x, player.mouse.y)
            colour = guns.shotgun.bulletSetup.colour

        }
        if (preset == 3) {
            speed = guns.sniper.bulletSetup.speed
            damage = guns.sniper.bulletSetup.damage
            size = guns.sniper.bulletSetup.size
            time = guns.sniper.bulletSetup.time
            count = guns.sniper.bulletSetup.count
            spread = guns.sniper.bulletSetup.spread
            target = new Vector(player.mouse.x, player.mouse.y)
            colour = guns.sniper.bulletSetup.colour
        }
        this.preset = preset;
        this.time = time;
        this.dam = damage;
        this.colour = colour;
        this.speed = speed;
        this.size = size;
        this.time = time;
        this.count = count;
        this.spread = spread;
        this.target = target
        this.pos = new Vector(x, y);
        this.angle = Math.atan2(player.mouse.y - this.pos.y, player.mouse.x - this.pos.x) + random("float", this.spread * -1, this.spread);
        this.dir = new Vector(Math.cos(this.angle), Math.sin(this.angle)).mult(this.speed);
    }
    display() {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.colour;
        ctx.fill();
    }
    movement() {
        this.pos.add(this.dir);
        this.time--;
    }
    died() {
        return (this.pos.x < -this.size || this.pos.x > canvasSect.arenaWidth + this.size || this.pos.y < -this.size || this.pos.y > canvasSect.arenaHeight + this.size) || (this.time <= 0);
    }
}


class Enemy {
    constructor(preset, x, y, hp, dam, speed, size, mass, colour) {
        if (preset == 1) {
            speed = enemy.norm.speed
            hp = enemy.norm.hp
            dam = enemy.norm.dam
            size = enemy.norm.size
            mass = enemy.norm.mass
            colour = enemy.norm.colour
        }
        if (preset == 2) {
            speed = enemy.small.speed
            hp = enemy.small.hp
            dam = enemy.small.dam
            size = enemy.small.size
            mass = enemy.small.mass
            colour = enemy.small.colour
        }
        if (preset == 3) {
            speed = enemy.big.speed
            hp = enemy.big.hp
            dam = enemy.big.dam
            size = enemy.big.size
            mass = enemy.big.mass
            colour = enemy.big.colour
        }
        this.colour = colour;
        this.size = size;
        this.hp = hp;
        this.dam = dam
        this.speed = speed;
        this.size = size;
        this.mass = mass;
        this.hitTimer = 0
        this.pos = new Vector(x, y);
        this.vel = new Vector(0, 0);
    }
    display() {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
        if (this.hitTimer > 0) {
            ctx.globalAlpha = 0.4
            this.hitTimer--
        }
        else {
            ctx.globalAlpha = 1
        }
        ctx.fillStyle = this.colour
        ctx.fill();
        ctx.globalAlpha = 1
    }
    movement(target) {
        this.dir = new Vector(target.x - this.pos.x, target.y - this.pos.y);
        this.dir.normalize().mult(this.speed * 50 / this.mass);
        this.vel.add(this.dir)
        this.pos.add(this.vel);
        this.vel.mult(0.75)
    }
}


const player = {
    moveDir: new Vector(0, 0),
    pos: new Vector(50, 50),
    size: 20,
    speed: 0.7,
    mass: 75,
    hp: 100,
    maxHp: 100,
    sta: 100,
    maxSta: 100,
    immune: 0,
    vel: new Vector(0, 0),
    mouse: new Vector(null, null)
};

const enemy = {
    norm: {
        id: 1,
        speed: 0.5,
        hp: 100,
        dam: 20,
        size: 20,
        mass: 75,
        colour: '#075518'
    },
    small: {
        id: 2,
        speed: 0.6,
        hp: 20,
        dam: 10,
        size: 10,
        mass: 45,
        colour: '#0a8a26'
    },
    big: {
        id: 3,
        speed: 0.4,
        hp: 250,
        dam: 40,
        size: 40,
        mass: 100,
        colour: '#04380f'
    }
}

const guns = {
    god: {
        id: 0,
        reloadTime: 0,
        fireRate: 0,
        magRounds: 100,
        loaded: 100,
        unloaded: Infinity,
        bulletSetup: {
            x: player.pos.x,
            y: player.pos.y,
            speed: 15,
            damage: Infinity,
            size: 10,
            time: Infinity,
            count: 1,
            spread: 0,
            colour: '#fb00ff'
        }
    },
    pistol: {
        id: 1,
        reloadTime: 70,
        fireRate: 15,
        magRounds: 10,
        loaded: 10,
        unloaded: 80,
        bulletSetup: {
            x: player.pos.x,
            y: player.pos.y,
            speed: 10,
            damage: 50,
            size: 5,
            time: 50,
            count: 1,
            spread: Math.PI / 120,
            colour: '#000000'
        }
    },
    shotgun: {
        id: 2,
        reloadTime: 240,
        fireRate: 60,
        magRounds: 5,
        loaded: 5,
        unloaded: 50,
        bulletSetup: {
            x: player.pos.x,
            y: player.pos.y,
            speed: 7.5 + random("float", -2, 2),
            damage: 20,
            size: 3,
            time: 30,
            count: 8,
            spread: Math.PI / 9,
            colour: '#000000'
        }
    },
    sniper: {
        id: 3,
        reloadTime: 360,
        fireRate: 120,
        magRounds: 2,
        loaded: 2,
        unloaded: 20,
        bulletSetup: {
            x: player.pos.x,
            y: player.pos.y,
            speed: 15,
            damage: 250,
            size: 4,
            time: 200,
            count: 1,
            spread: Math.PI / 720,
            colour: '#000000'
        }
    }
}



// Setup Function
function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasSect.arenaHeight = canvas.height * 19 / 24
    canvasSect.arenaWidth = canvas.width
    canvasSect.uiWidth = canvasSect.arenaWidth
    canvasSect.uiHeight = canvas.height - canvasSect.arenaHeight
}


// Draw Function (Runs continuously)
function draw() {
    // Clear background every frame
    ctx.fillStyle = 'rgb(100, 100, 100)';
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Finds current gun
    currentGun = findCurrentGun()

    timeSinceLastShot++;
    if (player.immune > 0) player.immune--;

    // Checks if hp is below 0
    if (player.hp <= 0) {
        ctx.fillStyle = 'rgba(19, 19, 19, 0.65)';
        ctx.fillRect(0, canvas.height / 3, canvas.width, canvas.height / 3)
        ctx.font = '60px Optimus_Princeps';
        ctx.textAlign = "center"; 
        ctx.textBaseline = "middle"
        ctx.fillStyle = 'rgb(169, 0, 0)';
        ctx.fillText("You Died", canvas.width / 2, canvas.height / 2)
        return;
    }

    // Sprint
    if (keypressed['w'] || keypressed['a'] || keypressed['s'] || keypressed['d']) {
        if (keypressed[' '] && player.sta > 0) {
            player.speed = 1.4;
            player.sta -= 0.5;
        }
        else {
            player.speed = 0.7
            if (player.sta < player.maxSta) player.sta += 0.2
        }
    }    
    else {
        player.speed = 0.7
        if (player.sta < player.maxSta) player.sta += 1 / 3
    }

    // Update coordinates based on key presses
    player.moveDir.x = 0;
    player.moveDir.y = 0;
    if (keypressed['w'] && player.pos.y >= 0 + player.size) player.moveDir.y -= 1;
    if (keypressed['s'] && player.pos.y <= canvasSect.arenaHeight - player.size) player.moveDir.y += 1;
    if (keypressed['a'] && player.pos.x >= 0 + player.size) player.moveDir.x -= 1;
    if (keypressed['d'] && player.pos.x <= canvasSect.arenaWidth - player.size) player.moveDir.x += 1;

    // If player is out of the border, it is sent back in
    if (player.pos.x < 0 + player.size) player.pos.x = 0 + player.size;
    if (player.pos.y < 0 + player.size) player.pos.y = 0 + player.size;
    if (player.pos.x > canvasSect.arenaWidth - player.size) player.pos.x = canvasSect.arenaWidth - player.size;
    if (player.pos.y > canvasSect.arenaHeight - player.size) player.pos.y = canvasSect.arenaHeight - player.size;


    // Player movement
    if (player.moveDir.mag() > 0) {
        player.moveDir.normalize();
        player.moveDir.mult(player.speed * 50 / player.mass);
        player.vel.add(player.moveDir)
    }
    player.pos.add(player.vel);
    player.vel.mult(0.75); // friction


    // Enemy movement, display and collision
    for (let i = enemylist.length - 1; i >= 0; i--) {
        if (enemylist[i].pos.x < 0 + enemylist[i].size) enemylist[i].pos.x = 0 + enemylist[i].size;
        if (enemylist[i].pos.y < 0 + enemylist[i].size) enemylist[i].pos.y = 0 + enemylist[i].size;
        if (enemylist[i].pos.x > canvasSect.arenaWidth - enemylist[i].size) enemylist[i].pos.x = canvasSect.arenaWidth - enemylist[i].size;
        if (enemylist[i].pos.y > canvasSect.arenaHeight - enemylist[i].size) enemylist[i].pos.y = canvasSect.arenaHeight - enemylist[i].size;
        enemylist[i].movement(player.pos);
        enemylist[i].display();
        playercollision(enemylist[i]);
    }
    // Resolve collisions after updating all enemy positions
    enemycollision(enemylist);

    // Bullet movement, display, and collision
    for (let j = bulletlist.length - 1; j >= 0; j--) {

        bulletlist[j].movement();
        bulletlist[j].display();
        if (bulletlist[j].died()) {
            bulletlist.splice(j, 1);
            break;
        }

        // Bullet and enemy collision
        for (let i = enemylist.length - 1; i >= 0; i--) {
            if (hit(bulletlist[j], enemylist[i])) {

                enemylist[i].hitTimer = 5
                const enemyknockback = new Vector(enemylist[i].pos.x - bulletlist[j].pos.x, enemylist[i].pos.y - bulletlist[j].pos.y)
                enemyknockback.normalize()
                enemyknockback.mult(150 / enemylist[i].mass)
                enemylist[i].vel.add(enemyknockback)



                if (enemylist[i].hp > bulletlist[j].dam) {
                    enemylist[i].hp -= bulletlist[j].dam;
                    bulletlist.splice(j, 1);
                    break;
                }
                else if (enemylist[i].hp == bulletlist[j].dam) {
                    bulletlist.splice(j, 1);
                    enemylist.splice(i, 1);
                    break;
                }
                else if (enemylist[i].hp < bulletlist[j].dam) {
                    bulletlist[j].dam -= enemylist[i].hp;
                    enemylist.splice(i, 1)
                    break;
                }
            }
        }
    }

    // Player and enemy collision detection
    if (reloading > 0) {
        reloading--;
        if (reloading == 0) {
            const roundsToLoad = Math.min(currentGun.unloaded, currentGun.magRounds)
            currentGun.unloaded -= roundsToLoad
            currentGun.loaded = roundsToLoad
            currentReloadTime = 0
        }
    }

    if (currentGun.loaded <= 0 && reloading == 0) {
        reloading = currentGun.reloadTime
        currentReloadTime = currentGun.reloadTime
    }

    // Draw player
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, player.size, 0, Math.PI * 2);
    if (player.immune == 0) ctx.fillStyle = '#00adb5';
    else ctx.fillStyle = '#00acb578';
    ctx.fill();

    // Draw UI
    ctx.fillStyle = 'rgb(169, 169, 169)';
    ctx.fillRect(0, canvasSect.arenaHeight, canvasSect.uiWidth, 200);

    // Draw health bar
    ctx.fillStyle = 'rgb(70, 14, 10)';
    ctx.fillRect(45, canvasSect.arenaHeight + 45, 410, 20);
    ctx.fillStyle = 'rgb(165, 28, 18)';
    ctx.fillRect(50, canvasSect.arenaHeight + 50, 400 * (player.hp / player.maxHp), 10);

    // Draw stamina bar
    ctx.fillStyle = 'rgb(10, 38, 70)';
    ctx.fillRect(45, canvasSect.arenaHeight + 125, 410, 20);
    ctx.fillStyle = 'rgb(18, 106, 165)';
    ctx.fillRect(50, canvasSect.arenaHeight + 130, 400 * (player.sta / player.maxSta), 10);

    // Draw reload bar
    if (reloading > 0) {
        ctx.fillStyle = 'rgb(209, 157, 0)';
        ctx.fillRect(1295, canvasSect.arenaHeight + 95, 260, 30);
        ctx.fillStyle = 'rgb(209, 185, 0)';
        ctx.fillRect(1300, canvasSect.arenaHeight + 100, 250 - (reloading / currentReloadTime) * 250, 20);
    }
    requestAnimationFrame(draw);
}


// Random number generator
function random(type, min, max) {
    if (type == "float") return Math.random() * (max - min) + min
    if (type == "int") return Math.floor(Math.random() * (max - min + 1) + min)
}


// Registers when two circles touch
function hit(a, b) {
    const dist = Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y);
    return (dist <= a.size + b.size);
}


// Resolves collision between enemy and enemy
function enemycollision(enemylist) {
    for (let i = 0; i < enemylist.length; i++) {
        for (let j = i + 1; j < enemylist.length; j++) {

            const dir = new Vector(
                enemylist[i].pos.x - enemylist[j].pos.x,
                enemylist[i].pos.y - enemylist[j].pos.y
            );
            const dist = dir.mag();
            const target = enemylist[i].size + enemylist[j].size;


            if (dist >= target) continue;



            dir.normalize();
            const totalMass = enemylist[i].mass + enemylist[j].mass;
            const overlap = target - dist;

            // Push enemylist[i]
            enemylist[i].pos.add(
                new Vector(dir.x, dir.y).mult(overlap * (enemylist[i].mass / enemylist[j].mass))
            );


            // Push enemylist[j]
            enemylist[j].pos.sub(
                new Vector(dir.x, dir.y).mult(overlap * (enemylist[j].mass / enemylist[i].mass))
            );

            const relatVel = new Vector(
                enemylist[i].vel.x - enemylist[j].vel.x,
                enemylist[i].vel.y - enemylist[j].vel.y
            );

            const velDir = relatVel.x * dir.x + relatVel.y * dir.y;

            if (velDir > 0) continue;

            const impulseMag = -1 * (velDir / ((1 / enemylist[i].mass) + (1 / enemylist[j].mass)));

            const impulse = new Vector(
                impulseMag * dir.x,
                impulseMag * dir.y
            );


            enemylist[i].vel.add(new Vector(
                impulse.x / enemylist[i].mass,
                impulse.y / enemylist[i].mass
            )
            );

            enemylist[j].vel.sub(new Vector(
                impulse.x / enemylist[j].mass,
                impulse.y / enemylist[j].mass
            )
            );

        }
    }
}


// Resolves collision between player and enemy
function playercollision(enemy) {
    const dir = new Vector(
        player.pos.x - enemy.pos.x,
        player.pos.y - enemy.pos.y
    );
    const dist = dir.mag();
    const target = player.size + enemy.size;


    if (dist >= target) return;


    const overlap = target - dist;
    dir.normalize();
    const totalMass = player.mass + enemy.mass;


    // Push player
    player.pos.add(
        new Vector(dir.x, dir.y).mult(overlap * (player.mass / enemy.mass))
    );


    // Push enemy
    enemy.pos.sub(
        new Vector(dir.x, dir.y).mult(overlap * (enemy.mass / player.mass))
    );

    const relatVel = new Vector(
        player.vel.x - enemy.vel.x,
        player.vel.y - enemy.vel.y
    );

    const velDir = relatVel.x * dir.x + relatVel.y * dir.y;

    if (velDir > 0) return;

    const impulseMag = -1 * (velDir / ((1 / player.mass) + (1 / enemy.mass)));

    const impulse = new Vector(
        impulseMag * dir.x,
        impulseMag * dir.y
    );


    player.vel.add(new Vector(
        impulse.x / player.mass,
        impulse.y / player.mass
    )
    );

    enemy.vel.sub(new Vector(
        impulse.x / enemy.mass,
        impulse.y / enemy.mass
    )
    );

    if (player.immune > 0) return;

    // Add knockback if player is not immune
    player.vel.add(new Vector(dir.x, dir.y).mult(10));
    player.immune = 200

    // Damage
    if (player.hp > 0) player.hp -= enemy.dam

};

function findCurrentGun() {
    switch (guntype) {
        case 0: return guns.god
        case 1: return guns.pistol
        case 2: return guns.shotgun
        case 3: return guns.sniper
    }
}

// Handle window resizing
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});


// Tracks coordinates of mouse
window.addEventListener('mousemove', (event) => {
    player.mouse.x = event.clientX
    player.mouse.y = event.clientY
});


// Checks if key is down
window.addEventListener('keydown', (event) => {
    keypressed[event.key] = true;
    if (event.key == 'q') {
        if (event.repeat) return;
        enemylist.push(new Enemy(1, 50, 50));
    }
    if (event.key == 'e') {
        if (event.repeat) return;
        enemylist.push(new Enemy(2, 50, 50));
    }
    if (event.key == 'r') {
        if (event.repeat) return;
        enemylist.push(new Enemy(3, 50, 50));
    }
    if (event.key == '0') {
        guntype = 0;
    }
    if (event.key == '1') {
        guntype = 1;
    }
    if (event.key == '2') {
        guntype = 2;
    }
    if (event.key == '3') {
        guntype = 3;
    }
});


// Check if key is up
window.addEventListener('keyup', (event) => {
    keypressed[event.key] = false;
});


// Check for clicks
window.addEventListener('click', (event) => {
    switch (event.button) {
        case 2: // Right click
            event.preventDefault();
            break;
        case 0: // Left click
            event.preventDefault();

            if (player.mouse.x >= 0 && player.mouse.x <= canvasSect.arenaWidth && player.mouse.y >= 0 && player.mouse.y <= canvasSect.arenaHeight) {
                if (guntype == 0) {
                    for (let i = 1; i <= guns.god.bulletSetup.count; i++) {
                            bulletlist.push(new Bullet(0, player.pos.x, player.pos.y))
                            guns.god.loaded--
                        }
                    timeSinceLastShot = 0
                }

                if (reloading == 0) {
                    if (timeSinceLastShot > currentGun.fireRate) {
                        for (let i = 1; i <= currentGun.bulletSetup.count; i++) {
                            bulletlist.push(new Bullet(guntype, player.pos.x, player.pos.y));
                        }
                        currentGun.loaded--
                        timeSinceLastShot = 0
                    }
                }
                break;
            }
    }
});


// Prevents pop-up from opening
window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    player.pos = new Vector(player.mouse.x, player.mouse.y);
});


// Start the engine
setup();
draw();