// Unified edge-triggered actions. Standard Gamepad mapping follows the requested controls.
export class Input {
  constructor(){this.held=new Set();this.pressed=new Set();this.padHeld=new Set();this.device='keyboard';this.padName='';this.lastSource='keyboard';this.drag={x:0,y:0};this.bindings=new Map();
    window.addEventListener('keydown',e=>{const a=KEYS[e.code];if(a){e.preventDefault();this.down(a,'keyboard')}});
    window.addEventListener('keyup',e=>{const a=KEYS[e.code];if(a)this.up(a)});
    window.addEventListener('gamepadconnected',e=>{this.padName=e.gamepad.id;this.device='gamepad'});
    window.addEventListener('gamepaddisconnected',()=>{this.padName='';this.device='touch'});
    document.querySelectorAll('[data-action]').forEach(b=>{const a=b.dataset.action;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);this.down(a,'touch')});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>this.up(a))});
  }
  down(a,source){if(!this.held.has(a))this.pressed.add(a);this.held.add(a);if(source)this.lastSource=source}
  up(a){this.held.delete(a)}
  update(){const pads=navigator.getGamepads?.()||[],p=[...pads].find(Boolean);if(p){this.padName=p.id;this.device='gamepad';const b=p.buttons,axes=p.axes,now=new Set();if(axes[1]<-.25)now.add('forward');if(axes[1]>.25)now.add('back');if(axes[0]<-.25)now.add('left');if(axes[0]>.25)now.add('right');if(b[0]?.pressed)now.add('jump');if(b[1]?.pressed)now.add('dodge');if(b[2]?.pressed)now.add('interact');if(b[6]?.pressed)now.add('aim');if(b[7]?.pressed)now.add('attack');if(b[10]?.pressed)now.add('sprint');if(b[11]?.pressed)now.add('crouch');if(b[9]?.pressed)now.add('confirm');for(const a of now)if(!this.padHeld.has(a))this.down(a,'gamepad');for(const a of this.padHeld)if(!now.has(a))this.up(a);this.padHeld=now}else if(this.device==='gamepad'){this.device='touch'} }
  isDown(a){return this.held.has(a)} consume(a){const yes=this.pressed.has(a);this.pressed.delete(a);return yes}endFrame(){this.pressed.clear()}
}
const KEYS={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',KeyJ:'attack',Enter:'confirm',KeyE:'aim',ShiftLeft:'sprint',ShiftRight:'sprint',ControlLeft:'crouch',ControlRight:'crouch',KeyK:'dodge',KeyX:'interact'};
