var player1,
    zombies =[],
    bullets = [],
    keyState = [],
    score = 0,
    hud,
    menu,
    play = false;

var starterValues = {
  stamina: 10,
  bulletCount: 10,
  annihilateCount: 3,
  playerSpeed: 2,
  bulletSpeed: 8,
  runSpeed: 5,
  attack: 25,
  zombieSpeed: 1,
  zombieHealth: 100,
  zombieSpawnSpeed: 1500, //ms
  reloadSpeed: 1500, //ms
  stansize: 50,
  bulletW: 50,
  bulletH: 5,
  font: 'VT323'
}

var imgs = {
  floor: null,
  zombieRight: null,
  zombieLeft: null,
  player: null
};

var soundEffects = {
  laser: function(){
    var audio = new Audio('laser.wav');
    return audio;
  },
  zombieDeath: function(){
    var audio = new Audio('death.wav');
    return audio;
  },
  run: function(){
    var audio = new Audio('run.wav');
    return audio;
  },
  annihilate: function(){
    var audio = new Audio('ann.wav');
    return audio;
  },
  reload: function(){
    var audio = new Audio('reload.wav');
    return audio;
  },
  gameover: function(){
    var audio = new Audio('gameover.wav');
    return audio;
  }
}
//function to detect collision
function collision(rect1,rect2){
  if(rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.h + rect1.y > rect2.y){
      return true;
  } else {
    return false;
  }
}

//preload imgs - p5js function, executes automatically
function preload(){
  imgs.zombieRight = loadImage('zombie-right.png');
  imgs.zombieLeft = loadImage('zombie-left.png');
  imgs.floor = loadImage('floor.jpg');
  //imgs.player = loadImage('player.png');
}

