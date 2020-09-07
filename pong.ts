import * as rxjs from 'rxjs';
import { fromEvent,interval } from 'rxjs'; 
import { map,filter,merge,scan } from 'rxjs/operators';

function pong() {
    // Inside this function you will use the classes and functions 
    // from rx.js
    // to add visuals to the svg element in pong.html, animate them, and make them interactive.
    // Study and complete the tasks in observable exampels first to get ideas.
    // Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/ 
    // You will be marked on your functional programming style
    // as well as the functionality that you implement.
    // Document your code!  
    // game state
    type State = {
      player_score: 0,
      computer_score:0
    }
    
    type Board = Readonly<{
      id: string,
      x: number,
      y: number,
      velx: number,
      vely: number
    }>
    const playerBoard: Board = {id: "player", x: 72, y: 300, velx: 0, vely: 0}
    const computerBoard: Board = {id: "player", x: 525, y: 300, velx: 0, vely:0}
    const initialState: State = {player_score:0, computer_score: 0}
    
    class Move { constructor(public readonly direction:number) {} }



  }
  
  // the following simply runs your pong function on window load.  Make sure to leave it in place.
  if (typeof window != 'undefined')
    window.onload = ()=>{
      pong();
    }
  
  

