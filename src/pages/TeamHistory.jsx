import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../utils/api';
import { FaArrowRight, FaArrowLeft, FaShieldAlt, FaBolt, FaStar, FaMagic, FaArrowLeft as BackIcon, FaCrown, FaTshirt } from "react-icons/fa";

const TeamHistory = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // --- منطق اكتشاف نوع الشاشة ---
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const initialGw = location.state?.startGw ? Math.max(1, location.state.startGw) : 1;
    const [currentGw, setCurrentGw] = useState(initialGw);
    const [teamInfo, setTeamInfo] = useState(null); 
    const [gwData, setGwData] = useState(null);
    const [chipsHistory, setChipsHistory] = useState({ p1: {}, p2: {} });
    const [loading, setLoading] = useState(false);
    const [restricted, setRestricted] = useState(false);
    
    // تحديث رابط السيرفر ليعمل على Render
    const SERVER_URL = 'https://fpl-zeddine.onrender.com';

    const CHIPS = {
        'theBest': { label: 'The Best', icon: <FaStar color="gold" /> },
        'tripleCaptain': { label: 'Triple Captain', icon: <FaBolt color="orange" /> },
        'benchBoost': { label: 'Bench Boost', icon: <FaShieldAlt color="green" /> },
        'freeHit': { label: 'Free Hit', icon: <FaMagic color="purple" /> },
        'wildcard': { label: 'Wildcard', icon: <span>🃏</span> }
    };

    const getLogoUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${SERVER_URL}${url.replace(/\\/g, '/')}`;
    };

    useEffect(() => {
        const fetchFullHistory = async () => {
            try {
                const { data } = await API.get(`/leagues/team-history-full/${teamId}`);
                if (data.team) setTeamInfo(data.team);
                const usedChips = { p1: {}, p2: {} };
                if (data.history) {
                    data.history.forEach(gw => {
                        if (gw.activeChip && gw.activeChip !== 'none' && gw.activeChip !== 'hidden') {
                            if (gw.gameweek <= 19) usedChips.p1[gw.activeChip] = gw.gameweek;
                            else usedChips.p2[gw.activeChip] = gw.gameweek;
                        }
                    });
                }
                setChipsHistory(usedChips);
            } catch (error) { console.error("Error:", error); }
        };
        fetchFullHistory();
    }, [teamId]);

    useEffect(() => {
        const fetchGwData = async () => {
            setLoading(true);
            setRestricted(false);
            setGwData(null);
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

    const changeGw = (val) => {
        if (currentGw + val > 0 && currentGw + val <= 38) setCurrentGw(prev => prev + val);
    };

    const KitImage = ({ size = 60 }) => {
        const teamName = teamInfo ? teamInfo.name : 'default';
        const kitSrc = `/kits/${teamName}.png`;
        return (
            <div style={{ position: 'relative', width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src={kitSrc} alt="Kit" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.5))' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                <FaTshirt size={size} color="#f0f0f0" style={{ display: 'none' }} />
            </div>
        );
    };

    const PlayerCard = ({ player, isSub = false, activeChip }) => {
        const name = player.userId?.username || 'Unknown';
        const hits = player.transferCost || 0;
        let displayScore = player.finalScore;
        let scoreBg = isSub ? '#ddd' : '#4caf50'; 
        let scoreColor = isSub ? '#555' : '#fff';
        let scoreBorder = '2px solid white';

        if (player.isCaptain) {
            const multiplier = activeChip === 'tripleCaptain' ? 3 : 2;
            displayScore = player.finalScore * multiplier;
            scoreBg = '#000000'; 
            scoreColor = '#fff';
            scoreBorder = '2px solid #ffd700'; 
        }

        return (
            <div key={player._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: isMobile ? '8px' : '15px' }}>
                <div style={{ position: 'relative' }}>
                    <KitImage size={isMobile ? 55 : 70} />
                    {player.isCaptain && <FaCrown size={isMobile ? 18 : 24} color="#ffd700" style={{ position: 'absolute', top: '-10px', right: '-6px', zIndex: 10 }} />}
                    {hits > 0 && <div style={{ position: 'absolute', top: '-5px', left: '-8px', backgroundColor: '#d32f2f', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', fontWeight: 'bold', border: '1px solid white', zIndex: 10 }}>-{hits}</div>}
                </div>
                <div style={{ backgroundColor: '#37003c', color: 'white', padding: '3px 6px', borderRadius: '4px', fontSize: isMobile ? '10px' : '12px', marginTop: '5px', width: isMobile ? '75px' : '90px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name}
                </div>
                <div style={{ fontSize: isMobile ? '13px' : '16px', fontWeight: 'bold', color: scoreColor, background: scoreBg, border: scoreBorder, padding: '1px 8px', borderRadius: '10px', marginTop: '3px', minWidth: '25px', textAlign: 'center' }}>
                    {displayScore}
                </div>
            </div>
        );
    };

    const ChipBadge = ({ type, usedGw }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: usedGw ? '#fff' : '#f9f9f9', padding: '4px 8px', borderRadius: '15px', border: usedGw ? '1px solid #38003c' : '1px dashed #ccc', opacity: usedGw ? 1 : 0.6, fontSize: isMobile ? '10px' : '11px' }}>
            {CHIPS[type]?.icon}
            <span style={{ fontWeight: 'bold' }}>{usedGw && isMobile ? '' : (CHIPS[type]?.label || type)}</span>
            {usedGw && <span style={{ background: '#38003c', color: 'white', padding: '1px 4px', borderRadius: '4px', fontSize: '9px' }}>GW{usedGw}</span>}
        </div>
    );

    const renderPitch = () => {
        if (!gwData || !gwData.lineup) return null;
        const starters = gwData.lineup.filter(p => p.isStarter);
        const bench = gwData.lineup.filter(p => !p.isStarter);
        const captain = starters.find(p => p.isCaptain);
        const others = starters.filter(p => !p.isCaptain);
        const activeChip = gwData.activeChip;

        return (
            <>
                <div style={{ 
                    position: 'relative', borderRadius: '15px', overflow: 'hidden', minHeight: isMobile ? '400px' : '520px',
                    border: '3px solid #fff', boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    background: `repeating-linear-gradient(0deg, #419d36, #419d36 40px, #4caf50 40px, #4caf50 80px)`,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ position: 'absolute', top: '10%', left: '0', right: '0', height: '1px', background: 'rgba(255,255,255,0.3)' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: isMobile ? '90px' : '120px', height: isMobile ? '90px' : '120px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%' }}></div>

                    {activeChip && activeChip !== 'none' && activeChip !== 'hidden' && (
                        <div style={{ position: 'absolute', top: '15px', backgroundColor: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #e91e63', color: '#e91e63' }}>
                            {CHIPS[activeChip]?.label}
                        </div>
                    )}

                    <div style={{ marginBottom: isMobile ? '30px' : '60px', zIndex: 10 }}>
                        {captain ? <PlayerCard player={captain} activeChip={activeChip} /> : (others.length > 0 && <PlayerCard player={others[0]} activeChip={activeChip} />)}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: isMobile ? '10px' : '60px', zIndex: 10 }}>
                        {others.map((p, idx) => ((!captain && idx === 0) ? null : <PlayerCard key={p._id} player={p} activeChip={activeChip} />))}
                    </div>
                </div>

                <div style={{ marginTop: '15px', backgroundColor: 'white', borderRadius: '12px', padding: '10px' }}>
                    <h6 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#37003c' }}>🛋 دكة الاحتياط</h6>
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {bench.map(p => <PlayerCard key={p._id} player={p} isSub={true} />)}
                    </div>
                </div>
            </>
        );
    };

    return (
        <div style={{ padding: isMobile ? '12px' : '20px', background: '#eef1f5', minHeight: '100vh', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}> <BackIcon /> عودة </button>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: 0, color: '#37003c', fontSize: isMobile ? '18px' : '22px' }}>{teamInfo?.name || 'التاريخ'}</h3>
                </div>
                <div style={{ width: isMobile ? '40px' : '70px' }}>
                    {teamInfo?.logoUrl && <img src={getLogoUrl(teamInfo.logoUrl)} style={{ width: isMobile ? '40px' : '70px', height: isMobile ? '40px' : '70px', objectFit: 'contain', borderRadius: '50%', backgroundColor: 'white' }} />}
                </div>
            </div>

            <div style={{ background: 'white', padding: '12px', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#4a148c' }}>الأدوات المستخدمة (Chips):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Object.keys(CHIPS).map(chip => (chipsHistory.p1[chip] || chipsHistory.p2[chip]) && <ChipBadge key={chip} type={chip} usedGw={chipsHistory.p1[chip] || chipsHistory.p2[chip]} />)}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <button onClick={() => changeGw(-1)} disabled={currentGw <= 1} style={{ border: 'none', background: 'white', padding: '10px', borderRadius: '50%' }}><FaArrowRight /></button>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '20px' }}>GW {currentGw}</div>
                    {gwData && <div style={{ color: '#e91e63', fontSize: '16px', fontWeight: 'bold' }}>{gwData.stats?.totalPoints || 0} pts</div>}
                </div>
                <button onClick={() => changeGw(1)} disabled={currentGw >= 38} style={{ border: 'none', background: 'white', padding: '10px', borderRadius: '50%' }}><FaArrowLeft /></button>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: '40px' }}>⏳</div> : restricted ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#ffebee', borderRadius: '15px', color: '#c62828' }}>
                    <FaShieldAlt size={40} />
                    <p>محتوى محجوب الديدلاين لم ينتهِ ⛔</p>
                </div>
            ) : gwData && !gwData.noData ? renderPitch() : <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>لا توجد تشكيلة 🤷‍♂️</div>}
        </div>
    );
};

export default TeamHistory;