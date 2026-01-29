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
        const displayScore = player.finalScore ?? 0;
        
        // تحسين الأبعاد لمنع التداخل في الهاتف
        const kitSize = isMobile ? (isSub ? 60 : 70) : (isSub ? 130 : 185);
        const cardWidth = isMobile ? (isSub ? '85px' : '92px') : (isSub ? '170px' : '220px');

        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                flex: isMobile ? '1 1 0px' : 'none', // توزيع متساوي في الموبايل
                width: isMobile ? 'auto' : cardWidth,
                maxWidth: isMobile ? cardWidth : 'none',
                margin: isMobile ? '5px 2px' : '10px 5px', 
                zIndex: 10 
            }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ width: kitSize, height: kitSize }}>
                        <img 
                            src={`/kits/${teamInfo?.name || 'default'}.png`} 
                            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
                            onError={(e) => { e.target.src = '/kits/default.png'; }} 
                        />
                    </div>
                    {player.isCaptain && (
                        <div style={{ position: 'absolute', top: isMobile ? '-12px' : '-25px', right: isMobile ? '-6px' : '-15px', zIndex: 15 }}>
                            <FaCrown size={isMobile ? 22 : 65} color={gwData?.activeChip === 'tripleCaptain' ? "#00ff87" : "#ffd700"} />
                            {gwData?.activeChip === 'tripleCaptain' && (
                                <div style={{ color: '#00ff87', fontSize: isMobile ? '9px' : '24px', fontWeight: '900', textShadow: '2px 2px 3px black', marginTop: '-4px', textAlign:'center' }}>x3</div>
                            )}
                        </div>
                    )}
                    {hits > 0 && (
                        <div style={{ position: 'absolute', top: '5px', left: isMobile ? '-8px' : '-25px', background: '#ff0000', color: 'white', borderRadius: '50%', width: isMobile ? '22px' : '50px', height: isMobile ? '22px' : '50px', fontSize: isMobile ? '12px' : '26px', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                            -{hits}
                        </div>
                    )}
                </div>

                <div style={{ 
                    backgroundColor: '#37003c', color: 'white', padding: isMobile ? '2px 4px' : '6px 15px', borderRadius: '5px', 
                    fontSize: isMobile ? '10px' : '24px', marginTop: '5px', 
                    width: '100%', textAlign: 'center', 
                    borderBottom: player.isCaptain && gwData?.activeChip === 'theBest' ? '3px solid #ffd700' : '2px solid #00ff87', 
                    fontWeight: '900', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                    {name}
                </div>

                <div style={{ 
                    fontSize: isMobile ? '15px' : '38px', fontWeight: '900', color: '#fff', 
                    background: player.isCaptain ? '#000' : (isSub ? '#444' : '#006400'), 
                    border: isMobile ? '1.5px solid white' : '3px solid white', padding: isMobile ? '2px 6px' : '4px 20px', borderRadius: '10px', marginTop: '4px', 
                    boxShadow: '0 4px 10px rgba(0,0,0,0.4)', minWidth: isMobile ? '40px' : '90px', textAlign: 'center' 
                }}>
                    {displayScore}
                </div>
            </div>
        );
    };

    if (!currentGw) return <div style={{textAlign:'center', padding:'100px'}}><FaSpinner className="spin" size={40} /></div>;

    return (
        <div style={{ padding: isCaptureMode ? '0' : (isMobile ? '5px' : '20px'), background: '#f4f6f9', minHeight: '100vh', direction: 'rtl' }}>
            
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
                    <h3 style={{ color: '#38003c', margin: 0, fontSize: isMobile ? '22px' : '35px', fontWeight: '900' }}>{teamInfo?.name}</h3>
                    <div style={{ width: isMobile ? '45px' : '75px', height: isMobile ? '45px' : '75px' }}>
                        <img src={teamInfo?.logoUrl || `/kits/${teamInfo?.name}.png`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = '/kits/default.png'; }} />
                    </div>
                </div>

                {gwData && gwData.isInherited && (
                    <div style={{ marginTop: '15px', backgroundColor: '#fff3e0', color: '#ef6c00', padding: '10px 20px', borderRadius: '10px', fontSize: isMobile ? '11px' : '17px', fontWeight: '900', border: '2px solid #ef6c00', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaInfoCircle size={20} />
                        <span>⚠️ هذا الفريق لم يقم باختيار التشكيلة لهذه الجولة.</span>
                    </div>
                )}
            </div>

            {!isCaptureMode && (
                <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38003c', marginBottom: '10px', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>📊 سجل الخواص المستعملة</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                        {Object.keys(CHIPS).map(chip => {
                            const gwP1 = chipsHistory.p1[chip]; const gwP2 = chipsHistory.p2[chip];
                            return (
                                <div key={chip} style={{ display: 'flex', gap: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: gwP1 ? '#38003c' : '#eee', color: gwP1 ? '#fff' : '#aaa', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' }}>
                                        {CHIPS[chip].icon} {CHIPS[chip].label} {gwP1 && `[${gwP1}]`}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: gwP2 ? '#00ff87' : '#eee', color: gwP2 ? '#38003c' : '#aaa', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' }}>
                                        {gwP2 && `[${gwP2}]`}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                {!isCaptureMode && <button onClick={() => setCurrentGw(prev => Math.max(1, prev - 1))} style={{ border: 'none', background: '#fff', padding: '12px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}><FaArrowRight /></button>}
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: isMobile ? '30px' : '55px', color: '#38003c', fontWeight: '900' }}>{isCaptureMode ? teamInfo?.name : `الجولة ${currentGw}`}</h2>
                    {gwData && <div style={{ color: '#e91e63', fontWeight: '900', fontSize: isMobile ? '28px' : '35px' }}>{gwData.stats?.totalPoints} ن</div>}
                </div>
                {!isCaptureMode && <button onClick={() => setCurrentGw(prev => Math.min(38, prev + 1))} style={{ border: 'none', background: '#fff', padding: '12px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}><FaArrowLeft /></button>}
            </div>

            {gwData && !gwData.noData && (
                <div key={currentGw} className="pitch-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* الملعب */}
                    <div style={{ 
                        background: `repeating-linear-gradient(0deg, #1b5e20, #1b5e20 60px, #2e7d32 60px, #2e7d32 120px)`,
                        borderRadius: isMobile ? '20px' : '30px', 
                        padding: isMobile ? '40px 10px' : '100px 30px', 
                        minHeight: isMobile ? '450px' : '950px', 
                        display:'flex', flexDirection:'column', justifyContent: 'space-around', border: isMobile ? '6px solid #fff' : '10px solid #fff', position:'relative', boxShadow: '0 15px 30px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ position: 'absolute', top: isMobile ? '10px' : '30px', left: isMobile ? '10px' : '30px', right: isMobile ? '10px' : '30px', bottom: isMobile ? '10px' : '30px', border: '2px solid rgba(255,255,255,0.3)' }}></div>
                        
                        {/* الكابتن */}
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', zIndex: 10 }}>
                            {gwData.lineup.filter(p => p.isStarter && p.isCaptain).map((p, idx) => (
                                <PlayerCard key={`cap-${idx}`} player={p} />
                            ))}
                        </div>

                        {/* اللاعبون (القاعدة) - منع التداخل عبر flex: 1 و gap */}
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: isMobile ? '10px' : '60px', // زيادة الفجوة في الموبايل لمنع تداخل الأسماء
                            width: '100%', 
                            flexWrap: 'nowrap',
                            padding: isMobile ? '0 5px' : '0'
                        }}>
                            {gwData.lineup.filter(p => p.isStarter && !p.isCaptain).map((p, idx) => (
                                <PlayerCard key={`star-${idx}`} player={p} />
                            ))}
                        </div>
                    </div>

                    {/* دكة البدلاء */}
                    <div style={{ marginTop: '20px', background: '#fff', padding: isMobile ? '15px' : '30px', borderRadius: '25px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '900', marginBottom: '15px', color: '#38003c', textAlign: 'center' }}>🛋 دكة البدلاء</div>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: isMobile ? '8px' : '40px', 
                            flexWrap: 'nowrap'
                        }}>
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