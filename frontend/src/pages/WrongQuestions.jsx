import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

function WrongQuestions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [practicing, setPracticing] = useState(false)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)

  const fetchWrong = async () => {
    try {
      const res = await api.get(`/categories/${id}/wrong-questions`)
      setQuestions(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWrong()
  }, [id])

  const handleClear = async () => {
    if (!confirm('确定要清空本分类的错题记录吗？')) return
    try {
      await api.delete(`/categories/${id}/wrong-records`)
      setQuestions([])
    } catch (err) {
      console.error(err)
    }
  }

  const goNext = useCallback(() => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1)
      setSelected(null)
      setSubmitted(false)
      setResult(null)
    } else {
      setPracticing(false)
      setCurrent(0)
      setSelected(null)
      setSubmitted(false)
      setResult(null)
      fetchWrong()
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
        setTimeout(goNext, 1000)
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  if (practicing && questions.length > 0) {
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
          <button className="back-btn" onClick={() => { setPracticing(false); fetchWrong() }}>← 返回错题集</button>
          <span>错题练习</span>
          <div />
        </div>
        <div className="practice-progress">第 {current + 1} / {questions.length} 题</div>
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
                {result.explanation && <div className="explanation">解析: {result.explanation}</div>}
              </div>
              <div className="practice-actions">
                <button className="btn btn-primary" onClick={goNext}>
                  {current < questions.length - 1 ? '下一题' : '完成练习'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(`/categories/${id}`)}>← 返回</button>
        <h2 className="page-title" style={{ margin: 0 }}>错题集</h2>
        <div />
      </div>

      {questions.length === 0 ? (
        <div className="empty-state">暂无错题，继续加油！</div>
      ) : (
        <>
          <p style={{ marginBottom: 20, color: '#666' }}>共 {questions.length} 道错题</p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button className="btn btn-primary" onClick={() => setPracticing(true)}>开始错题练习</button>
            <button className="btn btn-danger" onClick={handleClear}>清空错题记录</button>
          </div>
          <div className="question-list">
            {questions.map((q, i) => (
              <div key={q.id} className="question-item">
                <span className="q-text">{i + 1}. {q.question}</span>
                <span className="q-answer">答案: {q.answer}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default WrongQuestions
