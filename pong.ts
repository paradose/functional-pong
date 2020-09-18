
import { fromEvent,interval } from 'rxjs'; 
import { map,filter,merge,scan, flatMap, takeUntil } from 'rxjs/operators';

// reference: FIT2102, Tim's asteroids, 
// we use vector because it is immutable and returns new instances of vectors instead of changing its data in place.
class Vector {
  constructor(public readonly x: number = 0, public readonly y: number =0) {}
  add = (b: Vector) => new Vector(this.x + b.x, this.y + b.y);
  sub = (b: Vector) => new Vector(this.x - b.x, this.y - b.y)
  scale = (s: Vector) => new Vector(this.x*s.x, this.y*s.y)
  evenscale = (s: number) => new Vector(this.x*s, this.y*s)
  flipy = (s: number) => new Vector(this.x, this.y*s)
  flipx = (s: number) => new Vector(this.x*s, this.y)
  addy = (s:number) => new Vector(this.x, this.y-s)
  static Zero = new Vector()
}
class RNG {
  // referenced from FIT2014 Week 4 Observables question
  m = 0x80000000// 2**31
  a = 1103515245
  c = 12345
  state:number
  constructor(seed) {
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
  }
  nextInt() {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
  }
  nextFloat() {
    // returns in range [0,1]
    return this.nextInt() / (this.m - 1);
  }
}


