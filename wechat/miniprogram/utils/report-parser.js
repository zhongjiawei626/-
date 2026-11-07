var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/report-parser.mjs
var report_parser_exports = {};
__export(report_parser_exports, {
  groupOcrItems: () => groupOcrItems,
  parseReportLines: () => parseReportLines
});
module.exports = __toCommonJS(report_parser_exports);

// src/metrics.mjs
var aliases = [["\u5C3F\u5FAE\u91CF\u767D\u86CB\u767D/\u5C3F\u808C\u9150", "\u5C3F\u5FAE\u91CF\u767D\u86CB\u767D/\u5C3F\u808C\u9150\u6BD4\u503C"], ["\u5C3F\u603B\u86CB\u767D/\u5C3F\u808C\u9150", "\u5C3F\u603B\u86CB\u767D/\u808C\u9150\u6BD4\u503C"], ["\u5C3F\u5FAE\u91CF\u767D\u86CB\u767D/\u5C3F\u808C\u9150\u6BD4\u503C", "\u5C3F\u5FAE\u91CF\u767D\u86CB\u767D/\u5C3F\u808C\u9150\u6BD4\u503C"], ["\u5C3F\u603B\u86CB\u767D/\u808C\u9150\u6BD4\u503C", "\u5C3F\u603B\u86CB\u767D/\u808C\u9150\u6BD4\u503C"], ["24\u5C0F\u65F6\u5C3F\u86CB\u767D\u5B9A\u91CF", "24\u5C0F\u65F6\u5C3F\u86CB\u767D"], ["24\u5C0F\u65F6\u5C3F\u86CB\u767D", "24\u5C0F\u65F6\u5C3F\u86CB\u767D"], ["24\u5C0F\u65F6\u5C3F\u9499", "24\u5C0F\u65F6\u5C3F\u9499"], ["UACR", "\u5C3F\u5FAE\u91CF\u767D\u86CB\u767D/\u5C3F\u808C\u9150\u6BD4\u503C"], ["UPCR", "\u5C3F\u603B\u86CB\u767D/\u808C\u9150\u6BD4\u503C"], ["CREA-U", "\u5C3F\u808C\u9150"], ["MALB", "\u5C3F\u5FAE\u91CF\u767D\u86CB\u767D"], ["\u767D\u7EC6\u80DE\u916F\u9176", "\u767D\u7EC6\u80DE\u916F\u9176"], ["\u4F30\u7B97\u80BE\u5C0F\u7403\u6EE4\u8FC7\u7387", "\u80BE\u5C0F\u7403\u6EE4\u8FC7\u7387"], ["\u80BE\u5C0F\u7403\u6EE4\u8FC7\u7387", "\u80BE\u5C0F\u7403\u6EE4\u8FC7\u7387"], ["\u8840\u6E05\u808C\u9150", "\u8840\u6E05\u808C\u9150"], ["24\u5C0F\u65F6\u5C3F\u91CF", "24\u5C0F\u65F6\u5C3F\u91CF"], ["\u767D\u86CB\u767D/\u808C\u9150\u6BD4\u503C", "\u5C3F\u5FAE\u91CF\u767D\u86CB\u767D/\u5C3F\u808C\u9150\u6BD4\u503C"], ["\u767D\u86CB\u767D\u808C\u9150\u6BD4\u503C", "\u5C3F\u5FAE\u91CF\u767D\u86CB\u767D/\u5C3F\u808C\u9150\u6BD4\u503C"], ["24H\u5C3F\u86CB\u767D", "24\u5C0F\u65F6\u5C3F\u86CB\u767D"], ["24HR\u5C3F\u86CB\u767D", "24\u5C0F\u65F6\u5C3F\u86CB\u767D"], ["\u5C3F\u5FAE\u91CF\u767D\u86CB\u767D", "\u5C3F\u5FAE\u91CF\u767D\u86CB\u767D"], ["\u5C3F\u603B\u86CB\u767D", "\u5C3F\u603B\u86CB\u767D"], ["\u5C3F\u808C\u9150", "\u5C3F\u808C\u9150"], ["\u5C3F\u6BD4\u91CD", "\u5C3F\u6BD4\u91CD"], ["\u6BD4\u91CD", "\u5C3F\u6BD4\u91CD"], ["PH", "\u5C3F\u9178\u78B1\u5EA6"], ["\u5C3F\u9178\u78B1\u5EA6", "\u5C3F\u9178\u78B1\u5EA6"], ["\u5C3F\u86CB\u767D\u5B9A\u91CF", "\u5C3F\u86CB\u767D"], ["\u5C3F\u86CB\u767D", "\u5C3F\u86CB\u767D"], ["\u5C3F\u6F5C\u8840", "\u5C3F\u6F5C\u8840"], ["\u5C3F\u9690\u8840", "\u5C3F\u9690\u8840"], ["\u9690\u8840", "\u5C3F\u6F5C\u8840"], ["\u5C3F\u7CD6", "\u5C3F\u7CD6"], ["\u5C3F\u8461\u8404\u7CD6", "\u5C3F\u7CD6"], ["\u5C3F\u916E\u4F53", "\u5C3F\u916E\u4F53"], ["\u5C3F\u80C6\u7EA2\u7D20", "\u5C3F\u80C6\u7EA2\u7D20"], ["\u5C3F\u80C6\u539F", "\u5C3F\u80C6\u539F"], ["\u4E9A\u785D\u9178\u76D0", "\u4E9A\u785D\u9178\u76D0"], ["\u955C\u68C0\u7EA2\u7EC6\u80DE", "\u955C\u68C0\u7EA2\u7EC6\u80DE"], ["\u955C\u68C0\u767D\u7EC6\u80DE", "\u955C\u68C0\u767D\u7EC6\u80DE"], ["\u4E0A\u76AE\u7EC6\u80DE", "\u4E0A\u76AE\u7EC6\u80DE"], ["\u603B\u80C6\u56FA\u9187", "\u603B\u80C6\u56FA\u9187"], ["\u80C6\u56FA\u9187", "\u603B\u80C6\u56FA\u9187"], ["\u7518\u6CB9\u4E09\u916F", "\u7518\u6CB9\u4E09\u916F"], ["\u9AD8\u5BC6\u5EA6\u8102\u86CB\u767D", "\u9AD8\u5BC6\u5EA6\u8102\u86CB\u767D"], ["\u4F4E\u5BC6\u5EA6\u8102\u86CB\u767D", "\u4F4E\u5BC6\u5EA6\u8102\u86CB\u767D"], ["\u8840\u7EA2\u86CB\u767D", "\u8840\u7EA2\u86CB\u767D"], ["\u8840\u5C0F\u677F\u8BA1\u6570", "\u8840\u5C0F\u677F\u8BA1\u6570"], ["\u8840\u5C0F\u677F", "\u8840\u5C0F\u677F\u8BA1\u6570"], ["\u767D\u7EC6\u80DE\u8BA1\u6570", "\u767D\u7EC6\u80DE\u8BA1\u6570"], ["\u7EA2\u7EC6\u80DE\u8BA1\u6570", "\u7EA2\u7EC6\u80DE\u8BA1\u6570"], ["\u4E2D\u6027\u7C92\u7EC6\u80DE", "\u4E2D\u6027\u7C92\u7EC6\u80DE"], ["\u6DCB\u5DF4\u7EC6\u80DE", "\u6DCB\u5DF4\u7EC6\u80DE"], ["\u5355\u6838\u7EC6\u80DE", "\u5355\u6838\u7EC6\u80DE"], ["\u55DC\u9178\u6027\u7C92\u7EC6\u80DE", "\u55DC\u9178\u6027\u7C92\u7EC6\u80DE"], ["\u55DC\u78B1\u6027\u7C92\u7EC6\u80DE", "\u55DC\u78B1\u6027\u7C92\u7EC6\u80DE"], ["CRP", "CRP"], ["C\u53CD\u5E94\u86CB\u767D", "CRP"], ["SAA", "SAA"], ["D-\u4E8C\u805A\u4F53", "D-\u4E8C\u805A\u4F53"], ["D\u4E8C\u805A\u4F53", "D-\u4E8C\u805A\u4F53"], ["\u51DD\u8840\u9176\u539F\u65F6\u95F4", "\u51DD\u8840\u9176\u539F\u65F6\u95F4"], ["PT", "\u51DD\u8840\u9176\u539F\u65F6\u95F4"], ["INR", "INR"], ["\u6D3B\u5316\u90E8\u5206\u51DD\u8840\u6D3B\u9176\u65F6\u95F4", "APTT"], ["APTT", "APTT"], ["\u7EA4\u7EF4\u86CB\u767D\u539F", "\u7EA4\u7EF4\u86CB\u767D\u539F"], ["\u8840\u7CD6", "\u8840\u7CD6"], ["\u8461\u8404\u7CD6", "\u8840\u7CD6"], ["\u7A7A\u8179\u8840\u7CD6", "\u8840\u7CD6"], ["\u8840\u6E05\u808C\u9150", "\u8840\u6E05\u808C\u9150"], ["\u808C\u9150", "\u8840\u6E05\u808C\u9150"], ["\u5C3F\u7D20\u6C2E", "\u5C3F\u7D20\u6C2E"], ["\u5C3F\u7D20", "\u5C3F\u7D20"], ["\u5C3F\u9178", "\u5C3F\u9178"], ["\u94A0", "\u94A0"], ["\u94BE", "\u94BE"], ["\u6C2F", "\u6C2F"], ["\u9499", "\u9499"], ["\u78F7", "\u78F7"], ["\u9541", "\u9541"], ["\u603B\u86CB\u767D", "\u603B\u86CB\u767D"], ["\u767D\u86CB\u767D", "\u767D\u86CB\u767D"], ["\u7403\u86CB\u767D", "\u7403\u86CB\u767D"], ["\u8C37\u4E19\u8F6C\u6C28\u9176", "ALT"], ["ALT", "ALT"], ["\u8C37\u8349\u8F6C\u6C28\u9176", "AST"], ["AST", "AST"], ["\u78B1\u6027\u78F7\u9178\u9176", "\u78B1\u6027\u78F7\u9178\u9176"], ["\u8C37\u6C28\u9170\u8F6C\u80BD\u9176", "GGT"], ["\u773C\u538B", "\u773C\u538B"], ["\u5DE6\u773C\u89C6\u529B", "\u5DE6\u773C\u89C6\u529B"], ["\u53F3\u773C\u89C6\u529B", "\u53F3\u773C\u89C6\u529B"], ["\u5DE6\u773C\u773C\u538B", "\u5DE6\u773C\u773C\u538B"], ["\u53F3\u773C\u773C\u538B", "\u53F3\u773C\u773C\u538B"], ["MCV", "MCV"], ["MCHC", "MCHC"], ["MCH", "MCH"], ["WBC", "\u767D\u7EC6\u80DE\u8BA1\u6570"], ["RBC", "\u7EA2\u7EC6\u80DE\u8BA1\u6570"], ["HGB", "\u8840\u7EA2\u86CB\u767D"], ["HB", "\u8840\u7EA2\u86CB\u767D"], ["PLT", "\u8840\u5C0F\u677F\u8BA1\u6570"]];

