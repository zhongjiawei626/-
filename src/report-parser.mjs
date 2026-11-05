import { aliases } from './metrics.mjs';

// This module uses plain data and JavaScript so a Mini Program OCR adapter
// can reuse the extraction and validation without browser APIs.
const norm = s => s.toUpperCase().replace(/[\s:：*＊]/g, '');
const units = /(?:[×x*]?\s*10\s*[⁹9¹²^]+\s*\/L|mL\/min(?:\/1\.73m[²2])?|mg\/(?:mmol|24h|dL|L|g)|mmol\/L|[μµu]mol\/L|g\/(?:24h|dL|L)|mL|mmHg|U\/L|IU\/L|fL|pg|%)/i;
const number = /^\s*([<>≤≥]?)\s*(-?\d+(?:\.\d+)?)(?![\d.])/;

export function groupOcrItems(items) {
  const rows = [];
  for (const item of items) {
    if (!item.text || !item.poly?.length) continue;
    const xs = item.poly.map(p => p[0]), ys = item.poly.map(p => p[1]);
    const cell = { text:item.text, x:Math.min(...xs), y:(Math.min(...ys)+Math.max(...ys))/2, h:Math.max(...ys)-Math.min(...ys), score:item.score };
    let row = rows.find(r => Math.abs(r.y-cell.y) < Math.max(3, Math.min(r.h,cell.h)*.45));
    if (!row) {row={y:cell.y,h:cell.h,cells:[]}; rows.push(row);}
    row.cells.push(cell);
  }
  return rows.sort((a,b)=>a.y-b.y).map(r=>({text:r.cells.sort((a,b)=>a.x-b.x).map(c=>c.text).join('  '),cells:r.cells,score:Math.min(...r.cells.map(c=>c.score??0))}));
}

export function parseReportLines(lines, specimen = "") {
  const records = [];
  const headers=lines.map(x=>typeof x==='string'?x:x.text).filter(x=>/结果/.test(x)&&/参考/.test(x));
  const resultFirst=headers.some(x=>x.indexOf('结果')<x.indexOf('参考'));
  for (const input of lines) {
    const line = typeof input === 'string' ? input : input.text;
    let score = typeof input === 'string' ? 1 : input.score;
    if (!line || /(?:姓名|患者编号|报告编号|条形码|参考范围.*结果)/.test(line)) continue;
    // Keep spaces between columns: removing them merges results with reference values.
    const cleaned=line.replace(/[，,]/g,'.').replace(/[|｜]/g,' ').trim().replace(/^[A-Z][A-Z0-9%-]*(?:-[A-Z]+)?\s+/,'');
    const matches=aliases.map(([alias,metric])=>({alias,metric,index:norm(cleaned).indexOf(norm(alias))})).filter(x=>x.index>=0).sort((a,b)=>a.index-b.index||b.alias.length-a.alias.length);
    if (!matches.length) continue;
    const selected={...matches[0]};
    if(selected.alias==='肌酐')selected.metric=/尿/.test(specimen)?'尿肌酐':/血/.test(specimen)?'血清肌酐':'肌酐（标本未明）';
    // Find the exact label in the original line, allowing OCR spaces within it.
    const escaped=[...selected.alias].map(c=>c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s*');
    const match=cleaned.match(new RegExp(escaped,'i'));
    if (!match) continue;
    const prefix=cleaned.slice(0,match.index).replace(/[\s*＊\d.、]/g,'');
    if (prefix) continue; // avoid extracting values from narrative medical notes
    let tail=cleaned.slice(match.index+match[0].length).replace(/^\s*[:：]?\s*(?:[A-Za-z][A-Za-z0-9-]*\s+)?/,'');
    if (/^[（(]/.test(tail)) continue;
    const valueMatch=tail.match(number);
    if (!valueMatch) continue;
    if (valueMatch[1]) continue;
    const value=Number(valueMatch[2]);
    const rest=tail.slice(valueMatch[0].length).replace(/^\s*[↑↓HL]\s*/,' ');
    const unitMatch=rest.match(units), unit=unitMatch?.[0]?.replace(/\s/g,'')||'';
    const range=rest.match(/(?:[<>≤≥]\s*-?\d+(?:\.\d+)?|-?\d+(?:\.\d+)?\s*[-~～—至]\s*-?\d+(?:\.\d+)?)/)?.[0]||'';
    // An inequality result must not become an exact plotted value.
    if (input.cells) {
      const critical=input.cells.filter(c=>norm(c.text).includes(norm(selected.alias))||c.text.trim().startsWith(valueMatch[2])||(unit&&norm(c.text).includes(norm(unit))));
      score=critical.length?Math.min(...critical.map(c=>c.score??0)):0;
    }
    const bounded=!valueMatch[1];
    const dimensionless=/^(尿比重|尿酸碱度|INR)$/.test(selected.metric);
    const hasSeparator=!rest || /^[\s%↑↓HL]/.test(tail.slice(valueMatch[0].length)) || !!unitMatch;
    const compatible=selected.metric!=='肌酐（标本未明）'&&(selected.metric!=='血清肌酐'||/^(?:[μµu]mol\/L|mg\/dL)$/i.test(unit));
    const validated=compatible&&resultFirst&&bounded&&hasSeparator&&(!!unit||dimensionless)&&score>=.97;
    records.push({label:selected.alias,metric:selected.metric,value,unit,referenceRange:range,evidence:line,confidence:score,validated});
  }
  return records.filter((r,i,a)=>a.findIndex(x=>x.metric===r.metric&&x.value===r.value&&x.unit===r.unit)===i);
}
