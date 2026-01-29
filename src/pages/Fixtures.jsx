import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaArrowRight, FaTrophy } from "react-icons/fa";

const Fixtures = () => {
  const { user } = useContext(AuthContext);
  const [fixtures, setFixtures] = useState([]);
  const [currentGw, setCurrentGw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leagueLogo, setLeagueLogo] = useState('');
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const initPage = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const gwParam = params.get('gw');
        if (gwParam) setCurrentGw(parseInt(gwParam));
        else {
          const { data } = await API.get('/gameweek/status');
          setCurrentGw(data?.id || 1);
        }
        const { data: lData } = await API.get('/leagues/me');
        if (lData?.logoUrl) setLeagueLogo(lData.logoUrl);
      } catch (error) { 
        setError("فشل في تحميل بيانات الصفحة"); 
        setCurrentGw(1); 
      }
      finally { setLoading(false); }
    };
    initPage();
  }, []);

  useEffect(() => {
    if (currentGw !== null && user?.leagueId) fetchFixtures(currentGw);
  }, [currentGw, user]);

  const fetchFixtures = async (gw) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/fixtures/${user.leagueId}/${gw}`);
      setFixtures(Array.isArray(data) ? data : []);
    } catch (error) { setError(`فشل في تحميل المباريات`); }
    finally { setLoading(false); }
  };

  const changeGw = (direction) => {
    if (direction === 'next' && currentGw < 38) setCurrentGw(prev => prev + 1);
    if (direction === 'prev' && currentGw > 1) setCurrentGw(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentGw === null && loading) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      color: 'white', 
      fontSize: window.innerWidth < 768 ? '24px' : '48px', 
      fontWeight: 'bold' 
    }}>
      جاري التحميل...
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 100%)', 
      direction: 'rtl', 
      padding: window.innerWidth < 768 ? '10px' : '30px', 
      fontFamily: '"Cairo", sans-serif' 
    }}>
      
      {/* Header - متجاوب تماماً */}
      <div style={{ 
        display: 'flex',
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        alignItems: window.innerWidth < 768 ? 'stretch' : 'center',
        background: 'white',
        padding: window.innerWidth < 768 ? '15px' : '20px 30px',
        borderRadius: '15px',
        marginBottom: '25px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '2px solid #e2e8f0',
        gap: window.innerWidth < 768 ? '15px' : '20px'
      }}>
        {/* الجزء العلوي للهاتف: زر العودة + الشعار */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: window.innerWidth < 768 ? 'space-between' : 'flex-start',
          gap: '15px'
        }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ 
              width: window.innerWidth < 768 ? '45px' : '55px', 
              height: window.innerWidth < 768 ? '45px' : '55px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #38003c 0%, #58005e 100%)', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              flexShrink: 0
            }}
          >
            <FaArrowRight size={window.innerWidth < 768 ? 20 : 24} />
          </button>

          {/* شعار البطولة */}
          <div style={{
            width: window.innerWidth < 768 ? '50px' : '80px', 
            height: window.innerWidth < 768 ? '50px' : '80px',
            borderRadius: '10px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #eee',
            flexShrink: 0
          }}>
            <img 
              src={leagueLogo || 'default-logo.png'} 
              alt="League Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>

          {/* اسم البطولة - يظهر فقط في الهاتف */}
          {window.innerWidth < 768 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              flex: 1
            }}>
              <h1 style={{
                margin: 0,
                fontSize: '20px', 
                fontWeight: '900',
                color: '#38003c',
                lineHeight: '1.2',
                textAlign: 'right'
              }}>
                FPL ZEDDINE
              </h1>
              <span style={{ 
                fontSize: '12px', 
                color: '#718096', 
                fontWeight: '700',
                textAlign: 'right'
              }}>
                الدوري الرسمي للبطولة
              </span>
            </div>
          )}
        </div>

        {/* اسم البطولة - للحاسوب والأجهزة الكبيرة */}
        {window.innerWidth >= 768 && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            flex: 1
          }}>
            <h1 style={{
              margin: 0,
              fontSize: '34px', 
              fontWeight: '900',
              color: '#38003c',
              lineHeight: '1.2'
            }}>
              FPL ZEDDINE
            </h1>
            <span style={{ 
              fontSize: '13px', 
              color: '#718096', 
              fontWeight: '700' 
            }}>
              الدوري الرسمي للبطولة
            </span>
          </div>
        )}
      </div>

      {/* Selector - متجاوب */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: window.innerWidth < 768 ? '15px' : '40px', 
        marginBottom: '20px', 
        background: 'white', 
        padding: window.innerWidth < 768 ? '12px' : '20px', 
        borderRadius: '20px', 
        border: '2px solid #e2e8f0',
        maxWidth: '600px',
        margin: '0 auto 20px'
      }}>
        <button 
          onClick={() => changeGw('prev')} 
          disabled={currentGw <= 1} 
          style={{ 
            width: window.innerWidth < 768 ? '45px' : '50px', 
            height: window.innerWidth < 768 ? '45px' : '50px', 
            borderRadius: '10px', 
            background: currentGw <= 1 ? '#e2e8f0' : '#667eea', 
            border: 'none', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FaChevronRight size={window.innerWidth < 768 ? 20 : 24} />
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: window.innerWidth < 768 ? '12px' : '14px', 
            color: '#718096', 
            fontWeight: '600' 
          }}>
            الجولة
          </div>
          <div style={{ 
            fontSize: window.innerWidth < 768 ? '36px' : '40px', 
            fontWeight: '900', 
            color: '#2d3748', 
            lineHeight: '1' 
          }}>
            {currentGw || 1}
          </div>
        </div>
        
        <button 
          onClick={() => changeGw('next')} 
          disabled={currentGw >= 38} 
          style={{ 
            width: window.innerWidth < 768 ? '45px' : '50px', 
            height: window.innerWidth < 768 ? '45px' : '50px', 
            borderRadius: '10px', 
            background: currentGw >= 38 ? '#e2e8f0' : '#667eea', 
            border: 'none', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FaChevronLeft size={window.innerWidth < 768 ? 20 : 24} />
        </button>
      </div>

      {/* Fixtures List - متجاوب مع Grid */}
      <div style={{ 
        background: 'white', 
        borderRadius: '20px', 
        padding: window.innerWidth < 768 ? '12px' : '25px', 
        boxShadow: '0 10px 20px rgba(0,0,0,0.05)', 
        maxWidth: '900px', 
        margin: '0 auto' 
      }}>
        <div style={{ display: 'grid', gap: '12px' }}>
          {fixtures.map((match, index) => {
            const homeScore = match.homeScore ?? 0;
            const awayScore = match.awayScore ?? 0;
            const isSmallScreen = window.innerWidth < 480;

            return (
              <div
                key={match._id || index}
                onClick={() => navigate(`/match/${match._id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth < 768 ? 
                    (window.innerWidth < 480 ? '1fr 70px 1fr' : '1fr 90px 1fr') : 
                    '1fr 150px 1fr',
                  alignItems: 'center',
                  padding: window.innerWidth < 768 ? '10px 8px' : '20px 30px',
                  borderRadius: '16px',
                  background: match.isFinished ? '#ffffff' : '#f8fafc',
                  border: `2px solid ${match.isFinished ? '#48bb78' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  marginBottom: '8px',
                  gap: window.innerWidth < 768 ? '8px' : '15px'
                }}
              >
                {/* Home Team */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: window.innerWidth < 480 ? 'column' : 'row',
                  alignItems: 'center',
                  justifyContent: window.innerWidth < 768 ? 'center' : 'flex-start',
                  gap: window.innerWidth < 768 ? '8px' : '15px',
                  textAlign: window.innerWidth < 480 ? 'center' : 'right'
                }}>
                  <img 
                    src={match.homeTeamId?.logoUrl} 
                    alt={match.homeTeamId?.name}
                    style={{ 
                      width: window.innerWidth < 768 ? 
                        (window.innerWidth < 480 ? '35px' : '40px') : '60px', 
                      height: window.innerWidth < 768 ? 
                        (window.innerWidth < 480 ? '35px' : '40px') : '60px', 
                      objectFit: 'contain' 
                    }} 
                  />
                  <span style={{ 
                    fontWeight: '900', 
                    fontSize: window.innerWidth < 768 ? 
                      (window.innerWidth < 480 ? '12px' : '14px') : '22px', 
                    color: '#2d3748',
                    lineHeight: '1.2'
                  }}>
                    {match.homeTeamId?.name}
                  </span>
                </div>

                {/* Score Box */}
                <div style={{ textAlign: 'center' }}>
                  {match.isFinished ? (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      background: '#2d3748',
                      color: '#ffffff',
                      padding: window.innerWidth < 768 ? '6px 8px' : '8px 12px', 
                      borderRadius: '10px',
                      fontSize: window.innerWidth < 768 ? 
                        (window.innerWidth < 480 ? '16px' : '18px') : '26px',
                      fontWeight: '900',
                      gap: '8px'
                    }}>
                      <span>{homeScore}</span>
                      <span style={{ color: '#48bb78' }}>-</span>
                      <span>{awayScore}</span>
                    </div>
                  ) : (
                    <div style={{ 
                      background: '#e2e8f0', 
                      color: '#2d3748', 
                      padding: window.innerWidth < 768 ? '4px 12px' : '5px 15px', 
                      borderRadius: '20px', 
                      fontWeight: '900', 
                      fontSize: window.innerWidth < 768 ? '12px' : '14px' 
                    }}>
                      VS
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: window.innerWidth < 480 ? 'column' : 'row',
                  alignItems: 'center',
                  justifyContent: window.innerWidth < 768 ? 'center' : 'flex-end',
                  gap: window.innerWidth < 768 ? '8px' : '15px',
                  textAlign: window.innerWidth < 480 ? 'center' : 'left'
                }}>
                  <img 
                    src={match.awayTeamId?.logoUrl} 
                    alt={match.awayTeamId?.name}
                    style={{ 
                      width: window.innerWidth < 768 ? 
                        (window.innerWidth < 480 ? '35px' : '40px') : '60px', 
                      height: window.innerWidth < 768 ? 
                        (window.innerWidth < 480 ? '35px' : '40px') : '60px', 
                      objectFit: 'contain' 
                    }} 
                  />
                  <span style={{ 
                    fontWeight: '900', 
                    fontSize: window.innerWidth < 768 ? 
                      (window.innerWidth < 480 ? '12px' : '14px') : '22px', 
                    color: '#2d3748',
                    lineHeight: '1.2'
                  }}>
                    {match.awayTeamId?.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ff6b6b',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 1000,
          maxWidth: '90%',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default Fixtures;