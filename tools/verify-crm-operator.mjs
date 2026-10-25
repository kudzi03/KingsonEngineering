// Offline recovery verification: needs the encrypted archive, encrypted recovery key and passphrase.
// Does not need the original Windows DPAPI identity or any Supabase credentials.
import {readFile,mkdtemp} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {unwrapRecoveryKey,verifyArchive,removeStage} from './crm-operator-archive.mjs';
const [archive,recovery]=process.argv.slice(2),password=process.env.KINGSON_RECOVERY_PASSPHRASE;
delete process.env.KINGSON_RECOVERY_PASSPHRASE;
if(!archive||!recovery||!password)throw new Error('Archive, encrypted recovery key and private passphrase are required');
const modulePath=process.env.KINGSON_PGLITE_PATH||join(process.env.USERPROFILE,'.kingson-crm-operator','runtime','node_modules','@electric-sql','pglite','dist','index.js');
const {PGlite}=await import(pathToFileURL(modulePath));
const stage=await mkdtemp(join(tmpdir(),'kingson-offline-restore-'));let key;
try {
  key=unwrapRecoveryKey(JSON.parse(await readFile(recovery,'utf8')),password);
  console.log(JSON.stringify({verified:true,...await verifyArchive(archive,key,stage,PGlite)}));
} catch {
  console.error('Recovery verification failed. Check the passphrase, recovery key and archive. No production data was changed.');process.exitCode=1;
} finally {key?.fill(0);await removeStage(tmpdir(),stage);}
