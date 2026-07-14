fetch("CHANGELOG.md")
    .then(response => response.text())
    .then(text => {
        console.log(text);
    });
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const keyPressed = {};
const enemyList = [];
const bulletList = [];
const dropList = [];
let reloading = 0;
let timeSinceLastShot = 0;
let gunType = 1;
let currentGun = null
let currentReloadTime = 0
const canvasSect = {
    arenaWidth: null,
    arenaHeight: null,
    uiWidth: null,
    uiHeight: null,
    shakeX: null,
    shakeY: null,
    shakeTime: 0,
    shakeStrength: 0,
    tintStrength: 0,
    pulseSpeed: 0
}

const iconPaths = {
    healBlob: 'icons/healBlob.png',
    goldBlob: 'icons/goldBlob.png',
    pistolBullet: 'icons/pistolBullet.png',
    shotgunBullet: 'icons/shotgunBullet.png',
    sniperBullet: 'icons/sniperBullet.png',
    pistolIcon: 'icons/pistol.png'
}

const icons = {};

let iconsLoadedCount = 0
const iconsToLoad = Object.keys(iconPaths).length

Object.keys(iconPaths).forEach(key => {
    const img = new Image();
    img.src = iconPaths[key];

    img.onload = () => {
        iconsLoadedCount++;
        icons[key] = {
            image: img,
            width: img.naturalWidth,
            height: img.naturalHeight,
            aspectRatio: img.naturalWidth / img.naturalHeight
        }
        if (iconsLoadedCount === iconsToLoad) {
            console.log("All icons loaded successfully.");
            // Start the engine after all icons are loaded
            setup();
            draw();
        }
    }
});

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

        this.bulletSetup = guns[preset].bulletSetup;

        this.preset = preset;
        this.pos = new Vector(x, y);
        this.speed = this.bulletSetup.speed;
        this.dam = this.bulletSetup.damage;
        this.size = this.bulletSetup.size;
        this.time = this.bulletSetup.time;
        this.count = this.bulletSetup.count;
        this.spread = this.bulletSetup.spread;
        this.target = new Vector(player.mouse.x, player.mouse.y);
        this.colour = this.bulletSetup.colour;
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

        preset -= 1

        this.preset = preset
        this.pos = new Vector(x, y);
        this.vel = new Vector(0, 0);
        this.hp = enemy[preset].hp;
        this.dam = enemy[preset].dam
        this.speed = enemy[preset].speed;
        this.size = enemy[preset].size;
        this.mass = enemy[preset].mass;
        this.colour = enemy[preset].colour;
        this.hitTimer = 0
        this.loot = enemy[preset].loot
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

class Drop {
    constructor(type = null, x = null, y = null) {
        this.type = type
        this.pos = new Vector(x, y)
        this.rad = 18
        this.vel = new Vector(0, 0)
        this.data = dropTypes[type]
        this.randDir = random("float", 0, 360)
        this.impulseDir = new Vector(Math.cos(this.randDir), Math.sin(this.randDir))
        this.impulseTimer = 10
    }

    display() {
        ctx.drawImage(icons[this.data.image].image, this.pos.x - this.data.drawWidth / 2, this.pos.y - (this.data.drawWidth / icons[this.data.image].aspectRatio) / 2, this.data.drawWidth, this.data.drawWidth / icons[this.data.image].aspectRatio)
    }

    collectCheck() {
        this.dir = new Vector(player.pos.x - this.pos.x, player.pos.y - this.pos.y)
        this.dist = this.dir.mag()
        if (this.dist < 80) {
            this.dir.normalize().mult(5);
            this.vel.add(this.dir);
            this.pos.add(this.vel);
            this.vel.mult(0.75);
        }

    }
}


const player = {
    moveDir: new Vector(0, 0),
    pos: new Vector(null, null),
    size: 20,
    speed: 0.7,
    mass: 75,
    goldBlobs: 0,
    hp: 100,
    maxHp: 100,
    sta: 100,
    maxSta: 100,
    immune: 0,
    vel: new Vector(0, 0),
    mouse: new Vector(null, null),
    devMode: false
};

