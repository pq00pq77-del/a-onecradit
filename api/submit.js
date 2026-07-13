export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "허용되지 않은 요청입니다." });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ error: "텔레그램 연결 설정이 필요합니다." });
  }

  const { name, phone, birth, job, amount, message, company = "" } = req.body || {};

  // 간단한 스팸 방지용 숨은 입력칸
  if (company) {
    return res.status(200).json({ ok: true });
  }

  if (!name || !phone || !birth || !job || !amount || !message) {
    return res.status(400).json({ error: "필수 항목을 모두 입력해 주세요." });
  }

  const clean = (value, max = 1000) =>
    String(value).replace(/[<>]/g, "").trim().slice(0, max);

  const text = [
    "📩 신규 대출 상담 접수",
    "",
    `이름: ${clean(name, 30)}`,
    `휴대폰번호: ${clean(phone, 20)}`,
    `생년월일: ${clean(birth, 20)}`,
    `직업: ${clean(job, 30)}`,
    `희망금액: ${clean(amount, 40)}`,
    `문의내용: ${clean(message, 1000)}`,
    "",
    `접수시각: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`
  ].join("\n");

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error("Telegram error:", data);
      return res.status(502).json({ error: "텔레그램 전송에 실패했습니다." });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}
