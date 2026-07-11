====================Changelog====================


v1.0.0-alpha:
----Game Features----
 - Added player movement using WASD keys
 - Added shooting and reloading mechanism. 3 Types of guns available, pistol, shotgun and sniper.
 Switch between them using 123 keys
 - Added Enemies, enemy movement and evemy health system
 - Knockback when enemies are hit by a bullet. Knockback strength depends on mass of enemy
 - Enemy to enemy collision implemented. Takes into account speed, mass, size and direction of both enemies
 - Added UI bar at the bottom of the screen
 - Added reload bar (yellow) to UI. Yet to be functional

----Dev tools----
 - Right click to teleport to location
 - Pressing "=" will swich gun to God mode. Shoots bullets with infinite damage

v1.1.0-alpha:
----Game Features----
 - Added functioning health bar & system. Max health is 100
 - Added stamina bar & stamina system. Stamina used up if sprinting
 - Added sprinting mechanism, player moves twice as fast. Hold spacebar and movement key to sprint.
 - Enemies now do the following damage to player upon contact:
    Normal zomblob: 20
    Small zomblob: 10
    Large zomblob: 40
 - Added Deathscreen. Shown upon health reaching 0 or below
 - Changed key for God gun from "=" to "0"

----Code Changes----
 - Changed enemy stats from assigning them in their constructor() to a seperate object
 - Added element "immune" to player. Timer for hit immunity
 - Added element "dam" to enemy. Damage that the enemy does
 - Changed God gun stats from assigning them in bullet constructor() to guns object

----Bug fixes----
 - Fixed God gun after not firing when gun stats were changed to an object

v1.2.0-alpha
----Game Features----
 - Added devmode. Press "=" will enter devmode. The player will turn yellow
 - While in devmode, player will not take any damage or knockback from zombies,
 however, player is still able to be pushed by zombies
 - God gun is now only availible in devmode. If God gun is equipped while in devmode, and the user exits devmode, the gun will
switch to pistol
 - Added wave system. Triggered with "l" key, it will start to spawn zombies from a random corner of the arena
 - The amount of zombies to spawn in a wave is determined by the equation: round(sqrt(30*Current Wave Number))

----Code Changes----
 - Added element "devMode" to player
 - Added function waveSpawning(). dictates how the zombies spawn
 - Added object "wave". Stores the waves completed, zombies yet to be spawned, the cooldown in between each spawn and an
 identifier to check if a wave is active

v1.3.0-alpha
----Game Features----
 - Added drops upon zomblob death:
   Gold blob
   Heal blob 
   Pistol ammo x15
   Shotgun ammo x10
   Sniper ammo x5
 - Different zomblobs have different loot tables
 - Heal Blobs heal player health by 10hp
 - Gold Blobs add 5 Gold Blobs to player. Gold Blobs can be traded for items in the shop. (Shop is yet to be implemented)
 - Player will now spawn in the middle of the arena upon loading
 - If player consumes a Heal Blob that will cause the player health to go over the max health of the player, the Heal Blob will
 only add the amount of hp that is needed to reach max health
 - Spawning zombies using the "q", "e" and "r" keys have been moved to devmode only

----Code Changes----
 - Added new class for drops
 - Added new "icons" folder. Stores icons that will be used.
 - Added 2 key-value object for the icons. "iconPaths" stores the icon asset paths, while "icons" stores the loaded icons
 - Added key "loot" to all the enemy types
 - Added new key-value "dropTypes" object for drops
 - Added 2 new functions "pickUpItem" and "spawnDrops". "spawnDrops" responsible for setting up drops based on enemy loot table.
"pickUpItem" responsible for running events that happen when player picks up the item


====================End Changelog====================