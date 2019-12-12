import { vec2 } from '@tlaukkan/tsm';

type Vec2Array = [number, number];

export class Torus {
  constructor(
    public readonly dimensions: vec2
  ) {
  }

  public offset( from: vec2, to: vec2 ): vec2 {
    return Torus.offset( this.dimensions, from, to );
  }
  
  public static offset( dimensions: vec2, from: vec2, to: vec2 ): vec2 {
    let delta = to.copy().subtract( from );
    let abs = new vec2();
    abs.x = Math.abs(delta.x);
    abs.y = Math.abs(delta.y);

    if ( abs.x > dimensions.x / 2 ) delta.x = -Math.sign(delta.x) * (dimensions.x - abs.x);
    if ( abs.y > dimensions.y / 2 ) delta.y = -Math.sign(delta.y) * (dimensions.y - abs.y);

    return delta;
  }

  public distance_squared( from: vec2, to: vec2 ): number {
    return Torus.distance_squared( this.dimensions, from, to );
  }

  public distance( from: vec2, to: vec2 ): number {
    return Torus.distance( this.dimensions, from, to );
  }

  public static distance_squared( dimensions: vec2, from: vec2, to: vec2 ): number {
    let delta = new vec2( to.copy().subtract(from).xy.map(Math.abs) as Vec2Array );

    if ( delta.x > dimensions.x / 2 ) delta.x = dimensions.x - delta.x;
    if ( delta.y > dimensions.y / 2 ) delta.y = dimensions.y - delta.y;

    return delta.squaredLength();
  }

  public static distance( dimensions: vec2, from: vec2, to: vec2 ): number {
    return Math.sqrt(Torus.distance_squared( dimensions, from, to ));
  }
}