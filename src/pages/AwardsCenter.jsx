// client/src/pages/AwardsCenter.jsx
import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaTrophy, FaMedal, FaStar, FaArrowLeft, FaCrown, FaTshirt, FaCalendarAlt, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { TbSoccerField } from "react-icons/tb";

const AwardsCenter = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    // التبويبات: gameweek, month, season, form
    const [activeTab, setActiveTab] = useState('gameweek'); 
    
    const [gw, setGw] = useState(1); 
    const [awards, setAwards] = useState(null);
    const [formGuide, setFormGuide] = useState([]);
    const [loading, setLoading] = useState(false);

    // القائمة الديناميكية للأشهر
    const [monthsList, setMonthsList] = useState([]);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

    const getLogoUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
        return `${baseUrl}${url.replace(/\\/g, '/')}`;
    };

    // 1. التهيئة (جلب الجولة الحالية + جدول الأشهر)
    useEffect(() => {
        const init = async () => {
            try {
                // جلب حالة الجولة الحالية
                const statusRes = await API.get('/gameweek/status');
                const currentGwId = statusRes.data.id || 1;
                
                // ✅ تعديل: عرض الجولة الحالية مباشرة بدلاً من السابقة
                setGw(currentGwId); 

                // جلب جدول الأشهر
                const scheduleRes = await API.get('/leagues/schedule');
                const schedule = scheduleRes.data;
                setMonthsList(schedule);
                
                // تحديد الشهر الحالي تلقائياً
                if(schedule.length > 0) {
                    const currentMonthIdx = schedule.findIndex(m => {
                        const [start, end] = m.range.split(',').map(Number);
                        return currentGwId >= start && currentGwId <= end;
                    });
                    
                    if (currentMonthIdx !== -1) {
                        setSelectedMonthIndex(currentMonthIdx);
                    } else {
                        setSelectedMonthIndex(schedule.length - 1);
                    }
                }

            } catch (e) { console.error(e); }
        };
        init();
    }, []);

    // 2. جلب البيانات عند التغيير
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
        if (newIndex >= 0 && newIndex < monthsList.length) {
            setSelectedMonthIndex(newIndex);
        }
    };

    const FormBadge = ({ result }) => {
        let color = '#9e9e9e'; 
        if (result === 'W') color = '#00c853'; 
        if (result === 'L') color = '#d32f2f'; 
        return <span style={{ background: color, color: 'white', width: '25px', height: '25px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', margin: '0 2px' }}>{result}</span>;
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
        const size = isCenterForward ? 70 : (isSub ? 45 : 55);
        return (
            <div style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px', position: 'relative', margin: '0 2px',
                transform: isCenterForward ? 'translateY(25px)' : 'none', 
                zIndex: isCenterForward ? 10 : 1
            }}>
                <div style={{ position: 'relative' }}>
                    <KitImage teamName={player.teamName} size={size} />
                    {player.isCaptain && <FaCrown color="#ffd700" size={isCenterForward ? 22 : 18} style={{ position: 'absolute', top: -12, right: -5, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))', zIndex: 10 }} />}
                </div>
                <div style={{ background: '#38003c', color: 'white', fontSize: '9px', padding: '3px 6px', borderRadius: '4px', marginTop: '5px', width: '100%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderBottom: `2px solid ${player.score >= 80 ? '#00e676' : '#fff'}` }}>
                    {player.name}
                </div>
                <div style={{ background: isSub ? '#bdbdbd' : '#4caf50', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '1px 8px', borderRadius: '10px', marginTop: '3px', border: '1px solid white' }}>
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

        let displayFwd = [...fwd];
        if (fwd.length === 3) displayFwd = [fwd[1], fwd[0], fwd[2]];

        const Row = ({ rowPlayers, isForwardLine = false }) => (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '20px', zIndex: 5, width: '100%' }}>
                {rowPlayers.map((p, idx) => {
                    const isCenter = isForwardLine && rowPlayers.length === 3 && idx === 1;
                    return <DreamPlayer key={p.id} player={p} isCenterForward={isCenter} />;
                })}
            </div>
        );

        return (
            <>
                {/* الحاوية الخارجية مع خاصية التمرير للموبايل */}
                <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '10px 0' }}>
                    <div style={{ 
                        background: 'linear-gradient(180deg, #1b5e20 0%, #2e7d32 50%, #1b5e20 100%)', 
                        padding: '20px 10px 40px 10px', 
                        borderRadius: '15px', border: '4px solid #ffd700', 
                        margin: '20px auto', minHeight: '700px', minWidth: '350px', maxWidth: '600px', position: 'relative', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px', border: '2px solid rgba(255,255,255,0.4)', pointerEvents: 'none' }}></div>
                        <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', background: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}></div>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '120px', height: '120px', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}></div>

                        <div style={{ marginTop: '30px', zIndex: 5 }}>{gk && <DreamPlayer player={gk} />}</div>
                        <Row rowPlayers={def} />
                        <Row rowPlayers={mid} />
                        <Row rowPlayers={displayFwd} isForwardLine={true} />
                    </div>
                </div>

                <div style={{ background: 'white', padding: '15px', borderRadius: '15px', borderTop: '5px solid #38003c', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                    <h4 style={{ margin: '0 0 15px 0', textAlign: 'center', color: '#555' }}>دكة الاحتياط</h4>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                        {bench.map(p => <DreamPlayer key={p.id} player={p} isSub={true} />)}
                    </div>
                </div>
            </>
        );
    };

    return (
        <div style={{ padding: '20px', background: '#f5f7fa', minHeight: '100vh', fontFamily: 'Arial', direction: 'rtl' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'white', border: 'none', padding: '10px', borderRadius: '50%', cursor:'pointer', boxShadow:'0 2px 5px rgba(0,0,0,0.1)' }}><FaArrowLeft /></button>
                <h1 style={{ margin: 0, color: '#38003c', fontSize: '24px', fontWeight: 'bold' }}>🏆 مركز الجوائز</h1>
            </div>

            {/* Tab Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
                {['gameweek', 'month', 'season', 'form'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: activeTab === tab ? '#38003c' : 'white', color: activeTab === tab ? 'white' : '#333', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        {tab === 'gameweek' ? '🌟 الجولة' : tab === 'month' ? '📅 الشهر' : tab === 'season' ? '👑 الموسم' : '📊 الفورمة'}
                    </button>
                ))}
            </div>

            {loading ? <div style={{textAlign:'center', padding:'50px', fontSize: '18px'}}>جاري تحليل البيانات...</div> : (
                <>
                    {(activeTab === 'gameweek' || activeTab === 'season' || activeTab === 'month') && (
                        <div>
                             {activeTab === 'gameweek' && (
                                <div style={{ textAlign: 'center', marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>
                                    <button onClick={() => setGw(g => Math.max(1, g - 1))} style={{border:'none', background:'none', cursor:'pointer', fontSize:'24px', padding: '0 10px'}}>◀</button>
                                    <span style={{margin:'0 15px', background:'#e0e0e0', padding:'5px 20px', borderRadius:'10px'}}>GW {gw}</span>
                                    <button onClick={() => setGw(g => Math.min(38, g + 1))} style={{border:'none', background:'none', cursor:'pointer', fontSize:'24px', padding: '0 10px'}}>▶</button>
                                </div>
                            )}

                            {activeTab === 'month' && monthsList.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
                                    <button onClick={() => changeMonth(-1)} disabled={selectedMonthIndex === 0} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '50%', padding: '10px', cursor: 'pointer' }}><FaChevronRight /></button>
                                    <select value={selectedMonthIndex} onChange={(e) => setSelectedMonthIndex(Number(e.target.value))} style={{ padding: '10px', borderRadius: '10px', border: '2px solid #38003c', fontSize: '16px', fontWeight: 'bold' }}>
                                        {monthsList.map((m, i) => ( <option key={i} value={i}>{m.name}</option> ))}
                                    </select>
                                    <button onClick={() => changeMonth(1)} disabled={selectedMonthIndex === monthsList.length - 1} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '50%', padding: '10px', cursor: 'pointer' }}><FaChevronLeft /></button>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', textAlign: 'center', borderTop: '5px solid #00c853', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                    <FaTrophy size={35} color="#00c853" />
                                    <h3 style={{ margin: '10px 0' }}>{activeTab === 'month' ? 'بطل الشهر' : activeTab === 'season' ? 'بطل الموسم' : 'بطل الجولة'}</h3>
                                    {awards?.bestTeam ? (
                                        <div>
                                            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{awards.bestTeam.name}</div>
                                            <div style={{ fontSize:'24px', color:'#2e7d32', fontWeight:'bold' }}>{awards.bestTeam.totalScore} pts</div>
                                        </div>
                                    ) : <p>--</p>}
                                </div>

                                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', textAlign: 'center', borderTop: '5px solid #2979ff', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                    <FaStar size={35} color="#2979ff" />
                                    <h3 style={{ margin: '10px 0' }}>{activeTab === 'month' ? 'نجم الشهر' : 'نجم الجولة'}</h3>
                                    {awards?.bestPlayer ? (
                                        <div>
                                            <div style={{ display:'flex', justifyContent:'center', margin:'10px 0' }}><KitImage teamName={awards.bestPlayer.teamName} size={60} /></div>
                                            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{awards.bestPlayer.name}</div>
                                            <div style={{ fontSize:'24px', color:'#1565c0', fontWeight:'bold' }}>{awards.bestPlayer.score} pts</div>
                                        </div>
                                    ) : <p>--</p>}
                                </div>
                            </div>

                            <DreamTeamPitch players={awards?.dreamTeam} />
                        </div>
                    )}

                    {activeTab === 'form' && (
                        <div style={{ background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                            <h3 style={{ borderBottom: '2px solid #38003c', paddingBottom: '10px', fontSize: '20px' }}>📊 سجل الفورمة</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '450px' }}>
                                <tbody>
                                    {formGuide.map((team) => (
                                        <tr key={team.teamId} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <img src={getLogoUrl(team.logoUrl)} style={{ width: '35px', height: '35px', objectFit: 'contain' }} />
                                                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{team.teamName}</span>
                                            </td>
                                            <td style={{ padding: '15px', textAlign: 'left' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-start', flexDirection: 'row-reverse' }}>
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