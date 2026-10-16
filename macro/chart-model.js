/* Calendar-aligned comparisons; no interpolation or growth-of-growth. */
(function(root){
'use strict';
const finite=v=>typeof v==='number'&&Number.isFinite(v);
function prior(period,steps,frequency){
 if(frequency==='M'&&/^\d{4}-\d{2}$/.test(period)){const n=Number(period.slice(0,4))*12+Number(period.slice(5))-1-steps;return Math.floor(n/12)+'-'+String(n%12+1).padStart(2,'0');}
 if(frequency==='Q'&&/^\d{4}Q[1-4]$/.test(period)){const n=Number(period.slice(0,4))*4+Number(period.at(-1))-1-steps;return Math.floor(n/4)+'Q'+(n%4+1);}
 return null;
}
function options(s,series){
 const m=s.meta,all=[{id:'none',label:'不叠加',unit:'',note:''}],basis=m.basis||'',name=m.name||'';
 if(!['M','Q'].includes(m.frequency))return all;
 // Official paired rates retain each series' own methodology and source.
 if(/同比|环比/.test(name)){
  const peerName=name.replace(/同比|环比/,v=>v==='同比'?'环比':'同比');
  const peer=series.find(p=>p.meta.name===peerName&&p.meta.frequency===m.frequency&&p.meta.country===m.country&&p.meta.unit===m.unit&&p.points.length);
  if(peer)all.push({id:'peer:'+peer.meta.id,label:peer.meta.name,unit:peer.meta.unit,peer,default:true,note:'右轴使用已有的 '+peer.meta.name+' 序列，按同一统计期对齐；'+peer.meta.basis+'。'});
 }
 if(m.unit==='%'||m.unit==='百分点'||basis.includes('扩散指数')){
  const unit=basis.includes('扩散指数')?'点':'百分点';
  all.push({id:'delta',label:'较上期变化（'+unit+'）',unit,steps:1,operation:'difference',note:'当前值减去相邻'+(m.frequency==='Q'?'季度':'月份')+'值，单位为'+unit+'，不是新的同比或环比增速。'+(basis.includes('累计')?'累计窗口逐期扩大，差值不代表单月变化。':'')});
  return all;
 }
 // Changes in employment and signed trade balances are not positive levels.
 if(/之差/.test(basis)||/新增.*就业|贸易差额/.test(name)||m.transform==='diff')return all;
 const cumulative=basis.includes('累计'),sa=basis.includes('季调')&&!basis.includes('未季调');
 all.push({id:'yoy',label:cumulative?'累计同比（计算）':'同比（计算）',unit:'%',steps:m.frequency==='Q'?4:12,operation:'growth',default:true,note:'以去年相同'+(m.frequency==='Q'?'季度':'月份')+'为基期计算 (本期 ÷ 基期 − 1) × 100%。'+(cumulative?'比较相同累计窗口；现价金额增速不等于实际增长。':'采用原序列口径，名义金额增速包含价格变化。')+'缺少可比基期或基期不大于零时不计算；未对统计口径变化另行调整。'});
 if(!cumulative)all.push({id:'mom',label:(m.frequency==='Q'?'季环比':'月环比')+'（'+(sa?'季调':'未季调')+'）',unit:'%',steps:1,operation:'growth',note:'以紧邻上一'+(m.frequency==='Q'?'季度':'月份')+'为基期计算百分比变化，不折年。'+(sa?'沿用原序列季调口径；季调年率的环比为年率数值之间的变化。':'原序列未注明季调，季节性可能较强，不宜直接解释为趋势。')+'缺少相邻期或基期不大于零时不计算。'});
 return all;
}
function values(s,option){
 if(option.id==='none')return new Map();
 if(option.peer)return new Map(option.peer.points.filter(p=>finite(p.value)).map(p=>[p.period,{value:p.value,source:p,base:null}]));
 const by=new Map(s.points.map(p=>[p.period,p])),out=new Map();
 for(const p of s.points){const base=by.get(prior(p.period,option.steps,s.meta.frequency));if(!finite(p.value)||!base||!finite(base.value))continue;
  if(option.operation==='growth'&&base.value<=0)continue;
  const value=option.operation==='growth'?(p.value/base.value-1)*100:p.value-base.value;
  if(finite(value))out.set(p.period,{value,source:p,base});
 }
 return out;
}
function nearest(points,target,position){let index=0,distance=Infinity;points.forEach((p,i)=>{const d=Math.abs(position(p)-target);if(d<distance){distance=d;index=i;}});return index;}
const api={prior,options,values,nearest};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MacroChart=api;
})(typeof window!=='undefined'?window:globalThis);

