import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../utils/api';
import { 
    FaArrowRight, FaArrowLeft, FaShieldAlt, FaBolt, FaStar, 
    FaMagic, FaCrown, FaSpinner, FaInfoCircle
} from "react-icons/fa";
import TournamentHeader from '../utils/TournamentHeader';

const TeamHistory = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const isCaptureMode = new URLSearchParams(location.search).get('mode') === 'capture';

    const [currentGw, setCurrentGw] = useState(null);
    const [teamInfo, setTeamInfo] = useState(null); 
    const [gwData, setGwData] = useState(null);
    const [chipsHistory, setChipsHistory] = useState({ p1: {}, p2: {} });
    const [loading, setLoading] = useState(false);
    const [restricted, setRestricted] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [leagueLogo, setLeagueLogo] = useState(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const CHIPS = {
        'theBest': { label: 'The Best', icon: <FaStar color="gold" /> },
        'tripleCaptain': { label: 'Triple Captain', icon: <FaBolt color="orange" /> },
        'benchBoost': { label: 'Bench Boost', icon: <FaShieldAlt color="green" /> },
        'freeHit': { label: 'Free Hit', icon: <FaMagic color="purple" /> }
    };

    useEffect(() => {
        const initStatus = async () => {
            try {
                const { data } = await API.get('/gameweek/status');
                setCurrentGw(data.id || 1);
            } catch (error) { setCurrentGw(1); }
        };
        initStatus();
    }, []);

    useEffect(() => {
        const fetchFullHistory = async () => {
            try {
                const { data } = await API.get(`/leagues/team-history-full/${teamId}`);
                if (data.team) {
                    setTeamInfo(data.team);
                    if (data.team.leagueId && data.team.leagueId.logoUrl) {
                        setLeagueLogo(data.team.leagueId.logoUrl);
                    }
                }
                const usedChips = { p1: {}, p2: {} };
                if (data.history) {
                    data.history.forEach(gw => {
                        if (gw.activeChip && gw.activeChip !== 'none' && CHIPS[gw.activeChip]) {
                            if (gw.gameweek <= 19) usedChips.p1[gw.activeChip] = gw.gameweek;
                            else usedChips.p2[gw.activeChip] = gw.gameweek;
                        }
                    });
                }
                setChipsHistory(usedChips);
            } catch (error) { console.error(error); }
        };
        fetchFullHistory();
    }, [teamId]);

    useEffect(() => {
        if (!currentGw) return;
        const fetchGwData = async () => {
            setLoading(true); setRestricted(false);
            try {
                const { data } = await API.get(`/gameweek/team-data/${teamId}/${currentGw}`);
                if (data.restricted) setRestricted(true);
                else setGwData(data);
            } catch (error) {
                if(error.response?.status === 403) setRestricted(true);
            } finally { setLoading(false); }
        };
        fetchGwData();
    }, [currentGw, teamId]);

    const PlayerCard = ({ player, isSub = false }) => {
        const name = player.userId?.username || 'Unknown';
        const hits = player.transferCost || 0;
        
        // ✅ التعديل المطلوب: عرض النقاط الأصلية دون طرح الهيت
        const displayScore = player.finalScore ?? 0;
        
        const kitSize = isMobile ? (isSub ? 85 : 110) : (isSub ? 130 : 185);
        const cardMinWidth = isMobile ? (isSub ? '95px' : '120px') : (isSub ? '170px' : '220px');

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: cardMinWidth, width: 'fit-content', margin: '10px 5px', zIndex: 10 }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ width: kitSize, height: kitSize }}>
                        <img 
                            src={`/kits/${teamInfo?.name || 'default'}.png`} 
                            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.5))' }}
                            onError={(e) => { e.target.src = '/kits/default.png'; }} 
                        />
                    </div>
                    {player.isCaptain && (
                        <div style={{ position: 'absolute', top: '-25px', right: '-15px', zIndex: 15 }}>
                            <FaCrown size={isMobile ? 35 : 65} color={gwData?.activeChip === 'tripleCaptain' ? "#00ff87" : "#ffd700"} />
                            {gwData?.activeChip === 'tripleCaptain' && (
                                <div style={{ color: '#00ff87', fontSize: isMobile ? '16px' : '24px', fontWeight: '900', textShadow: '3px 3px 5px black', marginTop: '-12px', textAlign:'center' }}>x3</div>
                            )}
                        </div>
                    )}
                    
                    {/* ✅ نقاط الهيت تظهر كدائرة تنبيهية فقط دون أن تُطرح من الرقم بالأسفل */}
                    {hits > 0 && (
                        <div style={{ position: 'absolute', top: '10px', left: isMobile ? '-15px' : '-25px', background: '#ff0000', color: 'white', borderRadius: '50%', width: isMobile ? '35px' : '50px', height: isMobile ? '35px' : '50px', fontSize: isMobile ? '18px' : '26px', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '3px solid white', boxShadow: '0 4px 8px rgba(0,0,0,0.4)' }}>
                            -{hits}
                        </div>
                    )}
                </div>

                <div style={{ 
                    backgroundColor: '#37003c', color: 'white', padding: '6px 15px', borderRadius: '8px', 
                    fontSize: isMobile ? '15px' : '24px', marginTop: '10px', 
                    width: 'fit-content', minWidth: '90%', maxWidth: '280px', textAlign: 'center', 
                    borderBottom: player.isCaptain && gwData?.activeChip === 'theBest' ? '5px solid #ffd700' : '4px solid #00ff87', 
                    fontWeight: '900', whiteSpace: 'nowrap', textShadow: '1px 1px 2px black'
                }}>
                    {name}
                </div>

                <div style={{ 
                    fontSize: isMobile ? '22px' : '38px', fontWeight: '900', color: '#fff', 
                    background: player.isCaptain ? '#000' : (isSub ? '#444' : '#006400'), 
                    border: '3px solid white', padding: '4px 20px', borderRadius: '15px', marginTop: '6px', 
                    boxShadow: '0 6px 15px rgba(0,0,0,0.4)', minWidth: isMobile ? '60px' : '90px', textAlign: 'center' 
                }}>
                    {displayScore}
                </div>
            </div>
        );
    };

    if (!currentGw) return <div style={{textAlign:'center', padding:'100px'}}><FaSpinner className="spin" size={40} /></div>;

    return (
        <div style={{ padding: isCaptureMode ? '0' : (isMobile ? '10px' : '20px'), background: '#f4f6f9', minHeight: '100vh', direction: 'rtl' }}>
            
            {!isCaptureMode && <TournamentHeader isMobile={isMobile} logoUrl={leagueLogo} />}
            
            <div style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '15px', 
                backgroundColor: isCaptureMode ? 'transparent' : '#fff', 
                padding: '15px', borderRadius: '15px', 
                position: 'relative', width: '100%' 
            }}>
                {!isCaptureMode && (
                    <button onClick={() => navigate(-1)} style={{ position: 'absolute', right: '15px', top: '15px', background: '#f0f0f0', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold' }}>⬅</button>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h3 style={{ color: '#38003c', margin: 0, fontSize: isMobile ? '20px' : '35px', fontWeight: '900' }}>{teamInfo?.name}</h3>
                    <div style={{ width: isMobile ? '45px' : '75px', height: isMobile ? '45px' : '75px' }}>
                        <img src={teamInfo?.logoUrl || `/kits/${teamInfo?.name}.png`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = '/kits/default.png'; }} />
                    </div>
                </div>

                {gwData && gwData.isInherited && (
                    <div style={{ marginTop: '15px', backgroundColor: '#fff3e0', color: '#ef6c00', padding: '10px 20px', borderRadius: '10px', fontSize: isMobile ? '13px' : '17px', fontWeight: '900', border: '2px solid #ef6c00', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaInfoCircle size={22} />
                        <span>⚠️ هذا الفريق لم يقم باختيار التشكيلة لهذه الجولة؛ التشكيلة ستتغير تلقائياً مع كل تحديث للنقاط.</span>
                    </div>
                )}
            </div>

            {/* باقي محتوى سجل الخواص والملعب كما هو... */}
            {!isCaptureMode && (
                <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38003c', marginBottom: '10px', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>📊 سجل الخواص المستعملة</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                        {Object.keys(CHIPS).map(chip => {
                            const gwP1 = chipsHistory.p1[chip]; const gwP2 = chipsHistory.p2[chip];
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
            )}

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginBottom: '20px', position: 'relative' }}>
                {!isCaptureMode && <button onClick={() => setCurrentGw(prev => Math.max(1, prev - 1))} style={{ border: 'none', background: '#fff', padding: '12px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer' }}><FaArrowRight /></button>}
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: isMobile ? '35px' : '55px', color: '#38003c', fontWeight: '900' }}>{isCaptureMode ? teamInfo?.name : `الجولة ${currentGw}`}</h2>
                    {gwData && <div style={{ color: '#e91e63', fontWeight: '900', fontSize: '35px' }}>{gwData.stats?.totalPoints} ن</div>}
                </div>
                {!isCaptureMode && <button onClick={() => setCurrentGw(prev => Math.min(38, prev + 1))} style={{ border: 'none', background: '#fff', padding: '12px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer' }}><FaArrowLeft /></button>}
            </div>

            {gwData && !gwData.noData && (
                <div key={currentGw} className="pitch-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* ... (نفس كود الملعب واللاعبين) */}
                    <div style={{ 
                        background: `repeating-linear-gradient(0deg, #1b5e20, #1b5e20 60px, #2e7d32 60px, #2e7d32 120px)`,
                        borderRadius: '30px', padding: isMobile ? '50px 10px' : '100px 30px', minHeight: isMobile ? '600px' : '950px', 
                        display:'flex', flexDirection:'column', justifyContent: 'center', border:'10px solid #fff', position:'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ position: 'absolute', top: '30px', left: '30px', right: '30px', bottom: '30px', border: '3px solid rgba(255,255,255,0.4)' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '60px' : '110px', alignItems: 'center', zIndex: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                {gwData.lineup.filter(p => p.isStarter && p.isCaptain).map((p, idx) => (
                                    <PlayerCard key={`cap-${idx}`} player={p} />
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '30px' : '80px', width: '100%', flexWrap: 'wrap' }}>
                                {gwData.lineup.filter(p => p.isStarter && !p.isCaptain).map((p, idx) => (
                                    <PlayerCard key={`star-${idx}`} player={p} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', background: '#fff', padding: '30px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '24px', fontWeight: '900', marginBottom: '25px', color: '#38003c', textAlign: 'center', borderBottom: '2px solid #eee' }}>🛋 دكة البدلاء</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '15px' : '50px', flexWrap: 'wrap' }}>
                            {gwData.lineup.filter(p => !p.isStarter).map((p, idx) => (
                                <PlayerCard key={`sub-${idx}`} player={p} isSub={true} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default TeamHistory;