// main.js에 추가 및 수정할 부분

// [추가] 브라우저 저장소(localStorage)에 카테고리별로 데이터 누적 저장하기
function saveToStorage(resultData) {
  const timestamp = new Date().toLocaleString();

  // 1. 전체 기록 통째로 저장 (복기용)
  let historyStorage = JSON.parse(localStorage.getItem('det_history')) || [];
  historyStorage.push({ date: timestamp, data: resultData });
  localStorage.setItem('det_history', JSON.stringify(historyStorage));

  // 2. 단어 및 표현 따로 누적 저장 (나만의 단어장)
  if (resultData.vocabulary && resultData.vocabulary.length > 0) {
    let vocabStorage = JSON.parse(localStorage.getItem('det_vocab')) || [];
    vocabStorage = vocabStorage.concat(resultData.vocabulary);
    localStorage.setItem('det_vocab', JSON.stringify(vocabStorage));
  }

  // 3. 문법(Grammar Focus) 따로 누적 저장 (오답노트)
  if (resultData.grammar_focus && resultData.grammar_focus.length > 0) {
    let grammarStorage = JSON.parse(localStorage.getItem('det_grammar')) || [];
    grammarStorage = grammarStorage.concat(resultData.grammar_focus);
    localStorage.setItem('det_grammar', JSON.stringify(grammarStorage));
  }
}

// [수정] 제출 버튼 로직
submitBtn.onclick = async () => {
  // ... (기존 로직 동일) ...
  const result = await evaluateWriting(userInput.value);
  
  if (result) {
    // API 결과를 화면에 뿌려주기 전에 로컬스토리지에 저장!
    saveToStorage(result);

    document.getElementById('question-section').classList.add('hidden');
    document.getElementById('result-section').classList.remove('hidden');
    
    // (이곳에 화면에 결과 렌더링하는 기존 코드 유지)
    renderResultUI(result); 
  }
};
