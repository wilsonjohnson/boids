import {Boid} from './boids';
import { vec2, mat2 } from '@tlaukkan/tsm';
import { Sprite } from '../pre-render';
import { Torus } from '../torus';

const HALF_PI = Math.PI / 2;
const ROTATE_LEFT_45 = new mat2([
  Math.cos(HALF_PI),  Math.sin(HALF_PI),
  -Math.sin(HALF_PI), Math.cos(HALF_PI),
])
const ROTATE_RIGHT_45 = new mat2([
  Math.cos(-HALF_PI),  Math.sin(-HALF_PI),
  -Math.sin(-HALF_PI), Math.cos(-HALF_PI),
])

export class Player extends Boid {
  constructor(
    position: vec2 = vec2.zero.copy(),
    constraints: vec2,
    max_speed: number = 2,
    image?: Sprite 
  ) {
    super( position, constraints, max_speed, image, 'player' );
  }

  public turn_left() {
    this.add_velocity(ROTATE_LEFT_45.multiplyVec2( this.velocity, null ).normalize());
  }

  public turn_right() {
    this.add_velocity(ROTATE_RIGHT_45.multiplyVec2( this.velocity, null ).normalize());
  }

  public speed_up() {
    if ( this.velocity.squaredLength() === 0 ) this.velocity.add( new vec2([0,0.01]));
    this.add_velocity( this.velocity.copy().normalize().scale(0.05) );
  }

  public update( others: Boid[], torus: Torus ) {
  }
}