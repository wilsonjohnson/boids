// Import stylesheets
import './style.css';
import { createRenderer } from './render';

const TAU = Math.PI * 2;
const ORIGIN: Vector = {x:0,y:0};

// Write TypeScript code!
const appDiv: HTMLElement = document.getElementById('app');
appDiv.innerHTML = `
<canvas id="canvas"></canvas>
<button id="debug_circle">Show Radius</button>
`;

const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
const show_radius_button: HTMLButtonElement = document.getElementById('debug_circle') as HTMLButtonElement;
canvas.width = 500;
canvas.height = 500;

const renderer = createRenderer( canvas, render );

const background_color = '#3F3F3F';

function fill_background( context: CanvasRenderingContext2D, width: number, height: number ) {
  context.fillStyle = background_color;
  context.fillRect(0,0, width, height);
}

let delta_array = [];
let rate_array = [];

interface Boid extends Vector {
  velocity: Vector;
  angle: number;
  radius_squared: number;
  radius: number;
  id: number;
  turn_speed: number;
  separation: Vector;
  alignment: Vector;
  group: Vector;
  nearby: Boid[];
  gap: number;
  debug?: {
    radius?: boolean,
    separation?: boolean,
    alignment?: boolean,
    group?: boolean,
  }
}

interface Vector {
  x: number,
  y: number
}

function mag( vector: Vector ): number {
  return Math.abs(Math.sqrt( vector.x * vector.x + vector.y * vector.y ));
}

function normalize( vector: Vector ): Vector {
  const magnitude = mag( vector ) || 1;
  return vector_divide({ ...vector }, mag( vector ) );
}

function random_vector(): Vector {
  const angle = Math.random() * TAU;
  const magnitude = Math.random() + 1;
  return {
    x: magnitude * Math.sin( angle ),
    y: magnitude * Math.cos( angle )
  };
}

function lerp( start: number, end: number, amt: number ){
  return ( 1 - amt ) * start + amt * end;
}

function vector_lerp( start: Vector, end: Vector, amount: number ) {
  return {
    x: lerp( start.x, end.x, amount ),
    y: lerp( start.y, end.y, amount )
  };
}

function make_boid(
  x: number = Math.floor(Math.random() * 500) + 1,
  y: number = Math.floor(Math.random() * 500) + 1
): Boid {
  return {
    x,
    y,
    velocity: normalize(random_vector()),
    angle: Math.random() * Math.PI * 2,
    radius_squared: 1000,
    radius: 50,
    id: 0,
    turn_speed: 0.002,
    alignment: ORIGIN,
    separation: ORIGIN,
    group: ORIGIN,
    nearby: [],
    gap: 500,
    debug: {
      radius: false
    }
  }
}

const boid_array = [...generate_boids(100)];
const no_move_boids = [];

show_radius_button.onclick = () => {
  boid_array.forEach( boid => boid.debug.radius = !boid.debug.radius );
};

boid_array.forEach( ( boid, i ) => boid.id = i );

function* generate_boids( amount: number ) {
  for ( let i = 0; i < amount; i++ ) {
    const cur = make_boid();
    cur.id = i;
    cur.radius_squared = cur.radius ** 2;
    yield cur;
  }
}

function distance_squared( {x:x1,y:y1}: Vector, {x:x2,y:y2}: Vector ) {
  const x = (x2 - x1);
  const y = (y2 - y1);
  return x * x + y * y;
}

function toroidal_distance_squared(
  {x:x1,y:y1}: Vector,
  {x:x2,y:y2}: Vector,
  width: number,
  height: number
): number {
  let dx = Math.abs(x2 - x1);
  let dy = Math.abs(y2 - y1);

  if ( dx > width / 2 ) dx = width - dx;
  if ( dy > height / 2 ) dy = height - dy;

  return dx * dx + dy * dy;
}

function toroidal_offset(
  {x:x1,y:y1}: Vector,
  {x:x2,y:y2}: Vector,
  width: number,
  height: number
): Vector {
  let dx = x2 - x1;
  let dy = y2 - y1;
  let adx = Math.abs(dx);
  let ady = Math.abs(dy);

  if ( adx > width / 2 ) dx = -Math.sign(dx) * (width - adx);
  if ( ady > height / 2 ) dy = -Math.sign(dy) * (height - ady);

  return {x:dx,y:dy};
}

