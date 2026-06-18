import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'

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

function Practice() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'order'

  const [phase, setPhase] = useState('loading')
  const [progressInfo, setProgressInfo] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [practiceResult, setPracticeResult] = useState(null)
  const [cheating, setCheating] = useState(false)
  const correctRef = useRef(0)
  const startRef = useRef(Date.now())
  const lockRef = useRef(false)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get(`/categories/${id}/practice/status?mode=${mode}`)
        if (res.data.has_progress) {
          setProgressInfo(res.data)
          setPhase('choosing')
        } else {
          await doStart(true)
        }
    } catch (err) {
      lockRef.current = false
      console.error(err)
    }
    }
    checkStatus()
  }, [id, mode])

  const doStart = async (isNew) => {
    try {
      const res = await api.post(`/categories/${id}/practice/start`, { mode, is_new: isNew })
      const qs = res.data.questions || []
      const idx = res.data.current_index || 0
      setQuestions(qs)
      setCurrent(idx)
      correctRef.current = 0
      startRef.current = Date.now()
      lockRef.current = false
      setPhase('practicing')
    } catch (err) {
      console.error(err)
    }
  }

  const saveProgress = (index) => {
    api.put(`/categories/${id}/practice/progress`, { mode, current_index: index }).catch(() => {})
  }

  const finishPractice = async () => {
    const duration = Math.floor((Date.now() - startRef.current) / 1000)
    if (duration < questions.length) {
      await api.delete(`/categories/${id}/practice/progress?mode=${mode}`).catch(() => {})
      setCheating(true)
      return
    }
    try {
      const res = await api.post(`/categories/${id}/practice/complete`, {
        mode,
        correct_count: correctRef.current,
        total_count: questions.length,
        duration,
      })
      setPracticeResult(res.data)
      setPhase('result')
    } catch (err) {
      console.error(err)
      navigate(`/categories/${id}`)
    }
  }

  const goNext = useCallback(() => {
    if (current < questions.length - 1) {
      const next = current + 1
      setCurrent(next)
      setSelected(null)
      setSubmitted(false)
      setResult(null)
      lockRef.current = false
      saveProgress(next)
    }
  }, [current, questions.length, id, mode])

  const handleSelect = async (option) => {
    if (submitted || lockRef.current) return
    lockRef.current = true
    setSelected(option)
    try {
      const q = questions[current]
      const res = await api.post(`/questions/${q.id}/answer`, { answer: option })
      setResult(res.data)
      setSubmitted(true)

      const isLast = current >= questions.length - 1
      if (res.data.is_correct) {
        correctRef.current += 1
        if (!isLast) {
          setTimeout(goNext, 1000)
        } else {
          setTimeout(() => {
            finishPractice()
          }, 1000)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (phase === 'loading') return <div className="loading">加载中...</div>

  if (phase === 'choosing') {
    return (
      <div className="practice-page">
        <div className="modal-overlay">
          <div className="modal">
            <h3>选择练习方式</h3>
            <p style={{ color: '#666', marginBottom: 20 }}>
              检测到未完成的{mode === 'random' ? '随机' : '顺序'}练习进度（第 {progressInfo.current_index + 1} / {progressInfo.total} 题）
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="btn btn-primary btn-block" onClick={() => doStart(false)}>继续练习</button>
              <button className="btn btn-secondary btn-block" onClick={() => doStart(true)}>新练习</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'result' && practiceResult) {
    const ev = getEvaluation(practiceResult.score)
    return (
      <div className="practice-page">
        <div className="result-page">
          <h2 style={{ marginBottom: 8 }}>练习完成</h2>
          <div className="result-score-circle" style={{ borderColor: ev.color }}>
            <div className="result-score-number" style={{ color: ev.color }}>{practiceResult.score}</div>
            <div className="result-score-label">分</div>
          </div>
          <div className="result-evaluation" style={{ color: ev.color }}>{ev.text}</div>
          <div className="result-stats">
            <div className="result-stat-item">
              <div className="result-stat-value">{practiceResult.correct_count}/{practiceResult.total_count}</div>
              <div className="result-stat-label">正确/总题数</div>
            </div>
            <div className="result-stat-item">
              <div className="result-stat-value">{formatDuration(practiceResult.duration)}</div>
              <div className="result-stat-label">用时</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate(`/categories/${id}`)}>返回分类</button>
        </div>
      </div>
    )
  }

  if (cheating) {
    return (
      <div className="practice-page">
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#128064;</div>
            <h2 style={{ color: '#ea4335', marginBottom: 12 }}>你不老实，作弊！</h2>
            <p style={{ color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
              答题时间异常（总用时少于 {questions.length} 秒）<br/>本次成绩不予记录
            </p>
            <button className="btn btn-danger" onClick={() => navigate(`/categories/${id}`)}>
              乖乖回去重新做
            </button>
          </div>
        </div>
      </div>
    )
  }

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

  const isLast = current >= questions.length - 1

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
              {!isLast ? (
                <button className="btn btn-primary" onClick={goNext}>下一题</button>
              ) : (
                <button className="btn btn-success" onClick={finishPractice}>查看成绩</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Practice
