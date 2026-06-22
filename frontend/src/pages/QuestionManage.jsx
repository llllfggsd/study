import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

function QuestionManage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/categories/${id}/questions`)
      setQuestions(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [id])

  const handleDelete = async (qid) => {
    if (!confirm('确定要删除该题目吗？')) return
    try {
      await api.delete(`/questions/${qid}`)
      fetchQuestions()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(`/categories/${id}`)}>← 返回</button>
        <h2 className="page-title" style={{ margin: 0 }}>题目管理</h2>
        <div />
      </div>

      {questions.length === 0 ? (
        <div className="empty-state">暂无题目</div>
      ) : (
        <>
          <p style={{ marginBottom: 16, color: '#666' }}>共 {questions.length} 道题目</p>
          <div className="question-list">
            {questions.map((q, i) => (
              <div key={q.id} className="question-item">
                <span className="q-text">{i + 1}. {q.question}</span>
                <span className="q-answer">{q.qtype === 'multiple' ? '多选' : '单选'} · 答案: {q.answer}</span>
                <button className="delete-btn" onClick={() => handleDelete(q.id)}>删除</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default QuestionManage
