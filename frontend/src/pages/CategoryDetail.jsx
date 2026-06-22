import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'

function CategoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

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

  const copyCode = () => {
    navigator.clipboard.writeText(category.share_code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) return <div className="loading">加载中...</div>
  if (!category) return <div className="empty-state">分类不存在</div>

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
        <h2 className="page-title" style={{ margin: 0 }}>{category.name}</h2>
        <div />
      </div>

      {!category.is_owner && (
        <p style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>创建者: {category.owner_name}</p>
      )}

      {category.is_owner && category.share_code && (
        <div className="share-code-box" onClick={copyCode}>
          <span className="share-label">分享码</span>
          <span className="share-value">{category.share_code}</span>
          <span className="share-copy">{copied ? '已复制' : '点击复制'}</span>
        </div>
      )}

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

      <p style={{ marginBottom: 16, fontSize: 13, color: '#999' }}>
        单选 {category.single_count} 题 · 多选 {category.multiple_count} 题
      </p>

      <div className="action-grid">
        {category.is_owner && (
          <Link to={`/categories/${id}/import`} className="action-card">导入题目</Link>
        )}
        <Link to={`/categories/${id}/practice?mode=order`} className="action-card">顺序练习</Link>
        <Link to={`/categories/${id}/practice?mode=random`} className="action-card">随机练习</Link>
        <Link to={`/categories/${id}/exam`} className="action-card">考试</Link>
        <Link to={`/categories/${id}/wrong`} className="action-card">错题集</Link>
        {category.is_owner && (
          <Link to={`/categories/${id}/questions`} className="action-card">题目管理</Link>
        )}
        <Link to={`/categories/${id}/ranking`} className="action-card">排名</Link>
        {category.is_owner && (
          <Link to={`/categories/${id}/members`} className="action-card">成员管理</Link>
        )}
      </div>
    </div>
  )
}

export default CategoryDetail
