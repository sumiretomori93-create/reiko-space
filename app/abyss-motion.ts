"use client";
import {useEffect,useState} from 'react';
const storageKey='reiko-abyss-motion';
export function useSeaMotion(){
  const [choice,setChoice]=useState<'system'|'on'|'off'>('system');
  const [reduced,setReduced]=useState(false);
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();
    try{const saved=localStorage.getItem(storageKey);if(saved==='on'||saved==='off')setChoice(saved);}catch{}
    media.addEventListener('change',update);return()=>media.removeEventListener('change',update);
  },[]);
  const enabled=choice==='on'||(choice==='system'&&!reduced);
  const toggle=()=>{const next=enabled?'off':'on';setChoice(next);try{localStorage.setItem(storageKey,next);}catch{}};
  return {enabled,toggle};
}
