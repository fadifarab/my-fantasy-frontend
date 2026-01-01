import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    FaUserTie, FaCrown, FaCheck, FaArrowDown, FaExchangeAlt, 
    FaTshirt, FaClock, FaExclamationTriangle, FaCalendarCheck, FaLock 
} from "react-icons/fa"; 
import { TbSoccerField, TbReplace } from "react-icons/tb";

const MyTeam = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lineup, setLineup] = useState({}); 
  const [activeChip, setActiveChip] = useState('none');
  const [message, setMessage] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [currentGW, setCurrentGW] = useState(null); 
  const [selectedGW, setSelectedGW] = useState(null); 
  const [timeLeft, setTimeLeft] = useState('');
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    const initializeGW = async () => {
      try {
        const { data: status } = await API.get('/gameweek/status');
        if (status) {
          setCurrentGW(status.id);
          const nextGw = status.id + 1;
          setSelectedGW(nextGw <= 38 ? nextGw : status.id);
          await fetchTeamForGW(nextGw <= 38 ? nextGw : status.id);
        }
      } catch (error) {
        console.error("خطأ:", error);
        setLoading(false);
      }
    };
    initializeGW();
  }, []);

  const fetchTeamForGW = async (gwId) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/teams/me?gw=${gwId}`);
      if (data) {
        setTeam(data);
        setDeadline(data.deadline_time ? new Date(data.deadline_time) : null);
        const initialLineup = {};
        const playersSource = (data.lineup && data.lineup.length > 0) ? data.lineup : (data.members || []);

        playersSource.forEach((p, index) => {
          if (p) {
            const userData = p.userId && p.userId._id ? p.userId : p; 
            initialLineup[userData._id] = {
              userId: userData._id,
              username: userData.username,
              fplId: userData.fplId,
              isStarter: p.isStarter !== undefined ? p.isStarter : (index < 3),
              isCaptain: p.isCaptain || false
            };
          }
        });

        const hasCaptain = Object.values(initialLineup).some(p => p.isStarter && p.isCaptain);
        if (!hasCaptain && Object.keys(initialLineup).length > 0) {
          const firstStarterId = Object.keys(initialLineup).find(id => initialLineup[id].isStarter);
          if (firstStarterId) initialLineup[firstStarterId].isCaptain = true;
        }

        setLineup(initialLineup);
        setActiveChip(data.activeChip || 'none');
        if (data.isInherited) setMessage('📋 هذه تشكيلة موروثة. قم بالتعديل والحفظ للجولة القادمة.');
        else setMessage('');
      }
      setLoading(false);
    } catch (error) { setLoading(false); }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (!deadline || currentGW === null) return;

      const now = new Date();
      const diff = deadline - now;
      const isNextGW = selectedGW === (currentGW + 1);
      const timeRemaining = diff > 0;
      
      setIsEditable(isNextGW && timeRemaining);

      if (!isNextGW) {
        setTimeLeft(selectedGW <= currentGW ? 'انتهت' : 'مغلقة (للمعاينة)');
      } else if (!timeRemaining) {
        setTimeLeft('انتهى الوقت! ⛔');
      } else {
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${d}ي ${h}س ${m}د`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline, selectedGW, currentGW]);

  const toggleStarter = (id) => {
    // إضافة رسالة توضيحية عند محاولة التعديل في جولة غير مسموح بها
    if (!isEditable) {
        setMessage(`⚠️ التعديل مسموح فقط للجولة رقم ${currentGW + 1}`);
        setTimeout(() => setMessage(''), 3000);
        return;
    }
    const startersCount = Object.values(lineup).filter(p => p.isStarter).length;
    setLineup(prev => {
      const p = prev[id];
      if (!p.isStarter && startersCount >= 3) {
        setMessage('خطأ: يمكنك إشراك 3 لاعبين فقط!');
        return prev;
      }
      return { ...prev, [id]: { ...p, isStarter: !p.isStarter, isCaptain: p.isStarter ? false : p.isCaptain } };
    });
  };

  const setCaptain = (id) => {
    if (!isEditable || !lineup[id].isStarter) return;
    const nl = { ...lineup };
    Object.keys(nl).forEach(k => nl[k].isCaptain = false);
    nl[id].isCaptain = true;
    setLineup(nl);
  };

  const handleSaveLineup = async () => {
    if (selectedGW !== (currentGW + 1)) {
        setMessage(`⛔ لا يمكنك الحفظ إلا للجولة القادمة (${currentGW + 1}) فقط.`);
        return;
    }

    const startersCount = Object.values(lineup).filter(p => p.isStarter).length;
    if (startersCount !== 3) {
        setMessage(`⛔ يجب اختيار 3 لاعبين فقط. (اخترت ${startersCount})`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    try {
      const playersArray = Object.values(lineup).map(p => ({ userId: p.userId, isStarter: p.isStarter, isCaptain: p.isCaptain }));
      const { data } = await API.post('/gameweek/lineup', { players: playersArray, activeChip, gw: selectedGW });
      setMessage(`✅ ${data.message}`);
      await fetchTeamForGW(selectedGW);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) { setMessage('فشل الحفظ'); }
  };

  if (loading || !team) return <div style={{textAlign:'center', marginTop:'100px'}}>جاري تحميل التشكيلة... ⚽</div>;

  const starters = Object.values(lineup).filter(p => p.isStarter);
  const bench = Object.values(lineup).filter(p => !p.isStarter);
  const isManager = team.managerId && user._id === (team.managerId._id || team.managerId);

  const KitImage = ({ size = 80 }) => {
    const kitSrc = `/kits/${team.name}.png`;
    return (
      <div style={{ position: 'relative', width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img src={kitSrc} alt="Kit" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.5))' }}
               onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
        <FaTshirt size={size} color="#f0f0f0" style={{ display: 'none' }} />
      </div>
    );
  };

  return (
    <div style={{ padding: isMobile ? '10px' : '20px', fontFamily: 'Arial', direction: 'rtl', backgroundColor: '#eef1f5', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: '10px', backgroundColor: 'white', padding: '12px', borderRadius: '12px', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <button onClick={() => navigate('/dashboard')} style={{ padding: '6px 12px', cursor:'pointer', border:'1px solid #ddd', borderRadius:'8px', background:'white' }}>⬅</button>
             <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <img src={team.logoUrl} alt="L" style={{ width: '35px', height: '35px', objectFit: 'contain' }} />
                <h2 style={{ margin: 0, color: '#37003c', fontSize: isMobile ? '18px' : '22px' }}>{team.name}</h2>
             </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            <div style={{ background: '#38003c', color: '#00ff85', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                <select value={selectedGW} onChange={(e) => { const v = parseInt(e.target.value); setSelectedGW(v); fetchTeamForGW(v); }}
                        style={{ background: 'transparent', color: '#00ff85', border: 'none', fontWeight: 'bold', outline: 'none' }}>
                  {[...Array(38)].map((_, i) => <option key={i+1} value={i+1} style={{background: '#38003c'}}>GW {i+1}</option>)}
                </select>
            </div>
            <div style={{ backgroundColor: !isEditable ? '#ffebee' : '#e3f2fd', color: !isEditable ? '#c62828' : '#0d47a1', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #90caf9', display:'flex', alignItems:'center', gap:'5px' }}>
                {!isEditable ? <FaLock /> : <FaClock />} {timeLeft}
            </div>
        </div>
      </div>

      {/* رسالة حالة الجولة التوضيحية */}
      <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          borderRadius: '10px', 
          backgroundColor: selectedGW === (currentGW + 1) ? '#e8f5e9' : '#fff3e0',
          color: selectedGW === (currentGW + 1) ? '#2e7d32' : '#e65100',
          fontSize: '13px',
          textAlign: 'center',
          fontWeight: 'bold',
          border: `1px solid ${selectedGW === (currentGW + 1) ? '#a5d6a7' : '#ffcc80'}`
      }}>
          {selectedGW === (currentGW + 1) 
              ? `✅ الجولة ${selectedGW} مفتوحة للتعديل والحفظ.`
              : selectedGW <= currentGW 
                  ? `⛔ الجولة ${selectedGW} انتهت (للمعاينة فقط).`
                  : `⏳ الجولة ${selectedGW} مغلقة حالياً (الحفظ متاح للجولة ${currentGW + 1} فقط).`
          }
      </div>
      
      {message && <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '8px', fontWeight:'bold', fontSize:'13px', backgroundColor: message.includes('✅') ? '#e8f5e9' : '#fff3e0', color: message.includes('✅') ? 'green' : '#e65100', textAlign:'center' }}>{message}</div>}

      {/* Main Content Layout */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px' }}>
        
        {/* الملعب */}
        <div style={{ flex: 2.5 }}>
            {isManager && (
                <div style={{ marginBottom: '10px', backgroundColor: 'white', padding: '8px', borderRadius: '12px', display:'flex', gap:'5px', overflowX:'auto' }}>
                    {['none', 'tripleCaptain', 'benchBoost', 'freeHit'].map(chip => (
                        <button key={chip} onClick={() => isEditable && setActiveChip(chip)} 
                                style={{ padding: '6px 10px', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '10px', whiteSpace:'nowrap', backgroundColor: activeChip === chip ? '#00ff87' : '#f5f5f5', color: activeChip === chip ? '#37003c' : '#555' }}>
                            {chip.toUpperCase()}
                        </button>
                    ))}
                </div>
            )}

            <div style={{ 
                position: 'relative', borderRadius: '15px', overflow: 'hidden', minHeight: isMobile ? '450px' : '650px', border: '3px solid #fff',
                background: `repeating-linear-gradient(0deg, #419d36, #419d36 40px, #4caf50 40px, #4caf50 80px)`
            }}>
                <div style={{ position: 'absolute', top: '10%', left: '0', right: '0', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }}></div>
                <div style={{ position: 'absolute', bottom: '10%', left: '0', right: '0', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: isMobile ? '100px' : '150px', height: isMobile ? '100px' : '150px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%' }}></div>

                <div style={{ position: 'relative', zIndex: 2, height: isMobile ? '450px' : '650px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', padding: '10px' }}>
                    {starters.map(player => (
                        <div key={player.userId} style={{ textAlign: 'center', width: isMobile ? '90px' : '110px', margin: '5px' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <KitImage size={isMobile ? 65 : 85} /> 
                                {player.isCaptain && <FaCrown size={isMobile ? 18 : 26} color="#ffd700" style={{ position: 'absolute', top: '-10px', right: '-8px', zIndex: 10 }} />}
                            </div>
                            <div style={{ backgroundColor: '#37003c', color: 'white', padding: '3px', borderRadius: '4px', fontSize: isMobile ? '10px' : '12px', marginTop: '3px', fontWeight: 'bold', borderBottom: '2px solid #00ff87' }}>
                                {player.username}
                            </div>
                            {isManager && isEditable && (
                                <div style={{ marginTop: '5px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                    <button onClick={() => toggleStarter(player.userId)} style={{ backgroundColor: '#ff1744', border: 'none', borderRadius: '50%', width: '25px', height: '25px', color: 'white' }}><FaArrowDown size={12} /></button>
                                    <button onClick={() => setCaptain(player.userId)} style={{ backgroundColor: player.isCaptain ? '#ffd700' : '#eee', border: 'none', borderRadius: '50%', width: '25px', height: '25px', fontWeight: 'bold', fontSize:'10px' }}>C</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            
            {isManager && (
                <button 
                    onClick={handleSaveLineup} 
                    disabled={!isEditable}
                    style={{ 
                        width: '100%', 
                        padding: '15px', 
                        marginTop: '15px', 
                        backgroundColor: isEditable ? '#00ff85' : '#bdbdbd', 
                        color: isEditable ? '#37003c' : '#757575', 
                        border: 'none', 
                        borderRadius: '10px', 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        cursor: isEditable ? 'pointer' : 'not-allowed',
                        boxShadow: isEditable ? '0 4px 12px rgba(0,255,133,0.3)' : 'none'
                    }}
                >
                    {selectedGW === (currentGW + 1) ? `حفظ تشكيلة الجولة ${selectedGW}` : `🔒 الحفظ متاح للجولة ${currentGW + 1} فقط`}
                </button>
            )}
        </div>

        {/* دكة الاحتياط */}
        <div style={{ flex: 1 }}>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px 0', borderBottom: '2px solid #f0f0f0', paddingBottom: '5px', fontSize:'16px' }}>🛋 دكة الاحتياط</h3>
                {bench.map(player => (
                    <div key={player.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f9f9f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <KitImage size={35} />
                            <div style={{fontWeight:'bold', fontSize:'13px'}}>{player.username}</div>
                        </div>
                        {isManager && isEditable && (
                            <button onClick={() => toggleStarter(player.userId)} style={{ backgroundColor: '#37003c', color: '#00ff87', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight:'bold' }}>
                                <FaExchangeAlt /> إشراك
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MyTeam;