'use client';

import React, { useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

type NewApplication = {
  name: string;
  contact: string;
  birth_prefix: string;
  address_main: string;
  address_detail: string;
  postal_code: string;
  certificates: string[];
  cash_receipt: string;
  payment_status?: string;
  amount?: number;
  paid_at?: string;
  mul_no?: string;
  photo_url?: string;
};

const CERTIFICATE_CATEGORIES = [
  {
    label: '★필수★ 노인복지분야',
    options: ['노인심리상담사1급', '병원동행매니저1급', '노인돌봄생활지원사1급', '실버인지활동지도사1급', '안전관리지도사1급']
  },
  {
    label: '★필수★ 아동복지분야',
    options: ['지역아동교육지도사1급', '방과후돌봄교실지도사1급', '방과후학교지도사1급', '진로적성상담사1급/인성지도사', '심리상담사1급']
  },
  {
    label: '★필수★ 노인복지분야 2',
    options: ['진로적성상담사1급/인성지도사', '심리상담사1급', '독서지도사1급', '학교폭력예방상담사1급', '인성지도사1급']
  },
  {
    label: '사회복지',
    options: ['노인심리상담사1급', '노인돌봄생활지원사1급', '병원동행매니저1급', '심리상담사1급', '다문화심리상담사1급', '음악심리상담사1급', '아동미술심리상담사1급', '부모교육상담사1급', '실버인지활동지도사1급', '지역아동교육지도사1급', '방과후돌봄교실지도사1급', '학교폭력예방상담사1급', '진로적성상담사1급', '안전교육지도사1급', '자원봉사지도사1급']
  },
  {
    label: '보육과정',
    options: ['방과후아동지도사1급', '방과후돌봄교실지도사1급', '방과후수학지도사1급', '방과후학교지도사1급', '독서지도사1급', '진로적성상담사1급/인성지도사', '지역아동교육지도사1급', '동화구연지도사1급', '아동공예지도사1급', '아동요리지도사1급', '안전교육지도사1급', '아동미술심리상담사1급', '부모교육상담사1급', '디지털중독예방지도사1급']
  },
  {
    label: '교양수업',
    options: ['지역아동교육지도사1급', '심리분석사1급', '심리상담사1급', '부동산권리분석사1급']
  },
  {
    label: '신규',
    options: ['북아트1급', '손유희지도사', '유튜브크리에이터', '이미지메이킹스피킹', '자기주도학습지도사1급', '종이접기지도사', '클레이아트지도사', '타로심리상담사', 'POP디자인지도사', 'SNS마케팅전문가', '병원코디네이터1급', '독서논술지도사1급']
  },
  {
    label: '심리분야',
    options: ['심리상담사', '노인심리상담사', '아동미술심리상담사', '다문화심리상담사', '음악심리상담사']
  },
  {
    label: '공통분야',
    options: ['자원봉사지도사1급', '심리상담사1급', '안전교육지도사1급']
  }
];

type NewApplicationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  // accept a broader shape to remain compatible with admin list handler
  onAdd?: (data: any) => void;
};

