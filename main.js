const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const IMAGE_URL = "https://source.unsplash.com/random/800x600/?nature,city,people";

const targetImg = document.getElementById('target-image');
const submitBtn = document.getElementById('submit-btn');
const userInput = document.getElementById('user-input');

// 1. 랜덤 사진 세팅
targetImg.src = IMAGE_URL;

// 2. AI 채점 로직
async function evaluateWriting(text) {
  const prompt = `
    You are a Duolingo English Test rater. Evaluate this description: "${text}"
    Return JSON only: {
      "score": number(10-160),
      "feedback": "string in Korean",
      "corrections": [{"original": "...", "better": "..."}]
    }`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

submitBtn.onclick = async () => {
  submitBtn.innerText = "Analyzing...";
  const result = await evaluateWriting(userInput.value);
  
  document.getElementById('question-section').classList.add('hidden');
  document.getElementById('result-section').classList.remove('hidden');
  document.getElementById('score-value').innerText = result.score;
  document.getElementById('feedback-msg').innerText = result.feedback;
  submitBtn.style.display = "none";
};
