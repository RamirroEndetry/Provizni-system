import {useState} from 'react';
import {Moon,Sun} from 'lucide-react';
export default function ThemeToggle(){
 const [dark,setDark]=useState(()=>document.documentElement.dataset.theme==='dark');
 function toggle(){
  const next=!dark;
  setDark(next);
  document.documentElement.dataset.theme=next?'dark':'light';
  try{localStorage.setItem('digiday-theme:'+new URL('.',location.href).pathname,next?'dark':'light');}catch{/* Preference storage may be unavailable. */}
 }
 return <button className="theme-toggle" type="button" onClick={toggle} aria-pressed={dark} aria-label="Tmavý režim" title={dark?'Přepnout na světlý režim':'Přepnout na tmavý režim'}>{dark?<Sun size={17}/>:<Moon size={17}/>}<span>{dark?'Světlý režim':'Tmavý režim'}</span></button>;
}
