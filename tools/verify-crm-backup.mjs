// Offline verification only. Never connects to or restores a production database.
import {readFile} from 'node:fs/promises';
import {verifyBackup} from '../crm-src/core/backup.js';
const [path]=process.argv.slice(2);
const passphrase=process.env.KINGSON_BACKUP_PASSPHRASE;
delete process.env.KINGSON_BACKUP_PASSPHRASE;
if(!path || !passphrase) throw new Error('Use verify-crm-backup.ps1 to choose the encrypted export and enter its passphrase privately.');
try {
  const payload=await verifyBackup(JSON.parse(await readFile(path,'utf8')),passphrase);
  console.log(JSON.stringify({verified:true,created_at:payload.created_at,
    records:Object.fromEntries(Object.entries(payload.tables).map(([table,rows])=>[table,rows.length])),
    files:payload.files.length,scope:payload.scope},null,2));
} catch {console.error('Verification failed: wrong passphrase, unsupported export or damaged data. No data was restored.');process.exitCode=1;}
