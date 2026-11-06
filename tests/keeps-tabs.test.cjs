const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
function mount(file){
 const slots=[],effects=[],pending=[];let cursor=0;
 const hooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value}];},useRef(initial){const i=cursor++;return slots[i]||(slots[i]={current:initial});},useEffect(fn,deps){const i=cursor++,old=effects[i];if(!old||deps.some((d,j)=>!Object.is(d,old[j])))pending.push(fn);effects[i]=deps;}};
 const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('exports','require','module',code)(m.exports,n=>n==='react'?hooks:require(n),m);
 return {render(){cursor=0;return m.exports.default({preview:true,published:true});},async effects(){while(pending.length)pending.shift()();await new Promise(setImmediate);}};
}
function text(node){if(node==null||typeof node==='boolean')return '';if(typeof node!=='object')return String(node);if(Array.isArray(node))return node.map(text).join('');return text(node.props?.children);}
function button(node,label){if(!node||typeof node!=='object')return null;if(Array.isArray(node)){for(const child of node){const found=button(child,label);if(found)return found;}return null;}if(node.type==='button'&&text(node).includes(label))return node;return button(node.props?.children,label);}
for(const file of ['app/keeps/keeps-client.tsx','app/keeps/classic-client.tsx'])test(`${file}: switching loaded notes to anniversaries and back never renders the wrong record type`,async()=>{
 const original=global.fetch;global.fetch=async url=>Response.json(String(url).includes('action=notes')?{items:[{id:'n',title:'Test note',text:'Body',signature:'Reiko',created_at:'2026-10-27T00:00:00Z'}]}:String(url).includes('action=anniversaries')?{items:[{id:'a',name:'Test anniversary',date:'2026-07-23',days_since:96,days_until_next:269,next_occurrence:'2027-07-23'}]}:{connected:true});
 try{const app=mount(file);let tree=app.render();await app.effects();tree=app.render();await app.effects();tree=app.render();assert.match(text(tree),/Test note/);
 button(tree,'纪念日').props.onClick();tree=app.render();assert.doesNotMatch(text(tree),/Test note/);await app.effects();tree=app.render();assert.match(text(tree),/Test anniversary/);
 button(tree,'留言').props.onClick();tree=app.render();assert.doesNotMatch(text(tree),/Test anniversary/);await app.effects();tree=app.render();assert.match(text(tree),/Test note/);
 }finally{global.fetch=original;}
});
