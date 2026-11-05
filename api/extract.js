const MODEL = "google/gemini-3.6-flash";
const ALLOWED_ORIGINS = new Set(["https://health-report-local-import-yingsun02-9131.vercel.app", "https://health-report-local-import.vercel.app"]);
const recentCalls = new Map();

const schema = `只做医院检验/检查报告的数据抄录，不做诊断或建议。按每个结果行输出：原始项目名、规范项目名、数值（只能是报告明示的数字）、原始单位、参考范围、报告日期、医院、报告中的原文证据、置信度0到1。禁止把患者编号、条码、页码、报告编号当指标；禁止从参考范围推测结果；禁止把一行中的单位套给其他项目。模糊或缺失字段用空字符串，低把握不要猜。只输出JSON：{"date":"YYYY-MM-DD或空","hospital":"或空","records":[{"label":"","metric":"","value":12.3,"unit":"","referenceRange":"","evidence":"","confidence":0.0}]}`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const origin = req.headers.origin;
  if (!ALLOWED_ORIGINS.has(origin)) return res.status(403).json({ error: "origin_not_allowed" });
  const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const now = Date.now();
  const timestamps = (recentCalls.get(ip) || []).filter(time => now - time < 60 * 60 * 1000);
  if (timestamps.length >= 30) return res.status(429).json({ error: "rate_limited" });
  timestamps.push(now); recentCalls.set(ip, timestamps);
  // In deployed Vercel Functions, OIDC is supplied per request as a header;
  // VERCEL_OIDC_TOKEN is only present during builds/local development.
  const token = req.headers["x-vercel-oidc-token"] || process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY;
  if (!token) return res.status(503).json({ error: "gateway_auth_not_configured" });

  const { text, image, fileName } = req.body || {};
  if ((!text || typeof text !== "string") && (!image || typeof image.data !== "string")) {
    return res.status(400).json({ error: "missing_report_content" });
  }
  if (text && text.length > 120000) return res.status(413).json({ error: "report_text_too_large" });
  if (image && (!/^image\/(jpeg|png|webp)$/.test(image.mimeType || "") || image.data.length > 3900000)) {
    return res.status(413).json({ error: "image_too_large_or_unsupported" });
  }

  const content = [{ type: "text", text: `${schema}\n文件名仅作上下文，不可据此编造结果：${String(fileName || "").slice(0, 160)}\n${text ? `报告文字：\n${text}` : "请读取附图中的报告表格。"}` }];
  if (image) content.push({ type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.data}` } });

  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 6000,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content }],
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      console.error("AI Gateway extraction failed", response.status, payload?.error?.code || "gateway_error", String(payload?.error?.message || "").slice(0, 240));
      return res.status(response.status >= 500 ? 502 : response.status).json({ error: "extraction_failed" });
    }
    const raw = payload.choices?.[0]?.message?.content;
    const result = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!result || !Array.isArray(result.records)) throw new Error("invalid_model_shape");
    return res.status(200).json(result);
  } catch (error) {
    console.error("AI Gateway extraction error", error?.message || "unknown");
    return res.status(502).json({ error: "extraction_unavailable" });
  }
};
