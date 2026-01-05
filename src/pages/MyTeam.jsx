import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    FaUserTie, FaCrown, FaCheck, FaArrowDown, FaExchangeAlt, 
    FaTshirt, FaClock, FaExclamationTriangle, FaCalendarCheck, FaLock,
    FaUserFriends, FaTimes, FaTrophy, FaRobot
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
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  // تعريف أقلام اللعبة بالإنجليزية (متوافق مع الباكند)
  const chips = [
    { id: 'none', label: 'No Chip', icon: null, color: '#f5f5f5' },
    { id: 'tripleCaptain', label: 'Triple Captain', icon: <FaCrown />, color: '#00ff87' },
    { id: 'benchBoost', label: 'Bench Boost', icon: <FaExchangeAlt />, color: '#00ff87' },
    { id: 'freeHit', label: 'Free Hit', icon: <FaTshirt />, color: '#00ff87' },
    { id: 'theBest', label: 'The Best', icon: <FaTrophy />, color: '#9c27b0' }
  ];

  // دالة للحصول على رابط الشعار الرسمي للفريق
  const getTeamLogoUrl = (teamName) => {
    // ... (نفس الكود السابق)
    return logoUrls[actualName] || `https://via.placeholder.com/150/37003c/FFFFFF?text=${teamName.substring(0, 2)}`;
  };

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

  const fetchTeamForGW = async (gwId) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/teams/me?gw=${gwId}`);
      if (data) {
        setTeam(data);
        
        // تحقق من حالة الديدلاين
        const deadlineTime = data.deadline_time ? new Date(data.deadline_time) : null;
        setDeadline(deadlineTime);
        
        const now = new Date();
        const deadlinePassed = deadlineTime && now > deadlineTime;
        setIsDeadlinePassed(deadlinePassed);

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
        
        // إذا كان THE BEST مفعلاً والديدلاين انتهى، اعرض رسالة توضيحية
        if (data.activeChip === 'theBest' && deadlinePassed) {
          setMessage('🤖 خاصية "The Best" مفعلة! سيتم اختيار الكابتن الأعلى نقاطاً تلقائياً مع كل تحديث للنقاط.');
        } else if (gwId <= currentGW) {
          setMessage('🔒 هذه الجولة منتهية أو جارية حالياً. العرض فقط.');
        } else if (data.isInherited) {
          setMessage('📋 هذه تشكيلة موروثة. اضغط حفظ لتأكيدها للجولة القادمة.');
        } else {
          setMessage('');
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Fetch Error:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (!deadline) {
        setTimeLeft(selectedGW > currentGW ? 'الجولة مفتوحة' : 'منتهية');
        setIsEditable(selectedGW === currentGW + 1);
        setIsDeadlinePassed(false);
        return;
      }
      const now = new Date();
      const diff = deadline - now;
      const deadlinePassed = diff <= 0;
      
      setIsDeadlinePassed(deadlinePassed);
      setIsEditable(selectedGW === currentGW + 1 && !deadlinePassed);

      if (deadlinePassed) {
        setTimeLeft(selectedGW <= currentGW ? 'انتهى الوقت! ⛔' : 'انتهى الديدلاين');
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
    
    // إذا كان THE BEST مفعلاً، اسأل المستخدم إذا كان يريد إلغاء التفعيل
    if (activeChip === 'theBest') {
      const confirmCancel = window.confirm(
        '⚠️ خاصية "The Best" مفعلة!\n\n' +
        'إذا قمت بتغيير الكابتن يدوياً، سيتم إلغاء تفعيل خاصية "The Best".\n' +
        'هل تريد المتابعة؟'
      );
      
      if (!confirmCancel) return;
      
      // إلغاء تفعيل THE BEST عند تغيير الكابتن يدوياً
      setActiveChip('none');
      setMessage('⚠️ تم إلغاء تفعيل خاصية "The Best" بسبب اختيار كابتن يدوياً');
    }
    
    const nl = { ...lineup };
    Object.keys(nl).forEach(k => nl[k].isCaptain = false);
    nl[id].isCaptain = true;
    setLineup(nl);
  };

  const handleSaveLineup = async () => {
    if (!isEditable) return;
    const startersCount = Object.values(lineup).filter(p => p.isStarter).length;
    if (startersCount !== 3) {
        setMessage(`⛔ يجب اختيار 3 أساسيين (أنت اخترت ${startersCount})`);
        return;
    }
    
    // تحقق من وجود كابتن (مطلوب حتى مع تفعيل THE BEST)
    const hasCaptain = Object.values(lineup).some(p => p.isStarter && p.isCaptain);
    if (!hasCaptain) {
        setMessage('⛔ يجب تعيين كابتن للفريق');
        return;
    }
    
    // التحقق من توافق القيم مع الباكند
    const validChips = ['none', 'tripleCaptain', 'benchBoost', 'freeHit', 'theBest'];
    if (!validChips.includes(activeChip)) {
      setMessage('❌ قيمة Chip غير صالحة');
      return;
    }
    
    // إذا كان THE BEST مفعلاً، اعرض تحذير
    if (activeChip === 'theBest') {
      const confirmMessage = isDeadlinePassed 
        ? '⚠️ تم تفعيل خاصية "The Best"!\n\n' +
          'لقد انتهى الديدلاين بالفعل. سيتم تطبيق الخاصية فوراً واختيار الكابتن الأعلى نقاطاً تلقائياً.\n\n' +
          'هل تريد المتابعة؟'
        : '⚠️ تم تفعيل خاصية "The Best"!\n\n' +
          'بعد انتهاء الديدلاين، سيتم اختيار الكابتن الأعلى نقاطاً (بعد خصم الهيتس) تلقائياً.\n' +
          'سيتم تحديث الكابتن باستمرار مع كل تحديث للنقاط.\n\n' +
          'هل تريد المتابعة؟'
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
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

  // ... (بقية الدوال handleAcceptPlayer و handleRejectPlayer)

  if (loading || !team) return <div style={{textAlign:'center', marginTop:'100px', fontSize:'20px'}}>جاري التحميل... ⚽</div>;

  const starters = Object.values(lineup).filter(p => p.isStarter);
  const bench = Object.values(lineup).filter(p => !p.isStarter);
  const isManager = team.managerId && user._id === (team.managerId._id || team.managerId);

  // مكون KitImage الأصلي
  const KitImage = ({ size = 80 }) => {
    const kitSrc = `/kits/${team.name}.png`;
    return (
      <div style={{ position: 'relative', width: '100%', maxWidth: size, aspectRatio: '1/1', display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="kit-container">
        <img 
            src={kitSrc} alt="Kit" 
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.5))' }}
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
        />
        <FaTshirt size={size} color="#f0f0f0" style={{ display: 'none' }} />
      </div>
    );
  };

  // الحصول على معلومات القلم النشط
  const activeChipInfo = chips.find(chip => chip.id === activeChip);

  return (
    <div className="my-team-container" style={{ padding: '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl', backgroundColor: '#eef1f5', minHeight: '100vh' }}>
      
      {/* Header */}
      <div className="header-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: '1 1 300px' }} className="header-right">
             <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 15px', cursor:'pointer', border:'1px solid #ddd', borderRadius:'8px', background:'white', fontWeight:'bold', whiteSpace: 'nowrap' }}>⬅ عودة</button>
             <div className="team-info-header">
                <h1 style={{ margin: 0, color: '#37003c', display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(16px, 4vw, 24px)' }}>
    {team.logoUrl && (
        <img 
            src={team.logoUrl} 
            alt={`شعار ${team.name}`}
            style={{ 
                width: '50px', 
                height: '50px', 
                objectFit: 'contain',
                border: '2px solid #37003c',
                borderRadius: '8px'
            }}
            onError={(e) => {
                e.target.style.display = 'none';
                const initials = team.name.substring(0, 2).toUpperCase();
                e.target.insertAdjacentHTML('afterend', 
                    `<div style="
                        width: 50px; 
                        height: 50px; 
                        border-radius: 8px; 
                        background: #37003c; 
                        color: white; 
                        display: flex; 
                        align-items: center; 
                        justifyContent: center; 
                        font-weight: bold;
                        border: 2px solid #00ff85;
                    ">${initials}</div>`
                );
            }}
        />
    )}
    {team.name}
