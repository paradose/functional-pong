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
  static Zero = new Vector()
}

function pong() {
  
  type Key = 'ArrowUp' | 'ArrowDown'
  type Event = 'keydown' | 'keyup'
  
  // --------*`'~*'` Actions for Streams `'*~'`*---------------

  class BoardMove { constructor(public readonly direction:number) {} }

  // --------*`'~*'` Keyboard Observable Stream `'*~'`*---------------

  const keyObservables = <T>(e: Event, k: Key, result: ()=> T) => 
    fromEvent<KeyboardEvent>(document, e)
      .pipe(
        filter(({code}) => code === k),
        filter( ({repeat}) => !repeat),
        map(result)),
    
    startMoveUp = keyObservables('keydown', 'ArrowUp', () => new BoardMove(1)),
    stopMoveUp = keyObservables('keyup', 'ArrowUp', () => new BoardMove(0)),
    startMoveDown = keyObservables('keydown', 'ArrowDown', () => new BoardMove(-1)),
    stopMoveDown = keyObservables('keydown', 'ArrowDown', () => new BoardMove(0))
    // need to add restart observable
  
  // -------*`'~*'` type desclarations `'*~'`*-----------------
  
  type State = {
    player: Board,
    computer : Board, 
    player_score: 0,
    computer_score:0,
    gameOver: boolean
  }
  
  type Board = Readonly<{
    id: string,
    position: Vector,
    velocity: Vector
  }>
  
  // ---------*`'~*'` Visual Initial States`'*~'`*--------------

  const playerBoard: Board = { id: "player", position: new Vector(72, 300), velocity: Vector.Zero}
  const computerBoard: Board = {id: "computer", position: new Vector(525,300) , velocity: Vector.Zero}
  const initialState: State = {player: playerBoard, computer: computerBoard, player_score:0, computer_score: 0, gameOver: false}

  // --------*`'~*'` Updating Game View Subscription `'*~'`*---------------


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
  // Document your code!  