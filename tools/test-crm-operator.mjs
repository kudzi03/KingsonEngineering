import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import {packArchive,verifyArchive,removeStage,hash,wrapRecoveryKey,unwrapRecoveryKey} from './crm-operator-archive.mjs';
import {scanVerdict,queryRows} from './crm-operator-scan.mjs';
assert.deepEqual(queryRows('[{"ok":1}]'),[{ok:1}]);
assert.deepEqual(queryRows('{"boundary":"fixture","rows":[{"ok":1}]}'),[{ok:1}]);
assert.throws(()=>queryRows('{"error":"fixture"}'));
assert.throws(()=>queryRows('unexpected non-JSON output'));
console.log('PASS CLI query output in interactive and unattended formats; unexpected formats fail closed');
assert.equal(scanVerdict({status:0,stdout:'fixture: OK'},'fixture'),'clean');
assert.equal(scanVerdict({status:1,stdout:'fixture: Test FOUND'},'fixture'),'blocked');
assert.equal(scanVerdict({status:1,stdout:'other: Test FOUND\nfixture: OK'},'fixture'),'clean');
assert.equal(scanVerdict({status:2,stdout:'fixture: OK'},'fixture'),'error');
assert.equal(scanVerdict({status:0,stdout:'otherfixture: OK'},'fixture'),'error');
assert.equal(scanVerdict({status:null,stdout:''},'fixture'),'error');
console.log('PASS scanner verdicts fail closed on engine failure, absent output and mismatched paths');
const {PGlite}=await import(pathToFileURL(process.env.KINGSON_PGLITE_PATH));
const root=await mkdtemp(join(tmpdir(),'kingson-operator-test-'));
try {
  const key=randomBytes(32),file=join(root,'fixture.txt'),empty=join(root,'empty.txt');
  const wrapped=wrapRecoveryKey(key,'Synthetic recovery passphrase only');
  assert.deepEqual(unwrapRecoveryKey(wrapped,'Synthetic recovery passphrase only'),key);
  assert.throws(()=>unwrapRecoveryKey(wrapped,'Wrong recovery password'));
  assert.throws(()=>unwrapRecoveryKey({...wrapped,tag:Buffer.alloc(16).toString('base64')},'Synthetic recovery passphrase only'));
  console.log('PASS recovery-key wrapping, independent unwrapping, wrong-passphrase and tamper rejection');
  await writeFile(file,'Synthetic drawing bytes');await writeFile(empty,'');
  const snapshot={created_at:new Date().toISOString(),tables:{'public.parent':[{id:1,label:'Synthetic only'}],'public.child':[{id:2,parent:1}]},enums:[],
    columns:[{table:'public.parent',columns:[{name:'id',type:'integer'},{name:'label',type:'text'}]},{table:'public.child',columns:[{name:'id',type:'integer'},{name:'parent',type:'integer'}]}],
    constraints:[{table:'public.child',name:'child_parent_fkey',type:'f',reference:'public.parent',definition:'FOREIGN KEY (parent) REFERENCES public.parent(id)'},{table:'public.parent',name:'parent_pkey',type:'p',definition:'PRIMARY KEY (id)'}]};
  const archive=join(root,'fixture.enc');
  await packArchive(archive,key,snapshot,[{id:hash('fixture'),local:file,bucket:'fixture',name:'drawing.txt'},{id:hash('empty'),local:empty,bucket:'fixture',name:'empty.txt'}]);
  const bytes=await readFile(archive);assert(!bytes.includes(Buffer.from('Synthetic')));
  const restored=await verifyArchive(archive,key,join(root,'restore'),PGlite);
  assert.equal(restored.tables,2);assert.equal(restored.rows,2);assert.equal(restored.files,2);assert.equal(restored.constraints,2);
  assert.equal(await readFile(join(root,'restore',hash('fixture')+'.bin'),'utf8'),'Synthetic drawing bytes');
  await assert.rejects(()=>verifyArchive(archive,randomBytes(32),join(root,'wrong-key'),PGlite));
  bytes[40]^=1;const tampered=join(root,'tampered.enc');await writeFile(tampered,bytes);
  await assert.rejects(()=>verifyArchive(tampered,key,join(root,'tampered'),PGlite));
  const broken=structuredClone(snapshot);broken.tables['public.child'][0].parent=99;
  const invalid=join(root,'bad-reference.enc');await packArchive(invalid,key,broken,[]);
  await assert.rejects(()=>verifyArchive(invalid,key,join(root,'bad-reference'),PGlite));
  await assert.rejects(()=>removeStage(root,root));
  console.log('PASS encrypted operator archive, typed relational restore, foreign keys, document hashes, empty files, wrong key, ciphertext tamper and cleanup boundary');
} finally {await removeStage(tmpdir(),root);}
