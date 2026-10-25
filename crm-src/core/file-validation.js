/* Shared by the browser and the upload Edge Function. This checks format, not malware. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export async function validateFile(file) {
  const name = file.name.normalize('NFKC');
  if (!file.size || file.size > MAX_FILE_BYTES) throw new Error('Choose a non-empty file no larger than 25 MB.');
  if (/[\x00-\x1f\x7f/\\]/.test(name) || name.length > 180) throw new Error('Use a shorter filename without path or control characters.');
  const ext = name.split('.').pop().toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const starts = (...head) => head.every((v, i) => bytes[i] === v);
  const head = new TextDecoder().decode(bytes.subarray(0, 1024));
  const types = { pdf:'application/pdf', jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png',
    webp:'image/webp', heic:'image/heic', dwg:'application/acad', dxf:'application/dxf',
    xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls:'application/vnd.ms-excel', doc:'application/msword', zip:'application/zip',
    txt:'text/plain', csv:'text/csv' };
  let valid = false;
  if (ext === 'pdf') valid = head.startsWith('%PDF-');
  if (ext === 'jpg' || ext === 'jpeg') valid = starts(255,216,255);
  if (ext === 'png') valid = starts(137,80,78,71,13,10,26,10);
  if (ext === 'webp') valid = head.startsWith('RIFF') && head.slice(8,12)==='WEBP';
  if (ext === 'heic') valid = head.slice(4,8)==='ftyp' && /heic|heix|mif1/.test(head.slice(8,32));
  if (ext === 'dwg') valid = /^AC10\d\d/.test(head);
  if (ext === 'doc' || ext === 'xls') valid = starts(208,207,17,224,161,177,26,225);
  if (['txt','csv','dxf'].includes(ext)) {
    try {
      const text = new TextDecoder('utf-8', { fatal:true }).decode(bytes);
      valid = !text.includes('\0') && (ext !== 'dxf' || /SECTION[\r\n]/.test(text));
    } catch { valid = false; }
    if (ext === 'dxf' && head.startsWith('AutoCAD Binary DXF')) valid = true;
  }
  if (['zip','docx','xlsx'].includes(ext) && starts(80,75,3,4)) {
    const view = new DataView(bytes.buffer);
    const names = [];
    let expanded = 0;
    // Read the ZIP central directory, not arbitrary filenames embedded in content.
    for (let i=0; i+46<=bytes.length; i++) {
      if (view.getUint32(i,true)!==0x02014b50) continue;
      const length=view.getUint16(i+28,true), extra=view.getUint16(i+30,true), comment=view.getUint16(i+32,true);
      if (i+46+length+extra+comment>bytes.length) throw new Error('The archive is damaged.');
      if (view.getUint16(i+8,true)&1) throw new Error('Password-protected archives cannot be checked. Send individual documents.');
      const entry=new TextDecoder().decode(bytes.subarray(i+46,i+46+length));
      if (/(^|[\\/])\.\.([\\/]|$)|^[\\/]|^[a-z]:|\x00/i.test(entry)
        || /\.(exe|com|scr|msi|bat|cmd|ps1|vbs|js|jse|html?|svg|lnk|dll|hta|jar|zip|7z|rar)$/i.test(entry)
        || /vbaProject\.bin$/i.test(entry)) throw new Error('Executable content, macros and nested archives are not accepted.');
      names.push(entry); expanded += view.getUint32(i+24,true);
      if (names.length>500 || expanded>100*1024*1024) throw new Error('The archive expands beyond the safe limit.');
      i+=45+length+extra+comment;
    }
    valid = names.length>0 && (ext==='zip' || names.includes('[Content_Types].xml') && names.some(n=>n.startsWith(ext==='docx'?'word/':'xl/')));
  }
  if (!types[ext] || !valid) throw new Error('The file contents do not match a supported drawing, document or image format.');
  return { name, mime:types[ext], bytes };
}
