import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { 
    FaUserTie, FaCrown, FaCheck, FaArrowDown, FaExchangeAlt, 
    FaTshirt, FaClock, FaExclamationTriangle, FaCalendarCheck, FaLock,
    FaUserFriends, FaTimes, FaTrophy, FaRobot, FaSpinner,
    FaShieldAlt, FaBolt, FaStar, FaMagic, FaArrowRight, FaArrowLeft
} from "react-icons/fa";
import TournamentHeader from '../utils/TournamentHeader';

const MyTeam = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lineup, setLineup] = useState({}); 
    const [activeChip, setActiveChip] = useState('none');
    const [message, setMessage] = useState('');
    const [leagueLogo, setLeagueLogo] = useState('');

    const [deadline, setDeadline] = useState(null);
    const [currentGW, setCurrentGW] = useState(null); 
    const [selectedGW, setSelectedGW] = useState(null); 
    const [timeLeft, setTimeLeft] = useState('');
    const [isEditable, setIsEditable] = useState(false);
    const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

    // سجل الخواص الجديد
    const [chipsHistory, setChipsHistory] = useState({ p1: {}, p2: {} });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // تعريف أقلام اللعبة بنفس تنسيق صفحة تاريخ الفريق
    const CHIPS = {
        'theBest': { label: 'The Best', icon: <FaStar color="gold" /> },
        'tripleCaptain': { label: 'Triple Captain', icon: <FaBolt color="orange" /> },
        'benchBoost': { label: 'Bench Boost', icon: <FaShieldAlt color="green" /> },
        'freeHit': { label: 'Free Hit', icon: <FaMagic color="purple" /> },
        'none': { label: 'No Chip', icon: null }
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
                
                if (data.leagueId && typeof data.leagueId === 'object' && data.leagueId.logoUrl) {
                    setLeagueLogo(data.leagueId.logoUrl);
                } else {
                    try {
                        const { data: lData } = await API.get('/leagues/me');
                        if (lData.logoUrl) setLeagueLogo(lData.logoUrl);
                    } catch (e) { console.log("Logo load fail"); }
                }

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

                try {
                    const historyRes = await API.get(`/leagues/team-history-full/${data._id}`);
                    const usedChips = { p1: {}, p2: {} };
                    if (historyRes.data.history) {
                        historyRes.data.history.forEach(gw => {
                            if (gw.activeChip && gw.activeChip !== 'none' && CHIPS[gw.activeChip]) {
                                if (gw.gameweek <= 19) usedChips.p1[gw.activeChip] = gw.gameweek;
                                else usedChips.p2[gw.activeChip] = gw.gameweek;
                            }
                        });
                    }
                    setChipsHistory(usedChips);
                } catch (e) { console.error(e); }
                
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
            
            if (!team || !team.managerId) return;
            const isManager = team.managerId && user._id === (team.managerId._id || team.managerId);
            if (!isManager) {
                setIsEditable(false);
            }

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
    }, [deadline, selectedGW, currentGW, team, user]);

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
        
        if (activeChip === 'theBest') {
            const confirmCancel = window.confirm(
                '⚠️ خاصية "The Best" مفعلة!\n\n' +
                'إذا قمت بتغيير الكابتن يدوياً، سيتم إلغاء تفعيل خاصية "The Best".\n' +
                'هل تريد المتابعة؟'
            );
            if (!confirmCancel) return;
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
        
        const hasCaptain = Object.values(lineup).some(p => p.isStarter && p.isCaptain);
        if (!hasCaptain) {
            setMessage('⛔ يجب تعيين كابتن للفريق');
            return;
        }
        
        const validChips = ['none', 'tripleCaptain', 'benchBoost', 'freeHit', 'theBest'];
        if (!validChips.includes(activeChip)) {
            setMessage('❌ قيمة Chip غير صالحة');
            return;
        }
        
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

    const handleAcceptPlayer = async (playerId) => {
        try {
            let endpoint = '/teams/players/approve';
            const { data } = await API.put(endpoint, {
                playerId,
                teamId: team._id
            });
            setMessage(`✅ ${data.message || 'تم قبول اللاعب بنجاح'}`);
            setTimeout(() => { fetchTeamForGW(selectedGW); }, 1000);
        } catch (err) {
            if (err.response?.status === 404) {
                try {
                    const { data } = await API.put('/teams/accept-member', {
                        playerId,
                        teamId: team._id
                    });
                    setMessage(`✅ ${data.message || 'تم قبول اللاعب بنجاح (بالمسار البديل)'}`);
                    setTimeout(() => { fetchTeamForGW(selectedGW); }, 1000);
                    return;
                } catch (secondErr) {
                    console.error("❌ فشل المسار البديل أيضاً:", secondErr);
                }
            }
            setMessage(err.response?.data?.message || `فشل قبول اللاعب - تحقق من كونسول المتصفح`);
        }
    };
    
    const handleRejectPlayer = async (playerId) => {
        if (!window.confirm('هل أنت متأكد من رفض هذا اللاعب؟')) return;
        try {
            const endpoint = '/teams/players/reject';
            const { data } = await API.put(endpoint, {
                playerId,
                teamId: team._id
            });
            setMessage(`✅ ${data.message || 'تم رفض اللاعب بنجاح'}`);
            setTimeout(() => { fetchTeamForGW(selectedGW); }, 1000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'فشل رفض اللاعب');
        }
    };

    const PlayerCard = ({ player, isSub = false }) => {
        const name = player.username || 'Unknown';
        const kitSize = isMobile ? (isSub ? 55 : 75) : (isSub ? 80 : 115);
        const cardWidth = isMobile ? (isSub ? '75px' : '85px') : '140px';
        const isManager = team && team.managerId && user._id === (team.managerId._id || team.managerId);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: cardWidth, margin: '2px 0', zIndex: 10 }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ width: kitSize, height: kitSize }}>
                        <img 
                            src={`/kits/${team?.name || 'default'}.png`} 
                            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                            onError={(e) => { e.target.src = '/kits/default.png'; }} 
                        />
                    </div>
                    {player.isCaptain && (
                        <div style={{ position: 'absolute', top: '-10px', right: '-5px', zIndex: 15, textAlign: 'center' }}>
                            <FaCrown size={isMobile ? 18 : 32} color={activeChip === 'tripleCaptain' ? "#00ff87" : "#ffd700"} />
                            {activeChip === 'tripleCaptain' && (
                                <div style={{ color: '#00ff87', fontSize: '9px', fontWeight: '900', textShadow: '1px 1px 2px black', marginTop: '-4px' }}>x3</div>
                            )}
                        </div>
                    )}
                </div>
                <div style={{ 
                    backgroundColor: '#37003c', color: 'white', padding: '2px 4px', borderRadius: '4px', 
                    fontSize: isMobile ? '9px' : '13px', marginTop: '4px', width: '100%', textAlign: 'center', 
                    borderBottom: player.isCaptain && activeChip === 'theBest' ? '3px solid #ffd700' : '2px solid #00ff87', 
                    fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                }}>
                    {name}
                </div>
                {isManager && isEditable && !isSub && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={() => toggleStarter(player.userId)} style={{ backgroundColor: '#ff1744', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaArrowDown size={12} /></button>
                        <button 
                            onClick={() => setCaptain(player.userId)} 
                            style={{ 
                                backgroundColor: player.isCaptain ? '#ffd700' : '#eee', 
                                border: player.isCaptain && activeChip === 'theBest' ? '2px solid #9c27b0' : '1px solid #999', 
                                borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'
                            }}>
                            C
                        </button>
                    </div>
                )}
                {isManager && isEditable && isSub && (
                    <button onClick={() => toggleStarter(player.userId)} style={{ 
                        backgroundColor: '#37003c', color: '#00ff87', border: 'none', padding: '4px 8px', borderRadius: '6px', 
                        marginTop: '5px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px'
                    }}>
                        <FaExchangeAlt size={8} /> إشراك
                    </button>
                )}
            </div>
        );
    };

    if (loading || !team) return <div style={{textAlign:'center', padding:'100px'}}><FaSpinner className="spin" size={40} /></div>;

    const starters = Object.values(lineup).filter(p => p.isStarter);
    const bench = Object.values(lineup).filter(p => !p.isStarter);
    const isManager = team.managerId && user._id === (team.managerId._id || team.managerId);

    return (
        <div style={{ padding: isMobile ? '10px' : '20px', background: '#f4f6f9', minHeight: '100vh', direction: 'rtl' }}>
            <TournamentHeader isMobile={isMobile} logoUrl={leagueLogo} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', backgroundColor: '#fff', padding: '10px 15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: '#f0f0f0', border: 'none', padding: '8px 12px', borderRadius: '10px', fontWeight: 'bold', cursor:'pointer' }}>⬅</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ color: '#38003c', margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '800' }}>{team.name}</h3>
                    <div style={{ width: isMobile ? '35px' : '45px', height: isMobile ? '35px' : '45px' }}>
                        <img 
        // 👈 التعديل هنا: نستخدم logoUrl القادم من قاعدة البيانات
        src={team.logoUrl || `/kits/${team.name}.png`} 
        alt="شعار النادي"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={(e) => { e.target.src = '/kits/default.png'; }} 
    />
                    </div>
                </div>
                <div style={{width:'40px'}}></div>
            </div>

            <div style={{ backgroundColor: !isEditable ? '#ffebee' : '#e3f2fd', color: !isEditable ? '#c62828' : '#0d47a1', padding: '10px', borderRadius: '12px', marginBottom: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: `1px solid ${!isEditable ? '#ef9a9a' : '#90caf9'}` }}>
                {!isEditable ? <FaLock /> : <FaClock />}
                <span>{timeLeft}</span>
            </div>

            <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38003c', marginBottom: '10px', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>📊 سجل الخواص المستعملة</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                    {Object.keys(CHIPS).filter(chip => chip !== 'none').map(chip => {
                        const gwP1 = chipsHistory.p1[chip];
                        const gwP2 = chipsHistory.p2[chip];
                        return (
                            <div key={chip} style={{ display: 'flex', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: gwP1 ? '#38003c' : '#eee', color: gwP1 ? '#fff' : '#aaa', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' }}>
                                    {CHIPS[chip].icon} {CHIPS[chip].label} (ذهاب) {gwP1 && `[${gwP1}]`}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: gwP2 ? '#00ff87' : '#eee', color: gwP2 ? '#38003c' : '#aaa', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' }}>
                                    {gwP2 && `[${gwP2}]`} (إياب)
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <button onClick={() => { const prev = selectedGW - 1; if (prev >= 1) { setSelectedGW(prev); fetchTeamForGW(prev); } }} disabled={selectedGW <= 1} style={{ border: 'none', background: '#fff', padding: '12px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer' }}><FaArrowRight /></button>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: isMobile ? '24px' : '32px', color: '#38003c' }}>الجولة {selectedGW}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#38003c', color: '#00ff85', padding: '5px 12px', borderRadius: '8px', border: '1px solid #00ff85', marginTop: '5px' }}>
                        <FaCalendarCheck />
                        <select value={selectedGW} onChange={(e) => { const v = parseInt(e.target.value); setSelectedGW(v); fetchTeamForGW(v); }} style={{ background: 'transparent', color: '#00ff85', border: 'none', fontWeight: 'bold', cursor: 'pointer', outline: 'none', fontSize: '14px' }}>
                            {[...Array(38)].map((_, i) => (
                                <option key={i+1} value={i+1} style={{background: '#38003c'}}>الجولة {i+1} {i+1 === currentGW + 1 ? '(القادمة 🔥)' : ''}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button onClick={() => { const next = selectedGW + 1; if (next <= 38) { setSelectedGW(next); fetchTeamForGW(next); } }} disabled={selectedGW >= 38} style={{ border: 'none', background: '#fff', padding: '12px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer' }}><FaArrowLeft /></button>
            </div>

            {message && (
                <div style={{ padding: '10px 20px', marginBottom: '20px', borderRadius: '8px', fontWeight:'bold', textAlign:'center', backgroundColor: message.includes('✅') ? '#e8f5e9' : message.includes('❌') ? '#ffebee' : message.includes('⚠️') ? '#fff3e0' : message.includes('🤖') ? '#f3e5f5' : '#fff3e0', color: message.includes('✅') ? 'green' : message.includes('❌') ? '#c62828' : message.includes('⚠️') ? '#e65100' : message.includes('🤖') ? '#7b1fa2' : '#e65100', border: `1px solid ${message.includes('✅') ? 'green' : message.includes('❌') ? '#ef9a9a' : message.includes('⚠️') ? '#ffcc80' : message.includes('🤖') ? '#e1bee7' : '#ffcc80'}` }}>
                    {message}
                </div>
            )}

            {isManager && isEditable && (
                <div style={{ marginBottom: '15px', backgroundColor: 'white', padding: '15px', borderRadius: '12px', display:'flex', gap:'10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflowX: 'auto', scrollbarWidth: 'none', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div style={{ width: '100%', marginBottom: '10px', textAlign: 'center' }}>
                        <h4 style={{ margin: '0', color: '#37003c', fontSize: '14px' }}>🎯 تفعيل خاص للجولة</h4>
                    </div>
                    {Object.keys(CHIPS).map(chipId => {
                        const chip = CHIPS[chipId];
                        const usedInP1 = !!chipsHistory.p1[chipId];
                        const usedInP2 = !!chipsHistory.p2[chipId];
                        const isCurrentInP1 = selectedGW <= 19;
                        const isUsedInCurrentPhase = isCurrentInP1 ? usedInP1 : usedInP2;
                        const usedInOtherGwInPhase = isUsedInCurrentPhase && (isCurrentInP1 ? chipsHistory.p1[chipId] !== selectedGW : chipsHistory.p2[chipId] !== selectedGW);
                        const isDisabled = chipId !== 'none' && usedInOtherGwInPhase;
                        return (
                            <button key={chipId} disabled={isDisabled} onClick={() => setActiveChip(chipId)} style={{ padding: '8px 15px', borderRadius: '20px', border: activeChip === chipId ? `2px solid ${chipId === 'theBest' ? '#9c27b0' : '#00ff87'}` : '1px solid #ddd', cursor: isDisabled ? 'not-allowed' : (isEditable ? 'pointer' : 'not-allowed'), fontWeight: 'bold', fontSize: '12px', backgroundColor: isDisabled ? '#e0e0e0' : (activeChip === chipId ? (chipId === 'theBest' ? '#9c27b0' : '#00ff87') : '#f5f5f5'), color: isDisabled ? '#9e9e9e' : (activeChip === chipId ? (chipId === 'theBest' ? 'white' : '#37003c') : '#555'), opacity: isDisabled ? 0.6 : (isEditable ? 1 : 0.6), whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px', minWidth: '120px', justifyContent: 'center' }}>
                                {chip.icon} {chip.label} {isDisabled && <FaLock size={10} style={{marginRight: '4px'}} />}
                            </button>
                        );
                    })}
                </div>
            )}

            {!isEditable && activeChip !== 'none' && (
                <div style={{ marginBottom: '15px', backgroundColor: '#38003c', color: '#00ff85', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 4px 15px rgba(56,0,60,0.3)', border: '2px solid #00ff85' }}>
                    <div style={{ fontSize: '20px' }}>{CHIPS[activeChip]?.icon}</div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>الخاصية المفعلة في هذه الجولة:</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{CHIPS[activeChip]?.label}</div>
                    </div>
                </div>
            )}

            <div key={selectedGW} className="pitch-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
                {activeChip && activeChip !== 'none' && (
                    <div style={{ backgroundColor: '#38003c', color: '#00ff87', padding: '10px', borderRadius: '12px 12px 0 0', textAlign: 'center', fontWeight: 'bold', border: '2px solid #00ff87', borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        {CHIPS[activeChip]?.icon} <span>الخاصية المستخدمة: {CHIPS[activeChip]?.label}</span>
                    </div>
                )}
                <div style={{ background: `repeating-linear-gradient(0deg, #2e7d32, #2e7d32 45px, #388e3c 45px, #388e3c 90px)`, borderRadius: activeChip && activeChip !== 'none' ? '0 0 20px 20px' : '20px', padding: isMobile ? '30px 5px' : '60px 20px', minHeight: isMobile ? '450px' : '650px', display:'flex', flexDirection:'column', justifyContent: 'center', border:'6px solid #fff', position:'relative', overflow:'hidden' }}>
                    <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px', border: '1px solid rgba(255,255,255,0.3)' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: 'rgba(255,255,255,0.3)' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '25px' : '50px', alignItems: 'center', zIndex: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>{starters.filter(p => p.isCaptain).map(p => <PlayerCard key={p.userId} player={p} />)}</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '45px' : '90px', width: '100%' }}>{starters.filter(p => !p.isCaptain).map(p => <PlayerCard key={p.userId} player={p} />)}</div>
                    </div>
                </div>
                <div style={{ marginTop: '15px', background: '#fff', padding: '15px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#38003c', borderBottom: '1px solid #eee' }}>🛋 الاحتياط</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '5px' : '25px', flexWrap: 'wrap' }}>{bench.map(p => <PlayerCard key={p.userId} player={p} isSub={true} />)}</div>
                </div>
                {isManager && isEditable && (
                    <button onClick={handleSaveLineup} style={{ width: '100%', padding: '15px', marginTop: '15px', backgroundColor: activeChip === 'theBest' ? '#9c27b0' : '#00ff85', color: activeChip === 'theBest' ? 'white' : '#37003c', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: activeChip === 'theBest' ? '0 6px 15px rgba(156, 39, 176, 0.3)' : '0 6px 15px rgba(0,255,133,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><FaCheck /> حفظ التشكيلة {activeChip === 'theBest' && 'مع تفعيل "The Best"'}</button>
                )}
            </div>

            {isManager && team.pendingMembers && team.pendingMembers.length > 0 && (
                <div style={{ marginTop: '30px', backgroundColor: '#fff9c4', padding: '20px', borderRadius: '12px', border: '2px solid #ffd54f', boxShadow: '0 4px 12px rgba(255, 213, 79, 0.3)' }}>
                    <h3 style={{ color: '#f57c00', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #ffd54f', paddingBottom: '10px' }}><FaUserFriends size={20} /> <span>طلبات الانضمام ({team.pendingMembers.length})</span></h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        {team.pendingMembers.map((player, index) => (
                            <div key={player._id || index} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #ffe082', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#37003c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>{player.username?.charAt(0)?.toUpperCase() || '?'}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#37003c' }}>{player.username || 'لاعب جديد'}</div>
                                        <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}><span style={{ fontWeight: 'bold' }}>FPL ID:</span> {player.fplId || 'غير معروف'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                    <button onClick={() => handleAcceptPlayer(player._id)} style={{ flex: 1, padding: '10px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><FaCheck size={14} /> قبول</button>
                                    <button onClick={() => handleRejectPlayer(player._id)} style={{ flex: 1, padding: '10px', backgroundColor: '#f5f5f5', color: '#d32f2f', border: '1px solid #ffcdd2', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><FaTimes size={14} /> رفض</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isManager && (!team.pendingMembers || team.pendingMembers.length === 0) && (
                <div style={{ marginTop: '30px', backgroundColor: '#f5f5f5', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#666', border: '2px dashed #ddd' }}>
                    <FaUserFriends size={50} style={{ marginBottom: '15px', color: '#9e9e9e' }} />
                    <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>لا توجد طلبات انضمام جديدة</div>
                </div>
            )}

            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } .pitch-fade-in { animation: fadeInSlide 0.4s ease-out forwards; } @keyframes fadeInSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @media (max-width: 600px) { .pitch-fade-in { max-width: 100% !important; } }`}</style>
        </div>
    );
};

export default MyTeam;