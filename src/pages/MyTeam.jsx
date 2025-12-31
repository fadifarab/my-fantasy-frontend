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

  // 1. التهيئة الأولية
  useEffect(() => {
    const initializeGW = async () => {
      try {
        const { data: status } = await API.get('/gameweek/status');
        if (status) {
          setCurrentGW(status.id);
          setSelectedGW(status.id);
          await fetchTeamForGW(status.id);
        }
      } catch (error) {
        console.error("خطأ في جلب الحالة:", error);
        setLoading(false);
      }
    };
    initializeGW();
  }, []);

  // 2. دالة جلب بيانات الفريق (مصلحة لقراءة البيانات المحفوظة)
  const fetchTeamForGW = async (gwId) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/teams/me?gw=${gwId}`);
      if (data) {
        setTeam(data);
        setDeadline(data.deadline_time ? new Date(data.deadline_time) : null);

        const initialLineup = {};
        
        // 🚨 هنا الإصلاح: نستخدم lineup القادم من السيرفر، وإذا لم يوجد نستخدم members
        const playersSource = (data.lineup && data.lineup.length > 0) 
          ? data.lineup 
          : (data.members || []);

        playersSource.forEach((p, index) => {
          if (p) {
            // استخراج بيانات المستخدم بشكل صحيح (Populated or Flat)
            const userData = p.userId && p.userId._id ? p.userId : p; 
            
            initialLineup[userData._id] = {
              userId: userData._id,
              username: userData.username,
              fplId: userData.fplId,
              // استرجاع الحالة المحفوظة بدقة
              isStarter: p.isStarter !== undefined ? p.isStarter : (index < 3),
              isCaptain: p.isCaptain || false
            };
          }
        });

        // ضمان الكابتن
        const hasCaptain = Object.values(initialLineup).some(p => p.isStarter && p.isCaptain);
        if (!hasCaptain && Object.keys(initialLineup).length > 0) {
          const firstStarterId = Object.keys(initialLineup).find(id => initialLineup[id].isStarter);
          if (firstStarterId) initialLineup[firstStarterId].isCaptain = true;
        }

        setLineup(initialLineup);
        setActiveChip(data.activeChip || 'none');
        
        if (data.isInherited) setMessage('📋 هذه تشكيلة موروثة. اضغط حفظ لتثبيتها لهذه الجولة.');
        else setMessage('');
      }
      setLoading(false);
    } catch (error) {
      console.error("Fetch Error:", error);
      setLoading(false);
    }
  };

  // 3. عداد الوقت
  useEffect(() => {
    const timer = setInterval(() => {
      if (!deadline) {
        setTimeLeft(selectedGW >= currentGW ? 'الجولة مفتوحة 🟢' : 'منتهية');
        setIsEditable(selectedGW >= currentGW);
        return;
      }
      const now = new Date();
      const diff = deadline - now;
      setIsEditable((selectedGW === currentGW && diff > 0) || (selectedGW > currentGW));

      if (diff <= 0) {
        setTimeLeft(selectedGW === currentGW ? 'انتهى الوقت! ⛔' : 'الجولة مغلقة');
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
        setMessage('خطأ: يجب اختيار 3 لاعبين أساسيين فقط!');
        return prev;
      }
      return {
        ...prev,
        [id]: { ...p, isStarter: !p.isStarter, isCaptain: p.isStarter ? false : p.isCaptain }
      };
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
    
    // 🚨 حساب عدد الأساسيين في الفرونت آند قبل الإرسال
    const startersCount = Object.values(lineup).filter(p => p.isStarter).length;
    
    if (startersCount !== 3) {
        setMessage(`⛔ لا يمكن الحفظ: يجب اختيار 3 لاعبين أساسيين فقط. (أنت اخترت ${startersCount})`);
        // التمرير لأعلى لرؤية الرسالة
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    try {
      const playersArray = Object.values(lineup).map(p => ({
        userId: p.userId,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain
      }));
      
      const { data } = await API.post('/gameweek/lineup', { 
        players: playersArray, 
        activeChip, 
        gw: selectedGW 
      });
      
      setMessage(`✅ ${data.message}`);
      await fetchTeamForGW(selectedGW);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) { 
        setMessage(err.response?.data?.message || 'فشل الحفظ'); 
    }
  };

  if (loading || !team) return <div style={{textAlign:'center', marginTop:'100px', fontSize:'20px'}}>جاري تحميل التشكيلة... ⚽</div>;

  const starters = Object.values(lineup).filter(p => p.isStarter);
  const bench = Object.values(lineup).filter(p => !p.isStarter);
  const isManager = team.managerId && user._id === (team.managerId._id || team.managerId);

  // 🚨 استرجاع منطق الأقمصة الأصلي
  const KitImage = ({ size = 80 }) => {
    const kitSrc = `/kits/${team.name}.png`; // المسار الأصلي الصحيح
    return (
      <div style={{ position: 'relative', width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img 
            src={kitSrc} 
            alt="Kit" 
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.5))' }}
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
        />
        <FaTshirt size={size} color="#f0f0f0" style={{ display: 'none' }} />
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl', backgroundColor: '#eef1f5', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 15px', cursor:'pointer', border:'1px solid #ddd', borderRadius:'8px', background:'white', fontWeight:'bold' }}>⬅ عودة</button>
             <div>
                <h1 style={{ margin: 0, color: '#37003c', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px' }}>
                    <img src={team.logoUrl} alt="Logo" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
                    {team.name}
                </h1>
                <small style={{color: '#666', marginRight: '55px'}}>المدير: {isManager ? 'أنت 👑' : (team.managerId.username || 'المناجير')}</small>
             </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#38003c', color: '#00ff85', padding: '5px 12px', borderRadius: '8px', border: '1px solid #00ff85' }}>
                <FaCalendarCheck />
                <select 
                  value={selectedGW} 
                  onChange={(e) => { const v = parseInt(e.target.value); setSelectedGW(v); fetchTeamForGW(v); }}
                  style={{ background: 'transparent', color: '#00ff85', border: 'none', fontWeight: 'bold', cursor: 'pointer', outline: 'none', fontSize: '14px' }}
                >
                  {[...Array(38)].map((_, i) => (
                    <option key={i+1} value={i+1} style={{background: '#38003c'}}>الجولة {i+1} {i+1 === currentGW ? '(الحالية)' : ''}</option>
                  ))}
                </select>
            </div>

            <div style={{ 
                backgroundColor: !isEditable ? '#ffebee' : '#e3f2fd', 
                color: !isEditable ? '#c62828' : '#0d47a1', 
                padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${!isEditable ? '#ef9a9a' : '#90caf9'}`
            }}>
                {!isEditable ? <FaLock /> : <FaClock />}
                <span>{timeLeft}</span>
            </div>
        </div>
      </div>
      
      {message && (
        <div style={{ 
            padding: '10px 20px', marginBottom: '20px', borderRadius: '8px', fontWeight:'bold', 
            backgroundColor: message.includes('✅') ? '#e8f5e9' : '#fff3e0', 
            color: message.includes('✅') ? 'green' : '#e65100', 
            textAlign:'center', border: `1px solid ${message.includes('✅') ? 'green' : '#ffcc80'}`
        }}>
            {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '25px' }}>
        
        {/* الملعب */}
        <div>
            {isManager && (
                <div style={{ marginBottom: '15px', backgroundColor: 'white', padding: '12px', borderRadius: '12px', display:'flex', gap:'10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    {['none', 'tripleCaptain', 'benchBoost', 'freeHit'].map(chip => (
                        <button key={chip} onClick={() => isEditable && setActiveChip(chip)} 
                            style={{ 
                                padding: '8px 15px', borderRadius: '20px', border: '1px solid #ddd', cursor: isEditable ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '12px',
                                backgroundColor: activeChip === chip ? '#00ff87' : '#f5f5f5', color: activeChip === chip ? '#37003c' : '#555', opacity: isEditable ? 1 : 0.6
                            }}>
                            {chip.toUpperCase()}
                        </button>
                    ))}
                </div>
            )}

            <div style={{ 
                position: 'relative', borderRadius: '15px', overflow: 'hidden', minHeight: '650px', border: '4px solid #fff', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                background: `repeating-linear-gradient(0deg, #419d36, #419d36 50px, #4caf50 50px, #4caf50 100px)`
            }}>
                <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px', border: '2px solid rgba(255,255,255,0.4)', pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '150px', height: '150px', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', backgroundColor: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}></div>

                <div style={{ position: 'relative', zIndex: 2, height: '650px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '45px', flexWrap: 'wrap', width: '100%', padding:'20px' }}>
                    {starters.map(player => (
                        <div key={player.userId} style={{ textAlign: 'center', position: 'relative', width: '110px' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <KitImage size={85} /> 
                                {player.isCaptain && <FaCrown size={26} color="#ffd700" style={{ position: 'absolute', top: '-15px', right: '-12px', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.6))', zIndex: 10 }} />}
                            </div>
                            <div style={{ backgroundColor: '#37003c', color: 'white', padding: '5px 2px', borderRadius: '4px', fontSize: '13px', marginTop: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderBottom: '3px solid #00ff87', fontWeight: 'bold' }}>
                                {player.username}
                            </div>
                            {isManager && isEditable && (
                                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button onClick={() => toggleStarter(player.userId)} style={{ backgroundColor: '#ff1744', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: 'white', cursor: 'pointer' }}><FaArrowDown size={14} /></button>
                                    <button onClick={() => setCaptain(player.userId)} style={{ backgroundColor: player.isCaptain ? '#ffd700' : '#eee', border: '1px solid #999', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}>C</button>
                                </div>
                            )}
                        </div>
                    ))}
                    </div>
                </div>
            </div>
            
            {isManager && isEditable && (
                <button onClick={handleSaveLineup} style={{ width: '100%', padding: '18px', marginTop: '20px', backgroundColor: '#00ff85', color: '#37003c', border: 'none', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 6px 15px rgba(0,255,133,0.3)' }}>
                    <FaCheck /> حفظ تشكيلة الجولة {selectedGW}
                </button>
            )}
        </div>

        {/* الاحتياط */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px', color: '#37003c' }}>🛋 دكة الاحتياط</h3>
                {bench.map(player => (
                    <div key={player.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #f9f9f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <KitImage size={40} />
                            <div>
                                <div style={{fontWeight:'bold', fontSize:'14px'}}>{player.username}</div>
                            </div>
                        </div>
                        {isManager && isEditable && (
                            <button onClick={() => toggleStarter(player.userId)} style={{ backgroundColor: '#37003c', color: '#00ff87', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight:'bold' }}>
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