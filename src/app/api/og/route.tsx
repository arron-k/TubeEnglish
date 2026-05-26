import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f0f4ff 0%, #fdf4ff 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6172f3, #d946ef)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
            }}
          >
            🎬
          </div>
          <span style={{ fontSize: '56px', fontWeight: 900, color: '#111827' }}>
            Tube<span style={{ color: '#444ce7' }}>English</span>
          </span>
        </div>

        <p
          style={{
            fontSize: '28px',
            color: '#6b7280',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          유튜브로 배우는 AI 영어 학습
        </p>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginTop: '48px',
          }}
        >
          {['📄 자막 동기화', '🎙️ 쉐도잉', '🤖 AI 튜터'].map((label) => (
            <div
              key={label}
              style={{
                padding: '12px 24px',
                borderRadius: '999px',
                background: 'white',
                fontSize: '20px',
                color: '#374151',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
