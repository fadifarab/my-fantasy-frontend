import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { 
    FaArrowRight, FaArrowLeft, FaShieldAlt, FaBolt, FaStar, 
    FaMagic, FaCrown, FaTshirt, FaSpinner 
} from "react-icons/fa";

const TeamHistory = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [currentGw, setCurrentGw] = useState(null);
    const [teamInfo, setTeamInfo] = useState(null); 
    const [gwData, setGwData] = useState(null);
    const [chipsHistory, setChipsHistory] = useState({ p1: {}, p2: {} });
    const [loading, setLoading] = useState(false);
    const [restricted, setRestricted] = useState(false);
    
    // ✅ اكتشاف نوع الشاشة للتجاوب
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
                if (data.team) setTeamInfo(data.team);
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
        
        // أحجام متجاوبة للهاتف
        const kitSize = isMobile ? (isSub ? 60 : 80) : (isSub ? 80 : 115);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: isMobile ? '90px' : '140px', margin: '5px 0', zIndex: 10 }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ width: kitSize, height: kitSize }}>
                        <img 
                            src={`/kits/${teamInfo?.name || 'default'}.png`} 
                            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.4))' }}
                            onError={(e) => { e.target.src = '/kits/default.png'; }} 
                        />
                    </div>
                    {player.isCaptain && <FaCrown size={isMobile ? 22 : 32} color="#ffd700" style={{ position: 'absolute', top: '-12px', right: '-8px', zIndex: 15 }} />}
                    {hits > 0 && (
                        <div style={{ position: 'absolute', top: '0', left: '-10px', background: '#d32f2f', color: 'white', borderRadius: '50%', width: '22px', height: '22px', fontSize: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid white' }}>
                            -{hits}
                        </div>
                    )}
                </div>
                <div style={{ backgroundColor: '#37003c', color: 'white', padding: '3px 6px', borderRadius: '5px', fontSize: isMobile ? '10px' : '13px', marginTop: '6px', width: '95%', textAlign: 'center', borderBottom: '2px solid #00ff87', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name}
                </div>
                <div style={{ fontSize: isMobile ? '15px' : '20px', fontWeight: '900', color: '#fff', background: player.isCaptain ? '#000' : (isSub ? '#777' : '#4caf50'), border: player.isCaptain ? '2px solid #ffd700' : '2px solid white', padding: '1px 12px', borderRadius: '12px', marginTop: '4px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', minWidth: '35px', textAlign: 'center' }}>
                    {displayScore}
                </div>
            </div>
        );
    };

    if (!currentGw) return <div style={{textAlign:'center', padding:'100px'}}><FaSpinner className="spin" size={40} /></div>;

    return (
        <div style={{ padding: isMobile ? '10px' : '20px', background: '#f4f6f9', minHeight: '100vh', direction: 'rtl' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <button onClick={() => navigate(-1)} style={{ background: '#fff', border: 'none', padding: '8px 15px', borderRadius: '10px', fontWeight: 'bold', cursor:'pointer' }}>⬅</button>
                <h3 style={{ color: '#38003c', margin: 0, fontSize: isMobile ? '18px' : '24px' }}>{teamInfo?.name}</h3>
                <div style={{width:'40px'}}></div>
            </div>

            {/* Chips Bar */}
            <div style={{ background: '#fff', padding: '10px', borderRadius: '15px', marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                {Object.keys(CHIPS).map(chip => {
                    const usedGw = chipsHistory.p1[chip] || chipsHistory.p2[chip];
                    return (
                        <div key={chip} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: usedGw ? '#38003c' : '#eee', color: usedGw ? '#fff' : '#aaa', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' }}>
                            {CHIPS[chip].icon} {CHIPS[chip].label} {usedGw && `(${usedGw})`}
                        </div>
                    );
                })}
            </div>

            {/* GW Navigator */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <button onClick={() => setCurrentGw(prev => Math.max(1, prev - 1))} disabled={currentGw <= 1} style={{ border: 'none', background: '#fff', padding: '12px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}><FaArrowRight /></button>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: isMobile ? '24px' : '32px', color: '#38003c' }}>الجولة {currentGw}</h2>
                    {gwData && <div style={{ color: '#e91e63', fontWeight: 'bold', fontSize: '20px' }}>{gwData.stats?.totalPoints} ن</div>}
                </div>
                <button onClick={() => setCurrentGw(prev => Math.min(38, prev + 1))} disabled={currentGw >= 38} style={{ border: 'none', background: '#fff', padding: '12px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}><FaArrowLeft /></button>
            </div>

            {/* Pitch */}
            {loading ? <div style={{textAlign:'center'}}><FaSpinner className="spin" /></div> : 
             restricted ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: '25px', margin: '0 auto' }}>
                    <FaShieldAlt size={60} color="#d32f2f" />
                    <h3 style={{ color: '#d32f2f' }}>التشكيلة مخفية 🔒</h3>
                </div>
            ) : gwData && !gwData.noData ? (
                <div style={{ maxWidth: '850px', margin: '0 auto' }}>
                    <div style={{ 
                        background: `repeating-linear-gradient(0deg, #2e7d32, #2e7d32 45px, #388e3c 45px, #388e3c 90px)`,
                        borderRadius: '20px', padding: isMobile ? '30px 5px' : '60px 20px', minHeight: isMobile ? '450px' : '650px', 
                        display:'flex', flexDirection:'column', justifyContent: 'center', border:'6px solid #fff', position:'relative', overflow:'hidden'
                    }}>
                        {/* خطوط الملعب */}
                        <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px', border: '1px solid rgba(255,255,255,0.3)' }}></div>
                        <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: 'rgba(255,255,255,0.3)' }}></div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '30px' : '60px', alignItems: 'center', zIndex: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                {gwData.lineup.filter(p => p.isStarter && p.isCaptain).map(p => <PlayerCard key={p._id} player={p} />)}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '5px' : '20px', width: '100%', flexWrap: 'wrap' }}>
                                {gwData.lineup.filter(p => p.isStarter && !p.isCaptain).map(p => <PlayerCard key={p._id} player={p} />)}
                            </div>
                        </div>
                    </div>

                    {/* دكة الاحتياط */}
                    <div style={{ marginTop: '15px', background: '#fff', padding: '15px', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#38003c', borderBottom: '1px solid #eee' }}>🛋 الاحتياط</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '5px' : '25px', flexWrap: 'wrap' }}>
                            {gwData.lineup.filter(p => !p.isStarter).map(p => <PlayerCard key={p._id} player={p} isSub={true} />)}
                        </div>
                    </div>
                </div>
            ) : <div style={{textAlign: 'center', padding: '40px'}}>لا توجد بيانات</div>}

            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default TeamHistory;