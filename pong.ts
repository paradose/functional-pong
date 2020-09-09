import * as rxjs from 'rxjs';
import { fromEvent,interval } from 'rxjs'; 
import { map,filter,merge,scan } from 'rxjs/operators';

// inspired by tim's asteroid
// we use vector because it is immutable and returns new instances of vectors instead
// of changing its data in place.
class Vector {
  constructor(public readonly x: number = 0, public readonly y: number =0) {}
  add = (b: Vector) => new Vector(this.x + b.x, this.y + b.y);
  sub = (b: Vector) => new Vector(this.x - b.x, this.y - b.y)
  scale = (s: number) => new Vector(this.x*s, this.y*s)
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

  const playerBoard: Board = { id: "player", position: new Vector(72, 300), velocity: Vector.Zero, direction: 0}
  const computerBoard: Board = {id: "computer", position: new Vector(525,300) , velocity: Vector.Zero, direction: 0}
  const ballBody: Board = {id: "ball", position: new Vector(300,300), velocity: new Vector(2,2), direction:0 }
  const initialState: State = {player: playerBoard, computer: computerBoard, ball: ballBody, player_score:0, computer_score: 0, gameOver: false, max_score:3 }
  // -----------*`'~*'` Reducing States and Initial Sates `'*~'`*---------------
  
  const reduceState = (s: State, e:BoardMove) =>
    e instanceof BoardMove ? {...s,
      player: {...s.player, position: s.player.position.add(e.direction)}
    } : {...s, ball: {...s.ball, position: s.ball.position.add(s.ball.velocity)}} 
// {...s, ball: {...s, position: s.ball.position.add(s.ball.velocity)}}
    // if no move is detected we want to continue moving the ball ? -> check if it collided

  // --------------*`'~*'` Subscribing Observables  `'*~'`*--------------------
  
  // const handleCollisions = (s: State) => {
  //   const
  // }
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
        { for(const k in o) e.setAttribute(k,String(o[k])); console.log('moving')},
        createBallView = () => {
          const ball = document.createElementNS(svg.namespaceURI,"circle")!;
          attr(ball,{id:s.ball.id, cx: s.ball.position.x, cy:s.ball.position.y,r: 5});
          ball.classList.add('ball')
          svg.appendChild(ball)
          return ball;
        }
      attr(board, {transform: `translate(${s.player.position.x}, ${s.player.position.y})`})
      const g = document.getElementById(s.ball.id) || createBallView();
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

  

  // function playerBoard() : Board { 
  //   return {
  //     id: "player", 
  //     position: new Vector(72, 300), 
  //     velocity: Vector.Zero}
  //   }
    // Inside this function you will use the classes and functions 
  // from rx.js
  // to add visuals to the svg element in pong.html, animate them, and make them interactive.
  // Study and complete the tasks in observable exampels first to get ideas.
  // Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/ 
  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
