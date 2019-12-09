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