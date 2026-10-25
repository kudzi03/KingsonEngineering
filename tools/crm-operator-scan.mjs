// Missing output, engine failures and path mismatches must never release a file.
export function queryRows(output) {
  const value=JSON.parse(output.trim()),rows=Array.isArray(value)?value:value.rows;
  if(!Array.isArray(rows))throw new Error('Unexpected CLI response');
  return rows;
}
export function scanVerdict(result,path) {
  if(!result || ![0,1].includes(result.status))return 'error';
  const lines=String(result.stdout||'').split(/\r?\n/);
  if(lines.some(line=>line.startsWith(path+': ')&&line.endsWith(' FOUND')))return 'blocked';
  return lines.includes(path+': OK')?'clean':'error';
}
