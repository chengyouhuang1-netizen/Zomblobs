1.0.0-alpha:
----Game Features----
 - Added player movement using WASD keys
 - Added shooting and reloading mechanism. 3 Types of guns available, pistol, shotgun and sniper. Switch between them using 123 keys
 - Added Enemies, enemy movement and evemy health system
 - Knockback when enemies are hit by a bullet. Knockback strength depends on mass of enemy
 - Enemy to enemy collision implemented. Takes into account speed, mass, size and direction of both enemies
 - Added UI bar at the bottom of the screen
 - Added reload bar (yellow) to UI. Yet to be functional

----Dev tools----
 - Right click to teleport to location
 - Pressing "=" will swich gun to God mode. Shoots bullets with infinite damage

1.1.0-alpha:
----Game Features----
 - Added functioning health bar & system. Max health is 100
 - Added stamina bar & stamina system. Stamina used up if sprinting
 - Added sprinting mechanism, player moves twice as fast. Hold spacebar and movement key to sprint.
 - Enemies now do the following damage to the player upon contact:
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