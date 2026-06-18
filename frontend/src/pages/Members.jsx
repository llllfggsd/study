import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

function formatDate(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function Members() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [ownerID, setOwnerID] = useState(null)
  const [loading, setLoading] = useState(true)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isOwner = currentUser.id === ownerID

  const fetchMembers = async () => {
    try {
      const res = await api.get(`/categories/${id}/members`)
      setMembers(res.data.members || [])
      setOwnerID(res.data.owner_id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [id])

  const handleRemove = async (uid, username) => {
    if (!confirm(`确定要移除 ${username} 吗？其练习记录也会被删除。`)) return
    try {
      await api.delete(`/categories/${id}/members/${uid}`)
      fetchMembers()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(`/categories/${id}`)}>← 返回</button>
        <h2 className="page-title" style={{ margin: 0 }}>成员管理</h2>
        <div />
      </div>

      <p style={{ color: '#666', marginBottom: 20 }}>共 {members.length} 人</p>

      <div className="question-list">
        {members.map((m) => (
          <div key={m.user_id} className="question-item">
            <span className="q-text" style={{ whiteSpace: 'normal' }}>
              {m.username}
              {m.role === 'owner' && <small style={{ color: '#1a73e8', marginLeft: 6 }}>(创建者)</small>}
            </span>
            <span className="q-answer">{formatDate(m.joined_at)}</span>
            {isOwner && m.role !== 'owner' && (
              <button className="delete-btn" onClick={() => handleRemove(m.user_id, m.username)}>移除</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Members
