try {
 const theme=localStorage.getItem('digiday-theme:'+new URL('.',location.href).pathname);
 document.documentElement.dataset.theme=theme==='dark'?'dark':'light';
} catch { document.documentElement.dataset.theme='light'; }
