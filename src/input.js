// One action map for keyboard, standard gamepad, and touch. Add bindings here safely.
export class Input {
  constructor() { this.held = new Set(); this.pressed = new Set(); this.previousPad = new Set();
    window.addEventListener('keydown', e => { const a=KEYS[e.code]; if(a){e.preventDefault();this.down(a);} });
    window.addEventListener('keyup', e => { const a=KEYS[e.code]; if(a)this.up(a); });
    document.querySelectorAll('[data-action]').forEach(button => {
      const a=button.dataset.action;
      button.addEventListener('pointerdown', e=>{e.preventDefault();button.setPointerCapture(e.pointerId);this.down(a);});
      for(const ev of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(ev,()=>this.up(a));
    });
  }
  down(a){if(!this.held.has(a))this.pressed.add(a);this.held.add(a)} up(a){this.held.delete(a)}
  update(){const pad=navigator.getGamepads?.()[0], now=new Set();if(pad){
    const axes=pad.axes; if(axes[1]<-.25)now.add('forward');if(axes[1]>.25)now.add('back');if(axes[0]<-.25)now.add('left');if(axes[0]>.25)now.add('right');
    if(pad.buttons[0]?.pressed)now.add('jump');if(pad.buttons[1]?.pressed)now.add('dodge');if(pad.buttons[2]?.pressed)now.add('attack');if(pad.buttons[3]?.pressed)now.add('lock');if(pad.buttons[4]?.pressed||pad.buttons[5]?.pressed)now.add('sprint');if(pad.buttons[9]?.pressed)now.add('getup');if(pad.buttons[11]?.pressed)now.add('crouch');
    for(const a of now)if(!this.previousPad.has(a))this.down(a);for(const a of this.previousPad)if(!now.has(a))this.up(a);}
    this.previousPad=now;
  }
  isDown(a){return this.held.has(a)} consume(a){const yes=this.pressed.has(a);this.pressed.delete(a);return yes} endFrame(){this.pressed.clear()}
}
const KEYS={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',KeyJ:'attack',Enter:'getup',KeyE:'lock',ShiftLeft:'sprint',ShiftRight:'sprint',ControlLeft:'crouch',ControlRight:'crouch',KeyK:'dodge'};