//setup
function setup(){
  createCanvas(windowWidth,windowHeight);
  starterValues.stansize = width/23;
  //player class
  function Player(x,y,w,h,direction){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.speed = starterValues.playerSpeed;
    this.direction = direction;
    this.bulletCount = starterValues.bulletCount;
    this.currentlyReloading = false;
    this.reloadTimer = null;
    this.startReloadTimer = 'nullified'; //stringified so it returns NaN
    this.annihilateCount = starterValues.annihilateCount;
    this.stamina = starterValues.stamina;
    this.currentlyRunning = false;
    this.fire = function(){
      if (!this.currentlyReloading) {
        switch (this.direction) {
          case 'right':
            bullets.push( new Bullet(this.x+this.w, this.y+(this.h/2),starterValues.bulletW,starterValues.bulletH,this.direction) );
          break;
          case 'left':
            bullets.push( new Bullet(this.x-(this.w), this.y+(this.h/2),starterValues.bulletW,starterValues.bulletH,this.direction) );
          break;
          case 'up':
            bullets.push( new Bullet(this.x+(this.w/2),this.y+this.h,starterValues.bulletH,starterValues.bulletW,this.direction) );
          break;
          case 'down':
            bullets.push( new Bullet(this.x+(this.w/2),this.y-(this.h),starterValues.bulletH,starterValues.bulletW,this.direction) );
          break;
        }
        this.bulletCount--;
        soundEffects.laser().play();
      }
    }
    this.reload = function(){
      //done reloading
      this.startReloadTimer = 'nullified';
      this.currentlyReloading = false;
      this.bulletCount = starterValues.bulletCount;
    }
    this.annihilate = function(){
      score+= zombies.length;
      zombies = [];
      this.annihilateCount--
      soundEffects.annihilate().play();
    }
    this.update = function(){
      //movement
      if (keyState[39] && this.x<width-this.w ){//right
        this.x += this.speed;
        this.direction = 'right';
      }
      if (keyState[37] && this.x>0){//left
        this.x -= this.speed;
        this.direction = 'left';
      }
      if (keyState[38] && this.y>0){//up
        this.y -= this.speed;
        this.direction = 'down';
      }
      if (keyState[40] && this.y<height-this.h ){//down
        this.y += this.speed;
        this.direction = 'up';
      }
      //running
      if (keyState[16] && !this.currentlyRunning){
        this.speed = starterValues.runSpeed;
        this.currentlyRunning = true;
        soundEffects.run().play();
      } else if (!keyState[16] && this.currentlyRunning) {
        this.speed = starterValues.playerSpeed;
        this.currentlyRunning = false;
      }
      if (this.stamina<0) {
        this.speed = starterValues.playerSpeed;
      }
      if (this.currentlyRunning && this.stamina>0){
        this.stamina-= 0.1;
      } else if (!this.currentlyRunning && this.stamina<10) {
        this.stamina+= 0.01;
      }
      //relaod time
      this.reloadTimer = Date.now() - this.startReloadTimer;
    }
    this.dr = function(){ //short for draw
      push();
      noStroke();
      fill('#dd5d5d');
      rect(this.x,this.y,this.w,this.h);
      //image(imgs.player, this.x, this.y, this.w, this.h);
      pop();
    }
  }
  //zombies class
  function Zombie(x,y,w,h,zombieSpeed){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.health = starterValues.zombieHealth;
    this.speed = zombieSpeed;
    this.direction = null;
    this.opacity = 1;
    this.alreadySpawned = false;
    this.spawnLocation = function(){
      if (!this.alreadySpawned){
        var direction = Math.floor(Math.random() * (3 - 0 + 1)) + 0;
        var randomW = Math.round( Math.random() * (width - 0) + 0 );
        var randomH = Math.round( Math.random() * (height - 0) + 0 );

        if (direction == 0){ //top
          this.y = 0 - this.h;
          this.x = randomW;
        } else if (direction == 1) { //bottom
          this.y = height;
          this.x = randomW
        } else if (direction == 2) { //left
          this.x = 0 - this.w;
          this.y = randomH;
        } else if (direction == 3) { //right
          this.x = width;
          this.y = randomH;
        }
        this.alreadySpawned = true;
      }
    }
    this.update = function(){
      //zombie movment
      if(player1.x<this.x){
        this.x -= this.speed;
        this.direction = 'left';
      } else if (player1.x>this.x) {
        this.x += this.speed;
        this.direction = 'right';
      }
      if (player1.y<this.y){
        this.y -= this.speed;
      } else if (player1.y>this.y) {
        this.y += this.speed;
      }
      //player collision with zombie
      if ( collision(player1,this) ){
        menu.gameover();
      }
      //zombie collision with bullets
      for (let i=0; i<bullets.length; i++){
        if (zombies.length>0 && collision(bullets[i],this)){
          var bulletIndex = bullets.indexOf(bullets[i]);
          bullets.splice(bulletIndex, 1);
          this.health -= starterValues.attack;
          var opacity = this.health/100;
          this.opacity = opacity;
        }
      }
      //zombie death
      if (this.health == 0) {
        var zombiesIndex = zombies.indexOf(this);
        zombies.splice(zombiesIndex, 1);
        score++;
        soundEffects.zombieDeath().play();
      }
      //zombies collision with other zombies

      /*for (var i=0; i<zombies.length; i++){
        if (this == zombies[i]) continue;
        if ( collision(this,zombies[i]) ) {
          if(this.speedx != 0) {
            this.speedx = 0;
            console.log('collision');
          }
        }
      }*/
    }
    this.dr = function(){
      var opacity = this.opacity*255;
      this.spawnLocation();
      push();
      tint(255, opacity);
      if(this.direction=='left'){
        image(imgs.zombieLeft, this.x, this.y, this.w, this.h);
      } else if(this.direction=='right'){
        image(imgs.zombieRight, this.x, this.y, this.w, this.h);
      }
      //image(imgs.zombieLeft, this.x, this.y, this.w, this.h);
      pop();
    }
  }
  //bullets class
  function Bullet(x,y,w,h,direction){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = '#ffda2a';
    this.direction = direction,
    this.speed = starterValues.bulletSpeed;
    this.animation = function(){
      switch (this.direction) {
        case 'right':
          this.x += this.speed;
        break;
        case 'left':
          this.x -= this.speed;
        break;
        case 'up':
          this.y += this.speed;
        break;
        case 'down':
          this.y -= this.speed;
        break;
      }
    }
    this.dr = function(){
      this.animation();
      push();
      noStroke();
      fill(this.color);
      rect(this.x,this.y,this.w,this.h);
      pop();
    }
  }
  //hud
  hud = {
    bullet: function(){
      for(let i=0; i<player1.bulletCount; i++){
        push();
        noStroke();
        fill('#ffda2a');
        rect(5,height-(20*(i+3)/2),20,3);
        pop();
      }
    },
    reload: function(){
      push();
      noStroke();
      fill('orange');
      rect(30, height-125, 7, 100);
      fill('#dd5d5d');
      rect(30, height-125, 7, player1.reloadTimer/15); //reloadtimes / x = 50(fullbar)
      pop();
    },
    score: function(){
      push();
      fill('white');
      textSize(35);
      text('SCORE: ' + score, 5, 25);
      pop();
    },
    annihilate: function(){
      for(let i=0; i<player1.annihilateCount; i++){
        push();
        fill('yellow');
        ellipse(20*(i+5)/2,height-35,20);
        pop();
      }
    },
    stamina: function(){
      var range = map(player1.stamina,0,starterValues.stamina,0,width);
      push();
      noStroke();
      fill('#787f35');
      rect(0, height-20, width, 20);
      fill('#dd5d5d');
      rect(0, height-20, range, 20); //reloadtimes / x = 50(fullbar)
      pop();
    },
    dr: function(){
      this.bullet();
      this.reload();
      this.score();
      this.annihilate();
      this.stamina();
    }
  }
  //menu
  menu = {
    intro: function(){
      player1 = new Player(Math.round(width/2),Math.round(height/2),starterValues.stansize,starterValues.stansize,'right');
      setInterval(function(){
        if (play) {
          zombies.push( new Zombie(0,0,starterValues.stansize,starterValues.stansize, starterValues.zombieSpeed) );
        }
      },starterValues.zombieSpawnSpeed);

      image(imgs.floor, 0, 0, width, height);
      textFont(starterValues.font);
      player1.dr();
      hud.dr();
      this.tutorial();
    },
    start: function(){
      zombies =[];
      bullets = [];
      score = 0;
      player1.stamina = starterValues.stamina;
      player1.bulletCount = starterValues.bulletCount;
      player1.annihilateCount = starterValues.bulletCount;

      play = true;
      player1 = new Player(Math.round(width/2),Math.round(height/2),starterValues.stansize,starterValues.stansize,'right');
    },
    pause: function(){
      play = !play;
      push();
      textAlign(CENTER);
      fill('white');
      textSize(50);
      text('PAUSED', width/2, height/2-40);
      textSize(20);
      text('[ENTER] TO RESTART. [BACKSPACE OR EXIT] TO CONTINUE\n[A] FIRE\n[R] RELOAD\n[D] ANNIHILATE\n[SHIFT] RUN', width/2, height/2);
      pop();
    },
    gameover: function(){
      soundEffects.gameover().play();
      play = false;
      push();
      textAlign(CENTER);
      fill('white');
      textSize(50);
      text('GAMEOVER. SCORE: ' + score, width/2, height/2);
      textSize(30);
      text('[ENTER] TO REPLAY', width/2, height/1.8);
      pop();
    },
    tutorial: function(){
      play = false;
      push();
      textAlign(CENTER);
      fill('white');
      textSize(30);
      text('[ENTER] START PLAYING\n[A] FIRE\n[R] RELOAD\n[D] ANNIHILATE\n[SHIFT] RUN', width/2, height/3);
      pop();
    }
  }
  menu.intro();
}