function draw_detection_distance(
  context: CanvasRenderingContext2D,
  boid: Boid,
  width: number,
  height: number
) {
  context.strokeStyle = 'grey';
  context.beginPath();
  context.ellipse( 0, 0, boid.radius, boid.radius, 0, 0, TAU );
  context.stroke();
  const right = boid.x + boid.radius;
  const left = boid.x - boid.radius;
  const top = boid.y - boid.radius;
  const bottom = boid.y + boid.radius;
  if ( right > width ) {
    context.beginPath();
    context.ellipse( -width, 0, boid.radius, boid.radius, 0, 0, TAU );
    context.stroke();
  }

  if ( left < 0 ) {
    context.beginPath();
    context.ellipse( width, 0, boid.radius, boid.radius, 0, 0, TAU );
    context.stroke();
  }

  if ( top < 0 ) {
    context.beginPath();
    context.ellipse( 0, height, boid.radius, boid.radius, 0, 0, TAU );
    context.stroke();
  }

  if ( bottom > height ) {
    context.beginPath();
    context.ellipse( 0, -height, boid.radius, boid.radius, 0, 0, TAU );
    context.stroke();
  }
}

function draw_boid(
  context: CanvasRenderingContext2D,
  boid: Boid,
  width: number,
  height: number
) {
  context.save();
  context.translate( boid.x, boid.y );
  context.save();
  // context.rotate( -boid.angle );
  const {x,y} = boid.velocity;
  const magnitude = mag( boid.velocity );
  context.transform( y / magnitude, -x / magnitude, x / magnitude, y / magnitude, 0, 0 );
  context.fillStyle = 'white';
  context.beginPath();
  context.lineTo(0, 5);
  context.lineTo(2.5, -5);
  context.lineTo(-2.5, -5);
  context.fill();
  context.restore();
  if ( !boid.debug ) {
    context.restore();
    return;
  }
  if ( boid.debug.separation ) {
    context.strokeStyle = 'red';
    context.beginPath();
    context.moveTo(0,0);
    context.lineTo( boid.separation.x , boid.separation.y ); 
    context.stroke();
  }

  if ( boid.debug.alignment) {
    context.strokeStyle = 'yellow';
    context.beginPath();
    context.moveTo(0,0);
    context.lineTo( boid.alignment.x , boid.alignment.y ); 
    context.stroke();
  }

  if ( boid.debug.group ) {
    context.strokeStyle = 'orange';
    context.beginPath();
    context.moveTo(0,0);
    context.lineTo( boid.group.x, boid.group.y  ); 
    context.stroke();
  }
  
  if ( boid.debug.radius ) {
    draw_detection_distance( context, boid, width, height );
  }

  context.restore();
  
  for( let other of boid.nearby ) {
    draw_line_between( context, boid, other, width, height, 'green');
  }
}

function draw_line_between(
  context: CanvasRenderingContext2D,
  {x:x1,y:y1}: Vector,
  {x:x2,y:y2}: Vector,
  width: number,
  height: number,
  color: string
) {
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(x1,y1);
  const to = vector_sum(toroidal_offset({x:x1,y:y1},{x:x2,y:y2}, width, height ), {x:x1,y:y1});
  context.lineTo(to.x,to.y);
  context.stroke();
}

function update_boid_position( boid: Boid, width: number, height: number ) {
  // if ( mag( boid.velocity ) < 1 ) boid.velocity = normalize( boid.velocity );
  if ( mag( boid.velocity ) > 2 ) boid.velocity = vector_multiply( normalize( boid.velocity ), 2 );
  boid.x += boid.velocity.x;
  boid.y += boid.velocity.y;
  if ( boid.x < 0 ) boid.x = width;
  else if ( boid.x > width ) boid.x = 0;
  if ( boid.y < 0 ) boid.y = height;
  else if ( boid.y > height ) boid.y = 0;
}

