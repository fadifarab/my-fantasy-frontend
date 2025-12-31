// client/src/pages/ForgotPassword.jsx
import { useState } from 'react';
import API from '../utils/api';
import { FaEnvelope, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        try {
            const { data } = await API.post('/auth/forgot-password', { email });
            setMsg(`✅ ${data.data}`);
        } catch (err) {
            setMsg(`❌ ${err.response?.data?.message || 'حدث خطأ'}`);
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

    return (
        <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5', padding: '20px' }}>
            <div style={{ background: 'white', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center', boxSizing: 'border-box' }}>
                <h2 style={{ color: '#37003c', marginBottom: '15px' }}>نسيت كلمة المرور؟ 🔒</h2>
                <p style={{ color: '#666', marginBottom: '25px', fontSize: '13px', lineHeight: '1.6' }}>لا تقلق، أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً للاستعادة.</p>
                
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div style={{ marginBottom: '20px', position: 'relative' }}>
                        <FaEnvelope style={{ position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)', color: '#888' }} />
                        <input 
                            type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} 
                            style={inputStyle} required
                        />
                    </div>
                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#37003c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
                        {loading ? 'جاري الإرسال...' : 'إرسال الرابط'}
                    </button>
                </form>
                
                {msg && <div style={{ marginTop: '20px', padding: '10px', borderRadius: '8px', background: msg.includes('✅') ? '#e8f5e9' : '#ffebee', color: msg.includes('✅') ? '#2e7d32' : '#c62828', fontSize: '13px' }}>{msg}</div>}

                <div style={{ marginTop: '25px' }}>
                    <Link to="/login" style={{ color: '#555', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '13px' }}>
                        <FaArrowRight size={12} /> العودة لتسجيل الدخول
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;