</h1>
                <small style={{color: '#666', display: 'block'}} className="manager-name">
                    المدير: {isManager ? 'أنت 👑' : (team.managerId?.username || 'المناجير')}
                </small>
             </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }} className="header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#38003c', color: '#00ff85', padding: '5px 12px', borderRadius: '8px', border: '1px solid #00ff85' }}>
                <FaCalendarCheck />
                <select value={selectedGW} onChange={(e) => { const v = parseInt(e.target.value); setSelectedGW(v); fetchTeamForGW(v); }}
                  style={{ background: 'transparent', color: '#00ff85', border: 'none', fontWeight: 'bold', cursor: 'pointer', outline: 'none', fontSize: '14px' }}>
                  {[...Array(38)].map((_, i) => (
                    <option key={i+1} value={i+1} style={{background: '#38003c'}}>
                      الجولة {i+1} {i+1 === currentGW + 1 ? '(القادمة 🔥)' : ''}
                    </option>
                  ))}
                </select>
            </div>

            <div className="deadline-box" style={{ 
                backgroundColor: !isEditable ? '#ffebee' : '#e3f2fd', 
                color: !isEditable ? '#c62828' : '#0d47a1', 
                padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px',
                display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${!isEditable ? '#ef9a9a' : '#90caf9'}`
            }}>
                {!isEditable ? <FaLock /> : <FaClock />}
                <span>{timeLeft}</span>
            </div>
        </div>
      </div>
      
      {message && (
        <div style={{ 
          padding: '10px 20px', 
          marginBottom: '20px', 
          borderRadius: '8px', 
          fontWeight:'bold', 
          backgroundColor: message.includes('✅') ? '#e8f5e9' : 
                         message.includes('❌') ? '#ffebee' : 
                         message.includes('⚠️') ? '#fff3e0' : 
                         message.includes('🤖') ? '#f3e5f5' : '#fff3e0', 
          color: message.includes('✅') ? 'green' : 
                message.includes('❌') ? '#c62828' : 
                message.includes('⚠️') ? '#e65100' : 
                message.includes('🤖') ? '#7b1fa2' : '#e65100', 
          textAlign:'center', 
          border: `1px solid ${message.includes('✅') ? 'green' : 
                  message.includes('❌') ? '#ef9a9a' : 
                  message.includes('⚠️') ? '#ffcc80' : 
                  message.includes('🤖') ? '#e1bee7' : '#ffcc80'}`
        }}>
          {message}
        </div>
      )}

      <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Pitch Area */}
        <div className="pitch-area" style={{ width: '100%' }}>
            {isManager && (
                <div className="chips-container" style={{ 
                    marginBottom: '15px', 
                    backgroundColor: 'white', 
                    padding: '15px', 
                    borderRadius: '12px', 
                    display:'flex', 
                    gap:'10px', 
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)', 
                    overflowX: 'auto', 
                    scrollbarWidth: 'none',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ width: '100%', marginBottom: '10px' }}>
                        <h4 style={{ margin: '0', color: '#37003c', fontSize: '14px' }}>
                            🎯 تفعيل خاص للجولة
                        </h4>
                        {activeChip === 'theBest' && (
                            <div style={{ fontSize: '11px', color: '#7b1fa2', marginTop: '5px', padding: '5px', backgroundColor: '#f3e5f5', borderRadius: '5px' }}>
                                {isDeadlinePassed 
                                    ? '🤖 خاصية "The Best" مفعلة - سيتم تحديث الكابتن تلقائياً مع كل تحديث للنقاط' 
                                    : '⚠️ بعد انتهاء الديدلاين، سيتم اختيار الكابتن الأعلى نقاطاً تلقائياً'
                                }
                            </div>
                        )}
                    </div>
                    
                    {chips.map(chip => (
                        <button 
                            key={chip.id} 
                            onClick={() => {
                                if (isEditable) {
                                    // إذا كان المستخدم يختار "No Chip" وكان THE BEST مفعلاً، اسأله
                                    if (chip.id === 'none' && activeChip === 'theBest') {
                                        const confirmCancel = window.confirm(
                                            'هل تريد إلغاء تفعيل خاصية "The Best"؟\n\n' +
                                            'إذا ألغيت التفعيل، لن يتم اختيار الكابتن تلقائياً بناءً على النقاط.'
                                        );
                                        if (!confirmCancel) return;
                                    }
                                    setActiveChip(chip.id);
                                }
                            }} 
                            style={{ 
                                padding: '8px 15px', 
                                borderRadius: '20px', 
                                border: activeChip === chip.id ? `2px solid ${chip.color}` : '1px solid #ddd', 
                                cursor: isEditable ? 'pointer' : 'not-allowed', 
                                fontWeight: 'bold', 
                                fontSize: '12px',
                                backgroundColor: activeChip === chip.id ? chip.color : '#f5f5f5', 
                                color: activeChip === chip.id ? 
                                    (chip.id === 'theBest' ? 'white' : '#37003c') : 
                                    '#555', 
                                opacity: isEditable ? 1 : 0.6, 
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                minWidth: '120px',
                                justifyContent: 'center'
                            }}>
                            {chip.icon}
                            {chip.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="actual-pitch" style={{ 
                position: 'relative', borderRadius: '15px', overflow: 'hidden', minHeight: '550px', border: '4px solid #fff', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                background: `repeating-linear-gradient(0deg, #419d36, #419d36 40px, #4caf50 40px, #4caf50 80px)` 
            }}>
                {/* Pitch Markings */}
                <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px', border: '1px solid rgba(255,255,255,0.3)', pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '10px', right: '10px', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100px', height: '100px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                
                <div className="players-container" style={{ position: 'relative', zIndex: 2, height: '100%', minHeight: '550px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center', padding: '20px 0' }}>
                    <div className="players-row" style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', width: '100%' }}>
                        {starters.map(player => (
                            <div key={player.userId} className="player-slot" style={{ textAlign: 'center', position: 'relative', width: '80px' }}>
                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                                    <KitImage size={65} /> 
                                    {player.isCaptain && (
                                        <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                                            <FaCrown 
                                                size={20} 
                                                color="#ffd700" 
                                                style={{ 
                                                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))',
                                                    border: activeChip === 'theBest' ? '2px solid #9c27b0' : 'none',
                                                    borderRadius: '50%',
                                                    padding: '2px',
                                                    backgroundColor: activeChip === 'theBest' ? 'white' : 'transparent'
                                                }} 
                                            />
                                            {activeChip === 'theBest' && isDeadlinePassed && (
                                                <FaRobot 
                                                    size={10} 
                                                    color="#9c27b0" 
                                                    style={{ 
                                                        position: 'absolute', 
                                                        top: '-5px', 
                                                        right: '-5px',
                                                        backgroundColor: 'white',
                                                        borderRadius: '50%',
                                                        padding: '2px',
                                                        border: '1px solid #9c27b0'
                                                    }} 
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="player-name-tag" style={{ 
                                    backgroundColor: 'rgba(55, 0, 60, 0.9)', 
                                    color: 'white', 
                                    padding: '3px 2px', 
                                    borderRadius: '4px', 
                                    fontSize: '11px', 
                                    marginTop: player.isCaptain ? '20px' : '4px', 
                                    fontWeight: 'bold', 
                                    borderBottom: player.isCaptain && activeChip === 'theBest' ? '3px solid #9c27b0' : '3px solid #00ff87', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis', 
                                    whiteSpace: 'nowrap' 
                                }}>
                                    {player.username}
                                    {player.isCaptain && activeChip === 'theBest' && isDeadlinePassed && (
                                        <div style={{ fontSize: '8px', color: '#ffd700', marginTop: '2px' }}>
                                            🤖 تلقائي
                                        </div>
                                    )}
                                </div>
                                {isManager && isEditable && (
                                    <div style={{ marginTop: '8px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                        <button onClick={() => toggleStarter(player.userId)} style={{ backgroundColor: '#ff1744', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaArrowDown size={12} /></button>
                                        <button 
                                            onClick={() => setCaptain(player.userId)} 
                                            style={{ 
                                                backgroundColor: player.isCaptain ? '#ffd700' : '#eee', 
                                                border: player.isCaptain && activeChip === 'theBest' ? '2px solid #9c27b0' : '1px solid #999', 
                                                borderRadius: '50%', 
                                                width: '28px', 
                                                height: '28px', 
                                                cursor: 'pointer', 
                                                fontWeight: 'bold', 
                                                fontSize: '12px',
                                                position: 'relative'
                                            }}>
                                            C
                                            {player.isCaptain && activeChip === 'theBest' && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-5px',
                                                    right: '-5px',
                                                    width: '10px',
                                                    height: '10px',
                                                    backgroundColor: '#9c27b0',
                                                    borderRadius: '50%',
                                                    border: '1px solid white'
                                                }}></div>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {isManager && isEditable && (
                <button className="save-btn" onClick={handleSaveLineup} style={{ 
                    width: '100%', 
                    padding: '15px', 
                    marginTop: '15px', 
                    backgroundColor: activeChip === 'theBest' ? '#9c27b0' : '#00ff85', 
                    color: activeChip === 'theBest' ? 'white' : '#37003c', 
                    border: 'none', 
                    borderRadius: '12px', 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    boxShadow: activeChip === 'theBest' ? '0 6px 15px rgba(156, 39, 176, 0.3)' : '0 6px 15px rgba(0,255,133,0.3)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '10px' 
                }}>
                    <FaCheck /> حفظ التشكيلة {activeChip === 'theBest' && 'مع تفعيل "The Best"'}
                </button>
            )}
        </div>

        {/* Bench Area */}
        <div className="bench-area" style={{ width: '100%' }}>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px', color: '#37003c', fontSize: '16px' }}>🛋 دكة الاحتياط</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {bench.map(player => (
                        <div key={player.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '35px' }}><KitImage size={35} /></div>
                                <div style={{fontWeight:'bold', fontSize:'13px'}}>{player.username}</div>
                            </div>
                            {isManager && isEditable && (
                                <button onClick={() => toggleStarter(player.userId)} style={{ backgroundColor: '#37003c', color: '#00ff87', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight:'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <FaExchangeAlt /> إشراك
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* طلبات الانضمام - تظهر فقط للمناجير */}
      {isManager && team.pendingMembers && team.pendingMembers.length > 0 && (
        <div className="pending-section" style={{
          marginTop: '30px',
          backgroundColor: '#fff9c4',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid #ffd54f',
          boxShadow: '0 4px 12px rgba(255, 213, 79, 0.3)'
        }}>
          <h3 style={{ 
            color: '#f57c00', 
            marginBottom: '15px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            borderBottom: '2px solid #ffd54f',
            paddingBottom: '10px'
          }}>
            <FaUserFriends size={20} /> 
            <span>طلبات الانضمام ({team.pendingMembers.length})</span>
            <span style={{
              fontSize: '12px',
              backgroundColor: '#4caf50',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '10px',
              marginRight: '10px'
            }}>
              ⏰ متاح دائماً
            </span>
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '15px',
            marginTop: '15px'
          }}>
            {team.pendingMembers.map((player, index) => (
              <div key={player._id || index} style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid #ffe082',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    backgroundColor: '#37003c',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}>
                    {player.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#37003c' }}>
                      {player.username || 'لاعب جديد'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>
                      <span style={{ fontWeight: 'bold' }}>FPL ID:</span> {player.fplId || 'غير معروف'}
                    </div>
                    {player.email && (
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                        ✉️ {player.email}
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '10px',
                  marginTop: '5px'
                }}>
                  <button 
                    onClick={() => handleAcceptPlayer(player._id)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      transition: 'background-color 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#388e3c'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#4caf50'}
                  >
                    <FaCheck size={14} /> قبول
                  </button>
                  <button 
                    onClick={() => handleRejectPlayer(player._id)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#f5f5f5',
                      color: '#d32f2f',
                      border: '1px solid #ffcdd2',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#ffebee';
                      e.target.style.color = '#b71c1c';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f5f5f5';
                      e.target.style.color = '#d32f2f';
                    }}
                  >
                    <FaTimes size={14} /> رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* عندما لا توجد طلبات */}
      {isManager && (!team.pendingMembers || team.pendingMembers.length === 0) && (
        <div style={{
          marginTop: '30px',
          backgroundColor: '#f5f5f5',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#666',
          border: '2px dashed #ddd'
        }}>
          <FaUserFriends size={50} style={{ marginBottom: '15px', color: '#9e9e9e' }} />
          <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>
            لا توجد طلبات انضمام جديدة
          </div>
          <div style={{ fontSize: '14px', color: '#888' }}>
            سيظهر هنا أي طلبات انضمام جديدة من اللاعبين
          </div>
        </div>
      )}

      <style>{`
        /* 📱 تحسينات الهواتف الذكية الشاملة */
        @media (max-width: 600px) {
            .my-team-container { padding: 8px !important; }
            .header-box { padding: 10px !important; }
            .team-info-header h1 { font-size: 16px !important; }
            .manager-name { margin-right: 0 !important; font-size: 11px !important; }
            .header-left { width: 100%; justify-content: space-between; }
            .actual-pitch { min-height: 480px !important; }
            .players-container { min-height: 480px !important; }
            .player-slot { width: 70px !important; }
            .player-name-tag { font-size: 10px !important; }
            .save-btn { font-size: 16px !important; position: sticky; bottom: 10px; z-index: 100; }
            .chips-container button { font-size: 10px !important; padding: 6px 10px !important; min-width: 100px !important; }
            .pending-section { padding: 15px !important; }
        }

        /* منع التمرير الأفقي غير المرغوب فيه */
        body { overflow-x: hidden; }
        
        /* تجميل شريط التمرير للـ Chips */
        .chips-container::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default MyTeam;