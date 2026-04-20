// main.js
// 기존의 import.meta.env.VITE_GEMINI_API_KEY 코드는 삭제합니다.

const IMAGE_URL = "[https://source.unsplash.com/random/800x600/?nature,city,people](https://source.unsplash.com/random/800x600/?nature,city,people)";

const targetImg = document.getElementById('target-image');
const submitBtn = document.getElementById('submit-btn');
const userInput = document.getElementById('user-input');

// 1. 랜덤 사진 세팅
targetImg.src = IMAGE_URL;

// 2. Vercel 백엔드로 평가 요청
async function evaluateWriting(text) {
  try {
    // 구글 API가 아닌, 우리가 만든 api/evaluate.js 로 요청을 보냄
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    });

    if (!response.ok) {
      throw new Error('Server error');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error);
    alert("평가 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    return null;
  }
}

submitBtn.onclick = async () => {
  if (userInput.value.trim().length < 10) {
    alert("조금 더 길게 작성해주세요!");
    return;
  }

  submitBtn.innerText = "Analyzing...";
  submitBtn.disabled = true;

  const result = await evaluateWriting(userInput.value);
  
  if (result) {
    document.getElementById('question-section').classList.add('hidden');
    document.getElementById('result-section').classList.remove('hidden');
    document.getElementById('score-value').innerText = result.score;
    document.getElementById('feedback-msg').innerText = result.feedback;
    
    // 교정 내역 출력 (옵션)
    const correctionsDiv = document.getElementById('corrections');
    if (result.corrections && result.corrections.length > 0) {
      let correctionsHtml = "<h4>Corrections:</h4><ul>";
      result.corrections.forEach(c => {
        correctionsHtml += `<li><del>${c.original}</del> -> <b>${c.better}</b></li>`;
      });
      correctionsHtml += "</ul>";
      correctionsDiv.innerHTML = correctionsHtml;
    }
  }
  
  submitBtn.style.display = "none";
};
