
import { fromEvent,interval } from 'rxjs'; 
import { map,filter,merge,scan, flatMap, takeUntil, throwIfEmpty } from 'rxjs/operators';

// inspired by tim's asteroid
// we use vector because it is immutable and returns new instances of vectors instead of changing its data in place.
class Vector {
  constructor(public readonly x: number = 0, public readonly y: number =0) {}
  add = (b: Vector) => new Vector(this.x + b.x, this.y + b.y);
  sub = (b: Vector) => new Vector(this.x - b.x, this.y - b.y)
  scale = (s: Vector) => new Vector(this.x*s.x, this.y*s.y)
  evenscale = (s: number) => new Vector(this.x*s, this.y*s)
  flipy = (s: number) => new Vector(this.x, this.y*s)
  flipx = (s: number) => new Vector(this.x*s, this.y)
  static Zero = new Vector()
}

function pong() {
  
  type Key = 'ArrowUp' | 'ArrowDown' | 'KeyR'
  type Event = 'keydown' | 'keyup'
  
  // --------*`'~*'` Actions for Streams `'*~'`*---------------

  class BoardMove { constructor(public readonly direction:Vector) {} }
  class RestartGameState {constructor(public readonly setGame: Boolean) {} }
  class BallMove {constructor (public readonly direction:Vector) {} }

  // --------*`'~*'` Keyboard Observable Stream `'*~'`*---------------

  const keyObservables = <T>(e: Event, k: Key, result: ()=> T) => 
    fromEvent<KeyboardEvent>(document, e)
      .pipe(
        filter(({code}) => code === k),
        map(result)),
    
    startMoveUp = keyObservables('keydown', 'ArrowUp', () => new BoardMove(new Vector(0,-8))),
    startMoveDown = keyObservables('keydown', 'ArrowDown', () => new BoardMove(new Vector(0,8))),
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
    angle : number,
  }>
  
  // --------------*`'~*'` Visual Initial States`'*~'`*--------------

  const playerBoard: Board = { id: "player", position: new Vector(75, 300), velocity: Vector.Zero, angle: 0}
  const computerBoard: Board = {id: "computer", position: new Vector(525,300) , velocity: new Vector(0,4), angle: 0}
  const ballBody: Board = {id: "ball", position: new Vector(300,300), velocity: new Vector(2,2), angle: 360}
  const initialState: State = {player: playerBoard, computer: computerBoard, ball: ballBody, player_score:0, computer_score: 0, gameOver: false, max_score:7, playerScored: false }
  
  // -----------*`'~*'` Reducing States and Initial Sates `'*~'`*---------------

  const reduceState = (s: State, e:BoardMove | RestartGameState) =>
    !s.gameOver ?
    (e instanceof BoardMove ? 
    {...s, player: {...s.player, position: onBoard(s.player.position,e.direction)? s.player.position.add(e.direction) : s.player.position}} 
                    : handleCollisions({...s, computer: moveComputer(s.computer,s.ball), ball: moveBall(s.ball)}) ) // check if ball has collided with anything
    : e instanceof RestartGameState ? initialState : s

  // --------------*`'~*'` Subscribing Observables  `'*~'`*--------------------
  const 
    moveComputer = (c:Board, b: Board) => <Board>{
      ...c,
      position: b.position.x > 300 ? 
                ((b.position.y + 5 *2 < c.position.y + 80/2) ? c.position.add(c.velocity.evenscale(-1)) 
                : c.position.add(c.velocity))
                : c.position
    },
    // heighT of the board is 80 and canvas size.
    onBoard = (start: Vector, dest: Vector) => (start.add(dest).y <= 600-80 ) && (start.add(dest).y >=0),
    moveBall = (o:Board) => <Board>{     ...o, position: o.position.add(ballCalc(o.angle,2))},
    // true if player score, false if computer scored, resets ball to original position
    changeScore = (s: State) => s.ball.position.x < 300 ? {...s, ball: ballBody, player_score: s.player_score+1} 
                                : {...s, ball: ballBody, computer_score: s.computer_score+1, playerScored: false }, 
    
    checkGameOver = (s:State) => <State>{...s, gameOver : s.player_score==s.max_score || s.computer_score==s.max_score},

    // changing angles/ game state when the ball hits something 
    handleCollisions = (s: State) => { 

    // board collision
      const 
        hitSideWalls = s.ball.position.x <= 0  || s.ball.position.x >= 600,
        hitTopWalls = s.ball.position.y <= 0 || s.ball.position.y >= 600,
        collidePlayerBoard = (s.ball.position.x <= s.player.position.x + 5 && s.ball.position.x >= s.player.position.x)
                              && (s.ball.position.y <= s.player.position.y + 80) && (s.ball.position.y >= s.player.position.y), 
        collideComputerBoard = (s.ball.position.x >= s.computer.position.x-5 && s.ball.position.x <= s.computer.position.x) 
                              && (s.ball.position.y <= s.computer.position.y + 80) && (s.ball.position.y >= s.computer.position.y)
        return hitSideWalls ? checkGameOver(changeScore(s))
            : hitTopWalls ? {...s, ball : {...s.ball, angle :-s.ball.angle}} 
            : collidePlayerBoard ? {...s, ball : {...s.ball, angle: bounceAngle(s.player,s.ball)}}
            : collideComputerBoard ? {...s, ball : {...s.ball,  angle: bounceAngle(s.player,s.ball) }}
            : s
    },
    
    bounceAngle = (b:Board, player:Board) => ((player.position.y + 40 - b.position.y)/40) * 75,
    ballCalc = (angle: number, velocity: number) => new Vector(velocity*Math.cos(angle), velocity*-1*Math.sin(angle))
// --------------*`'~*'` Subscribing Observables  `'*~'`*--------------------

  const playPong = interval(10).pipe(
    merge(startMoveUp, startMoveDown, restart),
    scan(reduceState, initialState),
    ).subscribe(updateView);
  
// ------------*`'~*'` Updating GameR View Subscription `'*~'`*-----------------

  function updateView(s: State) {
    const
        svg = document.getElementById("canvas")!,
        board = document.getElementById("player")!,
        computer = document.getElementById("computer")!,
        attr = (e:Element,o:any) =>
        { for(const k in o) e.setAttribute(k,String(o[k]));}
      attr(board, {transform: `translate(${s.player.position.x}, ${s.player.position.y})`})
      attr(computer, {transform: `translate(${s.computer.position.x}, ${s.computer.position.y})`})
      const g = document.getElementById(s.ball.id)
      attr(g, {cx: s.ball.position.x, cy:s.ball.position.y})
      const pscore = document.getElementById("playerscore")
      const cscore = document.getElementById("computerscore")
      pscore.innerHTML = s.player_score.toString()
      cscore.innerHTML = s.computer_score.toString()

// --------*`'~*'` Restart Game Implementation `'*~'`*---------------

      if (s.gameOver) {
        const v = document.createElementNS(svg.namespaceURI, "text")!;
        attr(v,{x:300/6,y:300/2,class:"gameover"});
        const winner = s.playerScored ? "won" : "lost";
        v.textContent = "You" + winner + "press R to restart!";
        svg.appendChild(v);
      }
  }
}

  if (typeof window != 'undefined')
    window.onload = ()=>{
      pong();
    }
            // : collidePlayerBoard || collideComputerBoard ? {...s, ball : {...s.ball, velocity: new Vector(s.ball.velocity.x*-1, s.ball.velocity.y)}}