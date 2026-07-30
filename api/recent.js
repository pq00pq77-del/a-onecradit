export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      message: '허용되지 않은 요청입니다.'
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/consultations?select=*&order=created_at.desc&limit=5`,
      {
        headers: {
          apikey: supabaseSecretKey,
          Authorization: `Bearer ${supabaseSecretKey}`
        }
      }
    );

    const data = await response.json();

    return res.status(200).json(data);

  } catch (error) {

    return res.status(500).json({
      message: '최근 상담 목록을 가져오지 못했습니다.'
    });

  }
}
