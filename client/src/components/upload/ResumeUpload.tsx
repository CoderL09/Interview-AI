import React, { useState } from 'react';
import axios from 'axios';

const ResumeUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: '请先选择文件' });
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: '未登录，请先登录' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      await axios.post('http://localhost:5000/api/user/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage({ type: 'success', text: '简历上传成功！AI 将根据你的简历提问。' });
      setFile(null); // 清空已选文件
      // 可以触发一个事件通知其他组件刷新（可选）
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.error || '上传失败，请重试' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 max-w-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">上传简历（可选）</h3>
      <p className="text-sm text-gray-500 mb-4">
        支持 PDF、Word、TXT 格式，让 AI 根据你的项目经验提问，模拟真实面试。
      </p>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
          选择文件
          <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} className="hidden" />
        </label>
        {file && <span className="text-sm text-gray-600 truncate max-w-[200px]">{file.name}</span>}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
        >
          {uploading ? '上传中...' : '上传简历'}
        </button>
      </div>
      {message && (
        <div className={`mt-3 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;