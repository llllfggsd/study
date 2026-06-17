import { useNavigate } from 'react-router-dom'

function Header() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <header className="header">
      <h1 onClick={() => navigate('/')}>学习题库</h1>
      {user && (
        <div className="user-info">
          <span>{user.username}</span>
          <button className="logout-btn" onClick={handleLogout}>退出</button>
        </div>
      )}
    </header>
  )
}

export default Header
