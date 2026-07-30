export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        message: '허용되지 않은 요청입니다.'
      });
    }

    const body = req.body || {};

    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const birth = String(body.birth || '').trim();
    const job = String(body.job || '').trim();
    const amount = String(body.amount || '').trim();
    const contactTime = String(body.contactTime || '').trim();
    const message = String(body.message || '').trim();
    const privacy = body.privacy;

    if (
      !name ||
      !phone ||
      !birth ||
      !job ||
      !amount ||
      !contactTime ||
      !privacy
    ) {
      return res.status(400).json({
        message: '필수 항목을 모두 입력해주세요.'
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    const telegramBotToken =
      process.env.TELEGRAM_BOT_TOKEN ||
      process.env.BOT_TOKEN;

    const telegramChatId =
      process.env.TELEGRAM_CHAT_ID ||
      process.env.CHAT_ID;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        message: 'Supabase 설정이 없습니다.'
      });
    }

    if (!telegramBotToken || !telegramChatId) {
      return res.status(500).json({
        message: '텔레그램 설정이 없습니다.'
      });
    }

    function maskName(value) {
      const cleanName = String(value).trim();

      if (!cleanName) {
        return '고객**';
      }

      return cleanName.charAt(0) + '**';
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    const maskedName = maskName(name);

    /* 1. Supabase 저장 */
    const supabaseResponse = await fetch(
      `${supabaseUrl}/rest/v1/consultations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          name_masked: maskedName,
          job: job,
          amount: amount,
          status: '상담 대기'
        })
      }
    );

    if (!supabaseResponse.ok) {
      const supabaseError = await supabaseResponse.text();

      console.error('Supabase 저장 실패:', supabaseError);

      return res.status(502).json({
        message: '상담 정보 저장에 실패했습니다.',
        detail: supabaseError
      });
    }

    /* 2. 텔레그램 전송 */
    const telegramMessage = [
      '📩 <b>A-ONE CREDIT 상담 접수</b>',
      '',
      `👤 이름: ${escapeHtml(name)}`,
      `📱 연락처: ${escapeHtml(phone)}`,
      `🎂 생년월일: ${escapeHtml(birth)}`,
      `💼 직업: ${escapeHtml(job)}`,
      `💰 희망금액: ${escapeHtml(amount)}`,
      `🕒 연락 가능 시간: ${escapeHtml(contactTime)}`,
      `📝 문의내용: ${escapeHtml(message || '없음')}`,
      '',
      `접수시각: ${new Date().toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul'
      })}`
    ].join('\n');

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: telegramMessage,
          parse_mode: 'HTML'
        })
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramResult.ok) {
      console.error('텔레그램 전송 실패:', telegramResult);

      return res.status(502).json({
        message: '텔레그램 전송에 실패했습니다.'
      });
    }

    return res.status(200).json({
      ok: true,
      message: '상담 신청이 정상적으로 접수되었습니다.'
    });
  } catch (error) {
    console.error('submit.js 전체 오류:', error);

    return res.status(500).json({
      message: '접수 처리 중 오류가 발생했습니다.',
      detail: error instanceof Error
        ? error.message
        : String(error)
    });
  }
}