const enemy = [
    {
        name: "norm",
        speed: 0.67,
        hp: 100,
        dam: 20,
        size: 20,
        mass: 75,
        loot: [
            { type: "healBlob", chance: 15 },
            { type: "goldBlob", chance: 10 },
            { type: "pistolBullet", chance: 10 },
            { type: "shotgunBullet", chance: 8 },
            { type: "sniperBullet", chance: 5 }
        ],
        colour: '#075518'
    },
    {
        name: "small",
        speed: 0.6,
        hp: 20,
        dam: 10,
        size: 10,
        mass: 45,
        loot: [
            { type: "healBlob", chance: 5 },
            { type: "goldBlob", chance: 2 },
            { type: "pistolBullet", chance: 2 },
            { type: "shotgunBullet", chance: 2 },
        ],
        colour: '#0a8a26'
    },
    {
        name: "big",
        speed: 0.6,
        hp: 200,
        dam: 40,
        size: 40,
        mass: 100,
        loot: [
            { type: "healBlob", chance: 20 },
            { type: "goldBlob", chance: 20 },
            { type: "pistolBullet", chance: 15 },
            { type: "shotgunBullet", chance: 12 },
            { type: "sniperBullet", chance: 10 }
        ],
        colour: '#04380f'
    }
]

const guns = [
    {
        name: "god",
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
    {
        name: "pistol",
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
    {
        name: "shotgun",
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
    {
        name: "sniper",
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
]


const dropTypes = {
    healBlob: {
        id: 1,
        image: 'healBlob',
        rad: 30,
        drawWidth: 22,
        onPickup() {
            player.hp += 10
        }
    },
    goldBlob: {
        id: 2,
        image: 'goldBlob',
        rad: 30,
        drawWidth: 22,
        onPickup() {
            player.goldBlobs += 5
        }
    },
    pistolBullet: {
        id: 3,
        image: 'pistolBullet',
        rad: 30,
        drawWidth: 20,
        onPickup() {
            guns[1].unloaded += 15
        }
    },
    shotgunBullet: {
        id: 4,
        image: 'shotgunBullet',
        rad: 30,
        drawWidth: 20,
        onPickup() {
            guns[2].unloaded += 10
        }
    },
    sniperBullet: {
        id: 5,
        image: 'sniperBullet',
        rad: 30,
        drawWidth: 20,
        onPickup() {
            guns[3].unloaded += 5
        }
    }
}

const wave = {
    completed: 0,
    enemiesToSpawn: 0,
    cooldown: 0,
    active: false
}

const shop = {
    open: false,
    width: 400,
    targetX: null,
    x: null,
    slotSize: 80,
    slotGap: 30,
    slotStartX: 40,
    slotStartY: 200
}

const shopItems = [
    {
        label: "Heal Blob",
        desc: "+10 hp",
        cost: 10,
        icon: 'healBlob',
        drawWidth: 45,
        onBuy: () => player.hp += 10,
    },
    {
        label: "Pistol Bullets",
        desc: "+15 pistol bullets",
        cost: 8,
        icon: "pistolBullet",
        drawWidth: 40,
        onBuy: () => guns.pistol.unloaded += 15,
    },
    {
        label: "Shotgun Bullets",
        desc: "+8 shotgun bullets",
        cost: 10,
        icon: "shotgunBullet",
        drawWidth: 40,
        onBuy: () => guns[2].unloaded += 8,
    },
    {
        label: "Sniper Bullets",
        desc: "+6 sniper bullets",
        cost: 15,
        icon: "sniperBullet",
        drawWidth: 35,
        onBuy: () => guns[3].unloaded += 6,
    },
];


// Setup Function
function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasSect.arenaHeight = canvas.height * 19 / 24
    canvasSect.arenaWidth = canvas.width
    canvasSect.uiWidth = canvasSect.arenaWidth
    canvasSect.uiHeight = canvas.height - canvasSect.arenaHeight
    player.pos.x = canvasSect.arenaWidth / 2
    player.pos.y = canvasSect.arenaHeight / 2
    shop.targetX = canvas.width
    shop.x = canvas.width
}


// Draw Function (Runs continuously)
function draw() {
    // Clear background every frame
    ctx.fillStyle = 'rgb(100, 100, 100)';
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Shake screen
    if (canvasSect.shakeTime > 0) {
        canvasSect.shakeTime--;
        canvasSect.shakeX = random("float", -canvasSect.shakeStrength, canvasSect.shakeStrength)
        canvasSect.shakeY = random("float", -canvasSect.shakeStrength, canvasSect.shakeStrength)
        canvasSect.shakeStrength *= 0.9
    }

    ctx.save();
    ctx.translate(canvasSect.shakeX, canvasSect.shakeY)

    // Finds current gun
    currentGun = findCurrentGun()

    timeSinceLastShot++;
    if (player.immune > 0) player.immune--;

    //Resets the gun to pistol if devmode ends and God gun was equipped
    if (gunType == 0 && !player.devMode) gunType = 1

    waveSpawning()

    // Drops display
    for (let k = dropList.length - 1; k >= 0; k--) {
        dropList[k].display()
        dropList[k].collectCheck()

        if (dropList[k].impulseTimer > 0) {
            dropList[k].impulseTimer--;
            dropList[k].vel.mult(Math.round(dropList[k].impulseTimer / 10, 2));
            dropList[k].vel.add(dropList[k].impulseDir)
            dropList[k].pos.add(dropList[k].vel)
        }

        if (dropList[k].dist <= dropList[k].rad + player.size && dropList[k].impulseTimer == 0) {
            pickUpItem(dropList[k].type)
            dropList.splice(k, 1)
        };
    }


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
    if (keyPressed['w'] || keyPressed['a'] || keyPressed['s'] || keyPressed['d']) {
        if (keyPressed[' '] && player.sta > 0) {
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
    if (keyPressed['w'] && player.pos.y >= 0 + player.size) player.moveDir.y -= 1;
    if (keyPressed['s'] && player.pos.y <= canvasSect.arenaHeight - player.size) player.moveDir.y += 1;
    if (keyPressed['a'] && player.pos.x >= 0 + player.size) player.moveDir.x -= 1;
    if (keyPressed['d'] && player.pos.x <= canvasSect.arenaWidth - player.size) player.moveDir.x += 1;

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
    for (let i = enemyList.length - 1; i >= 0; i--) {
        if (enemyList[i].pos.x < 0 + enemyList[i].size) enemyList[i].pos.x = 0 + enemyList[i].size;
        if (enemyList[i].pos.y < 0 + enemyList[i].size) enemyList[i].pos.y = 0 + enemyList[i].size;
        if (enemyList[i].pos.x > canvasSect.arenaWidth - enemyList[i].size) enemyList[i].pos.x = canvasSect.arenaWidth - enemyList[i].size;
        if (enemyList[i].pos.y > canvasSect.arenaHeight - enemyList[i].size) enemyList[i].pos.y = canvasSect.arenaHeight - enemyList[i].size;
        enemyList[i].movement(player.pos);
        enemyList[i].display();
        playercollision(enemyList[i]);
    }

    // Resolve collisions after updating all enemy positions
    enemycollision(enemyList);

    // Bullet movement, display, and collision
    for (let j = bulletList.length - 1; j >= 0; j--) {

        bulletList[j].movement();
        bulletList[j].display();
        if (bulletList[j].died()) {
            bulletList.splice(j, 1);
            break;
        }

        // Bullet and enemy collision
        for (let i = enemyList.length - 1; i >= 0; i--) {
            if (hit(bulletList[j], enemyList[i])) {

                enemyList[i].hitTimer = 5
                const enemyknockback = new Vector(enemyList[i].pos.x - bulletList[j].pos.x, enemyList[i].pos.y - bulletList[j].pos.y)
                enemyknockback.normalize()
                enemyknockback.mult(150 / enemyList[i].mass)
                enemyList[i].vel.add(enemyknockback)



                if (enemyList[i].hp > bulletList[j].dam) {
                    enemyList[i].hp -= bulletList[j].dam;
                    bulletList.splice(j, 1);
                    break;
                }
                else if (enemyList[i].hp == bulletList[j].dam) {
                    bulletList.splice(j, 1);
                    spawnDrops(enemyList[i])
                    enemyList.splice(i, 1);
                    break;
                }
                else if (enemyList[i].hp < bulletList[j].dam) {
                    bulletList[j].dam -= enemyList[i].hp;
                    spawnDrops(enemyList[i])
                    enemyList.splice(i, 1)
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
    else if (player.immune != 0) ctx.fillStyle = '#00acb578';
    if (player.devMode) ctx.fillStyle = '#fbff00';
    ctx.fill();

    // Draw UI
    ctx.fillStyle = 'rgb(169, 169, 169)';
    ctx.fillRect(0, canvasSect.arenaHeight, canvasSect.uiWidth, 200);

    // Draw health bar
    if (player.hp > player.maxHp) player.hp = player.maxHp
    ctx.fillStyle = 'rgb(70, 14, 10)';
    ctx.fillRect(45, canvasSect.arenaHeight + 45, 410, 20);
    ctx.fillStyle = 'rgb(165, 28, 18)';
    ctx.fillRect(50, canvasSect.arenaHeight + 50, 400 * (player.hp / player.maxHp), 10);

    // Draw Gold Blob icon
    ctx.drawImage(icons["goldBlob"].image, 600 - icons["goldBlob"].width / 2, canvasSect.arenaHeight + 50 - (icons["goldBlob"].height / 2), 50, 50 / icons["goldBlob"].aspectRatio)
    ctx.font = '30px Impact';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle"
    ctx.fillStyle = 'rgb(255, 191, 0)';
    ctx.fillText(player.goldBlobs, 650, canvasSect.arenaHeight + 55);


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

    // Move shop page according to shop.targetX
    shop.x = lerp(shop.x, shop.targetX, 0.20)

    // Draw shop page
    ctx.fillStyle = 'rgba(9, 9, 9, 0.8)'
    ctx.fillRect(shop.x, 0, shop.width, canvas.height);
    ctx.font = '60px Impact';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = 'rgb(187, 187, 187)';
    ctx.fillText("Shop", shop.x + 40, 40);

    // Resets cursor style to default when not hovering over a slot
    document.body.style.cursor = 'default';

    // Draw slots & description
    for (let l = shopItems.length - 1; l >= 0; l--) {
        const iconInfo = icons[shopItems[l].icon]
        const iconWidth = shopItems[l].drawWidth
        const iconHeight = shopItems[l].drawWidth / iconInfo.aspectRatio
        let hovering = false

        // Draw outline & shadow around slot when slot is hovered
        if (isHoveringSlot(getSlotInfo(l))) {
            ctx.strokeStyle = "rgb(255, 196, 0)"
            ctx.lineWidth = 5
            ctx.strokeRect(getSlotInfo(l).x, getSlotInfo(l).y, shop.slotSize, shop.slotSize);
            ctx.shadowColor = "rgba(255, 204, 0, 0.8)";
            ctx.shadowBlur = 30;

            document.body.style.cursor = 'pointer';
        }

        ctx.fillStyle = 'rgb(189, 152, 11)'
        ctx.fillRect(getSlotInfo(l).x, getSlotInfo(l).y, shop.slotSize, shop.slotSize)
        ctx.shadowBlur = 0;

        // Draw icon in shop
        ctx.drawImage(
            iconInfo.image,
            getSlotInfo(l).x + (shop.slotSize - iconWidth) / 2,
            getSlotInfo(l).y + (shop.slotSize - iconHeight) / 2,
            iconWidth,
            iconHeight
        );

        // Draw item title
        ctx.font = '25px Impact';
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = 'rgb(151, 151, 151)';
        ctx.fillText(shopItems[l].label, getSlotInfo(l).x + shop.slotGap + shop.slotSize, getSlotInfo(l).y + 5);

        // Draw item description
        ctx.font = '18px Impact';
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = 'rgb(151, 151, 151)';
        ctx.fillText(shopItems[l].desc, getSlotInfo(l).x + shop.slotGap + shop.slotSize, getSlotInfo(l).y + 35);

        // Draw Gold Blob next to cost
        ctx.drawImage(icons["goldBlob"].image, getSlotInfo(l).x + shop.slotGap + shop.slotSize, getSlotInfo(l).y + 60, 20, 20 / icons["goldBlob"].aspectRatio)

        // Write cost
        ctx.font = '18px Impact';
        ctx.textAlign = "left";
        ctx.textBaseline = "top"
        ctx.fillStyle = 'rgb(255, 191, 0)';
        ctx.fillText(shopItems[l].cost, getSlotInfo(l).x + shop.slotGap + shop.slotSize + 25, getSlotInfo(l).y + 60);
    }

    if (player.hp <= player.maxHp / 3) canvasSect.tintStrength = 1 - (player.hp / (player.maxHp / 3)) 
    else canvasSect.tintStrength = 0

    const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        10,
        canvas.width / 2, 
        canvas.height / 2, 1800
    );

    canvasSect.pulseSpeed += 0.05 + canvasSect.tintStrength / 10
    const pulseTint = 0.75 + Math.sin(canvasSect.pulseSpeed) * 0.25

    gradient.addColorStop(0, "rgba(255, 0, 0, 0)");
    gradient.addColorStop(0.5, `rgba(255, 0, 0, ${lerp(0, canvasSect.tintStrength, pulseTint * 0.4)})`);
    gradient.addColorStop(1, `rgba(255, 0, 0, ${lerp(0, canvasSect.tintStrength, pulseTint * 0.8)})`);

    // Apply to shape and draw
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    requestAnimationFrame(draw);
    ctx.restore();
}


// Random number generator
function random(type, min, max) {
    if (type == "float") return Math.random() * (max - min) + min
    if (type == "int") return Math.floor(Math.random() * (max - min + 1) + min)
}

function pickUpItem(type) {
    dropTypes[type].onPickup()
}

function spawnDrops(enemy) {
    for (const drop of enemy.loot) {
        if (random("float", 0, 100) < drop.chance) {
            dropList.push(new Drop(drop.type, enemy.pos.x, enemy.pos.y))
        }
    }
}

// Registers when two circles touch
function hit(a, b) {
    const dist = Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y);
    return (dist <= a.size + b.size);
}


// Resolves collision between enemy and enemy
function enemycollision(enemyList) {
    for (let i = 0; i < enemyList.length; i++) {
        for (let j = i + 1; j < enemyList.length; j++) {

            const dir = new Vector(
                enemyList[i].pos.x - enemyList[j].pos.x,
                enemyList[i].pos.y - enemyList[j].pos.y
            );
            const dist = dir.mag();
            const target = enemyList[i].size + enemyList[j].size;


            if (dist >= target) continue;



            dir.normalize();
            const totalMass = enemyList[i].mass + enemyList[j].mass;
            const overlap = target - dist;

            // Push enemyList[i]
            enemyList[i].pos.add(
                new Vector(dir.x, dir.y).mult(overlap * (enemyList[i].mass / enemyList[j].mass))
            );


            // Push enemyList[j]
            enemyList[j].pos.sub(
                new Vector(dir.x, dir.y).mult(overlap * (enemyList[j].mass / enemyList[i].mass))
            );

            const relatVel = new Vector(
                enemyList[i].vel.x - enemyList[j].vel.x,
                enemyList[i].vel.y - enemyList[j].vel.y
            );

            const velDir = relatVel.x * dir.x + relatVel.y * dir.y;

            if (velDir > 0) continue;

            const impulseMag = -1 * (velDir / ((1 / enemyList[i].mass) + (1 / enemyList[j].mass)));

            const impulse = new Vector(
                impulseMag * dir.x,
                impulseMag * dir.y
            );


            enemyList[i].vel.add(new Vector(
                impulse.x / enemyList[i].mass,
                impulse.y / enemyList[i].mass
            )
            );

            enemyList[j].vel.sub(new Vector(
                impulse.x / enemyList[j].mass,
                impulse.y / enemyList[j].mass
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

    if (player.immune > 0 || player.devMode) return;

    // Add knockback if player is not immune
    player.vel.add(new Vector(dir.x, dir.y).mult(10));
    player.immune = 200

    // Damage
    if (player.hp > 0) player.hp -= enemy.dam

    // Apply screen shake
    shakeScreen(10, 60)
};

// Define the screen shake
function shakeScreen(strength, time) {
    canvasSect.shakeStrength = strength
    canvasSect.shakeTime = time
}

function findCurrentGun() {
    switch (gunType) {
        case 0: return guns[0]
        case 1: return guns[1]
        case 2: return guns[2]
        case 3: return guns[3]
    }
}

function waveSpawning() {
    if (!wave.active) return;
    wave.active = true;
    if (wave.enemiesToSpawn > 0) {
        if (wave.cooldown == 0) {
            const side = random("int", 1, 4)
            const type = random("int", 1, 3)
            if (side == 1) enemyList.push(new Enemy(type, 50, 50));
            if (side == 2) enemyList.push(new Enemy(type, 50, canvasSect.arenaHeight - 50));
            if (side == 3) enemyList.push(new Enemy(type, canvasSect.arenaWidth - 50, canvasSect.arenaHeight - 50));
            if (side == 4) enemyList.push(new Enemy(type, canvasSect.arenaWidth - 50, 50));
            wave.enemiesToSpawn--;
            wave.cooldown = 60
        }
        else wave.cooldown--;
    }
    if (wave.enemiesToSpawn <= 0 && enemyList.length == 0) {
        wave.active = false;
        wave.completed++
    }
}

// If shop is opened, targetX will be set to shop width, and set to canvas width if shop is closed
function toggleShop() {
    shop.open = !shop.open
    shop.targetX = shop.open ? canvas.width - shop.width : canvas.width
}

function buyItem(num) {
    if (player.goldBlobs < shopItems[num].cost) return
    player.goldBlobs -= shopItems[num].cost
    shopItems[num].onBuy()
}

// Returns if mouse is hovering over slot
function isHoveringSlot(slot) {
    return (
        shop.open &&
        player.mouse.x >= slot.x &&
        player.mouse.y >= slot.y &&
        player.mouse.x <= slot.x + shop.slotSize &&
        player.mouse.y <= slot.y + shop.slotSize
    )
}

function getSlotInfo(l) {
    return {
        x: shop.slotStartX + shop.x,
        y: shop.slotStartY + l * (shop.slotGap + shop.slotSize),
    }
}

const lerp = (start, end, amt) => (1 - amt) * start + amt * end

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
    keyPressed[event.key] = true;
    if (event.key == 'q') {
        if (event.repeat) return;
        if (player.devMode) enemyList.push(new Enemy(1, 50, 50));
    }
    if (event.key == 'e') {
        if (event.repeat) return;
        if (player.devMode) enemyList.push(new Enemy(2, 50, 50));
    }
    if (event.key == 'r') {
        if (event.repeat) return;
        if (player.devMode) enemyList.push(new Enemy(3, 50, 50));
    }
    if (event.key == 'l' && !wave.active) {
        wave.enemiesToSpawn = Math.round(Math.sqrt(30 * (wave.completed + 1)));
        wave.active = true;
    }
    if (event.key == 'v') {
        if (!player.devMode) return
        const getRandomDrop = obj => {
            const keys = Object.keys(obj)
            return keys[random("int", 0, keys.length - 1)];
        }
        dropList.push(new Drop(getRandomDrop(dropTypes), player.mouse.x, player.mouse.y))
    }
    if (event.key == 'z') {
        toggleShop()
    }
    if (event.key == '=') {
        if (!player.devMode) player.devMode = true;
        else if (player.devMode) player.devMode = false;
    }
    if (event.key == '0' && player.devMode) {
        gunType = 0;
    }
    if (event.key == '1') {
        gunType = 1;
    }
    if (event.key == '2') {
        gunType = 2;
    }
    if (event.key == '3') {
        gunType = 3;
    }
});


// Check if key is up
window.addEventListener('keyup', (event) => {
    keyPressed[event.key] = false;
});


// Check for clicks
window.addEventListener('click', (event) => {
    switch (event.button) {
        case 2: // Right click
            event.preventDefault();
            break;
        case 0: // Left click
            event.preventDefault();

            if (shop.open === true && player.mouse.x >= shop.x) {
                for (let l = shopItems.length - 1; l >= 0; l--) {
                    if (isHoveringSlot(getSlotInfo(l))) {
                        buyItem(l)
                    }
                }
                break;
            }

            if (player.mouse.x >= 0 && player.mouse.x <= canvasSect.arenaWidth && player.mouse.y >= 0 && player.mouse.y <= canvasSect.arenaHeight) {
                if (gunType == 0) {
                    for (let i = 1; i <= guns[0].bulletSetup.count; i++) {
                        bulletList.push(new Bullet(0, player.pos.x, player.pos.y))
                        guns[0].loaded--
                    }
                    timeSinceLastShot = 0
                }

                if (reloading == 0) {
                    if (timeSinceLastShot > currentGun.fireRate) {
                        for (let i = 1; i <= currentGun.bulletSetup.count; i++) {
                            bulletList.push(new Bullet(gunType, player.pos.x, player.pos.y));
                        }
                        currentGun.loaded--
                        timeSinceLastShot = 0
                    }
                }
                break;
            }
    }
});


// Prevents pop-up from opening (Right click)
window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (player.devMode) player.pos = new Vector(player.mouse.x, player.mouse.y);
});