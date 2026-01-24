import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { 
    FaFacebook, FaImage, FaChartLine, FaTrophy, 
    FaUsers, FaArrowRight, FaSpinner, FaBullhorn, FaTimes, FaCheck,
    FaExclamationTriangle, FaSync, FaInfoCircle
} from "react-icons/fa";
import { TbSoccerField } from "react-icons/tb";
import TournamentHeader from '../utils/TournamentHeader';

const MediaCenter = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [leagueLogo, setLeagueLogo] = useState('');
    const [currentGw, setCurrentGw] = useState(1);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [showPreview, setShowPreview] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [userCaption, setUserCaption] = useState('');
    const [currentType, setCurrentType] = useState('');
    const [currentTitle, setCurrentTitle] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/dashboard');
            return;
        }

        const fetchData = async () => {
            try {
                const { data } = await API.get('/leagues/me');
                if (data) {
                    setLeagueLogo(data.logoUrl || '');
                    setCurrentGw(data.currentGw || 1);
                }
            } catch (err) {
                console.error("Error fetching league data:", err);
                if (err.response?.status === 401) {
                    setMessage({ 
                        text: '❌ انتهت صلاحية الجلسة', 
                        type: 'error' 
                    });
                }
            }
        };
        fetchData();

        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [user, navigate]);

    // ⭐⭐ دالة المعاينة المعدلة ⭐⭐
    const handleRequestPreview = async (type, title) => {
        setLoading(true);
        setCurrentType(type);
        setCurrentTitle(title);
        setMessage({ text: 'جاري تحضير المعاينة... 📸', type: 'info' });
        
        try {
            // ✅ المسار الصحيح: /leagues/get-preview
            const { data } = await API.post('/leagues/get-preview', { 
                type, 
                gw: currentGw
                // لا حاجة لإرسال token في body - API.js يرسله في headers
            });
            
            console.log('📥 استجابة السيرفر:', data);
            
            if (data.success && data.previewImage) {
                // تأكد أن الصورة تبدأ بـ data:image/png;base64,
                let imageData = data.previewImage;
                if (!imageData.startsWith('data:image/')) {
                    imageData = `data:image/png;base64,${imageData}`;
                }
                
                setPreviewImage(imageData);
                setShowPreview(true);
                setMessage({ text: '', type: '' });
                
                // نص افتراضي
                setUserCaption(`🎮 ${title} - الجولة ${currentGw}\n\n⚽ #FPL_ZEDDINE\n🔥 #تعليم_الرياضي\n📊 #دوري_المحترفين\n\nتابعنا لمزيد من التفاصيل! 👇`);
                
                console.log('✅ تم إنشاء المعاينة بنجاح');
            } else {
                setMessage({ 
                    text: `❌ ${data.message || 'فشل في إنشاء المعاينة'}`, 
                    type: 'error' 
                });
            }
        } catch (err) {
            console.error('❌ خطأ في المعاينة:', err);
            
            let errorMsg = '❌ فشل الاتصال بالسيرفر';
            
            if (err.response) {
                console.error('تفاصيل الخطأ:', {
                    status: err.response.status,
                    data: err.response.data
                });
                
                if (err.response.status === 404) {
                    errorMsg = '❌ نقطة النهاية غير موجودة (/leagues/get-preview)';
                } else if (err.response.status === 401) {
                    errorMsg = '❌ صلاحية غير كافية (يجب أن تكون أدمن)';
                } else if (err.response.status === 500) {
                    errorMsg = '❌ خطأ في السيرفر الداخلي';
                } else if (err.response.data?.message) {
                    errorMsg = `❌ ${err.response.data.message}`;
                }
            }
            
            setMessage({ 
                text: errorMsg, 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    // ⭐⭐ دالة النشر المعدلة ⭐⭐
    const confirmAndPublish = async () => {
        if (!userCaption.trim()) {
            setMessage({ 
                text: '⚠️ يرجى إضافة نص للمنشور قبل النشر', 
                type: 'error' 
            });
            return;
        }

        setLoading(true);
        setMessage({ text: 'جاري النشر إلى فيسبوك... 📤', type: 'info' });
        
        try {
            // ✅ المسار الصحيح: /leagues/publish-to-facebook
            const { data } = await API.post('/leagues/publish-to-facebook', {
                type: currentType,
                gw: currentGw,
                caption: userCaption
                // لا حاجة لإرسال token في body
            });
            
            if (data.success) {
                setMessage({ 
                    text: '✅ تم النشر على فيسبوك بنجاح!', 
                    type: 'success' 
                });
                
                setTimeout(() => {
                    setShowPreview(false);
                    setMessage({ text: '', type: '' });
                }, 3000);
            } else {
                setMessage({ 
                    text: `❌ ${data.message || 'فشل النشر'}`, 
                    type: 'error' 
                });
            }
        } catch (err) {
            console.error('❌ خطأ في النشر:', err);
            
            let errorMsg = '❌ فشل النشر إلى فيسبوك';
            if (err.response?.data?.message) {
                errorMsg = `❌ ${err.response.data.message}`;
            }
            
            setMessage({ 
                text: errorMsg, 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const downloadImage = () => {
        if (!previewImage) return;
        
        const link = document.createElement('a');
        link.href = previewImage;
        link.download = `منشور_${currentType}_جولة${currentGw}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setMessage({ 
            text: '📥 تم تنزيل الصورة بنجاح', 
            type: 'success' 
        });
    };

    // دالة اختبار الاتصال
    const testConnection = async () => {
        setMessage({ text: '🔍 جاري اختبار الاتصال...', type: 'info' });
        
        try {
            // 1. اختبار التوكن الأساسي
            const leagueRes = await API.get('/leagues/me');
            console.log('✅ التوكن صالح:', leagueRes.data.name);
            
            // 2. اختبار نقطة get-preview
            const testRes = await fetch('http://localhost:5000/api/leagues/get-preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ type: 'standings', gw: currentGw })
            });
            
            if (testRes.ok) {
                const testData = await testRes.json();
                setMessage({ 
                    text: `✅ جميع الخدمات تعمل! (${testData.message || 'جاهز'})`, 
                    type: 'success' 
                });
            } else {
                const errorText = await testRes.text();
                setMessage({ 
                    text: `❌ get-preview status: ${testRes.status} - ${errorText.substring(0, 100)}`, 
                    type: 'error' 
                });
            }
        } catch (err) {
            console.error('Test error:', err);
            setMessage({ 
                text: `❌ فشل الاختبار: ${err.message}`, 
                type: 'error' 
            });
        }
    };

    const PublishCard = ({ title, icon, color, type, description }) => (
        <div style={{
            background: 'white', 
            padding: '20px', 
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)', 
            textAlign: 'center',
            borderTop: `5px solid ${color}`, 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'space-between', 
            minHeight: '200px',
            transition: 'transform 0.3s, box-shadow 0.3s'
        }}
        className="hover-card"
        >
            <div style={{ color: color, fontSize: '35px', marginBottom: '10px' }}>{icon}</div>
            <h3 style={{ 
                margin: '0 0 10px 0', 
                fontSize: '17px', 
                color: '#38003c', 
                fontWeight:'bold',
                minHeight: '40px'
            }}>
                {title}
            </h3>
            <p style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginBottom: '20px',
                minHeight: '36px'
            }}>
                {description}
            </p>
            <button 
                onClick={() => handleRequestPreview(type, title)}
                disabled={loading && currentType === type}
                style={{
                    background: color, 
                    color: color === '#ffd700' ? '#38003c' : 'white', 
                    border: 'none',
                    padding: '12px', 
                    borderRadius: '10px', 
                    fontWeight: 'bold',
                    cursor: (loading && currentType === type) ? 'not-allowed' : 'pointer', 
                    fontSize: '14px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    opacity: (loading && currentType === type) ? 0.7 : 1,
                    transition: 'opacity 0.3s'
                }}
            >
                {loading && currentType === type ? (
                    <><FaSpinner className="spin" /> جاري التحميل...</>
                ) : (
                    <><FaFacebook /> معاينة ونشر</>
                )}
            </button>
        </div>
    );

    const cardsData = [
        { title: "تشكيلات الجولة", type: "lineups", description: "نشر صور أطقم الفرق والخواص المستعملة.", icon: <FaUsers />, color: "#38003c" },
        { title: "نتائج المباريات", type: "fixtures", description: "تصدير نتائج المواجهات المباشرة للجولة.", icon: <FaBullhorn />, color: "#00c853" },
        { title: "جدول الترتيب", type: "standings", description: "تحديث صورة الترتيب العام والنقاط الذهبية.", icon: <FaTrophy />, color: "#ffd700" },
        { title: "التشكيلة المثالية", type: "dream-team", description: "نشر صورة ملعب النجوم الحاصلين على أعلى النقاط.", icon: <TbSoccerField />, color: "#2979ff" },
        { title: "إحصائيات الجولات", type: "stats", description: "نشر مصفوفة النقاط التفصيلية لجميع الفرق.", icon: <FaChartLine />, color: "#e91e63" },
        { title: "جدول الفورمة", type: "form", description: "نشر سجل أداء الفرق في آخر 5 مواجهات.", icon: <FaImage />, color: "#ff9800" }
    ];

    if (!user) return <div style={{textAlign:'center', padding:'50px'}}>جاري التحميل...</div>;

    return (
        <div style={{ 
            padding: isMobile ? '10px' : '30px', 
            background: '#f8f9fb', 
            minHeight: '100vh', 
            direction: 'rtl',
            maxWidth: '1400px',
            margin: '0 auto'
        }}>
            <TournamentHeader isMobile={isMobile} logoUrl={leagueLogo} />

            {/* رأس الصفحة مع زر الاختبار */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '25px', 
                gap: '15px', 
                background: 'white', 
                padding: '15px 20px', 
                borderRadius: '12px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        style={{ 
                            background: '#f5f5f5', 
                            border: 'none', 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '10px', 
                            cursor:'pointer', 
                            display:'flex', 
                            alignItems:'center', 
                            justifyContent:'center',
                            flexShrink: 0
                        }}
                    >
                        <FaArrowRight color="#38003c" />
                    </button>
                    <div>
                        <h1 style={{ 
                            margin: 0, 
                            color: '#38003c', 
                            fontSize: isMobile ? '20px' : '26px', 
                            fontWeight: '900',
                            marginBottom: '5px'
                        }}>
                            📢 المركز الإعلامي (فيسبوك)
                        </h1>
                        <p style={{ 
                            margin: 0, 
                            color: '#666', 
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>الجولة: <strong>{currentGw}</strong></span>
                            <span style={{color: '#ccc'}}>|</span>
                            <span>الدخول كـ: <strong>{user?.name || user?.email}</strong></span>
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={testConnection}
                    style={{
                        padding: '8px 15px',
                        background: '#f0f7ff',
                        color: '#1976d2',
                        border: '1px solid #90caf9',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <FaSync size={14} /> اختبار الاتصال
                </button>
            </div>

            {/* رسائل النظام */}
            {message.text && (
                <div style={{ 
                    background: message.type === 'success' ? '#e8f5e9' : 
                                message.type === 'error' ? '#ffebee' : '#e3f2fd',
                    color: message.type === 'success' ? '#2e7d32' : 
                           message.type === 'error' ? '#c62828' : '#1565c0',
                    padding: '15px', 
                    borderRadius: '10px', 
                    marginBottom: '25px', 
                    fontWeight: 'bold',
                    textAlign: 'center', 
                    border: `1px solid ${message.type === 'success' ? '#a5d6a7' : 
                             message.type === 'error' ? '#ef9a9a' : '#90caf9'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                }}>
                    {message.type === 'error' && <FaExclamationTriangle />}
                    {message.text}
                </div>
            )}

            {/* بطاقات الخيارات */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '25px',
                marginBottom: '30px'
            }}>
                {cardsData.map((card, index) => (
                    <PublishCard 
                        key={index}
                        title={card.title}
                        type={card.type}
                        description={card.description}
                        icon={card.icon}
                        color={card.color}
                    />
                ))}
            </div>

            {/* معلومات إضافية */}
            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                marginTop: '20px',
                borderLeft: '4px solid #38003c'
            }}>
                <h3 style={{ color: '#38003c', marginTop: 0, marginBottom: '10px' }}>
                    📋 معلومات التقنية
                </h3>
                <div style={{ color: '#666', fontSize: '14px' }}>
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaInfoCircle /> مسار المعاينة: <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>POST /leagues/get-preview</code>
                    </div>
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaInfoCircle /> مسار النشر: <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>POST /leagues/publish-to-facebook</code>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaInfoCircle /> متطلبات: صلاحية أدمن + توكن صالح
                    </div>
                </div>
            </div>

            {/* 🖼 نافذة المعاينة */}
            {showPreview && (
                <div style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    background: 'rgba(0,0,0,0.85)', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    zIndex: 9999, 
                    padding: isMobile ? '10px' : '20px' 
                }}>
                    <div style={{ 
                        background: 'white', 
                        padding: '25px', 
                        borderRadius: '15px', 
                        maxWidth: '700px', 
                        width: '100%', 
                        maxHeight: '95vh', 
                        overflowY: 'auto', 
                        position: 'relative' 
                    }}>
                        <button 
                            onClick={() => setShowPreview(false)} 
                            style={{ 
                                position: 'absolute', 
                                top: '15px', 
                                left: '15px', 
                                background: '#eee', 
                                border: 'none', 
                                borderRadius: '50%', 
                                width: '35px', 
                                height: '35px', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <FaTimes />
                        </button>
                        
                        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                            <h2 style={{ 
                                color: '#38003c', 
                                marginBottom: '5px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}>
                                {currentTitle}
                                <span style={{ 
                                    background: '#38003c', 
                                    color: 'white', 
                                    padding: '3px 10px', 
                                    borderRadius: '20px', 
                                    fontSize: '12px' 
                                }}>
                                    الجولة {currentGw}
                                </span>
                            </h2>
                        </div>
                        
                        {/* الصورة مع تصحيح */}
                        <div style={{ 
                            border: '2px solid #e0e0e0', 
                            borderRadius: '10px', 
                            overflow: 'hidden', 
                            marginBottom: '20px',
                            background: '#f5f5f5'
                        }}>
                            {previewImage ? (
                                <div>
                                    <img 
                                        src={previewImage} 
                                        style={{ 
                                            width: '100%', 
                                            display: 'block',
                                            maxHeight: '400px',
                                            objectFit: 'contain'
                                        }} 
                                        alt="Preview" 
                                        onError={(e) => {
                                            console.error('❌ فشل تحميل الصورة');
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = `
                                                <div style="padding: 40px; text-align: center; color: #c62828;">
                                                    <p>❌ فشل تحميل الصورة</p>
                                                    <p style="font-size: 12px; color: #666; margin-top: 10px;">
                                                        بيانات الصورة غير صالحة<br/>
                                                        طول البيانات: ${previewImage.length} حرف
                                                    </p>
                                                </div>
                                            `;
                                        }}
                                    />
                                    <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', padding: '5px', background: '#fafafa' }}>
                                        الصورة: {previewImage.length} حرف | {previewImage.startsWith('data:image') ? 'صيغة صحيحة' : 'صيغة تحتاج تصحيح'}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                    جاري تحميل الصورة...
                                </div>
                            )}
                        </div>

                        {/* نص المنشور */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ 
                                fontWeight: 'bold', 
                                display: 'block', 
                                marginBottom: '8px',
                                color: '#38003c'
                            }}>
                                نص المنشور:
                            </label>
                            <textarea 
                                value={userCaption}
                                onChange={(e) => setUserCaption(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    height: '100px', 
                                    borderRadius: '8px', 
                                    padding: '12px', 
                                    border: '1px solid #ccc', 
                                    fontSize: '14px', 
                                    fontFamily: 'inherit', 
                                    resize: 'none',
                                    lineHeight: '1.5'
                                }}
                                placeholder="اكتب وصف المنشور هنا..."
                            />
                        </div>

                        {/* أزرار التحكم */}
                        <div style={{ 
                            display: 'flex', 
                            gap: '15px', 
                            marginTop: '25px',
                            flexWrap: isMobile ? 'wrap' : 'nowrap'
                        }}>
                            <button 
                                onClick={confirmAndPublish} 
                                disabled={loading}
                                style={{ 
                                    flex: 2, 
                                    padding: '15px', 
                                    background: '#1877F2', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '10px', 
                                    fontWeight: 'bold', 
                                    fontSize: '16px', 
                                    cursor: loading ? 'not-allowed' : 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '10px',
                                    minWidth: isMobile ? '100%' : 'auto'
                                }}
                            >
                                {loading ? (
                                    <><FaSpinner className="spin" /> جاري النشر...</>
                                ) : (
                                    <><FaCheck /> نشر إلى فيسبوك</>
                                )}
                            </button>
                            
                            <button 
                                onClick={downloadImage}
                                disabled={!previewImage}
                                style={{ 
                                    flex: 1, 
                                    padding: '15px', 
                                    background: '#4CAF50', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '10px', 
                                    fontWeight: 'bold', 
                                    cursor: previewImage ? 'pointer' : 'not-allowed',
                                    minWidth: isMobile ? '100%' : 'auto'
                                }}
                            >
                                <FaImage /> تنزيل
                            </button>
                            
                            <button 
                                onClick={() => setShowPreview(false)}
                                style={{ 
                                    flex: 1, 
                                    padding: '15px', 
                                    background: '#f5f5f5', 
                                    color: '#333', 
                                    border: 'none', 
                                    borderRadius: '10px', 
                                    fontWeight: 'bold', 
                                    cursor: 'pointer',
                                    minWidth: isMobile ? '100%' : 'auto'
                                }}
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .spin { 
                    animation: spin 1s linear infinite; 
                } 
                @keyframes spin { 
                    100% { 
                        transform: rotate(360deg); 
                    } 
                }
                .hover-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};

export default MediaCenter;