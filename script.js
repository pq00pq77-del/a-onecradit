const form = document.getElementById('consultForm');

const steps = [
  ...document.querySelectorAll('.form-step')
];

const progressBar =
  document.getElementById('progressBar');

const progressText =
  document.getElementById('progressText');

const toast =
  document.getElementById('toast');

const submitButton =
  document.getElementById('submitButton');

const recentList =
  document.getElementById('recentList');

let currentStep = 0;


/* 신청 단계 변경 */
function updateStep() {
  steps.forEach(function (step, index) {
    if (index === currentStep) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });

  const progressValues = [33, 66, 100];
  const progress = progressValues[currentStep];

  if (progressBar) {
    progressBar.style.width = progress + '%';
  }

  if (progressText) {
    progressText.textContent = progress + '%';
  }
}


/* 현재 단계 필수 입력 확인 */
function validateCurrentStep() {
  const fields =
    steps[currentStep].querySelectorAll(
      'input, select, textarea'
    );

  for (const field of fields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }

  return true;
}


/* 다음 버튼 */
document
  .querySelectorAll('.next-button')
  .forEach(function (button) {
    button.addEventListener(
      'click',
      function () {
        if (!validateCurrentStep()) {
          return;
        }

        if (currentStep < steps.length - 1) {
          currentStep++;
        }

        updateStep();
      }
    );
  });


/* 이전 버튼 */
document
  .querySelectorAll('.previous-button')
  .forEach(function (button) {
    button.addEventListener(
      'click',
      function () {
        if (currentStep > 0) {
          currentStep--;
        }

        updateStep();
      }
    );
  });


/* 휴대폰번호 자동 하이픈 */
const phoneInput =
  form?.elements?.phone;

if (phoneInput) {
  phoneInput.addEventListener(
    'input',
    function (event) {
      const numbers =
        event.target.value
          .replace(/\D/g, '')
          .slice(0, 11);

      if (numbers.length < 4) {
        event.target.value = numbers;
      } else if (numbers.length < 8) {
        event.target.value =
          numbers.slice(0, 3)
          + '-'
          + numbers.slice(3);
      } else {
        event.target.value =
          numbers.slice(0, 3)
          + '-'
          + numbers.slice(3, 7)
          + '-'
          + numbers.slice(7);
      }
    }
  );
}


/* 화면 알림 */
function showToast(message, isError) {
  if (!toast) {
    return;
  }

  toast.textContent = message;

  if (isError) {
    toast.classList.add('error');
  } else {
    toast.classList.remove('error');
  }

  toast.classList.add('show');

  setTimeout(function () {
    toast.classList.remove('show');
  }, 3200);
}


/* 화면 출력 안전 처리 */
function escapeText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/* 접수 시간 표시 */
function formatRelativeTime(dateValue) {
  if (!dateValue) {
    return '';
  }

  const createdTime =
    new Date(dateValue).getTime();

  if (Number.isNaN(createdTime)) {
    return '';
  }

  const difference =
    Math.max(0, Date.now() - createdTime);

  const minutes =
    Math.floor(difference / 60000);

  if (minutes < 1) {
    return '방금 전';
  }

  if (minutes < 60) {
    return minutes + '분 전';
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return hours + '시간 전';
  }

  const days =
    Math.floor(hours / 24);

  return days + '일 전';
}


/* 상태별 CSS */
function getStatusClass(status) {
  if (status === '상담 완료') {
    return 'complete';
  }

  if (status === '상담 중') {
    return 'progress';
  }

  return 'waiting';
}


/* 최근 상담 목록 불러오기 */
async function loadRecentConsultations() {
  if (!recentList) {
    return;
  }

  try {
    const response = await fetch(
      '/api/recent?time=' + Date.now(),
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        '최근 상담 목록을 불러오지 못했습니다.'
      );
    }

    const items =
      Array.isArray(result)
        ? result
        : [];

    if (items.length === 0) {
      recentList.innerHTML = `
        <div class="recent-empty">
          아직 접수된 상담이 없습니다.
        </div>
      `;

      return;
    }

    recentList.innerHTML =
      items.map(function (item) {
        const maskedName =
          escapeText(item.name_masked || '고객**');

        const firstLetter =
          escapeText(
            String(item.name_masked || '고객')
              .charAt(0)
          );

        const job =
          escapeText(item.job || '기타');

        const amount =
          escapeText(item.amount || '상담 문의');

        const status =
          escapeText(item.status || '상담 대기');

        const statusClass =
          getStatusClass(item.status);

        const relativeTime =
          formatRelativeTime(item.created_at);

        return `
          <article class="recent-item">

            <div class="customer-info">

              <span class="customer-icon">
                ${firstLetter}
              </span>

              <div>
                <strong>
                  ${maskedName} 고객님
                </strong>

                <small>
                  ${job} · ${amount}
                  ${relativeTime
                    ? ' · ' + relativeTime
                    : ''}
                </small>
              </div>

            </div>

            <span
              class="consult-status ${statusClass}"
            >
              ${status}
            </span>

          </article>
        `;
      }).join('');

  } catch (error) {
    console.error(
      '최근 상담 불러오기 오류:',
      error
    );

    recentList.innerHTML = `
      <div class="recent-empty">
        최근 상담 현황을 불러오지 못했습니다.
      </div>
    `;
  }
}


/* 상담 신청 */
if (form) {
  form.addEventListener(
    'submit',
    async function (event) {
      event.preventDefault();

      if (!validateCurrentStep()) {
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = '접수 중...';

      const formData =
        new FormData(form);

      const data =
        Object.fromEntries(
          formData.entries()
        );

      try {
        const response =
          await fetch(
            '/api/submit',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify(data)
            }
          );

        const result =
          await response
            .json()
            .catch(function () {
              return {};
            });

        if (!response.ok) {
          throw new Error(
            result.message ||
            '접수 처리 중 오류가 발생했습니다.'
          );
        }

        showToast(
          '상담 신청이 정상적으로 접수되었습니다.',
          false
        );

        form.reset();

        currentStep = 0;

        updateStep();

        await loadRecentConsultations();

      } catch (error) {
        showToast(
          error.message ||
          '잠시 후 다시 시도해주세요.',
          true
        );

      } finally {
        submitButton.disabled = false;
        submitButton.textContent =
          '상담 신청 완료';
      }
    }
  );
}


/* 처음 사이트 열 때 실행 */
updateStep();
loadRecentConsultations();


/* 10초마다 실시간 새로고침 */
setInterval(
  loadRecentConsultations,
  10000
);