// src/report-parser.mjs
var norm = (s) => s.toUpperCase().replace(/[\s:：*＊]/g, "");
var units = /(?:[×x*]?\s*10\s*[⁹9¹²^]+\s*\/L|mL\/min(?:\/1\.73m[²2])?|mg\/(?:mmol|24h|dL|L|g)|mmol\/L|[μµu]mol\/L|g\/(?:24h|dL|L)|mL|mmHg|U\/L|IU\/L|fL|pg|%)/i;
var number = /^\s*([<>≤≥]?)\s*(-?\d+(?:\.\d+)?)(?![\d.])/;
function groupOcrItems(items) {
  var _a;
  const rows = [];
  for (const item of items) {
    if (!item.text || !((_a = item.poly) == null ? void 0 : _a.length)) continue;
    const xs = item.poly.map((p) => p[0]), ys = item.poly.map((p) => p[1]);
    const cell = { text: item.text, x: Math.min(...xs), y: (Math.min(...ys) + Math.max(...ys)) / 2, h: Math.max(...ys) - Math.min(...ys), score: item.score };
    let row = rows.find((r) => Math.abs(r.y - cell.y) < Math.max(3, Math.min(r.h, cell.h) * 0.45));
    if (!row) {
      row = { y: cell.y, h: cell.h, cells: [] };
      rows.push(row);
    }
    row.cells.push(cell);
  }
  return rows.sort((a, b) => a.y - b.y).map((r) => ({ text: r.cells.sort((a, b) => a.x - b.x).map((c) => c.text).join("  "), cells: r.cells, score: Math.min(...r.cells.map((c) => {
    var _a2;
    return (_a2 = c.score) != null ? _a2 : 0;
  })) }));
}
function parseReportLines(lines, specimen = "") {
  var _a, _b;
  const records = [];
  const headers = lines.map((x) => typeof x === "string" ? x : x.text).filter((x) => /结果/.test(x) && /参考/.test(x));
  const resultFirst = headers.some((x) => x.indexOf("\u7ED3\u679C") < x.indexOf("\u53C2\u8003"));
  for (const input of lines) {
    const line = typeof input === "string" ? input : input.text;
    let score = typeof input === "string" ? 1 : input.score;
    if (!line || /(?:姓名|患者编号|报告编号|条形码|参考范围.*结果)/.test(line)) continue;
    const cleaned = line.replace(/[，,]/g, ".").replace(/[|｜]/g, " ").trim().replace(/^[A-Z][A-Z0-9%-]*(?:-[A-Z]+)?\s+/, "");
    const matches = aliases.map(([alias, metric]) => ({ alias, metric, index: norm(cleaned).indexOf(norm(alias)) })).filter((x) => x.index >= 0).sort((a, b) => a.index - b.index || b.alias.length - a.alias.length);
    if (!matches.length) continue;
    const selected = { ...matches[0] };
    if (selected.alias === "\u808C\u9150") selected.metric = /尿/.test(specimen) ? "\u5C3F\u808C\u9150" : /血/.test(specimen) ? "\u8840\u6E05\u808C\u9150" : "\u808C\u9150\uFF08\u6807\u672C\u672A\u660E\uFF09";
    const escaped = [...selected.alias].map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s*");
    const match = cleaned.match(new RegExp(escaped, "i"));
    if (!match) continue;
    const prefix = cleaned.slice(0, match.index).replace(/[\s*＊\d.、]/g, "");
    if (prefix) continue;
    let tail = cleaned.slice(match.index + match[0].length).replace(/^\s*[:：]?\s*(?:[A-Za-z][A-Za-z0-9-]*\s+)?/, "");
    if (/^[（(]/.test(tail)) continue;
    const valueMatch = tail.match(number);
    if (!valueMatch) continue;
    if (valueMatch[1]) continue;
    const value = Number(valueMatch[2]);
    const rest = tail.slice(valueMatch[0].length).replace(/^\s*[↑↓HL]\s*/, " ");
    const unitMatch = rest.match(units), unit = ((_a = unitMatch == null ? void 0 : unitMatch[0]) == null ? void 0 : _a.replace(/\s/g, "")) || "";
    const range = ((_b = rest.match(/(?:[<>≤≥]\s*-?\d+(?:\.\d+)?|-?\d+(?:\.\d+)?\s*[-~～—至]\s*-?\d+(?:\.\d+)?)/)) == null ? void 0 : _b[0]) || "";
    if (input.cells) {
      const critical = input.cells.filter((c) => norm(c.text).includes(norm(selected.alias)) || c.text.trim().startsWith(valueMatch[2]) || unit && norm(c.text).includes(norm(unit)));
      score = critical.length ? Math.min(...critical.map((c) => {
        var _a2;
        return (_a2 = c.score) != null ? _a2 : 0;
      })) : 0;
    }
    const bounded = !valueMatch[1];
    const dimensionless = /^(尿比重|尿酸碱度|INR)$/.test(selected.metric);
    const hasSeparator = !rest || /^[\s%↑↓HL]/.test(tail.slice(valueMatch[0].length)) || !!unitMatch;
    const compatible = selected.metric !== "\u808C\u9150\uFF08\u6807\u672C\u672A\u660E\uFF09" && (selected.metric !== "\u8840\u6E05\u808C\u9150" || /^(?:[μµu]mol\/L|mg\/dL)$/i.test(unit));
    const validated = compatible && resultFirst && bounded && hasSeparator && (!!unit || dimensionless) && score >= 0.97;
    records.push({ label: selected.alias, metric: selected.metric, value, unit, referenceRange: range, evidence: line, confidence: score, validated });
  }
  return records.filter((r, i, a) => a.findIndex((x) => x.metric === r.metric && x.value === r.value && x.unit === r.unit) === i);
}
