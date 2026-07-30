export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      message: '허용되지 않은 요청입니다.'
    });
  }

  const {
    name = '',
    phone = '',
    birth = '',
    job = '',
    amount = '',
    contactTime = '',
    message = '',
    privacy = ''
  } = req.body || {};

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

  /* 이름을 김** 형태로 변경 */
  function maskName(value) {
    const cleanName = String(value).trim();

    if (!cleanName) {
      return '고객';
    }

    return cleanName.charAt(0) + '**';
  }

  /* 텔레그램 HTML 특수문자 처리 */
  function escapeHtml(value) {
    return String(value).replace(/[<>&]/g, function (character) {
      const characters = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;'
      };

      return characters[character];
    });
  }

  const maskedName = maskName(name);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY;

  const telegramBotToken =
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.BOT_TOKEN;

  const telegramChatId =
    process.env.TELEGRAM_CHAT_ID ||
    process.env.CHAT_ID;

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error('Supabase 환경변수가 없습니다.');

    return res.status(500).json({
      message: '데이터베이스 설정이 완료되지 않았습니다.'
    });
  }

  if (!telegramBotToken || !telegramChatId) {
    console.error('Telegram 환경변수가 없습니다.');

    return res.status(500).json({
      message: '텔레그램 설정이 완료되지 않았습니다.'
    });
  }

  try {
    /* 1. Supabase에 최근 상담 정보 저장 */
    const supabaseResponse = await fetch(
      `${supabaseUrl}/rest/v1/consultations`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseSecretKey,
          Authorization: `Bearer ${supabaseSecretKey}`,
          Prefer: 'return=minimal'
        },

        body: JSON.stringify({
          name_masked: maskedName,
          job: String(job),
          amount: String(amount),
          status: '상담 대기'
        })
      }
    );

    if (!supabaseResponse.ok) {
      const supabaseError =
        await supabaseResponse.text();

      console.error(
        'Supabase 저장 실패:',
        supabaseError
      );

      return res.status(502).json({
        message: '상담 접수 저장에 실패했습니다.'
      });
    }

    /* 2. 텔레그램으로 전체 상담 내용 전송 */
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
      `접수시각: ${new Date().toLocaleString(
        'ko-KR',
        {
          timeZone: 'Asia/Seoul'
        }
      )}`
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

    const telegramResult =
      await telegramResponse.json();

    if (
      !telegramResponse.ok ||
      !telegramResult.ok
    ) {
      console.error(
        'Telegram 전송 실패:',
        telegramResult
      );

      return res.status(502).json({
        message: '텔레그램 전송에 실패했습니다.'
      });
    }

    return res.status(200).json({
      ok: true,
      message: '상담 신청이 접수되었습니다.'
    });

  } catch (error) {
    console.error('상담 접수 오류:', error);

    return res.status(500).json({
      message: '접수 처리 중 오류가 발생했습니다.'
    });
  }
}
