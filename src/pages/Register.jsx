// client/src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api'; 
import { FaUser, FaEnvelope, FaLock, FaIdBadge, FaKey, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', email: '', password: '', fplId: '', role: 'player', adminCode: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // حالات خاصة للتحقق
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    // تحديث البيانات (مع معالجة خاصة لـ FPL ID)
    const onChange = (e) => {
        if (e.target.name === 'fplId') {
            setIsVerified(false); // إلغاء التحقق عند تغيير الرقم
            setFormData({ ...formData, fplId: e.target.value, username: '' }); // تصفير الاسم
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    // دالة التحقق من FPL ID
    const handleVerifyFPL = async () => {
        if (!formData.fplId) return setError("الرجاء إدخال رقم FPL ID");
        
        setError('');
        setIsVerifying(true);
        
        try {
            // انتبه: المسار يجب أن يطابق ملف الراوتس الخاص بك (/auth/check-fpl)
            const { data } = await API.post('/auth/check-fpl', { fplId: formData.fplId });
            
            // نجاح التحقق: ملء الاسم وتفعيل الزر
            setFormData(prev => ({ ...prev, username: data.player_name }));
            setIsVerified(true);
        } catch (err) {
            setError(err.response?.data?.message || 'لم يتم العثور على حساب فانتازي بهذا الرقم');
            setIsVerified(false);
            setFormData(prev => ({ ...prev, username: '' }));
        } finally {
            setIsVerifying(false);
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault(); 
        if (!isVerified) return setError("الرجاء التحقق من FPL ID أولاً");

        setError(''); 
        setLoading(true);
        try { 
            const { data } = await API.post('/auth/register', formData);
            localStorage.setItem('token', data.token);
            navigate('/dashboard'); 
        } 
        catch (err) { 
            setError(err.response?.data?.message || 'فشل الاتصال بالسيرفر'); 
        } 
        finally { 
            setLoading(false); 
        }
    };

    const styles = {
        wrapper: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #37003c 0%, #00ff85 100%)', fontFamily: 'Arial', padding: '20px', boxSizing: 'border-box', direction: 'rtl' },
        box: { background: 'white', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', width: '100%', maxWidth: '450px', textAlign: 'center', boxSizing: 'border-box' },
        inputGroup: { marginBottom: '15px', position: 'relative', width: '100%', boxSizing: 'border-box' },
        input: { width: '100%', padding: '12px 45px 12px 15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', textAlign: 'right', boxSizing: 'border-box', backgroundColor: '#f9f9f9' },
        icon: { position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)', color: '#888', zIndex: 1 },
        btn: { width: '100%', padding: '12px', background: isVerified ? '#37003c' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: (loading || !isVerified) ? 'not-allowed' : 'pointer', marginTop: '10px', transition: '0.3s' },
        verifyBtn: { position: 'absolute', top: '5px', left: '5px', bottom: '5px', background: isVerified ? '#00ff85' : '#37003c', color: isVerified ? '#37003c' : 'white', border: 'none', borderRadius: '6px', padding: '0 15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.box}>
                <h2 style={{ color: '#37003c', marginBottom: '20px' }}>انضم للدوري ⚽</h2>
                {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '13px' }}>{error}</div>}
                
                <form onSubmit={onSubmit} style={{width:'100%'}}>
                    
                    {/* 1. حقل FPL ID مع زر التحقق */}
                    <div style={styles.inputGroup}>
                        <FaIdBadge style={styles.icon} />
                        <input 
                            type="number" 
                            name="fplId" 
                            value={formData.fplId} 
                            onChange={onChange} 
                            placeholder="رقم FPL ID" 
                            style={styles.input} 
                            required 
                        />
                        <button 
                            type="button" 
                            onClick={handleVerifyFPL}
                            disabled={isVerifying || !formData.fplId}
                            style={styles.verifyBtn}
                        >
                            {isVerifying ? <FaSpinner className="fa-spin"/> : (isVerified ? <FaCheckCircle size={14}/> : "تحقق")}
                        </button>
                    </div>

                    {/* 2. حقل اسم المستخدم (تلقائي وقراءة فقط) */}
                    <div style={styles.inputGroup}>
                        <FaUser style={{...styles.icon, color: isVerified ? '#00c853' : '#888'}} />
                        <input 
                            type="text" 
                            name="username" 
                            value={formData.username} 
                            readOnly 
                            placeholder="اسم المدرب (سيظهر تلقائياً)" 
                            style={{
                                ...styles.input, 
                                backgroundColor: isVerified ? '#e8f5e9' : '#eee',
                                border: isVerified ? '1px solid #00ff85' : '1px solid #ddd',
                                color: '#333',
                                fontWeight: 'bold'
                            }} 
                        />
                    </div>

                    <div style={styles.inputGroup}><FaEnvelope style={styles.icon} /><input type="email" name="email" value={formData.email} onChange={onChange} placeholder="البريد الإلكتروني" style={styles.input} required /></div>
                    <div style={styles.inputGroup}><FaLock style={styles.icon} /><input type="password" name="password" value={formData.password} onChange={onChange} placeholder="كلمة المرور" style={styles.input} required /></div>
                    
                    <div style={{ marginBottom: '12px' }}><select name="role" value={formData.role} onChange={onChange} style={{ ...styles.input, padding: '12px', cursor: 'pointer' }}><option value="player">مدرب (Player)</option><option value="admin">مدير الدوري (Admin)</option></select></div>
                    
                    {formData.role === 'admin' && (<div style={styles.inputGroup}><FaKey style={styles.icon} /><input type="password" name="adminCode" value={formData.adminCode} onChange={onChange} placeholder="كود المسؤول" style={styles.input} required /></div>)}
                    
                    <button type="submit" disabled={loading || !isVerified} style={styles.btn}>
                        {loading ? 'جاري التسجيل...' : 'تسجيل حساب'}
                    </button>
                </form>
                <div style={{ marginTop: '20px', fontSize: '13px' }}>لديك حساب؟ <Link to="/login" style={{ color: '#37003c', fontWeight: 'bold', textDecoration: 'none' }}>سجل الدخول</Link></div>
            </div>
        </div>
    );
};
export default Register;