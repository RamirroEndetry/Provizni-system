import { recordSchema, type RecordItem } from './records';
const DB_NAME='digiday-evidence-local-v1:'+ (typeof location==='undefined'?'test':new URL('.',location.href).pathname);
type StoredFile={id:string,name:string,blob:Blob};
export type Backup={format:'digiday-backup',version:1,createdAt:string,records:RecordItem[],files:{id:string,name:string,mime:string,data:string}[]};
function openDB():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{r.result.createObjectStore('records',{keyPath:'id'});r.result.createObjectStore('files',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Zavři ostatní karty aplikace a zkus to znovu.'));});}
function request<T>(r:IDBRequest<T>):Promise<T>{return new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function transact<T>(stores:string[],mode:IDBTransactionMode,run:(tx:IDBTransaction)=>Promise<T>):Promise<T>{
 const db=await openDB();const tx=db.transaction(stores,mode);
 const done=new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Zápis do prohlížeče selhal.'));tx.onabort=()=>reject(tx.error||Error('Operace byla zrušena.'));});
 // Attach the rejection handler immediately, even while requests are pending.
 done.catch(()=>{});
 try{const result=await run(tx);await done;return result;}catch(e){try{tx.abort();}catch{}await done.catch(()=>{});throw e;}finally{db.close();}
}
export async function listRecords(){return transact(['records'],'readonly',tx=>request<RecordItem[]>(tx.objectStore('records').getAll()));}
export async function saveRecord(input:RecordItem){const r=recordSchema.parse(input);return transact(['records'],'readwrite',async tx=>{
 const s=tx.objectStore('records');const old=await request<RecordItem|undefined>(s.get(r.id));
 if((old?.revision??0)!==r.revision)throw Error('Záznam byl změněn v jiné kartě. Obnov stránku a zkus to znovu.');
 const next={...r,revision:r.revision+1};await request(s.put(next));return next;
});}
export async function deleteRecord(r:RecordItem){return transact(['records'],'readwrite',async tx=>{const s=tx.objectStore('records');const old=await request<RecordItem|undefined>(s.get(r.id));if(!old||old.revision!==r.revision)throw Error('Záznam byl mezitím změněn. Obnov stránku.');await request(s.delete(r.id));});}
export async function importRecords(input:RecordItem[]){const rows=recordSchema.array().max(10000).parse(input);return transact(['records'],'readwrite',async tx=>{const s=tx.objectStore('records');let inserted=0;for(const r of rows){if(!await request(s.get(r.id))){await request(s.add({...r,revision:1,attachment:'',attachmentName:''}));inserted++;}}return inserted;});}
export async function saveAttachment(file:File){if(file.size>10*1024*1024||!file.name.toLowerCase().endsWith('.pdf'))throw Error('Vyber PDF do 10 MB.');
 if(await file.slice(0,5).text()!=='%PDF-')throw Error('Soubor není platné PDF.');
 const id=crypto.randomUUID();await transact(['files'],'readwrite',tx=>request(tx.objectStore('files').add({id,name:file.name,blob:new Blob([file],{type:'application/pdf'})})));return {key:id,name:file.name};
}
export function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
export async function downloadAttachment(id:string){const f=await transact(['files'],'readonly',tx=>request<StoredFile|undefined>(tx.objectStore('files').get(id)));if(!f)throw Error('Příloha není v tomto prohlížeči dostupná. Připoj PDF znovu.');downloadBlob(f.blob,f.name);}
const base64=(blob:Blob):Promise<string>=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
export async function createBackup():Promise<Backup>{
 const snapshot=await transact(['records','files'],'readonly',async tx=>{const records=request<RecordItem[]>(tx.objectStore('records').getAll());const files=request<StoredFile[]>(tx.objectStore('files').getAll());return {records:await records,files:await files};});
 const ids=new Set(snapshot.records.map(r=>r.attachment).filter(Boolean));const files=snapshot.files.filter(f=>ids.has(f.id));
 if(files.length!==ids.size)throw Error('Některá příloha chybí. Před zálohou ji připoj znovu nebo odeber odkaz v zakázce.');
 return {format:'digiday-backup',version:1,createdAt:new Date().toISOString(),records:snapshot.records,files:await Promise.all(files.map(async f=>({id:f.id,name:f.name,mime:'application/pdf',data:await base64(f.blob)})))};
}
export async function parseBackup(file:File):Promise<{backup:Backup,files:StoredFile[]}>{
 if(file.size>200*1024*1024)throw Error('Záloha je větší než podporovaných 200 MB.');
 const b=JSON.parse(await file.text());if(b?.format!=='digiday-backup'||b.version!==1||!Array.isArray(b.files)||b.files.length>10000)throw Error('Nepodporovaný formát zálohy.');
 const records=recordSchema.array().max(10000).parse(b.records);
 if(new Set(records.map(r=>r.id)).size!==records.length)throw Error('Záloha obsahuje duplicitní záznamy.');
 const files:StoredFile[]=b.files.map((f:Backup['files'][number])=>{if(typeof f.id!=='string'||!f.id||typeof f.name!=='string'||f.name.length>250||f.mime!=='application/pdf'||typeof f.data!=='string'||f.data.length>14*1024*1024)throw Error('Neplatná příloha v záloze.');const decoded=atob(f.data);if(!decoded.startsWith('%PDF-')||decoded.length>10*1024*1024)throw Error('Neplatné PDF v záloze.');return {id:f.id,name:f.name,blob:new Blob([Uint8Array.from(decoded,c=>c.charCodeAt(0))],{type:'application/pdf'})};});
 const ids=new Set(files.map(f=>f.id));if(ids.size!==files.length||records.some(r=>r.attachment&&!ids.has(r.attachment)))throw Error('Záloha obsahuje chybějící nebo duplicitní přílohy.');
 return {backup:{...b,records},files};
}
export async function restoreBackup(parsed:Awaited<ReturnType<typeof parseBackup>>){return transact(['records','files'],'readwrite',async tx=>{
 const rows=tx.objectStore('records'),files=tx.objectStore('files');await request(rows.clear());await request(files.clear());
 for(const r of parsed.backup.records)await request(rows.put(r));for(const f of parsed.files)await request(files.put(f));
});}
