import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

function formatTime(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function Ranking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ranking, setRanking] = useState([])
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [loading, setLoading] = useState(true)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const res = await api.get(`/categories/${id}/ranking`)
        setRanking(res.data.ranking || [])
        setTotalQuestions(res.data.total_questions || 0)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchRanking()
  }, [id])

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(`/categories/${id}`)}>← 返回</button>
        <h2 className="page-title" style={{ margin: 0 }}>排名</h2>
        <div />
      </div>

      <p style={{ color: '#666', marginBottom: 20 }}>
        按考试成绩排名 · 满分 100 分，共 {totalQuestions} 题
      </p>

      {ranking.length === 0 ? (
        <div className="empty-state">暂无排名数据</div>
      ) : (
        <div className="ranking-table-wrap">
          <div className="ranking-table">
            <div className="ranking-header">
              <span className="rank-col">排名</span>
              <span className="name-col">用户</span>
              <span className="num-col">次数</span>
              <span className="num-col">最高</span>
              <span className="num-col">最低</span>
              <span className="num-col">平均</span>
              <span className="time-col">最近考试</span>
            </div>
            {ranking.map((item, i) => (
              <div
                key={item.user_id}
                className={`ranking-row ${item.user_id === currentUser.id ? 'ranking-self' : ''} ${i < 3 ? 'ranking-top' : ''}`}
              >
                <span className="rank-col">{i + 1}</span>
                <span className="name-col">
                  {item.username}
                  {item.user_id === currentUser.id && <small style={{ color: '#1a73e8', marginLeft: 4 }}>(我)</small>}
                </span>
                <span className="num-col">{item.attempt_count || 0}</span>
                <span className="num-col score-value">{item.attempt_count > 0 ? item.highest_score : '-'}</span>
                <span className="num-col">{item.attempt_count > 0 ? item.lowest_score : '-'}</span>
                <span className="num-col">{item.attempt_count > 0 ? item.avg_score : '-'}</span>
                <span className="time-col">{formatTime(item.last_practice_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Ranking
