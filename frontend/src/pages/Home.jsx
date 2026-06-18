import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function Home() {
  const [categories, setCategories] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [newName, setNewName] = useState('')
  const [shareCode, setShareCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories')
      setCategories(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      await api.post('/categories', { name: newName.trim() })
      setNewName('')
      setShowCreate(false)
      fetchCategories()
    } catch (err) {
      console.error(err)
    }
  }

  const handleJoin = async () => {
    if (!shareCode.trim()) return
    setJoinError('')
    try {
      await api.post('/categories/join', { share_code: shareCode.trim().toUpperCase() })
      setShareCode('')
      setShowJoin(false)
      fetchCategories()
    } catch (err) {
      setJoinError(err.response?.data?.error || '加入失败')
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('确定要删除该分类吗？分类下的所有题目也会被删除。')) return
    try {
      await api.delete(`/categories/${id}`)
      fetchCategories()
    } catch (err) {
      console.error(err)
    }
  }

  const handleLeave = async (e, id) => {
    e.stopPropagation()
    if (!confirm('确定要退出该题库吗？')) return
    try {
      await api.post(`/categories/${id}/leave`)
      fetchCategories()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 className="page-title" style={{ margin: 0 }}>我的学习模块</h2>
        <button className="btn btn-primary" onClick={() => setShowJoin(true)}>加入题库</button>
      </div>

      <div className="category-grid">
        {categories.map((cat) => (
          <div key={`${cat.id}-${cat.is_owner}`} className="category-card" onClick={() => navigate(`/categories/${cat.id}`)}>
            <h3>{cat.name}</h3>
            {!cat.is_owner && <p style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>创建者: {cat.owner_name}</p>}
            <div className="stats">
              <span className="stat-item">题目: {cat.question_count}</span>
              <span className="stat-item">错题: {cat.wrong_count}</span>
              <span className="stat-item">已练习: {cat.practiced_count}</span>
            </div>
            <div className="category-card-actions">
              {cat.is_owner ? (
                <button className="category-delete-btn" onClick={(e) => handleDelete(e, cat.id)}>删除</button>
              ) : (
                <button className="category-delete-btn" onClick={(e) => handleLeave(e, cat.id)}>退出</button>
              )}
            </div>
          </div>
        ))}
        <div className="category-card new-category-card" onClick={() => setShowCreate(true)}>
          <span>+ 新建分类</span>
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>新建学习分类</h3>
            <div className="form-group">
              <label>分类名称</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例如：Python、机器学习、历史"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>创建</button>
            </div>
          </div>
        </div>
      )}

      {showJoin && (
        <div className="modal-overlay" onClick={() => { setShowJoin(false); setJoinError('') }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>加入题库</h3>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>输入分享码加入他人的题库</p>
            {joinError && <p className="error-msg">{joinError}</p>}
            <div className="form-group">
              <label>分享码</label>
              <input
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value)}
                placeholder="输入6位分享码"
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                style={{ textTransform: 'uppercase', letterSpacing: 4, textAlign: 'center', fontSize: 20 }}
                maxLength={6}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setShowJoin(false); setJoinError('') }}>取消</button>
              <button className="btn btn-primary" onClick={handleJoin}>加入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