function pong() {
  
  type Key = 'ArrowUp' | 'ArrowDown' | 'KeyR'
  type Event = 'keydown' | 'keyup'
  
  // --------*`'~*'` Actions for Streams `'*~'`*---------------

  class BoardMove { constructor(public readonly direction:Vector) {} }
  class RestartGameState {constructor(public readonly setGame: Boolean) {} }

  // --------*`'~*'` Keyboard Observable Stream `'*~'`*---------------
  // Creating observable streams for each keyboard event where rxjs listens for the events.
  const keyObservables = <T>(e: Event, k: Key, result: ()=> T) => 
    fromEvent<KeyboardEvent>(document, e)
      .pipe(
        filter(({code}) => code === k),
        map(result)),
    
    startMoveUp = keyObservables('keydown', 'ArrowUp', () => new BoardMove(new Vector(0,-1))),
    startMoveDown = keyObservables('keydown', 'ArrowDown', () => new BoardMove(new Vector(0,1))),
    restart = keyObservables('keydown', 'KeyR', () => new RestartGameState(false))
  
  // -------*`'~*'` type desclarations `'*~'`*-----------------
  
  type State = Readonly<{
    player: Board,
    computer : Board,
    ball : Board, 
    player_score: number,
    computer_score:number,
    max_score: number,
    gameOver: boolean,
    playerScored: boolean,
  }>
  
  type Board = Readonly<{
    id: string,
    position: Vector,
    velocity: Vector,
  }>

  // --------------*`'~*'` Initial States`'*~'`*--------------
  const randomValue = new RNG(20) // having a seed to keep the randomisation constant
  const playerBoard: Board = { id: "player", position: new Vector(75, 300), velocity: new Vector(0,15)}
  const computerBoard: Board = {id: "computer", position: new Vector(525,300) , velocity: new Vector(0,3)}
  const ballBody: Board = {id: "ball", position: new Vector(300,300), velocity: new Vector(2,2)}
  const initialState: State = {player: playerBoard, computer: computerBoard, ball: ballBody, player_score:0, computer_score: 0,
                               gameOver: false, max_score:7, playerScored: false}
  
  // -----------*`'~*'` Reducing States and Initial Sates `'*~'`*---------------

  const reduceState = (s: State, e:BoardMove | RestartGameState) =>
    !s.gameOver ? // if game has not ended we transform the state based on events, otherwise we listen for restart.
      (e instanceof BoardMove)?
    // moves the player's board, otherwise checks if ball has collided with anything returning new state
      {...s, player: {...s.player, position: onBoard(s.player.position,e.direction.scale(s.player.velocity)) ? s.player.position.add(e.direction.scale(s.player.velocity)) : s.player.position}} 
                    : handleCollisions({...s, computer: moveComputer(s.computer,s.ball), ball: moveBall(s.ball)})
    : e instanceof RestartGameState ? initialState : s

  // --------------*`'~*'` Subscribing Observables  `'*~'`*--------------------
  const 
  // moving the computer when ball heads above, it moves up, otherwise down.
  moveComputer = (c:Board, b: Board) => <Board>{
    ...c,
    position: b.position.x > 300 
              ?  b.position.y + 5 *2 < c.position.y + 80/2 && onBoard(c.position,c.velocity.evenscale(-1))  // check if computer is on board and top of paddle
              ? c.position.add(c.velocity.evenscale(-1))
              : b.position.y + 5 *2 > c.position.y + 80/2 && onBoard(c.position,c.velocity.evenscale(1)) ? // otherwise 
              c.position.add(c.velocity)
              : c.position 
              : c.position

  },
  // height of the board is 80 and canvas size is 600. here we detect if on board or not.
  // functions below are used to check for collisions

  onBoard = (start: Vector, dest: Vector) => (start.add(dest).y <= 600-80 ) && (start.add(dest).y >=0),
  moveBall = (o:Board) => <Board>{...o, position: o.position.add(o.velocity)},
  randomSide = () => randomValue.nextFloat() > 0.5 ? -1 : 1,
  // true if player score, false if computer scored, resets ball to original position
  changeScore = (s: State) => s.ball.position.x < 300 
                              ? {...s, ball: {...ballBody, velocity: ballBody.velocity.flipx(randomSide())}, 
                                      player_score: s.player_score+1, playerScored: false, delay: true} 
                              : {...s, ball: {...ballBody, velocity: ballBody.velocity.flipx(randomSide())}, 
                                      computer_score: s.computer_score+1, playerScored: true, delay: true}, 
  
  checkGameOver = (s:State) => <State>{...s, gameOver : s.player_score==s.max_score || s.computer_score==s.max_score},
  
  // changing angles/ game state when the ball hits something 
  handleCollisions = (s: State) => { 
    const 
      hitSideWalls = s.ball.position.x <= 0  || s.ball.position.x >= 600,
      hitTopWalls = s.ball.position.y <= 0 || s.ball.position.y >= 600,
      collidePlayerBoard = (s.ball.position.x <= s.player.position.x + 5 && s.ball.position.x >= s.player.position.x)
                            && (s.ball.position.y <= s.player.position.y+80 && s.ball.position.y >= s.player.position.y), 
      collideComputerBoard = (s.ball.position.x >= s.computer.position.x && s.ball.position.x <= s.computer.position.x+5) 
                            && (s.ball.position.y <= s.computer.position.y + 80 && s.ball.position.y >= s.computer.position.y),

      // checks if difference between ball is more than half the height of the paddle
      topOfBoard = (bally: number, playery: number) => (bally<playery+40)
      return hitSideWalls ? checkGameOver(changeScore(s))
          : hitTopWalls ? {...s,ball : {...s.ball, velocity: s.ball.velocity.flipy(-1)}} 
          : collidePlayerBoard ? {...s, ball : {...s.ball, velocity: topOfBoard(s.ball.position.y, s.player.position.y) 
                                                                      ? s.ball.velocity.flipx(-1).addy(1) : s.ball.velocity.flipx(-1).addy(-1) }}
          : collideComputerBoard ?  {...s, ball : {...s.ball, velocity: topOfBoard(s.ball.position.y, s.computer.position.y)
                                                                      ? s.ball.velocity.flipx(-1).addy(1) : s.ball.velocity.flipx(-1).addy(-1)}}
          : s
  }
// --------------*`'~*'` Subscribing Observables  `'*~'`*--------------------
  // subscribing key events observables
  const playPong = interval(10).pipe(
    merge(startMoveUp, startMoveDown, restart),
    scan(reduceState, initialState),
    ).subscribe(updateView);
  
// ------------*`'~*'` Updating Game View Subscription `'*~'`*-----------------
  function updateView(s: State) {
    const
        board = document.getElementById("player")!,
        gameOver = document.getElementById("gameover")!,
        computer = document.getElementById("computer")!,
        attr = (e:Element,o:any) =>
        { for(const k in o) e.setAttribute(k,String(o[k]));}
      attr(board, {transform: `translate(${s.player.position.x}, ${s.player.position.y})`})
      attr(computer, {transform: `translate(${s.computer.position.x}, ${s.computer.position.y})`})
      const g = document.getElementById(s.ball.id)
      attr(gameOver, {visibility: 'hidden  '})
      attr(g, {cx: s.ball.position.x, cy:s.ball.position.y})
      const pscore = document.getElementById("playerscore")
      const cscore = document.getElementById("computerscore")
      pscore.innerHTML = s.player_score.toString()
      cscore.innerHTML = s.computer_score.toString()

// --------*`'~*'` Restart Game Implementation `'*~'`*---------------
    // if game has ended, we display a winning message depending on the score, and offer user option to restart.
      if (s.gameOver) {
        const gameOver = document.getElementById("gameover")
        const winningmessage = "You " +( s.playerScored ? " won" : " lost") +  "! Press R to restart!";
        gameOver.textContent = winningmessage
        attr(gameOver, {visibility: 'visible'})
      }
  }
}

if (typeof window != 'undefined')
  window.onload = ()=>{
    pong();
  }
