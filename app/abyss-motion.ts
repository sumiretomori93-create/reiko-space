"use client";
import {useEffect,useState} from 'react';
const storageKey='reiko-abyss-motion';
// This theme opens with motion enabled. A deliberate off choice stays off.
export function seaMotionEnabled(){try{return localStorage.getItem(storageKey)!=='off';}catch{return true;}}
export function useSeaMotion(){
  const [enabled,setEnabled]=useState(true);
  useEffect(()=>{setEnabled(seaMotionEnabled());},[]);
  const toggle=()=>{const next=!enabled;setEnabled(next);try{localStorage.setItem(storageKey,next?'on':'off');}catch{}};
  return {enabled,toggle};
}
