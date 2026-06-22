import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { buildOptions, isMulti } from '../utils/quiz'

function getEvaluation(score) {
  if (score === 100) return { text: '满分！太棒了！', color: '#34a853' }
  if (score >= 90) return { text: '非常优秀！', color: '#34a853' }
  if (score >= 80) return { text: '表现很好！', color: '#1a73e8' }
  if (score >= 70) return { text: '还不错，继续加油！', color: '#1a73e8' }
  if (score >= 60) return { text: '勉强及格，需要多练习', color: '#fbbc04' }
  return { text: '不及格，建议回顾错题', color: '#ea4335' }
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

function Exam() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('config')
  const [avail, setAvail] = useState({ single: 0, multiple: 0, total: 0 })
  const [count, setCount] = useState(50)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [examResult, setExamResult] = useState(null)
  const [reviewMap, setReviewMap] = useState({})
  const [cheating, setCheating] = useState(false)
  const [error, setError] = useState('')
  const startRef = useRef(Date.now())

  useEffect(() => {
    api.get(`/categories/${id}`).then((res) => {
      const s = res.data.single_count || 0
      const m = res.data.multiple_count || 0
      const total = res.data.question_count || s + m
      setAvail({ single: s, multiple: m, total })
      setCount(Math.min(50, total) || 1)
    }).catch(() => {})
  }, [id])

  const startExam = async () => {
    setError('')
    try {
      const res = await api.post(`/categories/${id}/exam/start`, { count: Number(count) })
      const qs = res.data.questions || []
      if (qs.length === 0) {
        setError('该分类暂无可用题目')
        return
      }
      setQuestions(qs)
      setCurrent(0)
      setAnswers({})
      startRef.current = Date.now()
      setPhase('exam')
    } catch (err) {
      setError(err.response?.data?.error || '开始考试失败')
    }
  }

  const handlePick = (q, key, multi) => {
    setAnswers((a) => {
      const cur = a[q.id] || []
      const next = multi
        ? (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key])
        : [key]
      return { ...a, [q.id]: next }
    })
  }

  const submitExam = async () => {
    const duration = Math.floor((Date.now() - startRef.current) / 1000)
    if (duration < questions.length) {
      setCheating(true)
      return
    }
    const payload = {}
    questions.forEach((q) => {
      payload[q.id] = (answers[q.id] || []).slice().sort().join('')
    })
    try {
      const res = await api.post(`/categories/${id}/exam/submit`, { answers: payload, duration })
      const map = {}
      ;(res.data.review || []).forEach((r) => { map[r.question_id] = r })
      setReviewMap(map)
      setExamResult(res.data)
      setPhase('result')
    } catch (err) {
      console.error(err)
      navigate(`/categories/${id}`)
    }
  }

  if (cheating) {
    return (
      <div className="practice-page">
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#128064;</div>
            <h2 style={{ color: '#ea4335', marginBottom: 12 }}>答题时间异常</h2>
            <p style={{ color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
              总用时少于 {questions.length} 秒，本次成绩不予记录
            </p>
            <button className="btn btn-danger" onClick={() => navigate(`/categories/${id}`)}>返回分类</button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'config') {
    const both = avail.single > 0 && avail.multiple > 0
    return (
      <div className="practice-page">
        <div className="detail-header">
          <button className="back-btn" onClick={() => navigate(`/categories/${id}`)}>← 返回</button>
          <h2 className="page-title" style={{ margin: 0 }}>考试</h2>
          <div />
        </div>
        <div className="question-card">
          <p style={{ marginBottom: 12, color: '#666' }}>
            题库共 {avail.total} 题（单选 {avail.single}，多选 {avail.multiple}）
          </p>
          {both && (
            <p style={{ marginBottom: 12, color: '#888', fontSize: 13 }}>
              同时包含单选与多选时，将按 单选 3 : 多选 2 的比例抽题。
            </p>
          )}
          <label style={{ display: 'block', marginBottom: 8 }}>考试题量</label>
          <input
            type="number" min={1} max={avail.total} value={count}
            onChange={(e) => setCount(e.target.value)}
            style={{ width: 120, padding: '8px 10px', fontSize: 16 }}
          />
          {error && <p className="error-msg">{error}</p>}
          <div className="practice-actions" style={{ marginTop: 20 }}>
            <button className="btn btn-primary" onClick={startExam} disabled={avail.total === 0}>开始考试</button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'result' && examResult) {
    const ev = getEvaluation(examResult.score)
    return (
      <div className="practice-page">
        <div className="result-page">
          <h2 style={{ marginBottom: 8 }}>考试完成</h2>
          <div className="result-score-circle" style={{ borderColor: ev.color }}>
            <div className="result-score-number" style={{ color: ev.color }}>{examResult.score}</div>
            <div className="result-score-label">分</div>
          </div>
          <div className="result-evaluation" style={{ color: ev.color }}>{ev.text}</div>
          <div className="result-stats">
            <div className="result-stat-item">
              <div className="result-stat-value">{examResult.correct_count}/{examResult.total_count}</div>
              <div className="result-stat-label">正确/总题数</div>
            </div>
            <div className="result-stat-item">
              <div className="result-stat-value">{formatDuration(examResult.duration)}</div>
              <div className="result-stat-label">用时</div>
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginBottom: 24 }} onClick={() => navigate(`/categories/${id}`)}>返回分类</button>

          <div className="question-list" style={{ textAlign: 'left' }}>
            {questions.map((q, i) => {
              const r = reviewMap[q.id] || {}
              const options = buildOptions(q)
              const correctSet = new Set((r.correct_answer || '').split(''))
              const yourSet = new Set((r.user_answer || '').split(''))
              return (
                <div key={q.id} className="question-card" style={{ marginBottom: 12 }}>
                  <div className="question-text">
                    <span className={`q-type-tag ${isMulti(q) ? 'multi' : 'single'}`}>{isMulti(q) ? '多选' : '单选'}</span>
                    <span style={{ color: r.is_correct ? '#34a853' : '#ea4335', marginRight: 6 }}>
                      {r.is_correct ? '✓' : '✗'}
                    </span>
                    {i + 1}. {q.question}
                  </div>
                  <ul className="options-list">
                    {options.map(({ key, text }) => {
                      let cls = 'option-item disabled'
                      if (correctSet.has(key)) cls += ' correct'
                      else if (yourSet.has(key)) cls += ' wrong'
                      return <li key={key} className={cls}>{key}. {text}</li>
                    })}
                  </ul>
                  <div className="result-box" style={{ background: '#f5f5f5' }}>
                    <p>你的答案: {r.user_answer || '（未选）'}，正确答案: {r.correct_answer}</p>
                    {r.explanation && <div className="explanation">解析: {r.explanation}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const q = questions[current]
  if (!q) return <div className="loading">加载中...</div>
  const multi = isMulti(q)
  const options = buildOptions(q)
  const picks = answers[q.id] || []
  const answeredCount = questions.filter((x) => (answers[x.id] || []).length > 0).length
  const isLast = current >= questions.length - 1

  return (
    <div className="practice-page">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(`/categories/${id}`)}>← 退出</button>
        <span>考试 · 已答 {answeredCount}/{questions.length}</span>
        <div />
      </div>

      <div className="practice-progress">第 {current + 1} / {questions.length} 题</div>

      <div className="question-card">
        <div className="question-text">
          <span className={`q-type-tag ${multi ? 'multi' : 'single'}`}>{multi ? '多选' : '单选'}</span>
          {q.question}
        </div>
        <ul className="options-list">
          {options.map(({ key, text }) => (
            <li key={key}
              className={`option-item${picks.includes(key) ? ' selected' : ''}`}
              onClick={() => handlePick(q, key, multi)}>
              {key}. {text}
            </li>
          ))}
        </ul>

        <div className="practice-actions" style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" disabled={current === 0}
            onClick={() => setCurrent((c) => c - 1)}>上一题</button>
          {!isLast ? (
            <button className="btn btn-primary" onClick={() => setCurrent((c) => c + 1)}>下一题</button>
          ) : (
            <button className="btn btn-success" onClick={submitExam}>交卷</button>
          )}
        </div>
        {isLast && answeredCount < questions.length && (
          <p style={{ marginTop: 10, fontSize: 13, color: '#ea4335' }}>
            还有 {questions.length - answeredCount} 题未作答，交卷后未答题计为错误。
          </p>
        )}
      </div>
    </div>
  )
}

export default Exam
