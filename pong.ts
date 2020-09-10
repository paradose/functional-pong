
import { fromEvent,interval } from 'rxjs'; 
import { map,filter,merge,scan, flatMap, takeUntil } from 'rxjs/operators';

// inspired by tim's asteroid
// we use vector because it is immutable and returns new instances of vectors instead
// of changing its data in place.
class Vector {
  constructor(public readonly x: number = 0, public readonly y: number =0) {}
  add = (b: Vector) => new Vector(this.x + b.x, this.y + b.y);
  len = ()=> Math.sqrt(this.x*this.x + this.y*this.y)
  sub = (b: Vector) => new Vector(this.x - b.x, this.y - b.y)
  scale = (s: Vector) => new Vector(this.x*s.x, this.y*s.y)
  static Zero = new Vector()
}

function pong() {
  
  type Key = 'ArrowUp' | 'ArrowDown'
  type Event = 'keydown' | 'keyup'
  
  // --------*`'~*'` Actions for Streams `'*~'`*---------------

  class BoardMove { constructor(public readonly direction:Vector) {} }
  class BallMove {constructor (public readonly direction:Vector) {} }
  // --------*`'~*'` Keyboard Observable Stream `'*~'`*---------------

  const keyObservables = <T>(e: Event, k: Key, result: ()=> T) => 
    fromEvent<KeyboardEvent>(document, e)
      .pipe(
        filter(({code}) => code === k),
        map(result)),
    
    startMoveUp = keyObservables('keydown', 'ArrowUp', () => new BoardMove(new Vector(0,-8))),
    startMoveDown = keyObservables('keydown', 'ArrowDown', () => new BoardMove(new Vector(0,8)))
    // need to add restart observable
  
  // -------*`'~*'` type desclarations `'*~'`*-----------------
  
  type State = Readonly<{
    player: Board,
    computer : Board,
    ball : Board, 
    player_score: number,
    computer_score:number,
    max_score: number,
    gameOver: boolean
  }>
  
  type Board = Readonly<{
    id: string,
    position: Vector,
    velocity: Vector,
    // direction is the angle
    direction: number
  }>
  
  // --------------*`'~*'` Visual Initial States`'*~'`*--------------

  const playerBoard: Board = { id: "player", position: new Vector(75, 300), velocity: Vector.Zero, direction: 0}
  const computerBoard: Board = {id: "computer", position: new Vector(525,300) , velocity: Vector.Zero, direction: 0}
  const ballBody: Board = {id: "ball", position: new Vector(300,300), velocity: new Vector(-1,1), direction:0 }
  const initialState: State = {player: playerBoard, computer: computerBoard, ball: ballBody, player_score:0, computer_score: 0, gameOver: false, max_score:3 }
  // -----------*`'~*'` Reducing States and Initial Sates `'*~'`*---------------
  
  const reduceState = (s: State, e:BoardMove) =>
    e instanceof BoardMove ? {...s,
      player: {...s.player, position: s.player.position.add(e.direction)}
    } : handleCollisions({...s, ball: moveBall(s.ball)}); // check if ball has collided with anything

  // --------------*`'~*'` Subscribing Observables  `'*~'`*--------------------

  const 
    // moveComputer = (o:Board ) => <Board>{
    //   ...o,
    //   position: 
    // },
    // where the magic happens for moving the ball
    moveBall = (o:Board) => <Board>{
      ...o,
      position: o.position.add(o.velocity)
    },
    // changing angles/ game state when the ball hits something 
    handleCollisions = (s: State) => {
    // board collision
      const
        hitSideWalls = s.ball.position.x <= 0  || s.ball.position.x >= 600,
        hitTopWalls = s.ball.position.y <= 0 || s.ball.position.y >= 600,
        collidePlayerBoard = (s.ball.position.x <= s.player.position.x + 5) && (s.ball.position.y < s.player.position.y + 80) && (s.ball.position.y > s.player.position.y), 
        collideComputerBoard = (s.ball.position.x >= s.computer.position.x + 5) && (s.ball.position.y > s.computer.position.y + 80) && (s.ball.position.y < s.computer.position.y)
      return hitSideWalls ? {...s, ball : ballBody}
            : hitTopWalls ? {...s, ball : {...s.ball, velocity: new Vector(s.ball.velocity.x, s.ball.velocity.y*-1)}} 
            : collidePlayerBoard||collideComputerBoard ? {...s, ball : {...s.ball, velocity: new Vector(s.ball.velocity.x*-1, s.ball.velocity.y)}} 
            : s
    }
  // --------------*`'~*'` Subscribing Observables  `'*~'`*--------------------
  
  const playPong = interval(10).pipe(
    merge(startMoveUp, startMoveDown),
    scan(reduceState, initialState)
    ).subscribe(updateView);


  // ------------*`'~*'` Updating Game View Subscription `'*~'`*-----------------
  function updateView(s: State) {
    const
        svg = document.getElementById("canvas")!,
        board = document.getElementById("player")!,
        attr = (e:Element,o:any) =>
        { for(const k in o) e.setAttribute(k,String(o[k])); console.log('moving')}
      attr(board, {transform: `translate(${s.player.position.x}, ${s.player.position.y})`})
      const g = document.getElementById(s.ball.id)
      attr(g, {cx: s.ball.position.x, cy:s.ball.position.y})

  }
  
  // --------*`'~*'` Restart Game Implementation `'*~'`*---------------

  // ~ this is the end of the pong() scope ~      
}
  // the following simply runs your pong function on window load.  Make sure to leave it in place.
  if (typeof window != 'undefined')
    window.onload = ()=>{
      pong();
    }
