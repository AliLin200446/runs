// Replace these strokes to change the mark. Coordinates are tabletop world units.
// An asymmetric double-chevron monogram: two rising cuts and one crossing bar.
export const MARK_STROKES = [
 { from: [-1.65, -1.65], to: [-.15, 1.65], count: 6 },
 { from: [-.15, 1.65], to: [1.35, -1.65], count: 6 },
 { from: [-.91, -.08], to: [1.25, -.08], count: 4 },
 { from: [1.25, -.08], to: [1.79, 1.12], count: 2 },
];
export function markTargets() {
 return MARK_STROKES.flatMap(({from,to,count})=>Array.from({length:count},(_,i)=>{
  const u=(i+.5)/count, dx=to[0]-from[0],dy=to[1]-from[1];
  return {x:from[0]+dx*u,y:from[1]+dy*u,a:Math.atan2(dy,dx),scale:Math.hypot(dx,dy)/count/.69};
 }));
}