export default function NewApplicationModal({ isOpen, onClose, onRefresh, onAdd }: NewApplicationModalProps) {
  const [formData, setFormData] = useState<NewApplication>({
    name: '',
    contact: '',
    birth_prefix: '',
    address_main: '',
    address_detail: '',
    postal_code: '',
    certificates: [],
    cash_receipt: '',
    payment_status: 'paid',
    amount: 100000,
    paid_at: new Date().toISOString().split('T')[0],
    mul_no: '',
    photo_url: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleCertificateToggle = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certificates: prev.certificates.includes(cert)
        ? prev.certificates.filter((c) => c !== cert)
        : [...prev.certificates, cert],
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.contact || !formData.birth_prefix || !formData.address_main) {
      alert('필수 정보를 입력해주세요.');
      return;
    }

    if (formData.certificates.length === 0) {
      alert('최소 1개 이상의 자격증을 선택해주세요.');
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      let photoUrl = '';

      // 사진 업로드
      if (photoFile) {
        const fileName = `${Date.now()}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, photoFile);

        if (uploadError) {
          alert('사진 업로드 중 오류가 발생했습니다.');
          return;
        }
        photoUrl = fileName;
      }

      const { error } = await supabase.from('certificate_applications').insert([
        {
          name: formData.name,
          contact: formData.contact,
          birth_prefix: formData.birth_prefix,
          address: `${formData.address_main} ${formData.address_detail}`,
          address_main: formData.address_main,
          address_detail: formData.address_detail,
          certificates: formData.certificates,
          cash_receipt: formData.cash_receipt,
          payment_status: formData.payment_status,
          amount: formData.amount,
          paid_at: formData.paid_at ? new Date(formData.paid_at).toISOString() : null,
          mul_no: formData.mul_no || null,
          photo_url: photoUrl || null,
          order_id: null,
          trade_id: null,
          pay_method: null,
          failed_at: null,
          failed_message: null,
          cancelled_at: null,
        },
      ]);

      if (!error) {
        alert('등록되었습니다.');
        // 새로 생성된 데이터를 리스트에 즉시 추가
        if (onAdd && error === null) {
          const newData = {
            ...formData,
            // 합쳐진 전체 주소 필드 추가 (관리자 리스트에서 `address` 사용)
            address: `${formData.address_main} ${formData.address_detail}`.trim(),
            photo_url: photoUrl,
            id: new Date().getTime().toString(), // 임시 ID (실제로는 서버에서 반환)
            created_at: new Date().toISOString(),
          };
          onAdd(newData as NewApplication & { id: string; created_at: string } & { address: string });
        }
        setFormData({
          name: '',
          contact: '',
          birth_prefix: '',
          address_main: '',
          address_detail: '',
          postal_code: '',
          certificates: [],
          cash_receipt: '',
          payment_status: 'paid',
          amount: 100000,
          paid_at: new Date().toISOString().split('T')[0],
          mul_no: '',
          photo_url: '',
        });
        setPhotoFile(null);
        onClose();
      } else {
        alert('등록 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 중복 제거한 자격증 리스트
  const allCertificates = Array.from(
    new Set(CERTIFICATE_CATEGORIES.flatMap((cat) => cat.options))
  ).sort();

  // 검색 결과 필터링
  const filteredCertificates = allCertificates.filter((cert) =>
    cert.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'flex-end',
      zIndex: 1000,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideModal {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: '#ffffff',
        borderRadius: '16px 16px 0 0',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'slideModal 0.3s ease-out',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          backgroundColor: '#ffffff'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#191f28' }}>
            새 신청 등록
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
              padding: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* 컨텐츠 */}
        <div style={{ padding: '24px' }}>
          {/* 기본 정보 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#999', marginBottom: '16px', textTransform: 'uppercase' }}>
              기본 정보
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  성명 *
                </label>
                <input
                  type="text"
                  placeholder="신청자 이름"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e8eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  연락처 *
                </label>
                <input
                  type="text"
                  placeholder="010-0000-0000"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e8eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  생년월일 (6자리) *
                </label>
                <input
                  type="text"
                  placeholder="990101"
                  value={formData.birth_prefix}
                  onChange={(e) => setFormData({ ...formData, birth_prefix: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e8eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  기본 주소 *
                </label>
                <input
                  type="text"
                  placeholder="서울시 강남구 테헤란로 123"
                  value={formData.address_main}
                  onChange={(e) => setFormData({ ...formData, address_main: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e8eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  상세 주소
                </label>
                <input
                  type="text"
                  placeholder="456호"
                  value={formData.address_detail}
                  onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e8eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 자격증 선택 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#999', marginBottom: '16px', textTransform: 'uppercase' }}>
              자격증 선택 * ({formData.certificates.length}개)
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="자격증 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e8eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              maxHeight: '350px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              {filteredCertificates.length > 0 ? filteredCertificates.map((cert) => (
                <label
                  key={cert}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px',
                    border: formData.certificates.includes(cert)
                      ? '2px solid #3182f6'
                      : '1px solid #e5e8eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: formData.certificates.includes(cert) ? '#f0f4ff' : 'white',
                    transition: 'all 0.2s',
                    fontSize: '12px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.certificates.includes(cert)}
                    onChange={() => handleCertificateToggle(cert)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '12px', lineHeight: 1.3 }}>{cert}</span>
                </label>
              )) : (
                <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: '#999' }}>
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 결제 정보 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#999', marginBottom: '16px', textTransform: 'uppercase' }}>
              결제 정보
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  결제 상태
                </label>
                <select
                  value={formData.payment_status || 'paid'}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_status: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e8eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="paid">결제 완료</option>
                  <option value="pending">결제 대기</option>
                  <option value="failed">결제 실패</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  결제 금액
                </label>
                <input
                  type="number"
                  value={formData.amount || 0}
                  onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e8eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  결제일
                </label>
                <input
                  type="date"
                  value={formData.paid_at || ''}
                  onChange={(e) => setFormData({ ...formData, paid_at: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e8eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  결제번호
                </label>
                <input
                  type="text"
                  placeholder="예: 12345678"
                  value={formData.mul_no || ''}
                  onChange={(e) => setFormData({ ...formData, mul_no: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e8eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 증명 사진 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#999', marginBottom: '16px', textTransform: 'uppercase' }}>
              증명 사진
            </h3>
            <div style={{
              border: '2px dashed #e5e8eb',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: photoFile ? '#f0f4ff' : '#fafbfc'
            }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setPhotoFile(e.target.files[0]);
                    setFormData({ ...formData, photo_url: e.target.files[0].name });
                  }
                }}
                style={{ display: 'none' }}
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                style={{
                  display: 'block',
                  cursor: 'pointer',
                  color: photoFile ? '#3182f6' : '#999'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  {photoFile ? '✓ ' + photoFile.name : '사진을 선택하거나 드래그하세요'}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  (JPG, PNG 형식)
                </div>
              </label>
            </div>
          </div>

          {/* 버튼 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '30px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '12px 16px',
                border: 'none',
                backgroundColor: '#10b981',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseOut={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = '#10b981';
              }}
            >
              {saving ? '등록 중...' : '등록'}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '12px 16px',
                border: '1px solid #e5e8eb',
                backgroundColor: '#ffffff',
                color: '#4e5968',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
