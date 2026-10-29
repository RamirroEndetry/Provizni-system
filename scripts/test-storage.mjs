import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
import 'fake-indexeddb/auto';
await fs.mkdir('work',{recursive:true});
for(const name of ['records','storage']){let src=await fs.readFile('lib/'+name+'.ts','utf8');src=src.replaceAll("'./records'","'./records.mjs'");await fs.writeFile('work/'+name+'.mjs',ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);}
globalThis.FileReader=class {async readAsDataURL(blob){try{this.result='data:application/pdf;base64,'+Buffer.from(await blob.arrayBuffer()).toString('base64');this.onload();}catch(e){this.error=e;this.onerror();}}};
const s=await import('../work/storage.mjs');const {blank}=await import('../work/records.mjs');
assert.deepEqual(await s.listRecords(),[]);
const sample={...blank(),company:'Testovací firma',amount:8600};
const record=await s.saveRecord(sample);assert.equal(record.revision,1);
await assert.rejects(s.saveRecord(sample),/jiné kartě/);
assert.equal(await s.importRecords([sample]),0);
const file=await s.saveAttachment(new File(['%PDF-1.4\nTestovací příloha\n%%EOF'],'test.pdf',{type:'application/pdf'}));
const attached=await s.saveRecord({...record,attachment:file.key,attachmentName:file.name});
const backup=await s.createBackup();assert.equal(backup.records.length,1);assert.equal(backup.files.length,1);
const parsed=await s.parseBackup(new File([JSON.stringify(backup)],'backup.json'));
await s.deleteRecord(attached);assert.equal((await s.listRecords()).length,0);
await s.restoreBackup(parsed);assert.equal((await s.listRecords())[0].attachment,file.key);
assert.deepEqual((await s.createBackup()).files,backup.files);
await assert.rejects(s.parseBackup(new File([JSON.stringify({...backup,files:[]})],'bad.json')),/chybějící/);
assert.equal((await s.listRecords()).length,1);
await assert.rejects(s.saveAttachment(new File(['not a PDF'],'fake.pdf')),/platné PDF/);
await assert.rejects(s.saveRecord({...record,amount:NaN}));
await assert.rejects(s.restoreBackup({...parsed,files:[{id:Symbol('bad'),blob:new Blob([])}]}));
assert.equal((await s.listRecords()).length,1,'failed restore must roll back clear');
assert.equal((await s.createBackup()).files[0].data,backup.files[0].data);
console.log('PASS: persistence, revision conflict, duplicate import, PDF validation, full backup and restore, invalid backup safety, atomic rollback.');

