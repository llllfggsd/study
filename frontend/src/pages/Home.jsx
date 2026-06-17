import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function Home() {
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
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
      setShowModal(false)
      fetchCategories()
    } catch (err) {
      console.error(err)
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

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div>
      <h2 className="page-title">我的学习模块</h2>
      <div className="category-grid">
        {categories.map((cat) => (
          <div key={cat.id} className="category-card" onClick={() => navigate(`/categories/${cat.id}`)}>
            <h3>{cat.name}</h3>
            <div className="stats">
              <span className="stat-item">题目: {cat.question_count}</span>
              <span className="stat-item">错题: {cat.wrong_count}</span>
              <span className="stat-item">已练习: {cat.practiced_count}</span>
            </div>
            <div className="category-card-actions">
              <button className="category-delete-btn" onClick={(e) => handleDelete(e, cat.id)}>删除</button>
            </div>
          </div>
        ))}
        <div className="category-card new-category-card" onClick={() => setShowModal(true)}>
          <span>+ 新建分类</span>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
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
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
