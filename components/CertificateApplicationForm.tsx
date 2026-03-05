"use client";

import Image from "next/image";
import { useState, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "../lib/supabase/client";

import StepIndicator from "./StepIndicator";
import styles from "./stepflow.module.css";
import DaumPostcodeInput from "./DaumPostcodeInput";

// 자격증 데이터 구조
const CERTIFICATE_CATEGORIES = [
  {
    label: "★필수★\n 노인복지분야",
    options: [
      "노인심리상담사1급",
      "병원동행매니저1급",
      "노인돌봄생활지원사1급",
      "실버인지활동지도사1급",
      "안전관리지도사1급",
    ],
  },
  {
    label: "★필수★\n 아동복지분야",
    options: [
      "지역아동교육지도사1급",
      "방과후돌봄교실지도사1급",
      "방과후학교지도사1급",
      "진로적성상담사1급/인성지도사",
      "심리상담사1급",
    ],
  },
  {
    label: "★필수★\n 청소년복지분야",
    options: [
      "진로적성상담사1급/인성지도사",
      "심리상담사1급",
      "독서지도사1급",
      "학교폭력예방상담사1급",
      "인성지도사1급",
    ],
  },
  {
    label: "사회복지 ",
    options: [
      "노인심리상담사1급",
      "노인돌봄생활지원사1급",
      "병원동행매니저1급",
      "심리상담사1급",
      "다문화심리상담사1급",
      "음악심리상담사1급",
      "아동미술심리상담사1급",
      "부모교육상담사1급",
      "실버인지활동지도사1급",
      "지역아동교육지도사1급",
      "방과후돌봄교실지도사1급",
      "학교폭력예방상담사1급",
      "진로적성상담사1급",
      "안전교육지도사1급",
      "자원봉사지도사1급",
    ],
  },
  {
    label: "보육과정 ",
    options: [
      "방과후아동지도사1급",
      "방과후돌봄교실지도사1급",
      "방과후수학지도사1급",
      "방과후학교지도사1급",
      "독서지도사1급",
      "진로적성상담사1급/인성지도사",
      "지역아동교육지도사1급",
      "동화구연지도사1급",
      "아동공예지도사1급",
      "아동요리지도사1급",
      "안전교육지도사1급",
      "아동미술심리상담사1급",
      "부모교육상담사1급",
      "디지털중독예방지도사1급",
    ],
  },
  {
    label: "교양수업 ",
    options: [
      "지역아동교육지도사1급",
      "심리분석사1급",
      "심리상담사1급",
      "부동산권리분석사1급",
    ],
  },
  {
    label: "신규",
    options: [
      "북아트1급",
      "손유희지도사",
      "유튜브크리에이터",
      "이미지메이킹스피킹",
      "자기주도학습지도사1급",
      "종이접기지도사",
      "클레이아트지도사",
      "타로심리상담사",
      "POP디자인지도사",
      "SNS마케팅전문가",
      "병원코디네이터1급",
      "독서논술지도사1급",
    ],
  },
  {
    label: "심리분야",
    options: [
      "심리상담사",
      "노인심리상담사",
      "아동미술심리상담사",
      "다문화심리상담사",
      "음악심리상담사",
    ],
  },
  {
    label: "공통분야",
    options: [
      "자원봉사지도사1급",
      "심리상담사1급",
      "안전교육지도사1급",
    ],
  },
];

function StepFlowContent({ clickSource }: { clickSource: string }) {
  const [step, setStep] = useState(2);
  const [loading, setLoading] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<{ mulNo: string; paidAt: string } | null>(null);
  const [photoUploadChoice, setPhotoUploadChoice] = useState<"yes" | "no">(
    "no",
  );
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);

  // 전체 선택 함수
  const handleSelectAll = () => {
    const allCerts = CERTIFICATE_CATEGORIES.flatMap((cat) => cat.options);
    setFormData((prev) => ({
      ...prev,
      certificates: allCerts,
    }));
  };

  // 전체 해제 함수
  const handleDeselectAll = () => {
    setFormData((prev) => ({
      ...prev,
      certificates: [],
    }));
  };

  // 카테고리 전체 토글 (모두 선택 / 모두 해제)
  const handleToggleCategoryAll = (idx: number) => {
    const opts = CERTIFICATE_CATEGORIES[idx].options;
    setFormData((prev) => {
      const allSelected = opts.every((o) => prev.certificates.includes(o));
      return {
        ...prev,
        certificates: allSelected
          ? prev.certificates.filter((c) => !opts.includes(c))
          : [
              ...prev.certificates,
              ...opts.filter((o) => !prev.certificates.includes(o)),
            ],
      };
    });
  };

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    birth_prefix: "",
    address: "", // 전체 주소
    addressMain: "", // 기본주소
    addressDetail: "", // 상세주소
    postalCode: "", // 우편번호
    certificates: [] as string[],
    cash_receipt: "",
    photo: null as File | null,
    courseCount: "",
  });

  // 파일 이름 안전하게 변환
  function sanitizeFileName(name: string) {
    return name
      .replace(/[^a-zA-Z0-9._-]/g, "_") // 한글, 특수문자, 공백 모두 언더스코어로 대체
      .replace(/_+/g, "_"); // 연속된 언더스코어는 하나로
  }
  const handleCertToggle = (cert: string) => {
    setFormData((prev) => {
      const isSelected = prev.certificates.includes(cert);
      let newCerts = isSelected
        ? prev.certificates.filter((c) => c !== cert)
        : [...prev.certificates, cert];

      // 같은 자격증이 다른 카테고리에 있는지 확인하고 함께 처리
      if (!isSelected) {
        // 선택 시: 같은 자격증이 다른 카테고리에 있으면 모두 추가
        CERTIFICATE_CATEGORIES.forEach((cat) => {
          if (cat.options.includes(cert) && !newCerts.includes(cert)) {
            if (!newCerts.includes(cert)) {
              newCerts.push(cert);
            }
          }
        });
      } else {
        // 해제 시: 같은 자격증 모두 제거
        newCerts = newCerts.filter((c) => c !== cert);
      }

      return { ...prev, certificates: [...new Set(newCerts)] };
    });
  };

  // 연락처 포맷팅 함수 (010-XXXX-XXXX 형식)
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7)
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 생년월일 포맷팅 함수 (YYMMDD 형식)
  const formatBirthDate = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    return numbers.slice(0, 6);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const supabase = createClient();
    let photo_url = null;

    try {
      if (formData.photo) {
        const safeName = sanitizeFileName(formData.photo.name);
        const { data, error: uploadError } = await supabase.storage
          .from("photos")
          .upload(`cert_photos/${Date.now()}_${safeName}`, formData.photo);
        if (uploadError) throw uploadError;
        photo_url = data?.path;
      }

      // 결제 금액 계산 (과목 수 * 100,000원)
      const courseCount = parseInt(formData.courseCount) || 0;
      const amount = courseCount * 100000;
      const orderId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 자격증 신청 + 결제 정보 함께 저장 (서버 API 경유 - RLS 우회)
      const appResponse = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          contact: formData.contact,
          birth_prefix: formData.birth_prefix,
          address: formData.address,
          address_main: formData.addressMain,
          address_detail: formData.addressDetail,
          certificates: formData.certificates,
          cash_receipt: formData.cash_receipt,
          photo_url,
          order_id: orderId,
          amount: amount,
          payment_status: "pending",
          source: "prepayment",
        }),
      });

      const appResult = await appResponse.json();
      if (!appResponse.ok) throw new Error(appResult.error || "신청 저장 실패");

      // 서버 엔드포인트로 PayApp 결제 요청 (CORS 우회)
      try {
        // 결제 처리 중 상태 저장 (중복 이동 방지)
        if (typeof window !== "undefined") {
          sessionStorage.setItem("paymentProcessing", "true");
        }

        const paymentResponse = await fetch("/api/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            goodname: `자격증 취득 신청 (${courseCount}과정)`,
            price: courseCount * 100000,
            recvphone: formData.contact,
            recvname: formData.name,
            var1: orderId,
          }),
        });

        const responseData = await paymentResponse.json();
        setLoading(false);

        if (responseData.success && responseData.data?.payurl) {
          // 모바일 기기 감지
          const isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent,
            );

          if (isMobile) {
            // 모바일: 직접 결제 페이지로 이동 (팝업 불가)
            window.location.href = responseData.data.payurl;
          } else {
            // 데스크톱: 팝업으로 결제창 열기
            const paymentWindow = window.open(
              responseData.data.payurl,
              "payapp_payment",
              "width=800,height=900,left=200,top=100",
            );

            if (!paymentWindow) {
              // 팝업 차단된 경우 새 탭으로 열기
              window.location.href = responseData.data.payurl;
            } else {
              // 팝업이 닫힐 때까지 체크 (타임아웃 없음 - 사용자가 결제를 완료할 때까지 대기)
              let popupClosing = false;

              const checkPopupClosed = setInterval(() => {
                try {
                  // 팝업의 URL 확인 (팝업이 결제 완료 페이지로 이동했는지 확인)
                  if (paymentWindow && !paymentWindow.closed) {
                    try {
                      // 크로스도메인 체크 - 같은 도메인이면 URL 확인 가능
                      const popupUrl = paymentWindow.location.href;
                      if (
                        popupUrl.includes("?payment=success")
                      ) {
                        // 결제 완료 페이지 도달 - 팝업 닫기 신호 전송
                        if (!popupClosing) {
                          popupClosing = true;
                          console.log("Payment completed, closing popup");
                          clearInterval(checkPopupClosed);
                          sessionStorage.removeItem("paymentProcessing");
                          paymentWindow.close();
                          // 즉시 부모 페이지 이동 (로딩 스크린 표시됨)
                          window.location.href =
                            window.location.pathname +
                            "?payment=success&step=3";
                        }
                      }
                    } catch (e) {
                      // 크로스도메인 에러 - 팝업이 다른 도메인에 있음 (정상)
                      // 아무것도 하지 않고 계속 체크
                    }
                  } else if (paymentWindow && paymentWindow.closed) {
                    // 팝업이 닫혔으면 interval 정리하고 대기 상태로 복귀
                    clearInterval(checkPopupClosed);
                    console.log("Popup closed by user");
                    sessionStorage.removeItem("paymentProcessing");
                    // 사용자가 팝업을 닫은 경우 메인 페이지로 복귀 (결제 취소)
                    window.location.href = window.location.pathname;
                  }
                } catch (err) {
                  console.error("Error checking popup:", err);
                }
              }, 500);
            }
          }
        } else {
          throw new Error(responseData.error || "결제 요청 실패");
        }
      } catch (err: any) {
        setLoading(false);
        sessionStorage.removeItem("paymentProcessing");
        throw new Error(`결제 요청 실패: ${err.message}`);
      }
    } catch (err: any) {
      alert("오류가 발생했습니다: " + err.message);
      sessionStorage.removeItem("paymentProcessing");
      setLoading(false);
    }
  };

  // 연락처 유효성 검사 (010-XXXX-XXXX 형식)
  const isPhoneValid = /^01[0-9]-\d{3,4}-\d{4}$/.test(formData.contact);

  const isFormValid =
    formData.name &&
    isPhoneValid &&
    formData.birth_prefix.length === 6 &&
    formData.addressMain &&
    formData.certificates.length > 0 &&
    privacyAgreed;

  // 결제 완료 후 URL 파라미터에서 step 감지
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const stepParam = params.get("step");
      const paymentParam = params.get("payment");

      console.log("URL params detected:", {
        stepParam,
        paymentParam,
        search: window.location.search,
        fullUrl: window.location.href
      });

      // step=3이 URL에 있으면 무조건 step 3으로 설정 (결제 완료)
      // payment=success가 있거나 step=3만 있어도 결제 완료로 간주
      if (stepParam === "3") {
        console.log("Setting step to 3 - Payment completed (stepParam=3 detected)");
        sessionStorage.removeItem("paymentProcessing");
        sessionStorage.setItem("paymentProcessed", "true");
        // localStorage에서 결제 정보 읽기
        const mulNo = localStorage.getItem("payment_mul_no") || "";
        const paidAt = localStorage.getItem("payment_date") || new Date().toISOString();
        if (mulNo || paidAt) {
          setPaymentInfo({ mulNo, paidAt });
          localStorage.removeItem("payment_mul_no");
          localStorage.removeItem("payment_date");
        }
        setStep(3);
        setIsInitializing(false);
        // URL 파라미터 제거 (step 설정 후)
        setTimeout(() => {
          window.history.replaceState({}, "", window.location.pathname);
        }, 100);
      } else if (paymentParam === "failed") {
        // 결제 실패 처리
        console.log("Payment failed");
        sessionStorage.removeItem("paymentProcessing");
        sessionStorage.removeItem("paymentProcessed");
        const message = params.get("message");
        alert(`결제가 실패했습니다.\n${message || "다시 시도해주세요."}`);
        setIsInitializing(false);
        // URL 파라미터 제거 (alert 후)
        setTimeout(() => {
          window.history.replaceState({}, "", window.location.pathname);
        }, 100);
      } else {
        // 일반 페이지 로드
        console.log("Normal page load - no payment params");
        setIsInitializing(false);
      }
    }
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Image
          src="/logo.png"
          alt="로고"
          width={130}
          height={34}
          className={styles.logo}
        />
      </header>

      {isInitializing && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #e5e7eb",
              borderTop: "4px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ color: "#6b7280", fontSize: "16px" }}>처리 중...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isInitializing && step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.stepWrapper}
          >
            <div className={styles.infoSection}>
              <div className={styles.infoInner}>
                <div style={{ marginBottom: "36px" }}>
                  <h1
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                      color: "#111827",
                      lineHeight: "1.3",
                    }}
                  >
                    자격증 연계 신청
                  </h1>
                </div>
                <StepIndicator step={step} />
              </div>
              <button
                className={styles.bottomButton}
                onClick={() => setStep(2)}
              >
                다음
              </button>
            </div>
          </motion.div>
        )}

        {!isInitializing && step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.stepWrapper}
            style={{ display: "flex", flexDirection: "column" }}
          >
          <div style={{ marginBottom: "36px" }}>
                  <h1
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                      color: "#111827",
                      lineHeight: "1.3",
                    }}
                  >
                    자격증 연계 신청
                  </h1>
                </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                이름
                <span className={styles.requiredMark}>*</span>
              </label>
              <input
                type="text"
                className={styles.inputField}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="성함을 입력해주세요"
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                연락처
                <span className={styles.requiredMark}>*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                className={styles.inputField}
                style={{
                  borderColor:
                    formData.contact && !isPhoneValid ? "#ef4444" : undefined,
                  backgroundColor:
                    formData.contact && !isPhoneValid ? "#fee2e2" : undefined,
                }}
                value={formData.contact}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: formatPhoneNumber(e.target.value),
                  })
                }
                placeholder="010-0000-0000"
                maxLength={13}
              />
              {formData.contact && !isPhoneValid && (
                <p
                  style={{
                    color: "#dc2626",
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  010-XXXX-XXXX 형식으로 입력해주세요
                </p>
              )}
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                과목 수
                <span className={styles.requiredMark}>*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                className={styles.inputField}
                value={formData.courseCount}
                onChange={(e) => {
                  const numbers = e.target.value.replace(/[^0-9]/g, "");
                  setFormData({ ...formData, courseCount: numbers });
                }}
                placeholder="신청할 과목 수를 입력해주세요"
              />
              {formData.courseCount && parseInt(formData.courseCount) > 0 && (
                <p
                  style={{
                    color: "#2563eb",
                    fontSize: "14px",
                    fontWeight: "600",
                    marginTop: "8px",
                  }}
                >
                  결제 금액: {(parseInt(formData.courseCount) * 100000).toLocaleString()}원
                  <span style={{ color: "#6B7280", fontWeight: "400", fontSize: "12px", marginLeft: "8px" }}>
                    ({formData.courseCount}과정 × 100,000원)
                  </span>
                </p>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: "auto",
                paddingTop: 32,
                justifyContent: "center",
              }}
            >
              <button
                className={styles.bottomButton}
                disabled={
                  !formData.name ||
                  !isPhoneValid ||
                  !formData.courseCount ||
                  parseInt(formData.courseCount) <= 0 ||
                  loading
                }
                onClick={handleSubmit}
              >
                {loading ? "처리 중..." : "결제하기"}
              </button>
            </div>
          </motion.div>
        )}

        {!isInitializing && step === 3 && (
          <motion.div
            key="step3"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={styles.stepWrapper}
            style={{ textAlign: "center", justifyContent: "center" }}
          >
            <Image
              src="/complete-check.png"
              alt="완료"
              width={240}
              height={240}
              style={{ margin: "0 auto 24px" }}
            />
            <h1 className={styles.title}>결제가 완료되었습니다!</h1>
            {paymentInfo && (
              <div style={{
                marginTop: "24px",
                padding: "16px 24px",
                backgroundColor: "#f9fafb",
                borderRadius: "12px",
                textAlign: "left",
                display: "inline-block",
                minWidth: "260px",
              }}>
                <div style={{ marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>결제일</span>
                  <p style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: 600, color: "#111827" }}>
                    {new Date(paymentInfo.paidAt).toLocaleString("ko-KR", {
                      year: "numeric", month: "2-digit", day: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                {paymentInfo.mulNo && (
                  <div>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>결제번호</span>
                    <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 600, color: "#111827", fontFamily: "monospace" }}>
                      {paymentInfo.mulNo}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 자격증 선택 모달 */}
      {showCertModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowCertModal(false)}
        >
          <div
            className={styles.certModalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.certModalHeader}>
              <h3 className={styles.certModalTitle}>자격증</h3>
              <button
                className={styles.certModalCloseButton}
                onClick={() => setShowCertModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.certModalBody}>
              {/* 좌측: 카테고리 리스트 */}
              <div className={styles.certCategoryList}>
                {CERTIFICATE_CATEGORIES.map((cat, idx) => (
                  <button
                    key={`category-${idx}`}
                    className={`${styles.certCategoryItem} ${idx === selectedCategoryIdx ? styles.certCategoryItemActive : styles.certCategoryItemInactive}`}
                    onClick={() => setSelectedCategoryIdx(idx)}
                  >
                    <span style={{ whiteSpace: "pre-line" }}>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* 우측: 자격증 목록 */}
              <div className={styles.certSelectAreaWrapper}>
                <div className={styles.certListWrapper}>
                  <div className={styles.certCategorySection}>
                    <div className={styles.certListContainer}>
                      {/* 카테고리 전체 토글 버튼 */}
                      <button
                        key={`all-${selectedCategoryIdx}`}
                        onClick={() =>
                          handleToggleCategoryAll(selectedCategoryIdx)
                        }
                        className={`${styles.certListItem} ${CERTIFICATE_CATEGORIES[selectedCategoryIdx].options.every((o) => formData.certificates.includes(o)) ? styles.certListItemSelected : ""}`}
                      >
                        <span>전체</span>
                        {CERTIFICATE_CATEGORIES[
                          selectedCategoryIdx
                        ].options.every((o) =>
                          formData.certificates.includes(o),
                        ) && <span>✓</span>}
                      </button>

                      {CERTIFICATE_CATEGORIES[selectedCategoryIdx].options.map(
                        (opt) => (
                          <button
                            key={opt}
                            onClick={() => handleCertToggle(opt)}
                            className={`${styles.certListItem} ${formData.certificates.includes(opt) ? styles.certListItemSelected : ""}`}
                          >
                            <span>{opt}</span>
                            {formData.certificates.includes(opt) && (
                              <span>✓</span>
                            )}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 선택된 자격증 표시 (모달 하단, 전체 너비) */}
            <div className={styles.selectedCertContainer}>
              <div className={styles.selectedCertLabel}>
                <span>
                  선택한 자격증{" "}
                  <span className={styles.selectedCertCount}>
                    {formData.certificates.length}
                  </span>
                </span>
                <span className={styles.selectedCertPrice}>
                  총{" "}
                  <span className={styles.selectedCertPriceNumber}>
                    {(formData.certificates.length * 100000).toLocaleString()}
                  </span>{" "}
                  원
                </span>
              </div>
              <div className={styles.selectedCertList}>
                {formData.certificates.map((cert) => (
                  <div key={cert} className={styles.selectedCertTag}>
                    <span>{cert}</span>
                    <button
                      className={styles.removeTagButton}
                      onClick={() => handleCertToggle(cert)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {formData.certificates.length === 0 && (
                  <div className={styles.noCertMessage}>
                    선택한 자격증이 없습니다
                  </div>
                )}
              </div>
            </div>

            <div className={styles.certModalFooter}>
              <button
                className={styles.certModalResetButton}
                onClick={handleDeselectAll}
              >
                <div className={styles.resetButtonContent}>
                  <span>초기화</span>
                  <div className={styles.resetIcon}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M8 2.03321C6.33627 2.03326 4.9234 2.61176 3.76758 3.76758C2.61175 4.92341 2.03326 6.33627 2.0332 8C2.03324 9.66366 2.61189 11.0766 3.76758 12.2324C4.92338 13.3881 6.33634 13.9667 8 13.9668C9.15476 13.9668 10.206 13.6683 11.1514 13.0713C12.0942 12.4758 12.8209 11.6814 13.3301 10.6895C13.4449 10.4884 13.4505 10.2715 13.3535 10.0498C13.2569 9.82916 13.0935 9.6795 12.8691 9.60938C12.6659 9.54261 12.463 9.5463 12.2646 9.6211C12.0646 9.69663 11.9086 9.83209 11.7998 10.0225L11.7988 10.0244C11.4289 10.718 10.9062 11.2704 10.2305 11.6826C9.55588 12.0941 8.81313 12.2998 8 12.2998C6.8041 12.2998 5.79066 11.8824 4.9541 11.0459C4.11766 10.2093 3.69926 9.1959 3.69922 8C3.69928 6.80403 4.11752 5.79069 4.9541 4.9541C5.79069 4.11752 6.80403 3.69928 8 3.69922C8.77737 3.69925 9.49674 3.89055 10.1592 4.27246C10.7709 4.62529 11.261 5.10193 11.6338 5.69922H9.4668C9.23471 5.69928 9.03476 5.78025 8.87402 5.94043C8.71317 6.10077 8.63235 6.30061 8.63281 6.53321C8.63336 6.76551 8.71437 6.96565 8.87402 7.12598C9.03393 7.2863 9.23401 7.36616 9.4668 7.36621H13.1338C13.3662 7.36664 13.5662 7.28728 13.7266 7.12696C13.887 6.96653 13.9668 6.76618 13.9668 6.53321V2.86621C13.9677 2.6342 13.8881 2.43412 13.7275 2.27344C13.5667 2.11272 13.3655 2.03266 13.1328 2.03321C12.9007 2.03391 12.7012 2.1138 12.541 2.27344C12.3805 2.43339 12.2999 2.63329 12.2998 2.86621V3.88672C11.7771 3.32321 11.1639 2.88126 10.4609 2.56348C9.67821 2.20974 8.85733 2.03323 8 2.03321Z"
                        fill="#656565"
                      />
                    </svg>
                  </div>
                </div>
              </button>
              <button
                className={styles.certModalConfirmButton}
                onClick={() => setShowCertModal(false)}
              >
                선택하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사진 미리보기 모달 */}
      {showPhotoPreview && formData.photo && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => setShowPhotoPreview(false)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90%",
              maxHeight: "90%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={URL.createObjectURL(formData.photo)}
              alt="증명 사진 미리보기"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
            <button
              onClick={() => setShowPhotoPreview(false)}
              style={{
                position: "absolute",
                top: "-40px",
                right: 0,
                background: "none",
                border: "none",
                fontSize: "32px",
                cursor: "pointer",
                color: "#ffffff",
                padding: 0,
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 개인정보처리방침 모달 */}
      {showPrivacyModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            className={styles.modalPrivacy}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalPrivacyHeader}>
              <h3 className={styles.modalPrivacyTitle}>개인정보처리방침</h3>
              <button
                className={styles.modalCloseButton}
                onClick={() => setShowPrivacyModal(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalPrivacyContent}>
              <div className={styles.modalPrivacyScroll}>
                <p className={styles.modalPrivacyItem}>
                  <strong>1. 개인정보 수집 및 이용 목적</strong>
                  <br />
                  사회복지사 자격 취득 상담 진행, 문의사항 응대
                  <br />
                  개인정보는 상담 서비스 제공을 위한 목적으로만 수집 및
                  이용되며, 동의 없이 제3자에게 제공되지 않습니다
                </p>
                <p className={styles.modalPrivacyItem}>
                  <strong>2. 수집 및 이용하는 개인정보 항목</strong>
                  <br />
                  필수 - 이름, 연락처(휴대전화번호), 생년월일, 주소, 자격증종류
                  선택 - 증명사진, 상세주소
                </p>
                <p className={styles.modalPrivacyItem}>
                  <strong>3. 보유 및 이용 기간</strong>
                  <br />
                  법령이 정하는 경우를 제외하고는 수집일로부터 1년 또는 동의
                  철회 시까지 보유 및 이용합니다.
                </p>
                <p className={styles.modalPrivacyItem}>
                  <strong>4. 동의 거부 권리</strong>
                  <br />
                  신청자는 동의를 거부할 권리가 있습니다. 단, 동의를 거부하는
                  경우 상담 서비스 이용이 제한됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CertificateApplicationForm({
  clickSource = "direct",
}: {
  clickSource?: string;
}) {
  return (
    <Suspense fallback={<div>로딩중...</div>}>
      <StepFlowContent clickSource={clickSource} />
    </Suspense>
  );
}
