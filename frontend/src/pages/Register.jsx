import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('两次密码不一致')
      return
    }
    try {
      const res = await api.post('/register', { username, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || '注册失败')
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>注册</h2>
        {error && <p className="error-msg">{error}</p>}
        <div className="form-group">
          <label>用户名</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" />
        </div>
        <div className="form-group">
          <label>密码</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" />
        </div>
        <div className="form-group">
          <label>确认密码</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="请再次输入密码" />
        </div>
        <button type="submit" className="btn btn-primary btn-block">注册</button>
        <p className="text-center mt-16">
          已有账号？ <Link to="/login" className="link">登录</Link>
        </p>
      </form>
    </div>
  )
}

export default Register
