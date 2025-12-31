// client/src/pages/ResetPassword.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { FaLock } from 'react-icons/fa';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return setMsg('❌ كلمات المرور غير متطابقة');
        
        setLoading(true);
        try {
            const { data } = await API.put(`/auth/reset-password/${token}`, { password });
            setMsg(`✅ ${data.message}`);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setMsg(`❌ ${err.response?.data?.message || 'الرابط غير صالح'}`);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', 
        padding: '12px 45px 12px 15px', 
        borderRadius: '8px',
        border: '1px solid #ddd', 
        fontSize: '15px', 
        outline: 'none', 
        textAlign: 'right', 
        direction: 'rtl',
        boxSizing: 'border-box', // ✅ الحل
        backgroundColor: '#f9f9f9'
    };
    
    const iconStyle = { position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)', color: '#888' };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5', padding: '20px' }}>
            <div style={{ background: 'white', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center', boxSizing: 'border-box' }}>
                <h2 style={{ color: '#00c853', marginBottom: '20px' }}>كلمة مرور جديدة 🔑</h2>
                
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div style={{ marginBottom: '15px', position: 'relative' }}>
                        <FaLock style={iconStyle} />
                        <input type="password" placeholder="كلمة المرور الجديدة" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
                    </div>
                    <div style={{ marginBottom: '20px', position: 'relative' }}>
                        <FaLock style={iconStyle} />
                        <input type="password" placeholder="تأكيد كلمة المرور" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} required />
                    </div>
                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#00c853', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
                        {loading ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
                    </button>
                </form>
                
                {msg && <div style={{ marginTop: '20px', padding: '10px', borderRadius: '8px', background: msg.includes('✅') ? '#e8f5e9' : '#ffebee', color: msg.includes('✅') ? '#2e7d32' : '#c62828', fontSize: '13px' }}>{msg}</div>}
            </div>
        </div>
    );
};

export default ResetPassword;