//controls
window.onkeyup = function(e){
  var code = e.keyCode;
  //fire
  if (player1.bulletCount > 0 && code==65) { //a
    player1.fire();
  }
  //reload
  if (!player1.currentlyReloading && player1.bulletCount < 10 && code==82){//r
    //reloading
    player1.startReloadTimer = Date.now();
    player1.currentlyReloading = true;
    var boundReload = player1.reload.bind(player1); //because timeout fucks with this binding
    setTimeout(boundReload, starterValues.reloadSpeed);
    if(play){
      soundEffects.reload().play();
    }
  }
  //annihilate
  if (player1.annihilateCount > 0 && code==68){//d
    player1.annihilate();
  }
  //pause
  if (code==8 || code==27) {
    menu.pause();
  }
  //restart
  if (!play && code==13){
    menu.start();
  }
}
window.addEventListener('keydown',function(e){
	keyState[e.keyCode || e.which] = true;
},true);
window.addEventListener('keyup',function(e){
	keyState[e.keyCode || e.which] = false;
},true);

//gameloop
function draw(){
  if(play){
    clear();
    image(imgs.floor, 0, 0, width, height); //background image

    player1.update();
    for(let i=0; i<zombies.length; i++){
      zombies[i].update();
      if (zombies.length > 0) {
        zombies[i].dr();
      }
    }
    player1.dr();
    for(let i=0; i<bullets.length; i++){
      bullets[i].dr();
    }
    hud.dr();
  }
}
