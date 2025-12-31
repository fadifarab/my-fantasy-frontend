// client/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api'; // ✅ استدعاء API مباشرة
import { FaEnvelope, FaLock } from 'react-icons/fa'; // أيقونة الإيميل

const Login = () => {
    const navigate = useNavigate();
    
    // 1. استخدام email بدلاً من username
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault(); 
        setError(''); 
        setLoading(true);
        try { 
            // 2. إرسال الإيميل وكلمة المرور للسيرفر
            const { data } = await API.post('/auth/login', formData); 
            
            // 3. حفظ التوكن وبيانات المستخدم في المتصفح
            localStorage.setItem('token', data.token);
            // نحفظ بيانات المستخدم أيضاً لنعرض اسمه في الداشبورد
            localStorage.setItem('user', JSON.stringify(data));

            // 4. التوجيه للداشبورد
            navigate('/dashboard'); 
            // نقوم بتحديث الصفحة لضمان تحميل البيانات الجديدة
            window.location.reload();
        } 
        catch (err) { 
            setError(err.response?.data?.message || 'خطأ في البريد الإلكتروني أو كلمة المرور'); 
        } 
        finally { 
            setLoading(false); 
        }
    };

    const styles = {
        wrapper: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #37003c 0%, #00ff85 100%)', fontFamily: 'Arial', padding: '20px', boxSizing: 'border-box' },
        box: { background: 'white', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', width: '100%', maxWidth: '400px', textAlign: 'center', boxSizing: 'border-box' },
        inputGroup: { marginBottom: '15px', position: 'relative', width: '100%', boxSizing: 'border-box' },
        input: { width: '100%', padding: '12px 45px 12px 15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', outline: 'none', textAlign: 'right', direction: 'rtl', boxSizing: 'border-box', backgroundColor: '#f9f9f9' },
        icon: { position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)', color: '#888', zIndex: 1 },
        btn: { width: '100%', padding: '12px', background: '#37003c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.box}>
                <h2 style={{ color: '#37003c', marginBottom: '10px' }}>أهلاً بك مجدداً 👋</h2>
                <p style={{ color: '#666', marginBottom: '30px' }}>سجل الدخول لإدارة فريقك</p>
                
                {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
                
                <form onSubmit={onSubmit} style={{width:'100%'}}>
                    <div style={styles.inputGroup}>
                        <FaEnvelope style={styles.icon} />
                        <input 
                            type="email" // ✅ نوع الحقل إيميل
                            name="email" // ✅ الاسم البرمجي إيميل
                            value={formData.email} 
                            onChange={onChange} 
                            placeholder="البريد الإلكتروني" 
                            style={styles.input} 
                            required 
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <FaLock style={styles.icon} />
                        <input type="password" name="password" value={formData.password} onChange={onChange} placeholder="كلمة المرور" style={styles.input} required />
                    </div>
                    
                    <div style={{ textAlign: 'left', marginBottom: '25px' }}>
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