import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    FaTrophy, FaMedal, FaStar, FaArrowLeft, FaCrown, FaTshirt, 
    FaCalendarAlt, FaChevronRight, FaChevronLeft, FaChartLine, FaSpinner
} from "react-icons/fa";
import { TbSoccerField } from "react-icons/tb";

const AwardsCenter = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('gameweek'); 
    const [gw, setGw] = useState(1); 
    const [awards, setAwards] = useState(null);
    const [formGuide, setFormGuide] = useState([]);
    const [loading, setLoading] = useState(false);
    const [monthsList, setMonthsList] = useState([]);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
    
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getLogoUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
        return `${baseUrl}${url.replace(/\\/g, '/')}`;
    };

    useEffect(() => {
        const init = async () => {
            try {
                const statusRes = await API.get('/gameweek/status');
                const currentGwId = statusRes.data.id || 1;
                setGw(currentGwId); 

                const scheduleRes = await API.get('/leagues/schedule');
                const schedule = scheduleRes.data;
                setMonthsList(schedule);
                
                if(schedule.length > 0) {
                    const currentMonthIdx = schedule.findIndex(m => {
                        const [start, end] = m.range.split(',').map(Number);
                        return currentGwId >= start && currentGwId <= end;
                    });
                    setSelectedMonthIndex(currentMonthIdx !== -1 ? currentMonthIdx : schedule.length - 1);
                }
            } catch (e) { console.error(e); }
        };
        init();
    }, []);

    useEffect(() => {
        if (activeTab === 'gameweek') fetchAwards('gameweek', gw);
        if (activeTab === 'season') fetchAwards('season');
        if (activeTab === 'month' && monthsList.length > 0) {
            fetchAwards('month', monthsList[selectedMonthIndex].range);
        }
        if (activeTab === 'form') fetchForm();
    }, [activeTab, gw, selectedMonthIndex, monthsList]);

    const fetchAwards = async (type, range) => {
        setLoading(true);
        try {
            if (!user.leagueId) return; 
            const { data } = await API.get(`/leagues/awards`, {
                params: { leagueId: user.leagueId, type, range }
            });
            setAwards(data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    const fetchForm = async () => {
        setLoading(true);
        try {
            if (!user.leagueId) return;
            const { data } = await API.get(`/leagues/form-guide`, { params: { leagueId: user.leagueId } });
            setFormGuide(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const changeMonth = (step) => {
        const newIndex = selectedMonthIndex + step;
        if (newIndex >= 0 && newIndex < monthsList.length) setSelectedMonthIndex(newIndex);
    };

    const FormBadge = ({ result }) => {
        const colors = { 'W': '#00c853', 'D': '#ff9800', 'L': '#d32f2f' };
        return (
            <span style={{ 
                background: colors[result] || '#9e9e9e', 
                color: 'white', 
                width: isMobile ? '20px' : '28px', 
                height: isMobile ? '20px' : '28px', 
                borderRadius: '4px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 'bold', 
                fontSize: isMobile ? '10px' : '13px', 
                margin: '0 2px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                minWidth: isMobile ? '20px' : '28px'
            }}>{result}</span>
        );
    };

    const KitImage = ({ teamName, size = 60 }) => {
        const kitSrc = `/kits/${teamName || 'default'}.png`;
        return (
            <div style={{ position: 'relative', width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img 
                    src={kitSrc} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }}
                    onError={(e) => { e.target.src = '/kits/default.png'; }} 
                    alt="Kit"
                />
            </div>
        );
    };

    const DreamPlayer = ({ player, isSub = false, isCenterForward = false }) => {
        const getSize = () => {
            if (isMobile) return isCenterForward ? 50 : (isSub ? 32 : 42);
            if (isTablet) return isCenterForward ? 65 : (isSub ? 45 : 55);
            return isCenterForward ? 75 : (isSub ? 50 : 65);
        };

        const size = getSize();

        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                width: isMobile ? '65px' : '100px', 
                position: 'relative', 
                transform: isCenterForward && !isMobile ? 'translateY(25px)' : 'none', 
                zIndex: isCenterForward ? 10 : 1,
                flexShrink: 0
            }}>
                <div style={{ position: 'relative' }}>
                    <KitImage teamName={player?.teamName} size={size} />
                    {player?.isCaptain && (
                        <FaCrown 
                            color="#ffd700" 
                            size={isMobile ? 12 : 20} 
                            style={{ position: 'absolute', top: -8, right: -4, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))', zIndex: 15 }} 
                        />
                    )}
                    {/* ✅ رمز GK للحارس الاحتياطي فقط */}
                    {isSub && player?.position === 'GKP' && (
                        <div style={{
                            position: 'absolute', bottom: -2, left: -2,
                            background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                            color: 'white', fontSize: '8px', fontWeight: '900',
                            padding: '1px 3px', borderRadius: '3px', border: '1px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)', zIndex: 20
                        }}>GK</div>
                    )}
                </div>
                <div style={{ 
                    background: 'rgba(56, 0, 60, 0.9)', color: 'white', 
                    fontSize: isMobile ? '8px' : '11px', padding: '3px 4px', 
                    borderRadius: '4px', marginTop: '6px', width: '95%', textAlign: 'center', 
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', 
                    borderBottom: '2.5px solid #00ff87', fontWeight: 'bold'
                }}>
                    {player?.name || '--'}
                </div>
                <div style={{ 
                    background: isSub ? '#555' : 'linear-gradient(180deg, #4caf50, #388e3c)', 
                    color: 'white', fontSize: isMobile ? '9px' : '13px', fontWeight: '900', 
                    padding: '1px 8px', borderRadius: '12px', marginTop: '3px', border: '1.5px solid white'
                }}>
                    {player?.score || '0'}
                </div>
            </div>
        );
    };

    const DreamTeamPitch = ({ players }) => {
        if(!players || players.length === 0) return (
            <div style={{ textAlign:'center', padding: '50px 20px', background:'#fff', borderRadius:'20px', color: '#666' }}>
                ⚽ لا توجد بيانات تشكيلة مثالية لهذه الفترة بعد
            </div>
        );
        
        const starters = players.filter(p => p.isStarter);
        const bench = players.filter(p => !p.isStarter).sort((a,b) => b.score - a.score);
        
        const gk = starters.find(p => p.position === 'GKP');
        const def = starters.filter(p => p.position === 'DEF');
        const mid = starters.filter(p => p.position === 'MID');
        let fwd = starters.filter(p => p.position === 'FWD');

        // ترتيب الهجوم: الأعلى نقاطاً يتوسطهم
        if (fwd.length === 3) {
            const sorted = [...fwd].sort((a, b) => b.score - a.score);
            fwd = [sorted[1], sorted[0], sorted[2]];
        } else if (fwd.length === 2) {
            const sorted = [...fwd].sort((a, b) => b.score - a.score);
            fwd = [sorted[1], sorted[0]];
        }

        return (
            <div className="dream-team-wrapper" style={{ direction: 'ltr', width: '100%', marginBottom: '30px' }}>
                <div style={{ 
                    background: 'linear-gradient(180deg, #1b5e20 0%, #2e7d32 50%, #1b5e20 100%)', 
                    padding: isMobile ? '30px 5px' : '60px 10px', 
                    borderRadius: '20px', border: '4px solid #ffd700', 
                    minHeight: isMobile ? '450px' : '750px', position: 'relative', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center', boxShadow: '0 15px 40px rgba(0,0,0,0.4)'
                }}>
                    {/* ✅ تخطيط الملعب */}
                    <div style={{ position: 'absolute', inset: '15px', border: '1.5px solid rgba(255,255,255,0.2)', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1.5px', background: 'rgba(255,255,255,0.2)' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: isMobile ? '80px' : '160px', height: isMobile ? '80px' : '160px', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '50%' }}></div>
                    <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '45%', height: '15%', border: '1.5px solid rgba(255,255,255,0.2)', borderTop: 'none' }}></div>
                    <div style={{ position: 'absolute', bottom: '-1px', left: '50%', transform: 'translateX(-50%)', width: '45%', height: '15%', border: '1.5px solid rgba(255,255,255,0.2)', borderBottom: 'none' }}></div>
                    
                    <DreamPlayer player={gk} />
                    <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '2px' : '20px', width: '100%', flexWrap: 'wrap' }}>
                        {def.map((p, i) => <DreamPlayer key={p.id || p._id || i} player={p} />)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '2px' : '20px', width: '100%', flexWrap: 'wrap' }}>
                        {mid.map((p, i) => <DreamPlayer key={p.id || p._id || i} player={p} />)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '10px' : '40px', width: '100%', flexWrap: 'wrap' }}>
                        {fwd.map((p, idx) => (
                            <DreamPlayer key={p.id || p._id || idx} player={p} isCenterForward={fwd.length === 3 ? idx === 1 : (fwd.length === 2 ? idx === 1 : true)} />
                        ))}
                    </div>
                </div>

                {/* ✅ دكة البدلاء مع الإزاحة الصحيحة */}
                <div style={{ 
                    background: '#fff', padding: '20px', borderRadius: '20px', 
                    marginTop: '20px', boxShadow: '0 8px 25px rgba(0,0,0,0.08)', 
                    textAlign: 'center', border: '1px solid #eee'
                }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#38003c', fontWeight: '900' }}>🛋️ دكة البدلاء المثالية</h4>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '8px' : '20px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '10px' }}>
                        {bench.map((p, i) => {
                            const isLeast = i === bench.length - 1 && bench.length > 1;
                            return (
                                <div key={p.id || p._id || i} style={{ 
                                    paddingLeft: isLeast ? (isMobile ? '15px' : '30px') : '0',
                                    borderLeft: isLeast ? '2px dashed #ddd' : 'none'
                                }}>
                                    <DreamPlayer player={p} isSub={true} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: isMobile ? '12px' : '30px', background: '#f8f9fb', minHeight: '100vh', direction: 'rtl' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', gap: '15px' }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: '#fff', border: '1px solid #eee', width: '45px', height: '45px', borderRadius: '12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: '#38003c' }}>
                    <FaArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ margin: 0, color: '#38003c', fontSize: isMobile ? '22px' : '32px', fontWeight: '900' }}>🏆 مركز الجوائز والتشكيلات</h1>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '25px', background: '#fff', padding: '6px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
                {['gameweek', 'month', 'season', 'form'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: isMobile ? '0 0 auto' : 1, padding: isMobile ? '10px 16px' : '12px 24px', borderRadius: '12px', border: 'none', background: activeTab === tab ? '#38003c' : 'transparent', color: activeTab === tab ? '#00ff87' : '#555', fontSize: isMobile ? '13px' : '15px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {getTabIcon(activeTab === tab ? tab : tab)} {tab === 'gameweek' ? 'أفضل جولة' : tab === 'month' ? 'أفضل شهر' : tab === 'season' ? 'أفضل موسم' : 'فورمة الفرق'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign:'center', padding: '100px 20px' }}><FaSpinner className="spin" size={40} color="#38003c" /></div>
            ) : (
                <div className="content-area">
                    {activeTab === 'gameweek' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
                            <button onClick={() => setGw(g => Math.max(1, g - 1))} style={{ background: '#fff', border: '1px solid #eee', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaChevronRight /></button>
                            <div style={{ background: 'linear-gradient(135deg, #38003c, #5c0062)', color: '#00ff87', padding: '10px 40px', borderRadius: '14px', fontWeight: '900', fontSize: '20px', minWidth: '160px', textAlign: 'center' }}>الجولة {gw}</div>
                            <button onClick={() => setGw(g => Math.min(38, g + 1))} style={{ background: '#fff', border: '1px solid #eee', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaChevronLeft /></button>
                        </div>
                    )}

                    {activeTab === 'month' && monthsList.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
                            <button onClick={() => changeMonth(-1)} disabled={selectedMonthIndex === 0} style={{ background: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', opacity: selectedMonthIndex === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}><FaChevronRight /></button>
                            <div style={{ textAlign: 'center', background: 'white', padding: '12px 30px', borderRadius: '16px', border: '2px solid #38003c', minWidth: '220px' }}>
                                <div style={{ fontWeight: '900', color: '#38003c', fontSize: '18px' }}>{monthsList[selectedMonthIndex]?.name}</div>
                                <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>النطاق: ج {monthsList[selectedMonthIndex]?.range.replace(',', ' - ')}</div>
                            </div>
                            <button onClick={() => changeMonth(1)} disabled={selectedMonthIndex === monthsList.length - 1} style={{ background: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', opacity: selectedMonthIndex === monthsList.length - 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}><FaChevronLeft /></button>
                        </div>
                    )}

                    {(activeTab === 'gameweek' || activeTab === 'month' || activeTab === 'season') && (
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                                <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', textAlign: 'center', border: '2px solid #00c853', boxShadow: '0 10px 20px rgba(0,200,83,0.08)' }}>
                                    <FaTrophy size={30} color="#00c853" style={{marginBottom:'10px'}} />
                                    <div style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>{activeTab === 'season' ? 'بطل الموسم' : 'فريق الشهر'}</div>
                                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#333', margin: '5px 0' }}>{awards?.bestTeam?.name || '--'}</div>
                                    <div style={{ fontSize: '18px', color: '#00c853', fontWeight: '900' }}>{awards?.bestTeam?.totalScore || '0'} <small>نقطة</small></div>
                                </div>
                                <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', textAlign: 'center', border: '2px solid #2979ff', boxShadow: '0 10px 20px rgba(41,121,255,0.08)' }}>
                                    <FaStar size={30} color="#2979ff" style={{marginBottom:'10px'}} />
                                    <div style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>لاعب الفترة (MVP)</div>
                                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#333', margin: '5px 0' }}>{awards?.bestPlayer?.name || '--'}</div>
                                    <div style={{ fontSize: '18px', color: '#2979ff', fontWeight: '900' }}>{awards?.bestPlayer?.score || '0'} <small>نقطة</small></div>
                                </div>
                            </div>
                            <DreamTeamPitch players={awards?.dreamTeam} />
                        </div>
                    )}

                    {activeTab === 'form' && (
                        <div style={{ background: 'white', borderRadius: '24px', padding: isMobile ? '15px' : '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', maxWidth: '900px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: '3px solid #38003c', paddingBottom: '15px' }}>
                                <FaChartLine color="#38003c" size={24} />
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>سجل فورمة الفرق (آخر 5 مواجهات)</h3>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                    <tbody>
                                        {formGuide.map((team, idx) => (
                                            <tr key={team.teamId} style={{ background: '#fcfcfe' }}>
                                                <td style={{ padding: '15px', fontWeight: '900', color: '#38003c', fontSize: '18px', width: '50px' }}>{idx + 1}</td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <img src={getLogoUrl(team.logoUrl)} style={{ width: '35px', height: '35px', objectFit: 'contain' }} alt="logo" />
                                                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{team.teamName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'row-reverse', gap: '5px' }}>
                                                        {team.form.map((res, i) => <FormBadge key={i} result={res} />)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @media (max-width: 768px) {
                    .pitch-container { transform: scale(0.92); transform-origin: top center; margin: 0 -10px; }
                }
            `}</style>
        </div>
    );
};

const getTabIcon = (tab) => {
    switch(tab) {
        case 'gameweek': return <TbSoccerField style={{ marginLeft: '8px' }} />;
        case 'month': return <FaCalendarAlt style={{ marginLeft: '8px' }} />;
        case 'season': return <FaTrophy style={{ marginLeft: '8px' }} />;
        case 'form': return <FaChartLine style={{ marginLeft: '8px' }} />;
        default: return null;
    }
};

export default AwardsCenter;