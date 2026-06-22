import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import CategoryDetail from './pages/CategoryDetail'
import Practice from './pages/Practice'
import Exam from './pages/Exam'
import WrongQuestions from './pages/WrongQuestions'
import QuestionManage from './pages/QuestionManage'
import ImportPage from './pages/Import'
import Ranking from './pages/Ranking'
import Members from './pages/Members'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/categories/:id" element={<PrivateRoute><CategoryDetail /></PrivateRoute>} />
          <Route path="/categories/:id/import" element={<PrivateRoute><ImportPage /></PrivateRoute>} />
          <Route path="/categories/:id/practice" element={<PrivateRoute><Practice /></PrivateRoute>} />
          <Route path="/categories/:id/exam" element={<PrivateRoute><Exam /></PrivateRoute>} />
          <Route path="/categories/:id/wrong" element={<PrivateRoute><WrongQuestions /></PrivateRoute>} />
          <Route path="/categories/:id/questions" element={<PrivateRoute><QuestionManage /></PrivateRoute>} />
          <Route path="/categories/:id/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
          <Route path="/categories/:id/members" element={<PrivateRoute><Members /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  )
}

export default App
