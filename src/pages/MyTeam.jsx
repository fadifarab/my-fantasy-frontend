import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    FaUserTie, FaCrown, FaCheck, FaArrowDown, FaExchangeAlt, 
    FaTshirt, FaClock, FaExclamationTriangle, FaCalendarCheck, FaLock, FaUserPlus 
} from "react-icons/fa"; 
import { TbSoccerField, TbReplace } from "react-icons/tb";

const MyTeam = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lineup, setLineup] = useState({}); 
  const [activeChip, setActiveChip] = useState('none');
  const [message, setMessage] = useState('');
  const [pendingMembers, setPendingMembers] = useState([]); // 🆕 حالة طلبات الانضمام

  const [deadline, setDeadline] = useState(null);
  const [currentGW, setCurrentGW] = useState(null); 
  const [selectedGW, setSelectedGW] = useState(null); 
  const [timeLeft, setTimeLeft] = useState('');
  const [isEditable, setIsEditable] = useState(false);

  // 1. التهيئة الأولية
  useEffect(() => {
    const initializeGW = async () => {
      try {
        const { data: status } = await API.get('/gameweek/status');
        if (status) {
          setCurrentGW(status.id);
          const nextGW = status.id + 1;
          setSelectedGW(nextGW);
          await fetchTeamForGW(nextGW);
        }
      } catch (error) {
        console.error("خطأ في جلب الحالة:", error);
        setLoading(false);
      }
    };
    initializeGW();
  }, []);

  // 2. جلب بيانات الفريق والطلبات
  const fetchTeamForGW = async (gwId) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/teams/me?gw=${gwId}`);
      if (data) {
        setTeam(data);
        setDeadline(data.deadline_time ? new Date(data.deadline_time) : null);

        const initialLineup = {};
        const playersSource = (data.lineup && data.lineup.length > 0) 
          ? data.lineup 
          : (data.members || []);

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
        
        if (gwId <= currentGW) setMessage('🔒 هذه الجولة منتهية أو جارية حالياً. العرض فقط.');
        else if (data.isInherited) setMessage('📋 هذه تشكيلة موروثة. اضغط حفظ لتأكيدها للجولة القادمة.');
        else setMessage('');

        // 🆕 جلب الطلبات إذا كان المستخدم هو المناجير
        const managerId = data.managerId?._id || data.managerId;
        if (user._id === managerId) {
            fetchPendingRequests(data._id);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Fetch Error:", error);
      setLoading(false);
    }
  };

  // 🆕 دالة جلب الطلبات المعلقة
  const fetchPendingRequests = async (teamId) => {
    try {
        const { data } = await API.get(`/teams/pending-members/${teamId}`);
        setPendingMembers(data || []);
    } catch (err) { console.error("Error fetching pending requests"); }
  };

  // 🆕 دالة قبول اللاعب
  const handleAcceptMember = async (userId) => {
    try {
        await API.put('/teams/accept-member', { teamId: team._id, userId });
        setMessage('✅ تم قبول اللاعب في الفريق!');
        fetchPendingRequests(team._id); // تحديث القائمة فوراً
        fetchTeamForGW(selectedGW);    // تحديث التشكيلة
    } catch (err) { setMessage('فشل قبول اللاعب'); }
  };

  // 3. عداد الوقت والتحقق من القفل
  useEffect(() => {
    const timer = setInterval(() => {
      if (!deadline) {
        setTimeLeft(selectedGW > currentGW ? 'الجولة مفتوحة' : 'منتهية');
        setIsEditable(selectedGW === currentGW + 1);
        return;
      }
      const now = new Date();
      const diff = deadline - now;
      setIsEditable(selectedGW === currentGW + 1 && diff > 0);

      if (diff <= 0) {
        setTimeLeft(selectedGW <= currentGW ? 'انتهى الوقت! ⛔' : 'الجولة مغلقة');
      } else {
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`متبقي: ${days}ي ${hours}س ${minutes}د ${seconds}ث`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline, selectedGW, currentGW]);

  const toggleStarter = (id) => {
    if (!isEditable) return;
    const startersCount = Object.values(lineup).filter(p => p.isStarter).length;
    setLineup(prev => {
      const p = prev[id];
      if (!p.isStarter && startersCount >= 3) {
        setMessage('⚠️ يمكنك اختيار 3 لاعبين أساسيين فقط!');
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
    if (!isEditable) return;
    const startersCount = Object.values(lineup).filter(p => p.isStarter).length;
    if (startersCount !== 3) {
        setMessage(`⛔ يجب اختيار 3 أساسيين`);
        return;
    }
    try {
      const playersArray = Object.values(lineup).map(p => ({
        userId: p.userId, isStarter: p.isStarter, isCaptain: p.isCaptain
      }));
      const { data } = await API.post('/gameweek/lineup', { 
        players: playersArray, activeChip, gw: selectedGW 
      });
      setMessage(`✅ ${data.message}`);
      fetchTeamForGW(selectedGW);
    } catch (err) { setMessage('فشل الحفظ'); }
  };

  if (loading || !team) return <div style={{textAlign:'center', marginTop:'100px', fontSize:'20px'}}>جاري التحميل... ⚽</div>;

  const starters = Object.values(lineup).filter(p => p.isStarter);
  const bench = Object.values(lineup).filter(p => !p.isStarter);
  const isManager = team.managerId && user._id === (team.managerId._id || team.managerId);

  const KitImage = ({ size = 80 }) => {
    const kitSrc = `/kits/${team.name}.png`;
    return (
      <div style={{ position: 'relative', width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img 
            src={kitSrc} alt="Kit" 
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.5))' }}
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
        />
        <FaTshirt size={size} color="#f0f0f0" style={{ display: 'none' }} />
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl', backgroundColor: '#eef1f5', minHeight: '100vh' }} className="my-team-container">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} className="header-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }} className="header-right">
             <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 15px', cursor:'pointer', border:'1px solid #ddd', borderRadius:'8px', background:'white', fontWeight:'bold' }}>⬅ عودة</button>
             <div className="team-info-header">
                <h1 style={{ margin: 0, color: '#37003c', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px' }}>
                    <img src={team.logoUrl} alt="Logo" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
                    {team.name}
                </h1>
                <small style={{color: '#666', marginRight: '55px'}} className="manager-name">المدير: {isManager ? 'أنت 👑' : (team.managerId.username || 'المناجير')}</small>
             </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }} className="header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#38003c', color: '#00ff85', padding: '5px 12px', borderRadius: '8px', border: '1px solid #00ff85' }}>
                <FaCalendarCheck />
                <select value={selectedGW} onChange={(e) => { const v = parseInt(e.target.value); setSelectedGW(v); fetchTeamForGW(v); }}
                  style={{ background: 'transparent', color: '#00ff85', border: 'none', fontWeight: 'bold', cursor: 'pointer', outline: 'none', fontSize: '14px' }}>
                  {[...Array(38)].map((_, i) => (
                    <option key={i+1} value={i+1} style={{background: '#38003c'}}>الجولة {i+1} {i+1 === currentGW + 1 ? '(القادمة 🔥)' : ''}</option>
                  ))}
                </select>
            </div>

            <div style={{ 
                backgroundColor: !isEditable ? '#ffebee' : '#e3f2fd', 
                color: !isEditable ? '#c62828' : '#0d47a1', 
                padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${!isEditable ? '#ef9a9a' : '#90caf9'}`
            }} className="deadline-box">
                {!isEditable ? <FaLock /> : <FaClock />}
                <span>{timeLeft}</span>
            </div>
        </div>
      </div>
      
      {message && <div style={{ padding: '10px 20px', marginBottom: '20px', borderRadius: '8px', fontWeight:'bold', backgroundColor: message.includes('✅') ? '#e8f5e9' : '#fff3e0', color: message.includes('✅') ? 'green' : '#e65100', textAlign:'center', border: `1px solid ${message.includes('✅') ? 'green' : '#ffcc80'}` }}>{message}</div>}

      {/* 🔔 قسم طلبات الانضمام - يظهر فقط للمناجير في حال وجود طلبات */}
      {isManager && pendingMembers.length > 0 && (
          <div style={{ background: '#fff3e0', border: '2px dashed #ff9800', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#e65100', display: 'flex', alignItems: 'center', gap: '10px' }}><FaUserPlus /> طلبات انضمام جديدة بانتظارك</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pendingMembers.map(m => (
                      <div key={m._id} style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                          <span style={{ fontWeight: 'bold' }}>{m.username}</span>
                          <button onClick={() => handleAcceptMember(m._id)} style={{ background: '#2e7d32', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight:'bold' }}>قبول ✅</button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '25px' }} className="main-grid">
        
        {/* الملعب */}
        <div className="pitch-area">
            {isManager && (
                <div style={{ marginBottom: '15px', backgroundColor: 'white', padding: '12px', borderRadius: '12px', display:'flex', gap:'10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflowX: 'auto' }} className="chips-container">
                    {['none', 'tripleCaptain', 'benchBoost', 'freeHit'].map(chip => (
                        <button key={chip} onClick={() => isEditable && setActiveChip(chip)} 
                            style={{ 
                                padding: '8px 15px', borderRadius: '20px', border: '1px solid #ddd', cursor: isEditable ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '12px',
                                backgroundColor: activeChip === chip ? '#00ff87' : '#f5f5f5', color: activeChip === chip ? '#37003c' : '#555', opacity: isEditable ? 1 : 0.6, whiteSpace: 'nowrap'
                            }}>
                            {chip.toUpperCase()}
                        </button>
                    ))}
                </div>
            )}

            <div style={{ 
                position: 'relative', borderRadius: '15px', overflow: 'hidden', minHeight: '650px', border: '4px solid #fff', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                background: `repeating-linear-gradient(0deg, #419d36, #419d36 50px, #4caf50 50px, #4caf50 100px)` 
            }} className="actual-pitch">
                <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px', border: '2px solid rgba(255,255,255,0.4)', pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '10px', right: '10px', height: '2px', backgroundColor: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '130px', height: '130px', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%', pointerEvents: 'none' }}></div>

                <div style={{ position: 'relative', zIndex: 2, height: '650px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '45px', flexWrap: 'wrap', width: '100%', padding:'20px' }}>
                    {starters.map(player => (
                        <div key={player.userId} style={{ textAlign: 'center', position: 'relative', width: '110px' }} className="player-slot">
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <KitImage size={85} /> 
                                {player.isCaptain && <FaCrown size={26} color="#ffd700" style={{ position: 'absolute', top: '-15px', right: '-12px', zIndex: 10, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))' }} />}
                            </div>
                            <div style={{ backgroundColor: 'rgba(55, 0, 60, 0.9)', color: 'white', padding: '5px 2px', borderRadius: '4px', fontSize: '13px', marginTop: '5px', fontWeight: 'bold', borderBottom: '3px solid #00ff87', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.username}</div>
                            {isManager && isEditable && (
                                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button onClick={() => toggleStarter(player.userId)} style={{ backgroundColor: '#ff1744', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaArrowDown size={14} /></button>
                                    <button onClick={() => setCaptain(player.userId)} style={{ backgroundColor: player.isCaptain ? '#ffd700' : '#eee', border: '1px solid #999', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}>C</button>
                                </div>
                            )}
                        </div>
                    ))}
                    </div>
                </div>
            </div>
            {isManager && isEditable && (
                <button onClick={handleSaveLineup} style={{ width: '100%', padding: '18px', marginTop: '20px', backgroundColor: '#00ff85', color: '#37003c', border: 'none', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 6px 15px rgba(0,255,133,0.3)' }} className="save-btn">
                    <FaCheck /> حفظ التشكيلة للجولة القادمة
                </button>
            )}
        </div>

        {/* دكة الاحتياط */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="bench-area">
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px', color: '#37003c' }}>🛋 دكة الاحتياط</h3>
                {bench.map(player => (
                    <div key={player.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #f9f9f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <KitImage size={40} />
                            <div style={{fontWeight:'bold', fontSize:'14px'}}>{player.username}</div>
                        </div>
                        {isManager && isEditable && (
                            <button onClick={() => toggleStarter(player.userId)} style={{ backgroundColor: '#37003c', color: '#00ff87', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight:'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <FaExchangeAlt /> إشراك
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
            .header-box { flex-direction: column !important; align-items: flex-start !important; }
            .header-left { width: 100%; justify-content: space-between; }
            .main-grid { grid-template-columns: 1fr !important; }
            .actual-pitch { min-height: 500px !important; }
            .player-slot { width: 85px !important; }
        }
      `}</style>
    </div>
  );
};

export default MyTeam;