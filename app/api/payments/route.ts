import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PayApp REST API로 결제 요청
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, goodname, price, recvphone, recvname, var1 } = body;

    // 필수 파라미터 검증
    if (!goodname || !price || !recvphone) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다. (goodname, price, recvphone)' },
        { status: 400 }
      );
    }

    const payappUserId = process.env.NEXT_PUBLIC_PAYAPP_USER_ID || 'korhrdcorp';
    const payappShopName = process.env.NEXT_PUBLIC_PAYAPP_SHOP_NAME || '한평생교육';
    const payappLinkKey = process.env.PAYAPP_LINK_KEY || '';
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` :
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'));

    baseUrl = baseUrl.replace(/\/$/, '');

    // PayApp REST API 요청
    // 면세 처리: 전체 금액을 amount_taxfree에 설정
    const paymentParams = new URLSearchParams({
      cmd: 'payrequest',
      userid: payappUserId,
      linkkey: payappLinkKey,
      shopname: payappShopName,
      goodname: goodname,
      price: price.toString(),
      recvphone: recvphone,
      memo: recvname || '',
      feedbackurl: `${baseUrl}/api/payments/webhook`,
      returnurl: `${baseUrl}/api/payments/result?var1=${encodeURIComponent(var1)}`,
      var1: var1,
      skip_cstpage: 'y', // 매출전표 페이지 스킵
      smsuse: 'n', // SMS 발송 안함
      openpaytype: 'card,kakaopay,naverpay,payco,applepay,myaccount', // 허용할 결제수단
      // 면세 설정
      amount_taxable: '0',           // 과세 금액: 0
      amount_taxfree: price.toString(), // 면세 금액: 전체 가격
      amount_vat: '0',              // 부가세: 0
    });

    const paymentResponse = await fetch('https://api.payapp.kr/oapi/apiLoad.html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: paymentParams.toString(),
    });

    const responseText = await paymentResponse.text();
    const responseParams = new URLSearchParams(responseText);
    const state = responseParams.get('state');
    const payurl = responseParams.get('payurl');
    const mulNo = responseParams.get('mul_no');
    const errorMessage = responseParams.get('errorMessage');

    if (state === '1' && payurl) {
      return NextResponse.json({
        success: true,
        message: '결제 요청이 생성되었습니다.',
        data: {
          payurl: payurl,
          mulNo: mulNo,
          var1: var1
        }
      });
    } else {
      return NextResponse.json(
        { error: errorMessage || '결제 요청 실패' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Payment request error:', error);
    return NextResponse.json(
      { error: '결제 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 결제 내역 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 데이터베이스에서 결제 내역 조회
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: '결제 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Payment query error:', error);
    return NextResponse.json(
      { error: '결제 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
