import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function sendSlackNotification(data: {
  name: string;
  amount: number;
  mul_no: string;
  payment_status: 'paid' | 'failed';
}) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) return;

  try {
    const message = {
      text: `[선납부신청] 결제 ${data.payment_status === 'paid' ? '완료' : '실패'} 알림`,
      attachments: [
        {
          color: data.payment_status === 'paid' ? '#28A745' : '#EE5A6F',
          fields: [
            { title: '신청자', value: data.name, short: true },
            { title: '결제 금액', value: `${data.amount.toLocaleString()}원`, short: true },
            { title: '결제번호', value: data.mul_no || '-', short: true },
            { title: '상태', value: data.payment_status === 'paid' ? '✅ 결제 완료' : '❌ 결제 실패', short: true },
            { title: '시간', value: new Date().toLocaleString('ko-KR'), short: false },
          ],
        },
      ],
    };
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Slack 알림 전송 실패:', error);
  }
}

/**
 * PayApp 결제 웹훅
 * PayApp에서 서버로 직접 호출하는 feedbackurl
 * 사용자가 결제 페이지를 닫아도 호출됨
 */
export async function POST(request: NextRequest) {
  try {
    // PayApp은 form-urlencoded로 전송하므로 body를 text로 파싱
    const body = await request.text();
    const params = new URLSearchParams(body);
    const supabase = createClient();

    const state = params.get('state'); // 1: 성공, 0: 실패
    const tradeid = params.get('tradeid'); // 거래번호
    const mul_no = params.get('mul_no'); // 결제 요청번호
    const var1 = params.get('var1'); // 주문번호
    const price = params.get('price'); // 결제 금액
    const shopname = params.get('shopname'); // 상점명
    const goodname = params.get('goodname'); // 상품명
    const message = params.get('message'); // 메시지
    const paymethod = params.get('paymethod'); // 결제수단

    console.log('Payment webhook received:', {
      state,
      tradeid,
      mul_no,
      orderId: var1,
      price,
      paymethod,
      allParams: Object.fromEntries(params) // 모든 파라미터 로깅
    });

    // 데이터베이스에 결제 정보 저장
    // state가 '1'이면 성공 (mul_no가 있으면 충분)
    if (state === '1' || (state === null && mul_no)) {
      // 결제 성공
      const { error: updateError, data: appData } = await supabase
        .from('certificate_applications')
        .update({
          payment_status: 'paid',
          trade_id: tradeid,
          mul_no: mul_no,
          pay_method: paymethod,
          paid_at: new Date().toISOString()
        })
        .eq('order_id', var1)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        // 실패 시 "SUCCESS" 대신 빈 응답으로 재시도 유도
        return new NextResponse('FAIL', { status: 200 });
      }

      // 결제 성공 로그 + 슬랙 알림
      if (appData) {
        await supabase.from('payment_logs').insert({
          app_id: appData.id,
          action: 'payment_success',
          amount: parseInt(price || '0'),
          response_data: Object.fromEntries(params)
        });

        await sendSlackNotification({
          name: appData.name,
          amount: parseInt(price || '0'),
          mul_no: mul_no || '',
          payment_status: 'paid',
        });
      }

      // PayApp 매뉴얼: feedbackurl에서 반드시 "SUCCESS" 응답 필수
      return new NextResponse('SUCCESS', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });

    } else {
      // 결제 실패
      const { error: updateError, data: appData } = await supabase
        .from('certificate_applications')
        .update({
          payment_status: 'failed',
          failed_message: message,
          failed_at: new Date().toISOString()
        })
        .eq('order_id', var1)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        return new NextResponse('FAIL', { status: 200 });
      } else if (appData) {
        // 결제 실패 로그 + 슬랙 알림
        await supabase.from('payment_logs').insert({
          app_id: appData.id,
          action: 'payment_failed',
          error_message: message,
          response_data: Object.fromEntries(params)
        });

        await sendSlackNotification({
          name: appData.name,
          amount: 0,
          mul_no: mul_no || '',
          payment_status: 'failed',
        });
      }

      // 결제 실패도 SUCCESS로 응답 (DB 업데이트 완료했으므로)
      return new NextResponse('SUCCESS', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

  } catch (error) {
    console.error('Payment webhook error:', error);
    // 에러 발생 시 FAIL 응답으로 재시도 유도
    return new NextResponse('FAIL', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}
