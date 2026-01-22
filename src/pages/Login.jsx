import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api'; 
import { FaEnvelope, FaLock } from 'react-icons/fa'; 

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // الرابط المباشر لشعار واسم البطولة (تعديل يدوي سريع)
    const leagueInfo = {
        name: "FPL ZEDDINE",
        logoUrl: "https://i.postimg.cc/RFwVd0Lw/logo-zdn.png" 
    };

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault(); 
        setError(''); 
        setLoading(true);
        try { 
            // إرسال طلب تسجيل الدخول
            const { data } = await API.post('/auth/login', formData); 
            
            if (data.token) {
                // حفظ التوكن وبيانات المستخدم
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));

                // توجيه المستخدم للوحة التحكم وتحديث الصفحة
                navigate('/dashboard'); 
                window.location.reload();
            }
        } 
        catch (err) { 
            // إظهار الخطأ القادم من السيرفر أو رسالة افتراضية
            setError(err.response?.data?.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة'); 
        } 
        finally { 
            setLoading(false); 
        }
    };

    const styles = {
        wrapper: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #37003c 0%, #00ff85 100%)', fontFamily: 'Arial', padding: '20px', boxSizing: 'border-box' },
        box: { background: 'white', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', width: '100%', maxWidth: '400px', textAlign: 'center', boxSizing: 'border-box' },
        logoContainer: { marginBottom: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
        logoImg: { width: '100px', height: '100px', objectFit: 'contain', marginBottom: '10px' },
        leagueName: { color: '#37003c', fontWeight: '900', fontSize: '24px', margin: '0' },
        inputGroup: { marginBottom: '15px', position: 'relative' },
        input: { width: '100%', padding: '12px 45px 12px 15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', outline: 'none', textAlign: 'right', direction: 'rtl', boxSizing: 'border-box', backgroundColor: '#f9f9f9' },
        icon: { position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)', color: '#888' },
        btn: { width: '100%', padding: '12px', background: '#37003c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px' }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.box}>
                
                {/* 🏆 الشعار والاسم المباشر */}
                <div style={styles.logoContainer}>
                    <img src={leagueInfo.logoUrl} alt="Logo" style={styles.logoImg} />
                    <h1 style={styles.leagueName}>{leagueInfo.name}</h1>
                </div>

                <p style={{ color: '#666', marginBottom: '25px', fontSize: '14px' }}>سجل الدخول لإدارة فريقك 👋</p>
                
                {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: 'bold' }}>{error}</div>}
                
                <form onSubmit={onSubmit}>
                    <div style={styles.inputGroup}>
                        <FaEnvelope style={styles.icon} />
                        <input type="email" name="email" value={formData.email} onChange={onChange} placeholder="البريد الإلكتروني" style={styles.input} required />
                    </div>
                    <div style={styles.inputGroup}>
                        <FaLock style={styles.icon} />
                        <input type="password" name="password" value={formData.password} onChange={onChange} placeholder="كلمة المرور" style={styles.input} required />
                    </div>
                    
                    <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                        <Link to="/forgot-password" style={{ fontSize: '12px', color: '#37003c', fontWeight: 'bold', textDecoration: 'none' }}>نسيت كلمة المرور؟</Link>
                    </div>
                    
                    <button type="submit" disabled={loading} style={styles.btn}>
                        {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                    </button>
                </form>
                
                <div style={{ marginTop: '20px', fontSize: '13px' }}>
                    ليس لديك حساب؟ <Link to="/register" style={{ color: '#00c853', fontWeight: 'bold', textDecoration: 'none' }}>أنشئ حساباً</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;