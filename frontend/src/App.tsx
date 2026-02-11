import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MoComponent } from './components/MoComponent';
import { SocketProvider, useSocket } from './context/SocketContext';
import client from './api/client';
import { LogOut, ShieldAlert } from 'lucide-react';

interface User {
  id: string;
  email: string;
  phapDanh?: string;
  currentKarma: number;
}

const MainHall: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => {
  const { notifications } = useSocket();
  const [karma, setKarma] = useState(user.currentKarma);

  const refreshKarma = useCallback(async () => {
    try {
      const res = await client.get(`/users/${user.id}`);
      setKarma(res.data.currentKarma);
    } catch (e) {
      console.error('Failed to refresh karma', e);
    }
  }, [user.id]);

  useEffect(() => {
    refreshKarma();
    const timer = setInterval(refreshKarma, 10000);
    return () => clearInterval(timer);
  }, [refreshKarma]);

  const handleSelfBan = async () => {
    if (confirm('Mẹ có chắc muốn "Tự Hủy" để test Nuclear Option không?')) {
      try {
        await client.post(`/admin/users/${user.id}/ban`);
      } catch (e) {
        console.error('Ban failed', e);
      }
    }
  };

  const handleDonate = async () => {
    const amountStr = prompt('Thí chủ muốn cúng dường bao nhiêu? (Mock)', '100000');
    if (amountStr) {
      const amount = parseInt(amountStr);
      try {
        await client.post('/users/mock-donate', { amount });
        console.log('[MainHall] Mock donation REST call success:', amount);
        refreshKarma();
      } catch (e) {
        console.error('Donation failed', e);
        alert('Cúng dường thất bại. Thí chủ vui lòng thử lại!');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Nam Mô A Di Đà Phật!</h1>
          <div className="flex items-center gap-3">
            <p className="text-stone-500">Chào: <span className="text-temple-red font-semibold">{user.phapDanh || user.email}</span></p>
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold border border-yellow-200">
              💎 {karma} Karma
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDonate}
            className="p-3 text-temple-red hover:bg-orange-50 rounded-xl transition-colors border border-orange-100 flex items-center gap-2"
            title="Cúng Dường (Simulation)"
          >
            <span className="hidden sm:inline">Cúng dường</span>
            <span>🧧</span>
          </button>
          <button
            onClick={handleSelfBan}
            className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-100 flex items-center gap-2"
            title="Tự Hủy (Test Nuclear Option)"
          >
            <ShieldAlert size={20} />
            <span className="hidden sm:inline">Tự Hủy</span>
          </button>
          <button
            onClick={onLogout}
            className="p-3 text-stone-600 hover:bg-orange-50 rounded-xl transition-colors border border-orange-100 flex items-center gap-2"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <main className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-orange-100">
          <MoComponent />
        </main>

        <aside className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100 flex flex-col gap-4">
          <h3 className="font-bold text-stone-700 flex items-center gap-2">
            📡 Thông báo Chùa
          </h3>
          <div className="flex-1 space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {notifications.length === 0 ? (
              <p className="text-stone-400 text-sm">Chưa có biến động karma nào...</p>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className={`text-sm p-3 rounded-xl border animate-in fade-in slide-in-from-right-4 duration-300 ${n.includes('CHÚC MỪNG')
                  ? 'bg-yellow-50 border-yellow-100 text-yellow-800 font-bold'
                  : 'bg-orange-50 border-orange-100 text-stone-700'
                  }`}>
                  {n}
                </div>
              ))
            )}
          </div>
          <div className="mt-auto pt-4 border-t border-orange-50 text-[10px] text-stone-400 text-center italic">
            Tâm thành tất ứng - Karma về tay
          </div>
        </aside>
      </div>
    </div>
  );
};

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

const RegisterPage: React.FC<{ onRegister: (user: User) => void; onToggleLogin: () => void }> = ({ onRegister, onToggleLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phapDanh, setPhapDanh] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await client.post<AuthResponse>('/auth/register', { email, password, phapDanh });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      onRegister(data.user);
    } catch (e) {
      alert('Quy y thất bại. Có thể email này đã có chủ!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-orange-100 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-temple-red mb-2">CẠO ĐẦU QUY Y</h1>
          <p className="text-stone-500">Bắt đầu hành trình tu tập tại Niết Bàn OS</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Pháp Danh (Username)</label>
            <input
              type="text"
              required
              placeholder="VD: Thích Code Dạo"
              className="w-full p-4 bg-orange-50/50 border border-orange-100 rounded-2xl focus:ring-2 focus:ring-temple-red outline-none transition-all"
              value={phapDanh}
              onChange={e => setPhapDanh(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Email</label>
            <input
              type="email"
              required
              className="w-full p-4 bg-orange-50/50 border border-orange-100 rounded-2xl focus:ring-2 focus:ring-temple-red outline-none transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Mật Khẩu</label>
            <input
              type="password"
              required
              className="w-full p-4 bg-orange-50/50 border border-orange-100 rounded-2xl focus:ring-2 focus:ring-temple-red outline-none transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-temple-red text-white p-4 rounded-2xl font-bold hover:bg-red-800 transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Đang xuống tóc...' : 'Quy y Tam Bảo'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-stone-500 text-sm">
            Đã là phật tử?{' '}
            <button onClick={onToggleLogin} className="text-temple-red font-bold hover:underline">
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const LoginPage: React.FC<{ onLogin: (user: User) => void; onToggleRegister: () => void }> = ({ onLogin, onToggleRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await client.post<AuthResponse>('/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      onLogin(data.user);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        alert('Sai mật khẩu hoặc email. Thí chủ hãy bình tĩnh kiểm tra lại!');
      } else {
        alert('Đăng nhập thất bại. Thí chủ vui lòng thử lại sau!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-orange-100 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-temple-red mb-2">NIẾT BÀN OS</h1>
          <p className="text-stone-500">Version 2.0 - Khai Quang Chánh Điện</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Email Thí Chủ</label>
            <input
              type="email"
              required
              className="w-full p-4 bg-orange-50/50 border border-orange-100 rounded-2xl focus:ring-2 focus:ring-temple-red outline-none transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Mật Khẩu</label>
            <input
              type="password"
              required
              className="w-full p-4 bg-orange-50/50 border border-orange-100 rounded-2xl focus:ring-2 focus:ring-temple-red outline-none transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-temple-red text-white p-4 rounded-2xl font-bold hover:bg-red-800 transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Đang quy y...' : 'Bước vào Chánh Điện'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-stone-500 text-sm">
            Chưa có tài khoản?{' '}
            <button onClick={onToggleRegister} className="text-temple-red font-bold hover:underline">
              Cạo đầu quy y ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setAccessToken(token);
    }
  }, []);

  const loginSuccess = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setAccessToken(localStorage.getItem('accessToken'));
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setAccessToken(null);
    setUser(null);
  };

  if (!user) {
    return showRegister ? (
      <RegisterPage onRegister={loginSuccess} onToggleLogin={() => setShowRegister(false)} />
    ) : (
      <LoginPage onLogin={loginSuccess} onToggleRegister={() => setShowRegister(true)} />
    );
  }

  return (
    <SocketProvider accessToken={accessToken}>
      <div className="min-h-screen bg-stone-50 pt-12 pb-24">
        <MainHall user={user} onLogout={logout} />
      </div>
    </SocketProvider>
  );
};

export default App;
