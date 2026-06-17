import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'

function CategoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await api.get(`/categories/${id}`)
        setCategory(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCategory()
  }, [id])

  if (loading) return <div className="loading">加载中...</div>
  if (!category) return <div className="empty-state">分类不存在</div>

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
        <h2 className="page-title" style={{ margin: 0 }}>{category.name} 题库</h2>
        <div />
      </div>

      <div className="detail-stats">
        <div className="stat-box">
          <div className="stat-number">{category.question_count}</div>
          <div className="stat-label">题目总数</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{category.practiced_count}</div>
          <div className="stat-label">已练习</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{category.wrong_count}</div>
          <div className="stat-label">错题数</div>
        </div>
      </div>

      <div className="action-grid">
        <Link to={`/categories/${id}/import`} className="action-card">导入题目</Link>
        <Link to={`/categories/${id}/practice?mode=order`} className="action-card">顺序练习</Link>
        <Link to={`/categories/${id}/practice?mode=random`} className="action-card">随机练习</Link>
        <Link to={`/categories/${id}/wrong`} className="action-card">错题集</Link>
        <Link to={`/categories/${id}/questions`} className="action-card">题目管理</Link>
      </div>
    </div>
  )
}

export default CategoryDetail
