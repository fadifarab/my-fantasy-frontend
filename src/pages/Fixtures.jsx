import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    FaCalendarAlt, FaChevronLeft, FaChevronRight, FaInfoCircle, 
    FaClock, FaCheckCircle 
} from "react-icons/fa";

const Fixtures = () => {
  const { user } = useContext(AuthContext);
  const [fixtures, setFixtures] = useState([]);
  const [currentGw, setCurrentGw] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    <div style={{ padding: isMobile ? '10px' : '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      
      {/* Header المطور */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 15px', cursor:'pointer', border:'none', borderRadius:'10px', background:'#38003c', color:'white', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(56,0,60,0.2)' }}>⬅ رجوع</button>
          <h2 style={{ margin: 0, color: '#38003c', display:'flex', alignItems:'center', gap:'8px', fontSize: isMobile ? '18px' : '22px' }}>
              <FaCalendarAlt color="#00ff85" /> المباريات
          </h2>
      </div>

      {/* Selector المطور */}
      <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          marginBottom: '20px', backgroundColor: '#38003c', padding: '12px 20px', borderRadius: '15px', 
          maxWidth: isMobile ? '100%' : '450px', margin: '0 auto 20px auto', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' 
      }}>
          <button onClick={() => changeGw('prev')} disabled={currentGw <= 1} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color:'white', padding: '10px', borderRadius: '50%', cursor: 'pointer', display:'flex' }}><FaChevronRight /></button>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#00ff85', fontSize: '10px', display: 'block', fontWeight: 'bold', letterSpacing: '1px' }}>GAMEWEEK</span>
            <h3 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: '900' }}>{currentGw}</h3>
          </div>
          <button onClick={() => changeGw('next')} disabled={currentGw >= 38} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color:'white', padding: '10px', borderRadius: '50%', cursor: 'pointer', display:'flex' }}><FaChevronLeft /></button>
      </div>

      {/* قائمة المباريات المطورة */}
      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'grid', gap: '15px' }}>
          {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#38003c', fontWeight: 'bold' }}>جاري جلب النتائج... ⏳</div>
          ) : fixtures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '20px', color: '#888', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                  <FaInfoCircle size={40} color="#ddd" style={{ marginBottom: '10px' }} />
                  <p style={{ fontWeight: 'bold' }}>لا توجد مباريات مجدولة لهذه الجولة.</p>
              </div>
          ) : (
              fixtures.map((match, index) => (
                  <div key={index} onClick={() => navigate(`/match/${match._id}`)} style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '18px', 
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
                      cursor: 'pointer',
                      border: '1px solid #eee'
                  }}>
                      {/* شريط حالة المباراة العلوي */}
                      <div style={{ 
                        backgroundColor: match.isFinished ? '#f8f9fa' : '#fff9e6', 
                        padding: '5px 15px', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        gap: '5px',
                        borderBottom: '1px solid #eee'
                      }}>
                        {match.isFinished ? (
                          <><FaCheckCircle size={10} color="#00ff85" /> <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#666' }}>انتهت المباراة</span></>
                        ) : (
                          <><FaClock size={10} color="#ffc107" /> <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#666' }}>لم تبدأ بعد</span></>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 10px' }}>
                          {/* Home Team */}
                          <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <img src={match.homeTeamId?.logoUrl} alt="home" style={{ width: isMobile ? '45px' : '55px', height: isMobile ? '45px' : '55px', objectFit: 'contain', marginBottom: '8px' }} />
                              <span style={{ fontWeight: '800', fontSize: isMobile ? '12px' : '14px', color: '#333' }}>
                                  {match.homeTeamId?.name}
                              </span>
                          </div>

                          {/* النتيجة الاحترافية */}
                          <div style={{ flex: 0.7, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              {match.isFinished ? (
                                  <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '4px',
                                      backgroundColor: '#38003c', 
                                      padding: '6px 14px', 
                                      borderRadius: '10px', 
                                      color: '#00ff85',
                                      fontSize: '22px', 
                                      fontWeight: '900',
                                      fontFamily: 'monospace',
                                      boxShadow: '0 4px 10px rgba(56,0,60,0.2)'
                                  }}>
                                      {match.homeScore}<span style={{color:'white', opacity:0.3, fontSize:'14px'}}>:</span>{match.awayScore}
                                  </div>
                              ) : (
                                  <div style={{ 
                                      backgroundColor: '#f0f0f0', 
                                      color: '#38003c', 
                                      padding: '5px 15px', 
                                      borderRadius: '12px', 
                                      fontWeight: '900', 
                                      fontSize: '12px',
                                      border: '1px solid #ddd'
                                  }}>VS</div>
                              )}
                              <span style={{ marginTop: '8px', color: '#00ff85', fontSize: '9px', fontWeight: 'bold', backgroundColor: '#38003c', padding: '2px 8px', borderRadius: '4px' }}>التفاصيل ⮕</span>
                          </div>

                          {/* Away Team */}
                          <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <img src={match.awayTeamId?.logoUrl} alt="away" style={{ width: isMobile ? '45px' : '55px', height: isMobile ? '45px' : '55px', objectFit: 'contain', marginBottom: '8px' }} />
                              <span style={{ fontWeight: '800', fontSize: isMobile ? '12px' : '14px', color: '#333' }}>
                                  {match.awayTeamId?.name}
                              </span>
                          </div>
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};
export default Fixtures;