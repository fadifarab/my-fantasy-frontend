import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaInfoCircle } from "react-icons/fa";

const Fixtures = () => {
  const { user } = useContext(AuthContext);
  const [fixtures, setFixtures] = useState([]);
  const [currentGw, setCurrentGw] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // اكتشاف حجم الشاشة لضبط التنسيقات المتجاوبة
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const initPage = async () => {
      try {
        const { data } = await API.get('/gameweek/status');
        if (data && data.id) setCurrentGw(data.id);
        else setCurrentGw(1);
      } catch (error) {
        console.error("Error fetching GW status", error);
        setCurrentGw(1);
      }
    };
    initPage();
  }, []);

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

  if (currentGw === null) return <div style={{textAlign:'center', padding:'100px'}}>جاري التحميل... ⚽</div>;

  return (
    <div style={{ padding: isMobile ? '10px' : '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 12px', cursor:'pointer', border:'none', borderRadius:'8px', background:'white', fontSize: isMobile ? '12px' : '14px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>⬅ عودة</button>
          <h2 style={{ margin: 0, color: '#38003c', display:'flex', alignItems:'center', gap:'8px', fontSize: isMobile ? '18px' : '24px' }}>
              <FaCalendarAlt /> جدول المباريات
          </h2>
      </div>

      {/* Gameweek Selector */}
      <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          marginBottom: '20px', backgroundColor: 'white', padding: '10px 15px', borderRadius: '15px', 
          maxWidth: isMobile ? '100%' : '400px', margin: '0 auto 20px auto', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' 
      }}>
          <button onClick={() => changeGw('prev')} disabled={currentGw <= 1} style={{ background: '#f5f5f5', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', display:'flex' }}><FaChevronRight /></button>
          <h3 style={{ margin: 0, color: '#38003c', fontSize: isMobile ? '16px' : '20px', fontWeight: '900' }}>الجولة {currentGw}</h3>
          <button onClick={() => changeGw('next')} disabled={currentGw >= 38} style={{ background: '#f5f5f5', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', display:'flex' }}><FaChevronLeft /></button>
      </div>

      {/* Fixtures List */}
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gap: '12px' }}>
          {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>جاري جلب النتائج... ⏳</div>
          ) : fixtures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '10px', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <FaInfoCircle size={30} color="#ccc" />
                  <p>لا توجد مباريات مجدولة لهذه الجولة.</p>
              </div>
          ) : (
              fixtures.map((match, index) => (
                  <div key={index} onClick={() => navigate(`/match/${match._id}`)} style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      backgroundColor: 'white', padding: isMobile ? '15px 10px' : '20px', 
                      borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
                      borderRight: match.isFinished ? '6px solid #00ff85' : '6px solid #38003c', 
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                  }}>
                      {/* Home Team */}
                      <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <img src={match.homeTeamId?.logoUrl} alt="home" style={{ width: isMobile ? '45px' : '65px', height: isMobile ? '45px' : '65px', objectFit: 'contain' }} />
                          <span style={{ fontWeight: 'bold', fontSize: isMobile ? '11px' : '15px', color: '#333', lineHeight: '1.2' }}>
                              {match.homeTeamId?.name}
                          </span>
                      </div>

                      {/* النتيجة المحسنة للهاتف */}
                      <div style={{ flex: 0.8, textAlign: 'center', display:'flex', flexDirection:'column', alignItems:'center' }}>
                          {match.isFinished ? (
                              <div style={{ 
                                  fontSize: isMobile ? '16px' : '22px', fontWeight: '900', color: '#38003c', 
                                  backgroundColor: '#00ff85', padding: isMobile ? '5px 10px' : '8px 18px', 
                                  borderRadius: '6px', fontFamily: 'monospace', minWidth: isMobile ? '55px' : '80px',
                                  boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.1)'
                              }}>
                                  {match.homeScore} - {match.awayScore}
                              </div>
                          ) : (
                              <div style={{ backgroundColor: '#38003c', color: 'white', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: isMobile ? '11px' : '14px', letterSpacing: '1px' }}>VS</div>
                          )}
                          <span style={{ display:'block', marginTop:'8px', color:'#999', fontSize:'10px', fontWeight:'bold' }}>التفاصيل</span>
                      </div>

                      {/* Away Team */}
                      <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <img src={match.awayTeamId?.logoUrl} alt="away" style={{ width: isMobile ? '45px' : '65px', height: isMobile ? '45px' : '65px', objectFit: 'contain' }} />
                          <span style={{ fontWeight: 'bold', fontSize: isMobile ? '11px' : '15px', color: '#333', lineHeight: '1.2' }}>
                              {match.awayTeamId?.name}
                          </span>
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};
export default Fixtures;