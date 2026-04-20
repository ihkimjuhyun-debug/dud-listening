import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', // 에러 방지용 빈 문자열 처리
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Vercel 서버에 API 키가 등록되지 않았습니다." }, { status: 500 });
    }

    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "분석할 텍스트가 없습니다." }, { status: 400 });
    }

    const systemPrompt = `
      당신은 영어 학습 데이터 분석 전문가입니다. 입력된 텍스트를 분석하여 반드시 아래 JSON 구조로만 응답하세요.
      학습 데이터는 100% '보편적인 일상 대화(Universal Daily Conversation)'를 기준으로 하며, 개인적인 정보는 배제합니다.

      JSON 구조:
      {
        "vocabulary": [{ "word": "단어", "meaning": "뜻", "usage": "예문" }],
        "idioms": [{ "phrase": "숙어/구동사", "meaning": "뜻", "usage": "예문" }],
        "writing": [{ "original": "원문", "corrected": "교정문", "score": 10, "feedback": "피드백" }],
        "spoken": [{ "expression": "구어표현", "situation": "활용상황" }]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("AI가 응답을 생성하지 못했습니다.");
    }

    return NextResponse.json(JSON.parse(content));
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "분석 중 서버 오류가 발생했습니다." }, { status: 500 });
  }
}
