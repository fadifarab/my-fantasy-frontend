// client/src/pages/Fixtures.jsx
import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaInfoCircle, FaArrowRight } from "react-icons/fa";
import TournamentHeader from '../utils/TournamentHeader'; // استيراد الرأسية

const Fixtures = () => {
  const { user } = useContext(AuthContext);
  const [fixtures, setFixtures] = useState([]);
  const [currentGw, setCurrentGw] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [leagueLogo, setLeagueLogo] = useState(''); // حالة شعار البطولة
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. جلب رقم الجولة الحالية وبيانات الدوري
  useEffect(() => {
      const initPage = async () => {
          try {
              const { data } = await API.get('/gameweek/status');
              if (data && data.id) setCurrentGw(data.id);
              else setCurrentGw(1);

              // جلب شعار البطولة (رابط PostImages)
              const { data: lData } = await API.get('/leagues/me');
              if (lData && lData.logoUrl) setLeagueLogo(lData.logoUrl);
          } catch (error) {
              console.error("Error fetching initial data", error);
              setCurrentGw(1);
          }
      };
      initPage();
  }, []);

  // 2. جلب المباريات عند تغير الجولة
  useEffect(() => {
    if (user && user.leagueId && currentGw !== null) {
        fetchFixtures(currentGw);
    }
  }, [currentGw, user]);

  const fetchFixtures = async (gw) => {
    setLoading(true);
    try {
        if (user.leagueId) {
            const { data } = await API.get(`/fixtures/${user.leagueId}/${gw}`);
            setFixtures(data);
        }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const changeGw = (direction) => {
      if (direction === 'next' && currentGw < 38) setCurrentGw(prev => prev + 1);
      if (direction === 'prev' && currentGw > 1) setCurrentGw(prev => prev - 1);
  };

  if (currentGw === null) return <div style={{textAlign:'center', padding:'50px'}}>جاري التحميل...</div>;

  return (
    <div style={{ padding: isMobile ? '10px' : '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* 🏆 رأسية البطولة الرسمية */}
      <TournamentHeader isMobile={isMobile} logoUrl={leagueLogo} />

      {/* 👕 شريط العودة والعنوان */}
      <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '20px', 
          gap: '15px',
          backgroundColor: 'white',
          padding: '10px 15px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
         <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 12px', cursor:'pointer', border:'none', borderRadius:'8px', background:'#f5f5f5', display:'flex', alignItems:'center', justifyContent:'center' }}>
             <FaArrowRight color="#38003c" />
         </button>
         <h2 style={{ margin: 0, color: '#38003c', display:'flex', alignItems:'center', gap:'10px', fontSize: isMobile ? '18px' : '24px' }}>
             <FaCalendarAlt size={isMobile ? 18 : 22} /> جدول المباريات
         </h2>
      </div>

      {/* 📅 محدد الجولات */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '30px', backgroundColor: 'white', padding: '15px', borderRadius: '15px', maxWidth: '400px', margin: '0 auto 30px auto', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
          <button onClick={() => changeGw('prev')} disabled={currentGw <= 1} style={{ background: '#f5f5f5', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}><FaChevronRight /></button>
          <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#888', fontWeight: 'bold', display: 'block' }}>الدور الأول</span>
              <h2 style={{ margin: 0, color: '#38003c', fontSize: isMobile ? '20px' : '24px' }}>الجولة {currentGw}</h2>
          </div>
          <button onClick={() => changeGw('next')} disabled={currentGw >= 38} style={{ background: '#f5f5f5', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}><FaChevronLeft /></button>
      </div>

      {/* ⚽ قائمة المباريات */}
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gap: '15px' }}>
          {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>جاري تحميل المباريات... ⏳</div>
          ) : fixtures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '10px', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <FaInfoCircle size={30} color="#ccc" />
                  <p>لا توجد مباريات لهذه الجولة.</p>
              </div>
          ) : (
              fixtures.map((match, index) => (
                  <div key={match._id || index} onClick={() => navigate(`/match/${match._id}`)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: isMobile ? '15px 10px' : '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderRight: match.isFinished ? '5px solid #00ff85' : '5px solid #ddd', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                      
                      {/* الفريق المستضيف */}
                      <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <img 
                            src={match.homeTeamId?.logoUrl || `/kits/${match.homeTeamId?.name}.png`} 
                            alt="home" 
                            style={{ width: isMobile ? '45px' : '65px', height: isMobile ? '45px' : '65px', objectFit: 'contain' }} 
                            onError={(e) => { e.target.src = '/kits/default.png'; }}
                          />
                          <span style={{ fontWeight: 'bold', fontSize: isMobile ? '12px' : '16px', color: '#333' }}>{match.homeTeamId?.name}</span>
                      </div>

                      {/* النتيجة / VS */}
                      <div style={{ flex: 0.6, textAlign: 'center' }}>
                          {match.isFinished ? (
                              <div style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: '900', color: '#38003c', backgroundColor: '#f0f0f0', padding: '5px 10px', borderRadius: '8px', fontFamily: 'monospace' }}>
                                  {match.homeScore} - {match.awayScore}
                              </div>
                          ) : (
                              <div style={{ backgroundColor: '#38003c', color: '#00ff85', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', border: '1px solid #00ff85' }}>VS</div>
                          )}
                          <small style={{display:'block', marginTop:'8px', color:'#aaa', fontSize:'9px'}}>تفاصيل اللقاء</small>
                      </div>

                      {/* الفريق الضيف */}
                      <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <img 
                            src={match.awayTeamId?.logoUrl || `/kits/${match.awayTeamId?.name}.png`} 
                            alt="away" 
                            style={{ width: isMobile ? '45px' : '65px', height: isMobile ? '45px' : '65px', objectFit: 'contain' }} 
                            onError={(e) => { e.target.src = '/kits/default.png'; }}
                          />
                          <span style={{ fontWeight: 'bold', fontSize: isMobile ? '12px' : '16px', color: '#333' }}>{match.awayTeamId?.name}</span>
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};

export default Fixtures;