// Import stylesheets
import './style.css';
import { createRenderer } from './render';
import { pre_render } from './pre-render';
import { Boid } from './boids';
import { vec2 } from '@tlaukkan/tsm';
import { Torus } from './torus';

const TAU = Math.PI * 2;

// Write TypeScript code!
const appDiv: HTMLElement = document.getElementById('app');
appDiv.innerHTML = `
<canvas id="canvas"></canvas>
<button id="debug_circle">Show Radius</button>
<button id="pause">Pause</button>
`;

const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
const pre_render_boid: HTMLCanvasElement = pre_render( 10, 10, context => {
  context.save();
  context.translate(5,5);
  context.fillStyle = 'white';
  context.beginPath();
  context.lineTo(0, 5);
  context.lineTo(2.5, -5);
  context.lineTo(-2.5, -5);
  context.fill();
  context.restore();
});

const show_radius_button: HTMLButtonElement = document.getElementById('debug_circle') as HTMLButtonElement;
const pause_button: HTMLButtonElement = document.getElementById('pause') as HTMLButtonElement;
canvas.width = 500;
canvas.height = 500;

function random_vec2(max: vec2) {
  return max.copy().multiply( new vec2([Math.random(), Math.random()])).add(vec2.one);
}

function random_angle(): vec2 {
  const angle = Math.random() * TAU;
  const magnitude = Math.random() + 1;
  return new vec2([Math.sin( angle ), Math.cos( angle )]).scale(magnitude);
}

const torus: Torus = new Torus( new vec2([canvas.width, canvas.height]) );

function* generate_new_boids( amount: number, torus: Torus ) {
  for ( let i = 0; i < amount; i++ ) {
    const cur: Boid = new Boid( random_vec2( torus.dimensions ), torus.dimensions );
    cur.velocity.xy = random_angle().xy;
    cur.add_velocity( random_angle() );
    yield cur;
  }
}

const new_boids = [...generate_new_boids(100, torus)];

const renderer = createRenderer( canvas, render );

pause_button.onclick = () => {
  renderer.is_playing() ? renderer.stop(): renderer.start();
  pause_button.innerText = renderer.is_playing() ? 'Pause' : 'Play';
};

const background_color = '#3F3F3F';

function fill_background( context: CanvasRenderingContext2D, width: number, height: number ) {
  context.fillStyle = background_color;
  context.fillRect(0,0, width, height);
}

let delta_array = [];
let rate_array = [];

show_radius_button.onclick = () => {
  
};

function render(
  context: CanvasRenderingContext2D,
  delta: number,
  width: number,
  height: number,
  timestamp: number
) {
  fill_background( context, width, height );
  context.fillStyle = 'white';
  context.font = '20px Georgia';
  const framerate = 1000 / delta;
  delta_array.push( delta );
  if ( delta_array.length > 60 ) delta_array.shift();
  const avg_delta = delta_array.reduce((x,y)=>x+y,0)/delta_array.length;
  rate_array.push( framerate );
  if ( rate_array.length > 100 ) rate_array.shift();
  const avg_rate = rate_array.reduce((x,y)=>x+y,0)/rate_array.length;

  context.fillText( Math.floor( avg_rate ), 5, 20 );
  context.fillText( new_boids.length, 5, 40 );

  for ( let boid of new_boids ) {
    boid.update( new_boids, torus );
    boid.tick();
  }
  for ( let boid of new_boids ) {
    boid.draw(context);
  }
}



function add_boid_at({x,y}:{x:number, y: number}) {
  const boid = new Boid(new vec2([x,y]), torus.dimensions);
  // boid.nearby = no_move_boids;
  boid.velocity = random_angle();
  new_boids.push( boid );
}

canvas.addEventListener('click', add_boid_at);

// add_still_boid_at( {x:25 ,y: 275});
// add_still_boid_at( {x:475 ,y: 225});
// add_still_boid_at( {x:275 ,y: 25});
// add_still_boid_at( {x:225 ,y: 475});

renderer.start();
