import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

function ImportPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f) setFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post(`/categories/${id}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.error || '导入失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="import-page">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(`/categories/${id}`)}>← 返回</button>
        <h2 className="page-title" style={{ margin: 0 }}>导入题目</h2>
        <div />
      </div>

      <div className="upload-area" onClick={() => fileRef.current.click()}>
        <input ref={fileRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={handleFileChange} />
        {file ? (
          <div>
            <p className="file-name">{file.name}</p>
            <p>点击重新选择文件</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 24 }}>点击选择 XLSX 文件</p>
            <p>支持 .xlsx 格式的 Excel 文件</p>
          </div>
        )}
      </div>

      {error && <p className="error-msg">{error}</p>}

      {result && (
        <div className="result-box correct">
          <p>导入完成！成功导入 {result.imported} 题，共 {result.total} 题。</p>
          {result.errors > 0 && <p>跳过 {result.errors} 条格式不正确的数据。</p>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button className="btn btn-primary" onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? '导入中...' : '开始导入'}
        </button>
        {result && (
          <button className="btn btn-success" onClick={() => navigate(`/categories/${id}`)}>
            返回分类
          </button>
        )}
      </div>

      <div className="format-hint">
        <h4>XLSX 文件格式要求</h4>
        <table>
          <thead>
            <tr>
              <th>问题</th><th>A</th><th>B</th><th>C</th><th>D</th><th>答案</th><th>解析</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Python中定义变量的正确方式是？</td>
              <td>int a=10</td><td>let a=10</td><td>a=10</td><td>var a=10</td>
              <td>C</td><td>Python变量不需要声明类型</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: 12, fontSize: 13, color: '#888' }}>
          第一行必须是标题行。问题、A、B、C、D、答案为必填，解析可为空。答案只能是 A/B/C/D。
        </p>
      </div>
    </div>
  )
}

export default ImportPage
