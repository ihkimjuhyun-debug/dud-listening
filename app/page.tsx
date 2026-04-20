'use client';

import { useState, useEffect } from 'react';

// Vercel 빌드 통과를 위한 완벽한 타입(Type) 정의
interface Vocabulary { word: string; meaning: string; usage: string; }
interface Idiom { phrase: string; meaning: string; usage: string; }
interface Writing { original: string; corrected: string; score: number; feedback: string; }
interface Spoken { expression: string; situation: string; }

interface StorageData {
  vocabulary: Vocabulary[];
  idioms: Idiom[];
  writing: Writing[];
  spoken: Spoken[];
}

export default function EnglishStudyApp() {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  const [loading, setLoading] = useState(false);
  
  const [storage, setStorage] = useState<StorageData>({
    vocabulary: [], idioms: [], writing: [], spoken: []
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('study_hub_master');
      if (saved) setStorage(JSON.parse(saved));
    } catch (error) {
      console.error("Storage loading error:", error);
    }
  }, []);

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "서버 통신 에러");
      }
      
      // 안전한 데이터 병합
      const updated: StorageData = {
        vocabulary: [...(data.vocabulary || []), ...storage.vocabulary],
        idioms: [...(data.idioms || []), ...storage.idioms],
        writing: [...(data.writing || []), ...storage.writing],
        spoken: [...(data.spoken || []), ...storage.spoken],
      };
      
      setStorage(updated);
      localStorage.setItem('study_hub_master', JSON.stringify(updated));
      setInputText('');
      setActiveTab('writing');
    } catch (error: any) {
      console.error(error);
      alert(`분석 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <header className="py-10 text-center">
          <h1 className="text-4xl font-black tracking-tight">STUDY HUB <span className="text-blue-600">PRO</span></h1>
          <p className="text-slate-500 mt-2">무결점 자동 분류 시스템</p>
        </header>

        <nav className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 mb-8">
          {['input', 'voca', 'writing', 'spoken'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}>
              {t === 'input' ? '입력' : t === 'voca' ? '단어/숙어' : t === 'writing' ? '문장교정' : '구어표현'}
            </button>
          ))}
        </nav>

        <main className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 min-h-[500px]">
          {activeTab === 'input' && (
            <div className="space-y-4">
              <textarea className="w-full h-72 p-6 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-lg outline-none"
                placeholder="학습한 내용을 복사해서 붙여넣으세요..."
                value={inputText} onChange={(e) => setInputText(e.target.value)} />
              <button onClick={handleProcess} disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 transition-all disabled:bg-slate-300">
                {loading ? "AI 분석 및 저장 중..." : "종합 분석 시작"}
              </button>
            </div>
          )}

          {activeTab === 'voca' && (
            <div className="grid md:grid-cols-2 gap-8">
              <section>
                <h3 className="text-lg font-bold text-blue-600 mb-4 border-b pb-2">단어장</h3>
                {storage.vocabulary.map((v, i) => (
                  <div key={i} className="mb-3 p-4 bg-blue-50 rounded-xl">
                    <p className="font-bold text-blue-900">{v.word} <span className="text-sm font-normal text-blue-400">| {v.meaning}</span></p>
                    <p className="text-xs text-blue-600 mt-2 italic">{v.usage}</p>
                  </div>
                ))}
              </section>
              <section>
                <h3 className="text-lg font-bold text-indigo-600 mb-4 border-b pb-2">숙어 & Chunks</h3>
                {storage.idioms.map((id, i) => (
                  <div key={i} className="mb-3 p-4 bg-indigo-50 rounded-xl">
                    <p className="font-bold text-indigo-900">{id.phrase}</p>
                    <p className="text-sm text-indigo-700">{id.meaning}</p>
                    <p className="text-xs text-indigo-500 mt-2 italic">{id.usage}</p>
                  </div>
                ))}
              </section>
            </div>
          )}

          {activeTab === 'writing' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-emerald-600 mb-2 border-b pb-2">라이팅 교정 및 평가</h3>
              {storage.writing.map((w, i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="mb-2"><span className="bg-emerald-100 px-3 py-1 rounded-full text-xs font-black text-emerald-700">SCORE: {w.score}/10</span></div>
                  <p className="text-rose-400 line-through text-sm mb-1">{w.original}</p>
                  <p className="text-slate-900 font-bold text-lg mb-3">→ {w.corrected}</p>
                  <p className="text-xs text-slate-500 bg-white p-3 rounded-lg shadow-sm"><strong>Feedback:</strong> {w.feedback}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'spoken' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-orange-600 mb-2 border-b pb-2">실전 구어체 표현</h3>
              {storage.spoken.map((s, i) => (
                <div key={i} className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
                  <p className="text-orange-900 font-bold text-lg">&quot;{s.expression}&quot;</p>
                  <p className="text-sm text-orange-700 mt-1">상황: {s.situation}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
