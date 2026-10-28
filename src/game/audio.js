export class Soundscape {
  constructor() { this.enabled=false;this.ctx=null;this.nextNote=0;this.note=0;this.noiseBuffer=null;this.lastImpact=0; }
  async setEnabled(enabled) {
    this.enabled=enabled;
    if(enabled){
      try { this.ctx ??= new (window.AudioContext || window.webkitAudioContext)(); await this.ctx.resume(); this.nextNote=0; }
      catch { this.enabled=false; }
    }
    return this.enabled;
  }
  tone(frequency,duration=.5,volume=.025,type='sine',delay=0){
    if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
    const ctx=this.ctx,osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime+delay;
    osc.type=type;osc.frequency.setValueAtTime(frequency,now);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+duration+.05);
  }
  sweep(from,to,duration,volume=.02,type='sine',delay=0){
    if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
    const ctx=this.ctx,osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime+delay;
    osc.type=type;osc.frequency.setValueAtTime(from,now);osc.frequency.exponentialRampToValueAtTime(Math.max(20,to),now+duration);
    gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(volume,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+duration+.02);
  }
  air(duration=.25,frequency=1200,volume=.025,delay=0){
    if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
    const ctx=this.ctx;
    if(!this.noiseBuffer){this.noiseBuffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const data=this.noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.6;}
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),now=ctx.currentTime+delay;
    source.buffer=this.noiseBuffer;filter.type='bandpass';filter.frequency.setValueAtTime(frequency,now);filter.frequency.exponentialRampToValueAtTime(Math.max(90,frequency*.3),now+duration);filter.Q.value=.65;
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);source.start(now);source.stop(now+duration+.02);
  }
  effect(event){
    if(!this.enabled||!this.ctx)return;
    if(event.type==='cast'){
      const id=event.effect??event.id;
      if(id==='attack'||id==='dash'){this.air(id==='dash'?.3:.13,3200,.045,id==='attack'?.08:0);this.sweep(900+(event.combo??1)*80,320,.13,.012,'triangle',id==='attack'?.08:0);}
      else if(id.startsWith('wind-')){for(const delay of id==='wind-final'?[.18,.42,.7,1.02]:[id==='wind-edge'?.13:.08]){this.air(.18,2800,.045,delay);this.sweep(1300,480,.22,.012,'sine',delay);}}
      else if(id==='swords'||id==='blades'){
        for(let i=0;i<5;i++){this.air(.15,2400,.022,i*.055);this.sweep(1200+i*70,650,.25,.012,'sine',i*.055);}
      }else if(id==='flame'||id==='dragon'){
        this.air(.85,id==='flame'?900:1450,.05);this.sweep(id==='flame'?160:280,70,.65,.025,'triangle');this.tone(id==='flame'?392:587,.7,.009,'sine',.15);
      }else if(id==='storm'||id==='meteor'){
        this.air(.18,3400,.065,.06);this.air(.8,230,.045,.1);this.sweep(180,42,.75,.035,'triangle',.08);
      }else if(id==='ice'){
        for(let i=0;i<5;i++)this.tone(880+i*165,.5,.013,'sine',i*.06);this.air(.35,4200,.018);
      }else if(id==='vortex'){
        this.sweep(320,65,.9,.024,'triangle');this.sweep(150,420,.8,.012,'sine');this.air(.7,700,.02);
      }else{
        for(let i=0;i<4;i++)this.tone([523,659,784,1046][i],.7,.015,'sine',i*.095);
        this.air(.3,1800,.012);
      }
    }else if(event.type==='damage'&&!event.healing&&this.ctx.currentTime-this.lastImpact>.055){
      this.lastImpact=this.ctx.currentTime;this.sweep(event.critical?260:180,55,.09,.018,'triangle');this.air(.06,1800,.022);
    }else if(event.type==='kill'){this.tone(659,.3,.014);this.tone(880,.4,.012,'sine',.09);}
  }
  update(time){
    if(!this.enabled||time<this.nextNote)return;
    this.nextNote=time+2.4;
    const notes=[261.63,329.63,392,440,392,329.63,293.66,196];
    this.tone(notes[this.note++%notes.length],2.2,.012);
    this.tone(notes[(this.note+2)%notes.length]/2,3,.008,'sine',.2);
  }
}
