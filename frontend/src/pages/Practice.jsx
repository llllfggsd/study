import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'

function Practice() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'order'

  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get(`/categories/${id}/practice?mode=${mode}`)
        setQuestions(res.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [id, mode])

  const goNext = useCallback(() => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1)
      setSelected(null)
      setSubmitted(false)
      setResult(null)
    }
  }, [current, questions.length])

  const handleSelect = async (option) => {
    if (submitted) return
    setSelected(option)
    try {
      const q = questions[current]
      const res = await api.post(`/questions/${q.id}/answer`, { answer: option })
      setResult(res.data)
      setSubmitted(true)
      if (res.data.is_correct) {
        if (current < questions.length - 1) {
          setTimeout(goNext, 1000)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="loading">加载中...</div>
  if (questions.length === 0) return (
    <div className="practice-page">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(`/categories/${id}`)}>← 返回</button>
      </div>
      <div className="empty-state">暂无题目，请先导入题目</div>
    </div>
  )

  const q = questions[current]
  const options = [
    { key: 'A', text: q.option_a },
    { key: 'B', text: q.option_b },
    { key: 'C', text: q.option_c },
    { key: 'D', text: q.option_d },
  ]

  const getOptionClass = (key) => {
    let cls = 'option-item'
    if (submitted) {
      cls += ' disabled'
      if (key === result.correct_answer) cls += ' correct'
      else if (key === selected && !result.is_correct) cls += ' wrong'
    } else if (key === selected) {
      cls += ' selected'
    }
    return cls
  }

  return (
    <div className="practice-page">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(`/categories/${id}`)}>← 返回</button>
        <span>{mode === 'random' ? '随机练习' : '顺序练习'}</span>
        <div />
      </div>

      <div className="practice-progress">
        第 {current + 1} / {questions.length} 题
      </div>

      <div className="question-card">
        <div className="question-text">{q.question}</div>
        <ul className="options-list">
          {options.map(({ key, text }) => (
            <li key={key} className={getOptionClass(key)} onClick={() => handleSelect(key)}>
              {key}. {text}
            </li>
          ))}
        </ul>

        {submitted && result && !result.is_correct && (
          <>
            <div className="result-box wrong">
              <p>你的答案: {result.user_answer}，正确答案: {result.correct_answer}</p>
              {result.explanation && (
                <div className="explanation">解析: {result.explanation}</div>
              )}
            </div>
            <div className="practice-actions">
              {current < questions.length - 1 ? (
                <button className="btn btn-primary" onClick={goNext}>下一题</button>
              ) : (
                <button className="btn btn-success" onClick={() => navigate(`/categories/${id}`)}>
                  练习完成，返回分类
                </button>
              )}
            </div>
          </>
        )}

        {submitted && result && result.is_correct && current >= questions.length - 1 && (
          <div className="practice-actions">
            <button className="btn btn-success" onClick={() => navigate(`/categories/${id}`)}>
              练习完成，返回分类
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Practice
