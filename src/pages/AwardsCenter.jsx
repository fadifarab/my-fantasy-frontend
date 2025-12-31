import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaTrophy, FaMedal, FaStar, FaArrowLeft, FaCrown, FaTshirt, FaCalendarAlt, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { TbSoccerField } from "react-icons/tb";

const AwardsCenter = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    // --- إضافة منطق اكتشاف حجم الشاشة ---
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [activeTab, setActiveTab] = useState('gameweek'); 
    const [gw, setGw] = useState(1); 
    const [awards, setAwards] = useState(null);
    const [formGuide, setFormGuide] = useState([]);
    const [loading, setLoading] = useState(false);
    const [monthsList, setMonthsList] = useState([]);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

    // --- تصحيح الرابط ليعمل على السيرفر المرفوع ---
    const getLogoUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        // استبدل localhost برابط السيرفر الخاص بك على Render
        return `https://fpl-zeddine.onrender.com${url.replace(/\\/g, '/')}`;
    };

    useEffect(() => {
        const init = async () => {
            try {
                const statusRes = await API.get('/gameweek/status');
                const currentGwId = statusRes.data.id || 1;
                setGw(currentGwId > 1 ? currentGwId - 1 : 1); 

                const scheduleRes = await API.get('/leagues/schedule');
                const schedule = scheduleRes.data;
                setMonthsList(schedule);
                
                if(schedule.length > 0) {
                    const currentMonthIdx = schedule.findIndex(m => {
                        const [start, end] = m.range.split(',').map(Number);
                        return currentGwId >= start && currentGwId <= end;
                    });
                    if (currentMonthIdx !== -1) setSelectedMonthIndex(currentMonthIdx);
                    else setSelectedMonthIndex(schedule.length - 1);
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
        let color = '#9e9e9e'; 
        if (result === 'W') color = '#00c853'; 
        if (result === 'L') color = '#d32f2f'; 
        return <span style={{ background: color, color: 'white', width: isMobile ? '20px' : '25px', height: isMobile ? '20px' : '25px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: isMobile ? '10px' : '12px', margin: '0 2px' }}>{result}</span>;
    };

    const KitImage = ({ teamName, size = 60 }) => {
        const name = teamName || 'default';
        const kitSrc = `/kits/${name}.png`;
        return (
            <div style={{ position: 'relative', width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img 
                    src={kitSrc} 
                    alt="Kit" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.5))' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                />
                <FaTshirt size={size} color="#ccc" style={{ display: 'none' }} />
            </div>
        );
    };

    const DreamPlayer = ({ player, isSub = false, isCenterForward = false }) => {
        // تعديل أحجام اللاعبين لتناسب الهاتف
        const baseSize = isMobile ? (isSub ? 35 : 45) : (isSub ? 45 : 55);
        const size = isCenterForward ? baseSize + 15 : baseSize;
        
        return (
            <div style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', 
                width: isMobile ? '65px' : '80px', position: 'relative', margin: '0 2px',
                transform: isCenterForward ? (isMobile ? 'translateY(15px)' : 'translateY(25px)') : 'none', 
                zIndex: isCenterForward ? 10 : 1
            }}>
                <div style={{ position: 'relative' }}>
                    <KitImage teamName={player.teamName} size={size} />
                    {player.isCaptain && <FaCrown color="#ffd700" size={isMobile ? 14 : 22} style={{ position: 'absolute', top: -8, right: -3, zIndex: 10 }} />}
                </div>
                <div style={{ background: '#38003c', color: 'white', fontSize: isMobile ? '8px' : '9px', padding: '2px 4px', borderRadius: '4px', marginTop: '5px', width: '100%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {player.name}
                </div>
                <div style={{ background: isSub ? '#bdbdbd' : '#4caf50', color: 'white', fontSize: isMobile ? '9px' : '11px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '10px', marginTop: '2px' }}>
                    {player.score}
                </div>
            </div>
        );
    };

    const DreamTeamPitch = ({ players }) => {
        if(!players || players.length === 0) return <div style={{textAlign:'center', padding:'20px'}}>لا توجد بيانات كافية</div>;
        const starters = players.filter(p => p.isStarter);
        const bench = players.filter(p => !p.isStarter);
        const gk = starters.find(p => p.position === 'GKP');
        const def = starters.filter(p => p.position === 'DEF');
        const mid = starters.filter(p => p.position === 'MID');
        const fwd = starters.filter(p => p.position === 'FWD');

        const Row = ({ rowPlayers, isForwardLine = false }) => (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: isMobile ? '5px' : '20px', marginBottom: isMobile ? '10px' : '20px', width: '100%' }}>
                {rowPlayers.map((p, idx) => {
                    const isCenter = isForwardLine && rowPlayers.length === 3 && idx === 1;
                    return <DreamPlayer key={p.id} player={p} isCenterForward={isCenter} />;
                })}
            </div>
        );

        return (
            <>
                <div style={{ 
                    background: 'linear-gradient(180deg, #1b5e20 0%, #2e7d32 50%, #1b5e20 100%)', 
                    padding: isMobile ? '10px 5px' : '20px 10px 40px 10px', 
                    borderRadius: '15px', border: '4px solid #ffd700', 
                    margin: '20px 0', minHeight: isMobile ? '450px' : '700px', position: 'relative', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center'
                }}>
                    {/* تخطيط الملعب */}
                    <div style={{ position: 'absolute', top: '5%', left: '5%', right: '5%', bottom: '5%', border: '1px solid rgba(255,255,255,0.3)', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: 'rgba(255,255,255,0.3)' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: isMobile ? '80px' : '120px', height: isMobile ? '80px' : '120px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%', transform: 'translate(-50%, -50%)' }}></div>

                    <div style={{ zIndex: 5 }}>{gk && <DreamPlayer player={gk} />}</div>
                    <Row rowPlayers={def} />
                    <Row rowPlayers={mid} />
                    <Row rowPlayers={fwd} isForwardLine={true} />
                </div>

                <div style={{ background: 'white', padding: '10px', borderRadius: '15px', borderTop: '5px solid #38003c' }}>
                    <h4 style={{ margin: '0 0 10px 0', textAlign: 'center', fontSize: '14px' }}>دكة الاحتياط</h4>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', flexWrap: 'wrap' }}>
                        {bench.map(p => <DreamPlayer key={p.id} player={p} isSub={true} />)}
                    </div>
                </div>
            </>
        );
    };

    return (
        <div style={{ padding: isMobile ? '10px' : '20px', background: '#f5f7fa', minHeight: '100vh', direction: 'rtl' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '10px' }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'white', border: 'none', padding: '8px', borderRadius: '50%', boxShadow:'0 2px 5px rgba(0,0,0,0.1)' }}><FaArrowLeft /></button>
                <h2 style={{ margin: 0, color: '#38003c', fontSize: isMobile ? '18px' : '24px' }}>🏆 مركز الجوائز</h2>
            </div>

            {/* أزرار التبويبات - إضافة تمرير جانبي للهاتف */}
            <div style={{ display: 'flex', justifyContent: isMobile ? 'flex-start' : 'center', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
                {['gameweek', 'month', 'season', 'form'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ 
                        padding: '8px 15px', borderRadius: '20px', border: 'none', 
                        background: activeTab === tab ? '#38003c' : 'white', 
                        color: activeTab === tab ? 'white' : '#333', 
                        fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '13px'
                    }}>
                        {tab === 'gameweek' ? '🌟 الجولة' : tab === 'month' ? '📅 الشهر' : tab === 'season' ? '👑 الموسم' : '📊 الفورمة'}
                    </button>
                ))}
            </div>

            {loading ? <div style={{textAlign:'center', padding:'50px'}}>جاري التحليل...</div> : (
                <>
                    {(activeTab === 'gameweek' || activeTab === 'season' || activeTab === 'month') && (
                        <div>
                             {activeTab === 'gameweek' && (
                                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                    <button onClick={() => setGw(g => Math.max(1, g - 1))} style={{border:'none', background:'none', fontSize:'20px'}}>◀</button>
                                    <span style={{margin:'0 10px', background:'#e0e0e0', padding:'5px 15px', borderRadius:'10px', fontWeight:'bold'}}>GW {gw}</span>
                                    <button onClick={() => setGw(g => Math.min(38, g + 1))} style={{border:'none', background:'none', fontSize:'20px'}}>▶</button>
                                </div>
                            )}

                            {activeTab === 'month' && monthsList.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
                                    <button onClick={() => changeMonth(-1)} disabled={selectedMonthIndex === 0} style={{ opacity: selectedMonthIndex === 0 ? 0.3 : 1 }}><FaChevronRight /></button>
                                    <select value={selectedMonthIndex} onChange={(e) => setSelectedMonthIndex(Number(e.target.value))} style={{ padding: '5px', borderRadius: '8px' }}>
                                        {monthsList.map((m, i) => <option key={i} value={i}>{m.name}</option>)}
                                    </select>
                                    <button onClick={() => changeMonth(1)} disabled={selectedMonthIndex === monthsList.length - 1} style={{ opacity: selectedMonthIndex === monthsList.length - 1 ? 0.3 : 1 }}><FaChevronLeft /></button>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div style={{ background: 'white', padding: '15px', borderRadius: '15px', textAlign: 'center', borderTop: '5px solid #00c853' }}>
                                    <FaTrophy color="#00c853" size={30} />
                                    <h4 style={{ margin: '5px 0' }}>البطل</h4>
                                    {awards?.bestTeam ? (
                                        <>
                                            <div style={{ fontWeight: 'bold' }}>{awards.bestTeam.name}</div>
                                            <div style={{ fontSize:'20px', color:'#2e7d32', fontWeight:'bold' }}>{awards.bestTeam.totalScore} pts</div>
                                        </>
                                    ) : '--'}
                                </div>

                                <div style={{ background: 'white', padding: '15px', borderRadius: '15px', textAlign: 'center', borderTop: '5px solid #2979ff' }}>
                                    <FaStar color="#2979ff" size={30} />
                                    <h4 style={{ margin: '5px 0' }}>النجم</h4>
                                    {awards?.bestPlayer ? (
                                        <>
                                            <div style={{ fontWeight: 'bold' }}>{awards.bestPlayer.name}</div>
                                            <div style={{ fontSize:'20px', color:'#1565c0', fontWeight:'bold' }}>{awards.bestPlayer.score} pts</div>
                                        </>
                                    ) : '--'}
                                </div>
                            </div>

                            <h3 style={{ textAlign: 'center', color: '#38003c', fontSize: '16px' }}><TbSoccerField /> تشكيلة الأحلام</h3>
                            <DreamTeamPitch players={awards?.dreamTeam} />
                        </div>
                    )}

                    {activeTab === 'form' && (
                        <div style={{ background: 'white', borderRadius: '15px', padding: '10px', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '300px' }}>
                                <tbody>
                                    {formGuide.map((team, idx) => (
                                        <tr key={team.teamId} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px', fontSize: '13px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <span style={{color:'#999'}}>{idx+1}</span>
                                                    <img src={getLogoUrl(team.logoUrl)} style={{ width: '25px', height: '25px' }} />
                                                    <span style={{ fontWeight: 'bold' }}>{team.teamName}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
                                                    {team.form.map((res, i) => <FormBadge key={i} result={res} />)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AwardsCenter;