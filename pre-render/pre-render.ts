export class Sprite {
  private image: HTMLCanvasElement

  constructor(
    width: number,
    height: number,
    private render_function: ( context: CanvasRenderingContext2D ) => void,
  ) {
    this.image = pre_render( width, height, this.render_function );
  }

  public get width(): number{
    return this.image.width;
  }
  public get height(): number {
    return this.image.height;
  }

  public draw( context: CanvasRenderingContext2D ): void {
    context.drawImage(this.image, -this.width/2, -this.height/2 );
  }
}

export function pre_render(
  width: number,
  height: number,
  render_function: ( context: CanvasRenderingContext2D ) => void
): HTMLCanvasElement {
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context: CanvasRenderingContext2D = canvas.getContext('2d');
  render_function( context );

  return canvas;
}