function turn_boid_toward( boid: Boid, angle: number, magnitude: number = boid.turn_speed ) {
  if ( boid.angle === angle ) return;
  angle = angle % TAU;

  magnitude = (( magnitude / boid.radius ) * Math.PI / 2 ) % Math.PI;

  boid.angle = lerp( boid.angle, angle, magnitude );

  if ( boid.angle > TAU ) {
    boid.angle = boid.angle - TAU;
  }
}

function vector_between( {x:x1,y:y1}: Vector, {x:x2,y:y2}: Vector ): Vector {
  
  return {
    x: x2 - x1,
    y: y2 - y1
  }
}

function vector_sum( {x:x1,y:y1}: Vector, {x:x2,y:y2}: Vector ): Vector {
  return {
    x: x1 + x2,
    y: y1 + y2
  }
}

function vector_sub( {x:x1,y:y1}: Vector, {x:x2,y:y2}: Vector ): Vector {
  return {
    x: x1 - x2,
    y: y1 - y2
  }
}

function vector_divide( {x,y}: Vector, scalar: number ): Vector {
  return {
    x: x/scalar,
    y: y/scalar
  }
}

function vector_multiply( {x,y}: Vector, scalar: number ): Vector {
  return {
    x: x*scalar,
    y: y*scalar
  }
}

function vector_angle( {x, y}: Vector ): number {
  return ( Math.atan( y / x ) + TAU ) % TAU;
}

function update_separation(
  boid: Boid,
  others: Boid[],
  width: number,
  height: number
): void {
  boid.separation = ORIGIN;
  if ( others.length === 0 ) return;
  let vector: Vector = ORIGIN;
  for( let other of others ) {
    const between = toroidal_offset( other, boid, width, height );
    if ( mag( between ) < boid.gap )
      vector = vector_sum( vector, between );
  }
  boid.separation = vector;
}

function update_group(
  boid: Boid,
  others: Boid[],
  width: number,
  height: number
): void {
  boid.group = ORIGIN;
  if ( others.length === 0 ) return;
  const center = vector_divide(
    others.reduce((acc, other)=> vector_sum( acc, toroidal_offset( boid, other, width, height) ), ORIGIN),
    others.length
  );

  boid.group = center;
}

function update_alignment( boid: Boid, others: Boid[] ): void {
  if ( others.length === 0 ) return;
  boid.alignment = 
  vector_divide(
  vector_divide(
    others.reduce( (acc, cur) => {
      if ( cur === boid ) return acc;
      return vector_sum( acc, cur.velocity );
    }, ORIGIN),
    others.length
  ),
  1/5
  );  
}

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

  context.save();
  for( let boid of boid_array ) {
    boid.nearby = boid_array.filter( other => {
     return toroidal_distance_squared( boid, other, width, height ) < boid.radius_squared
      && other !== boid
    });

    update_separation( boid, boid.nearby, width, height );
    update_alignment( boid, boid.nearby );
    update_group( boid, boid.nearby, width, height );

    const vs = vector_sum;
    const target = vs( boid.velocity, vs( vs( boid.alignment, boid.separation ), boid.group ));
    boid.velocity = vector_lerp( boid.velocity, target, boid.turn_speed );
    // boid.velocity = target;
    update_boid_position( boid, width, height );
  }
  boid_array.forEach( boid => draw_boid( context, boid, width, height ));
  no_move_boids.forEach( boid => draw_boid( context, boid, width, height ));
  
  context.fillStyle = 'white';
  context.strokeStyle = 'white';
  
  context.restore();
}



function add_boid_at({x,y}:{x:number, y: number}) {
  const boid = make_boid(x, y);
  // boid.nearby = no_move_boids;
  boid.debug.radius = false;
  boid_array.push( boid );
}

function add_still_boid_at({x,y}:{x:number, y: number}) {
  const boid = make_boid(x, y);
  boid.nearby = no_move_boids;
  boid.debug.radius = false;
  no_move_boids.push( boid );
}

window.toroidal_offset = toroidal_offset;
window.vector_sub = vector_sub;

canvas.addEventListener('click', add_boid_at);

// add_still_boid_at( {x:25 ,y: 275});
// add_still_boid_at( {x:475 ,y: 225});
// add_still_boid_at( {x:275 ,y: 25});
// add_still_boid_at( {x:225 ,y: 475});

renderer.start();
