export default async function handler(req, res) {
  /* GET 요청만 허용 */
  if (req.method !== 'GET') {
    return res.status(405).json({
      message: '허용되지 않은 요청입니다.'
    });
  }

  /* Vercel에 등록된 Supabase 환경변수 가져오기 */
  const supabaseUrl =
    process.env.SUPABASE_URL;

  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  /* 환경변수가 없는 경우 */
  if (!supabaseUrl) {
    console.error('SUPABASE_URL 환경변수가 없습니다.');

    return res.status(500).json({
      message: 'SUPABASE_URL 설정이 없습니다.'
    });
  }

  if (!supabaseKey) {
    console.error('Supabase API Key 환경변수가 없습니다.');

    return res.status(500).json({
      message: 'Supabase API Key 설정이 없습니다.'
    });
  }

  try {
    /* 최근 상담 5개 불러오기 */
    const requestUrl =
      `${supabaseUrl}/rest/v1/consultations` +
      `?select=id,name_masked,job,amount,status,created_at` +
      `&order=created_at.desc` +
      `&limit=5`;

    const response = await fetch(requestUrl, {
      method: 'GET',

      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json'
      }
    });

    const responseText = await response.text();

    let data;

    try {
      data = responseText
        ? JSON.parse(responseText)
        : [];
    } catch (error) {
      data = {
        message: responseText
      };
    }

    /* Supabase 요청 실패 */
    if (!response.ok) {
      console.error(
        'Supabase 최근 상담 조회 실패:',
        data
      );

      return res.status(response.status).json({
        message:
          data.message ||
          '최근 상담 목록을 불러오지 못했습니다.'
      });
    }

    /* 브라우저 캐시 방지 */
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate'
    );

    return res.status(200).json(
      Array.isArray(data) ? data : []
    );

  } catch (error) {
    console.error(
      '최근 상담 목록 오류:',
      error
    );

    return res.status(500).json({
      message: '최근 상담 목록을 가져오지 못했습니다.'
    });
  }
}
