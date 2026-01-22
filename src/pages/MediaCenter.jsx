import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { 
    FaFacebook, FaImage, FaChartLine, FaTrophy, 
    FaUsers, FaArrowRight, FaSpinner, FaBullhorn 
} from "react-icons/fa";
import { TbSoccerField } from "react-icons/tb";
import TournamentHeader from '../utils/TournamentHeader';

const MediaCenter = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [leagueLogo, setLeagueLogo] = useState('');
    const [currentGw, setCurrentGw] = useState(1);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        // حماية الصفحة: إذا لم يكن المستخدم أدمن، نخرجه فوراً
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
            }
        };
        fetchData();
    }, [user, navigate]);

    const handlePublish = async (type) => {
        if (!window.confirm(`هل أنت متأكد من نشر [${type}] على صفحة الفيسبوك؟`)) return;
        setLoading(true);
        setMessage('جاري التقاط الصورة ومعالجتها... قد يستغرق الأمر دقيقة ⏳');
        try {
            await API.post('/admin/publish-to-facebook', { 
                type, 
                gw: currentGw 
            });
            setMessage(`✅ تم النشر بنجاح!`);
        } catch (err) {
            setMessage(`❌ فشل النشر: ${err.response?.data?.message || 'تأكد من تشغيل السيرفر وإعدادات الفيسبوك'}`);
        } finally {
            setLoading(false);
        }
    };

    // مكون البطاقة الداخلية
    const PublishCard = ({ title, icon, color, type, description }) => (
        <div style={{
            background: 'white', padding: '20px', borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center',
            borderTop: `5px solid ${color}`, display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', minHeight: '200px'
        }}>
            <div style={{ color: color, fontSize: '35px', marginBottom: '10px' }}>{icon}</div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '17px', color: '#38003c' }}>{title}</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>{description}</p>
            <button 
                onClick={() => handlePublish(type)}
                disabled={loading}
                style={{
                    background: color, color: color === '#ffd700' ? '#38003c' : 'white', border: 'none',
                    padding: '12px', borderRadius: '10px', fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
            >
                {loading ? <FaSpinner className="spin" /> : <><FaFacebook /> انشر الآن</>}
            </button>
        </div>
    );

    // إذا لم تكن بيانات المستخدم قد حملت بعد، نمنع الانهيار
    if (!user) return <div style={{textAlign:'center', padding:'50px'}}>جاري التحميل...</div>;

    return (
        <div style={{ padding: isMobile ? '10px' : '30px', background: '#f8f9fb', minHeight: '100vh', direction: 'rtl' }}>
            <TournamentHeader isMobile={isMobile} logoUrl={leagueLogo} />

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', gap: '15px', background: 'white', padding: '10px 15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: '#f5f5f5', border: 'none', width: '40px', height: '40px', borderRadius: '10px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <FaArrowRight color="#38003c" />
                </button>
                <h1 style={{ margin: 0, color: '#38003c', fontSize: isMobile ? '20px' : '26px', fontWeight: '900' }}>
                    📢 المركز الإعلامي
                </h1>
            </div>

            {message && (
                <div style={{ background: message.startsWith('✅') ? '#e8f5e9' : '#ffebee', color: message.startsWith('✅') ? '#2e7d32' : '#c62828', padding: '15px', borderRadius: '10px', marginBottom: '25px', fontWeight: 'bold', textAlign: 'center', border: '1px solid' }}>
                    {message}
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px'
            }}>
                <PublishCard title="تشكيلات الجولة" type="lineups" description="نشر صور أطقم الفرق والخواص المستعملة." icon={<FaUsers />} color="#38003c" />
                <PublishCard title="نتائج المباريات" type="results" description="تصدير نتائج المواجهات المباشرة للجولة." icon={<FaBullhorn />} color="#00c853" />
                <PublishCard title="جدول الترتيب" type="standings" description="تحديث صورة الترتيب العام والنقاط الذهبية." icon={<FaTrophy />} color="#ffd700" />
                <PublishCard title="التشكيلة المثالية" type="dream-team" description="نشر صورة ملعب النجوم الحاصلين على أعلى النقاط." icon={<TbSoccerField />} color="#2979ff" />
                <PublishCard title="إحصائيات الجولات" type="stats" description="نشر مصفوفة النقاط التفصيلية لجميع الفرق." icon={<FaChartLine />} color="#e91e63" />
                <PublishCard title="جدول الفورمة" type="form" description="نشر سجل أداء الفرق في آخر 5 مواجهات." icon={<FaImage />} color="#ff9800" />
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; } 
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default MediaCenter;