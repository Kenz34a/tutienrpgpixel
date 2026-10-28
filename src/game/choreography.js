// Shared pose timing for the character and its attached sword trail.
export const SWORD_SKILL_IDS=['windEdge','windStep','windWheel','windWall','windFinal'];
const actions={
  'cut-1':{duration:.42,frames:[[.08,4],[.23,5],[.34,10],[.42,0]],contact:.08},
  'cut-2':{duration:.42,frames:[[.07,4],[.24,6],[.35,10],[.42,0]],contact:.07},
  'cut-3':{duration:.48,frames:[[.08,8],[.31,9],[.4,10],[.48,0]],contact:.08},
  'wind-edge':{duration:.7,frames:[[.13,4],[.39,7],[.57,10],[.7,0]],contact:.13},
  'wind-step':{duration:.48,frames:[[.08,4],[.27,8],[.38,5],[.48,10]],contact:.08},
  'wind-wheel':{duration:1.05,frames:[[.13,4],[.3,6],[.5,9],[.68,6],[.85,9],[1.05,10]],contact:.13},
  'wind-wall':{duration:.8,frames:[[.15,4],[.58,11],[.8,10]],contact:.15},
  'wind-final':{duration:1.48,frames:[[.14,4],[.27,8],[.43,5],[.62,6],[.82,7],[1.12,9],[1.32,10],[1.48,0]],contact:.14},
  channel:{duration:.6,frames:[[.13,4],[.43,11],[.6,10]],contact:.13},
  dash:{duration:.3,frames:[[.22,8],[.3,10]],contact:0},
};
export function actionName(effect,combo=1){return effect==='attack'?`cut-${combo}`:actions[effect]?effect:'channel';}
export function actionDefinition(name){return actions[name]??actions.channel;}
export function poseAt(action,time){
  if(!action)return null;
  const def=actionDefinition(action.name),age=time-action.started;
  if(age<0||age>=def.duration)return null;
  return {frame:def.frames.find(([end])=>age<end)?.[1]??0,age,progress:age/def.duration,contact:def.contact,facing:action.facing,name:action.name};
}
export function beginAction(player,effect,time,combo=1){
  const name=actionName(effect,combo),def=actionDefinition(name);
  player.action={name,started:time,facing:player.facing};player.castPose=def.duration;
}
