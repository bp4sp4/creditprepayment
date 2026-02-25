'use client';

import React, { useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

type Application = {
  id: string;
  name: string;
  contact: string;
  birth_prefix: string;
  address: string;
  certificates: string[];
  cash_receipt: string;
  photo_url?: string;
  created_at: string;
  order_id?: string;
  amount?: number;
  payment_status?: string;
  paid_at?: string;
  trade_id?: string;
  mul_no?: string;
  address_main?: string;
  address_detail?: string;
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

type DetailModalProps = {
  application: Application;
  onClose: () => void;
  onRefresh: () => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, data: Partial<Application>) => void;
};

export default function DetailModal({ application, onClose, onRefresh, onDelete, onUpdate }: DetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Application>(application);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);

  const allCertificates = Array.from(
    new Set(CERTIFICATE_CATEGORIES.flatMap((cat) => cat.options))
  ).sort();

  const filteredCertificates = allCertificates.filter((cert) =>
    cert.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      let photoUrl = formData.photo_url;

      // 새로운 사진이 선택된 경우 업로드
      if (photoFile) {
        const fileName = `${Date.now()}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, photoFile);

        if (uploadError) {
          alert('사진 업로드 중 오류가 발생했습니다.');
          setSaving(false);
          return;
        }
        photoUrl = fileName;
      }

      const { error } = await supabase
        .from('certificate_applications')
        .update({
          name: formData.name,
          contact: formData.contact,
          birth_prefix: formData.birth_prefix,
          address: `${formData.address_main} ${formData.address_detail || ''}`,
          address_main: formData.address_main,
          address_detail: formData.address_detail,
          certificates: formData.certificates,
          cash_receipt: formData.cash_receipt,
          payment_status: formData.payment_status,
          amount: formData.amount,
          paid_at: formData.paid_at,
          mul_no: formData.mul_no,
          photo_url: photoUrl,
        })
        .eq('id', application.id);

      if (!error) {
        alert('수정되었습니다.');
        setIsEditing(false);
        // 즉시 UI 업데이트
        if (onUpdate) {
          onUpdate(application.id, { ...formData, photo_url: photoUrl });
        }
        setPhotoFile(null);
        onClose();
      } else {
        alert('수정 중 오류가 발생했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('certificate_applications')
        .delete()
        .eq('id', application.id);

      if (!error) {
        alert('삭제되었습니다.');
        // 즉시 UI 업데이트
        if (onDelete) {
          onDelete(application.id);
        }
        onClose();
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // JPG로 다운로드
  const downloadAsJPG = async () => {
    const imageUrl = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('https://')[1]}/storage/v1/object/public/photos/${formData.photo_url}`;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Canvas를 사용해 JPG로 변환
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((jpgBlob) => {
            const link = document.createElement('a');
            const url = URL.createObjectURL(jpgBlob!);
            link.href = url;
            link.download = `${formData.name}_증명사진.jpg`;
            link.click();
            URL.revokeObjectURL(url);
          }, 'image/jpeg', 0.95);
        }
        URL.revokeObjectURL(objectUrl);
      };

      img.src = objectUrl;
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('다운로드에 실패했습니다.');
    }
  };

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
            {isEditing ? '신청 수정' : '신청 상세정보'}
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
          {!isEditing ? (
            // 조회 모드
            <>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#999', marginBottom: '12px', textTransform: 'uppercase' }}>
                  기본 정보
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>성명</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#191f28' }}>{formData.name}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>연락처</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#191f28' }}>{formData.contact}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>생년월일</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#191f28' }}>{formData.birth_prefix}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>기본 주소</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#191f28' }}>
                      {formData.address_main || '-'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>상세 주소</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#191f28' }}>
                      {formData.address_detail || '-'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>통신료 영수증</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#191f28' }}>
                      {formData.cash_receipt || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#999', marginBottom: '12px', textTransform: 'uppercase' }}>
                  자격증
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {formData.certificates.map((cert) => (
                    <span
                      key={cert}
                      style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        backgroundColor: '#f0f1f5',
                        color: '#4e5968',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#999', marginBottom: '12px', textTransform: 'uppercase' }}>
                  결제 정보
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>결제 상태</p>
                    <div style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: formData.payment_status === 'paid' ? '#d1fae5' : formData.payment_status === 'failed' ? '#fee2e2' : '#fef3c7',
                      color: formData.payment_status === 'paid' ? '#065f46' : formData.payment_status === 'failed' ? '#991b1b' : '#92400e'
                    }}>
                      {formData.payment_status === 'paid'
                        ? '결제 완료'
                        : formData.payment_status === 'failed'
                        ? '결제 실패'
                        : '대기 중'}
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>결제 금액</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#191f28' }}>
                      {formData.amount ? `${formData.amount.toLocaleString()}원` : '-'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>결제일</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#191f28' }}>
                      {formData.paid_at
                        ? new Date(formData.paid_at).toLocaleDateString('ko-KR')
                        : '-'}
                    </p>
                  </div>
                  {formData.mul_no && (
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>결제번호</p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#191f28', fontFamily: 'monospace' }}>
                        {formData.mul_no}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 증명 사진 */}
              {formData.photo_url && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#999', marginBottom: '12px', textTransform: 'uppercase' }}>
                    증명 사진
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <img
                      src={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('https://')[1]}/storage/v1/object/public/photos/${formData.photo_url}`}
                      alt="증명 사진"
                      onClick={() => setShowPhotoPreview(true)}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        border: '1px solid #e5e8eb',
                        maxHeight: '300px',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <button
                        onClick={() => setShowPhotoPreview(true)}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: '#3182f6',
                          color: '#ffffff',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          border: 'none'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#1e63d7';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#3182f6';
                        }}
                      >
                        크게 보기
                      </button>
                      <button
                        onClick={downloadAsJPG}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          border: 'none'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#059669';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#10b981';
                        }}
                      >
                        JPG 다운로드
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 버튼 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '30px' }}>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #e5e8eb',
                    backgroundColor: '#ffffff',
                    color: '#3182f6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f8ff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                >
                  삭제
                </button>
              </div>
            </>
          ) : (
            // 수정 모드
            <>
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
                      value={formData.address_main || ''}
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
                      value={formData.address_detail || ''}
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
                      onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
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
                      value={formData.paid_at ? formData.paid_at.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, paid_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
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
                      }
                    }}
                    style={{ display: 'none' }}
                    id="photo-upload-edit"
                  />
                  <label
                    htmlFor="photo-upload-edit"
                    style={{
                      display: 'block',
                      cursor: 'pointer',
                      color: photoFile ? '#3182f6' : '#999'
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                      {photoFile ? '✓ ' + photoFile.name : '새 사진을 선택하세요'}
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
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(application);
                    setSearchQuery('');
                  }}
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
            </>
          )}
        </div>
      </div>

      {/* 사진 미리보기 모달 */}
      {showPhotoPreview && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setShowPhotoPreview(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('https://')[1]}/storage/v1/object/public/photos/${formData.photo_url}`}
              alt="증명 사진 미리보기"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
            <button
              onClick={() => setShowPhotoPreview(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: 0,
                background: 'none',
                border: 'none',
                fontSize: '32px',
                cursor: 'pointer',
                color: '#ffffff',
                padding: 0,
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
