// Display clock only: never changes simulated data, fitted models or validation.
export class CulturePlayback {
 constructor(totalDays=14,durationMs=45000){this.totalDays=totalDays;this.durationMs=durationMs;this.day=0;this.rate=1;this.playing=false;}
 reset(totalDays=this.totalDays){this.totalDays=totalDays;this.day=0;this.playing=false;}
 start(){if(this.day>=this.totalDays)this.day=0;this.playing=true;}
 pause(){this.playing=false;}
 setRate(rate){if(![.25,.5,1,2,4].includes(rate))throw Error('Unknown playback rate');this.rate=rate;}
 seek(day){this.day=Math.min(this.totalDays,Math.max(0,day));this.pause();}
 advance(ms){if(!Number.isFinite(ms)||ms<0)throw Error('Invalid elapsed time');if(this.playing){this.day=Math.min(this.totalDays,this.day+ms/this.durationMs*this.totalDays*this.rate);if(this.day>=this.totalDays)this.pause();}return this.day;}
}
