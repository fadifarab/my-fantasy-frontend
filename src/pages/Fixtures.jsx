// client/src/pages/Fixtures.jsx
import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaInfoCircle } from "react-icons/fa";

const Fixtures = () => {
  const { user } = useContext(AuthContext);
  const [fixtures, setFixtures] = useState([]);
  const [currentGw, setCurrentGw] = useState(null); // نبدأ بـ null
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 1. جلب رقم الجولة الحالية أولاً
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
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
         <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 12px', cursor:'pointer', border:'none', borderRadius:'8px', background:'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>⬅ عودة</button>
         <h1 style={{ margin: 0, color: '#38003c', display:'flex', alignItems:'center', gap:'10px' }}>
             <FaCalendarAlt /> جدول المباريات
         </h1>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '30px', backgroundColor: 'white', padding: '15px', borderRadius: '15px', maxWidth: '400px', margin: '0 auto 30px auto', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <button onClick={() => changeGw('prev')} disabled={currentGw <= 1} style={{ background: '#f5f5f5', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}><FaChevronRight /></button>
          <h2 style={{ margin: 0, color: '#38003c' }}>الجولة {currentGw}</h2>
          <button onClick={() => changeGw('next')} disabled={currentGw >= 38} style={{ background: '#f5f5f5', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }}><FaChevronLeft /></button>
      </div>

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
                  <div key={index} onClick={() => navigate(`/match/${match._id}`)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderRight: match.isFinished ? '5px solid #00ff85' : '5px solid #ddd', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                      <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <img src={match.homeTeamId?.logoUrl} alt="home" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{match.homeTeamId?.name}</span>
                      </div>
                      <div style={{ flex: 0.5, textAlign: 'center' }}>
                          {match.isFinished ? (
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#38003c', backgroundColor: '#e0f2f1', padding: '5px 15px', borderRadius: '10px', fontFamily: 'Arial' }}>{match.homeScore} - {match.awayScore}</div>
                          ) : (
                              <div style={{ backgroundColor: '#38003c', color: 'white', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' }}>VS</div>
                          )}
                          <small style={{display:'block', marginTop:'5px', color:'#999', fontSize:'10px'}}>اضغط للتفاصيل</small>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <img src={match.awayTeamId?.logoUrl} alt="away" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{match.awayTeamId?.name}</span>
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};
export default Fixtures;