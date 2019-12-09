export function createRenderer(
  canvas: HTMLCanvasElement,
  renderer: Renderer
) {
  let start = null;
  let cancel = false;
  let last = 0;
  let delta = null;
  const context: CanvasRenderingContext2D = canvas.getContext('2d');
  const step = (timestamp: number) => {
    if( !start ) start = timestamp;
    delta = timestamp - last;
    last = timestamp;
    renderer( context, delta, canvas.width, canvas.height, timestamp );
    if ( cancel ) return;
    window.requestAnimationFrame(step);
  };
  return {
    start: () => {
      cancel = false;
      window.requestAnimationFrame(step);
    },
    stop: () => cancel = true,
    is_playing: () => !cancel
  };
}

type RenderFunction = (
   context: CanvasRenderingContext2D,
   delta: number,
   width: number,
   height: number,
) => void;

type TimestampedRenderFunction = (
   context: CanvasRenderingContext2D,
   delta: number,
   width: number,
   height: number,
   timestamp: number
) => void;
export type Renderer = RenderFunction | TimestampedRenderFunction;
