import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {loadData} from '../src/lib/data.mjs'
import {PALETTE_TOKENS} from '../src/lib/palette.mjs'
const css=await readFile(new URL('../assets/css/main.css',import.meta.url),'utf8')
function declaration(selector,property){
 const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
 const rule=css.match(new RegExp('(?:^|\\n)'+escaped+'\\s*\\{([^}]+)\\}'))?.[1]||''
 return rule.match(new RegExp('(?:^|;)\\s*'+property+':\\s*([^;]+)'))?.[1]?.trim()
}
function luminance(hex){
 const rgb=[0,2,4].map(i=>parseInt(hex.slice(1+i,3+i),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4)
 return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722
}
function contrast(a,b){const hi=Math.max(luminance(a),luminance(b)),lo=Math.min(luminance(a),luminance(b));return(hi+.05)/(lo+.05)}
for(const operator of ['disney','coasterguide','universal'])test(`${operator}: actual shared live-panel colors retain AA text contrast`,async()=>{
 const {site}=await loadData(operator)
 const colors=Object.fromEntries(Object.entries(PALETTE_TOKENS).map(([key,token])=>[token,site.brand.palette[key]]))
 function resolve(value,inherited){
  if(value==null)return inherited
  if(/^#[0-9a-f]{6}$/i.test(value))return value
  const variable=value.match(/^var\((--[\w-]+)(?:,\s*(#[0-9a-f]{6}))?\)$/i)
  assert.ok(variable,`unrecognized color declaration ${value}`)
  const color=colors[variable[1]]||variable[2]
  assert.ok(color,`unresolved color ${value}`)
  return color
 }
 const bg=resolve(declaration('.live-wait-grid','background'),colors['--paper'])
 const fg=resolve(declaration('.live-wait-grid','color'),colors['--ink'])
 const pairs=[['panel header, ride name and unavailable message',fg,bg]]
 for(const selector of ['.live-wait-meta','.live-wait-footer','.wait-time.wait-low','.wait-time.wait-medium','.wait-time.wait-high','.wait-time.wait-unknown'])pairs.push([selector,resolve(declaration(selector,'color'),fg),bg])
 pairs.push(['weather metadata',resolve(declaration('.live-wait-meta','color'),fg),colors['--paper']])
 for(const[label,text,background]of pairs)assert.ok(contrast(text,background)>=4.5,`${label}: ${text} on ${background} measures ${contrast(text,background).toFixed(2)}; needs 4.5`)
})
