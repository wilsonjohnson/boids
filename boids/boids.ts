import { vec2 } from '@tlaukkan/tsm';
import { Sprite } from '../pre-render';
import { Torus } from '../torus';

export class Boid {
  public velocity: vec2;
  public acceleration: vec2;
  public turn_speed: number = 0.01;
  public personal_bubble: number;
  public grouping_factor: number = 100;
  private max_speed_squared: number;
  private _max_force: number;
  private _max_force_squared: number;
  private _view_radius: number;
  private _view_radius_squared: number;
  private static IMAGE: Sprite;

  constructor(
    public position: vec2 = vec2.zero.copy(),
    private constraints: vec2,
    private max_speed: number = 2
  ) {
    this.velocity = new vec2([0,0]);
    this.acceleration = new vec2([0,0]);
    this.max_speed_squared = this.max_speed ** 2;
    this.max_force = 0.03;
    this.view_radius = 35;
    this.personal_bubble = 25;
    if ( ! Boid.IMAGE ) Boid.init();
  }

  private static init() {
    Boid.IMAGE = new Sprite(10,10,context => {
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
  }


  public get view_radius(): number {
    return this._view_radius;
  }

  public set view_radius( value: number ) {
    this._view_radius = value;
    this._view_radius_squared = value ** 2;
  }
  
  public get view_radius_squared(): number {
    return this._view_radius_squared;
  }

  public set view_radius_squared( value: number ) {
    this._view_radius = Math.sqrt(value);
    this._view_radius_squared = value;
  }

  public get max_force(): number {
    return this._max_force;
  }

  public set max_force( value: number ) {
    this._max_force = value;
    this._max_force_squared = value ** 2;
  }

  public get max_force_squared(): number {
    return this._max_force_squared;
  }

  public set max_force_squared( value: number ) {
    this._max_force_squared = value;
    this._max_force = Math.sqrt( value );
  }

  public add_velocity( value: vec2 ) {
    this.acceleration.add( value );
  }

  private update_grouping( others: Boid[] ) {
    if ( others.length === 0 ) return;
    const vector: vec2 = vec2.zero.copy();
    for ( let other of others ) {
      vector.add( Torus.offset( this.constraints, this.position, other.position ) );
    }
    vector.scale( 1 / others.length );
    // vector.subtract( this.position );
    vector.scale( 1 / 100 );
    this.add_velocity( vector );
  }

  private limit_force( force: vec2 ): vec2 {
    if ( force.squaredLength() < this.max_force_squared ) return force;
    return force.copy().normalize().scale( this.max_force );
  }

  private update_alignment( others: Boid[] ) {
    if ( others.length === 0 ) return;
    const target = vec2.zero.copy();
    for( let other of others ) {
      target.add( other.velocity );
    }
    target.scale( 1 / ( others.length ) );
    target.subtract(this.velocity);
    target.scale( 1/8 );

    this.add_velocity( target );
  }

  private update_separation( others: Boid[] ) {
    if ( others.length === 0 ) return;
    const target = vec2.zero.copy();
    for( let other of others ) {
      if ( other === this ) continue;
      const between: vec2 = Torus.offset( this.constraints, this.position, other.position );
      const length = between.length();
      if ( length > 0 && length < this.personal_bubble ) {
        target.subtract( between.scale( 1 / length ) );
      }
    }
    target.scale( 1 / others.length );
    this.add_velocity( target );
  }

  public update_velocity() {  
    if ( this.acceleration.squaredLength() === 0 ) return;
    // const velocity = vec2.mix( this.velocity, this.acceleration, this.turn_speed );
    // this.acceleration.xy = this.velocity.xy;
    // this.acceleration.xy = vec2.zero.xy;
    this.velocity.add( this.acceleration );
    // this.velocity = velocity;

    if ( this.velocity.squaredLength() > this.max_speed_squared ) {
      this.velocity.normalize().scale(this.max_speed);
    }
  }

  public update_position() {
    this.position.add( this.velocity );
    if ( this.constraints ) {
      const change = vec2.zero.copy();
      const [width, height] = this.constraints.xy;
      if ( this.position.x >= width  ) change.x = -width;
      else if ( this.position.x < 0 ) change.x = width;
      if ( this.position.y >= height  ) change.y = -height;
      else if ( this.position.y < 0 ) change.y = height;
      this.position.add( change );
    }
  }

  public update( others: Boid[], torus: Torus ) {
    const nearby = others.filter( other =>
      other !== this
      && Torus.distance_squared(this.constraints, this.position, other.position) < this.view_radius_squared
    );
    this.update_separation( nearby );
    this.update_alignment( nearby );
    this.update_grouping( nearby );
  }

  public tick() {
    this.update_velocity();
    this.update_position();
  }

  public draw( context: CanvasRenderingContext2D ) {
    context.save();
    context.translate( this.position.x, this.position.y );
    const {x,y} = this.velocity;
    const magnitude = this.velocity.length();
    context.transform( y / magnitude, -x / magnitude, x / magnitude, y / magnitude, 0, 0 );
    Boid.IMAGE.draw(context);
    context.restore();
  }
}


