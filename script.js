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

let currentStep = 0;


function updateStep() {

  steps.forEach(function (step, index) {

    if (index === currentStep) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }

  });

  const progressValues = [33, 66, 100];

  const progress =
    progressValues[currentStep];

  progressBar.style.width =
    progress + '%';

  progressText.textContent =
    progress + '%';

}


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


const phoneInput =
  form.elements.phone;


phoneInput.addEventListener(
  'input',
  function (event) {

    const numbers =
      event.target.value
        .replace(/\D/g, '')
        .slice(0, 11);

    if (numbers.length < 4) {

      event.target.value =
        numbers;

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


function showToast(
  message,
  isError
) {

  toast.textContent =
    message;

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


form.addEventListener(
  'submit',
  async function (event) {

    event.preventDefault();

    if (!validateCurrentStep()) {
      return;
    }

    submitButton.disabled = true;

    submitButton.textContent =
      '접수 중...';


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
          result.message
          || '접수 처리 중 오류가 발생했습니다.'
        );

      }


      showToast(
        '상담 신청이 정상적으로 접수되었습니다.',
        false
      );


      form.reset();

      currentStep = 0;

      updateStep();


    } catch (error) {

      showToast(
        error.message
        || '잠시 후 다시 시도해주세요.',
        true
      );

    } finally {

      submitButton.disabled = false;

      submitButton.textContent =
        '상담 신청 완료';

    }

  }
);


updateStep();
