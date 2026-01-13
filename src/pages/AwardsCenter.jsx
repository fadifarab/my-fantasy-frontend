import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    FaTrophy, FaMedal, FaStar, FaArrowLeft, FaCrown, FaTshirt, 
    FaCalendarAlt, FaChevronRight, FaChevronLeft, FaChartLine, FaSpinner, FaCog, FaHistory
} from "react-icons/fa";
import { TbSoccerField } from "react-icons/tb";

const AwardsCenter = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('gameweek'); 
    const [gw, setGw] = useState(1); 
    const [awards, setAwards] = useState(null);
    const [statsData, setStatsData] = useState(null);
    const [formGuide, setFormGuide] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [monthsList, setMonthsList] = useState([]);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

    const [tactic, setTactic] = useState('433'); 
    const isAdmin = user?.role === 'admin';

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
        const fetchData = async () => {
            if (!user?.leagueId) return;
            
            if (activeTab === 'gameweek') await fetchAwards('gameweek', gw);
            if (activeTab === 'season') await fetchAwards('season');
            if (activeTab === 'month' && monthsList.length > 0) {
                const range = monthsList[selectedMonthIndex]?.range;
                if (range) await fetchAwards('month', range);
            }
            if (activeTab === 'form') await fetchForm();
            if (activeTab === 'stats') await fetchExtendedStats();
        };
        
        fetchData();
    }, [activeTab, gw, selectedMonthIndex, monthsList, user?.leagueId]);

    const fetchAwards = async (type, range) => {
        setLoading(true);
        try {
            if (!user.leagueId) return; 
            const { data } = await API.get(`/leagues/awards`, {
                params: { leagueId: user.leagueId, type, range }
            });
            setAwards(data);
            if (data.tactic) setTactic(data.tactic);
        } catch (err) { 
            console.error("Error fetching awards:", err); 
            setAwards(null);
        } finally { 
            setLoading(false); 
        }
    };

    const fetchExtendedStats = async () => {
        setStatsLoading(true);
        try {
            if (!user?.leagueId) {
                console.error('No leagueId available');
                return;
            }
            
            const { data } = await API.get('/leagues/extended-stats', {
                params: { leagueId: user.leagueId }
            });
            
            console.log('Stats data received:', data);
            setStatsData(data || {
                bestAttack: { name: '--', stats: { totalFplPoints: 0 } },
                highestGwRecord: { teamName: '--', points: 0, gw: 0 },
                longestUnbeaten: { teamName: '--', maxUnbeaten: 0 },
                longestWinStreak: { teamName: '--', maxWinStreak: 0 },
                longestLosing: { teamName: '--', maxLosing: 0 },
                hallOfFame: []
            });
        } catch (err) { 
            console.error('Error fetching stats:', err);
            setStatsData({
                bestAttack: { name: '--', stats: { totalFplPoints: 0 } },
                highestGwRecord: { teamName: '--', points: 0, gw: 0 },
                longestUnbeaten: { teamName: '--', maxUnbeaten: 0 },
                longestWinStreak: { teamName: '--', maxWinStreak: 0 },
                longestLosing: { teamName: '--', maxLosing: 0 },
                hallOfFame: []
            });
        } finally { 
            setStatsLoading(false); 
        }
    };

    const fetchForm = async () => {
        setLoading(true);
        try {
            if (!user.leagueId) return;
            const { data } = await API.get(`/leagues/form-guide`, { 
                params: { leagueId: user.leagueId } 
            });
            setFormGuide(data || []);
        } catch (err) { 
            console.error(err); 
            setFormGuide([]);
        } finally { 
            setLoading(false); 
        }
    };

    const handleTacticChange = async (newTactic) => {
        setTactic(newTactic);
        if (isAdmin && user?.leagueId) {
            try {
                await API.post('/leagues/update-tactic', { 
                    leagueId: user.leagueId, 
                    tactic: newTactic,
                    type: activeTab,
                    range: activeTab === 'gameweek' ? gw.toString() : 
                           activeTab === 'month' ? monthsList[selectedMonthIndex]?.range : 'season'
                });
                const currentRange = activeTab === 'gameweek' ? gw : monthsList[selectedMonthIndex]?.range;
                if (currentRange) {
                    fetchAwards(activeTab, currentRange);
                }
            } catch (e) { 
                console.error("Error updating tactic:", e); 
            }
        }
    };

    const changeMonth = (step) => {
        const newIndex = selectedMonthIndex + step;
        if (newIndex >= 0 && newIndex < monthsList.length) {
            setSelectedMonthIndex(newIndex);
        }
    };

    const FormBadge = ({ result }) => {
        const colors = { 'W': '#00c853', 'D': '#ff9800', 'L': '#d32f2f' };
        return (
            <span style={{ 
                background: colors[result] || '#9e9e9e', 
                color: 'white', 
                width: isMobile ? '22px' : '28px', 
                height: isMobile ? '22px' : '28px', 
                borderRadius: '4px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 'bold', 
                fontSize: isMobile ? '11px' : '13px', 
                margin: '0 2px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                {result}
            </span>
        );
    };

    const KitImage = ({ teamName, size = 60 }) => {
        const kitSrc = `/kits/${teamName || 'default'}.png`;
        return (
            <div style={{ 
                position: 'relative', 
                width: size, 
                height: size, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center' 
            }}>
                <img 
                    src={kitSrc} 
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain', 
                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' 
                    }}
                    onError={(e) => { 
                        e.target.src = '/kits/default.png'; 
                    }} 
                    alt="Kit" 
                />
            </div>
        );
    };

    const DreamPlayer = ({ player, isSub = false, isCenterForward = false }) => {
        const size = isMobile ? 
            (isCenterForward ? 50 : (isSub ? 32 : 42)) : 
            (isCenterForward ? 75 : (isSub ? 50 : 65));
        
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
                            style={{ 
                                position: 'absolute', 
                                top: -8, 
                                right: -4, 
                                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))', 
                                zIndex: 15 
                            }} 
                        />
                    )}
                    {isSub && player?.position === 'GKP' && (
                        <div style={{ 
                            position: 'absolute', 
                            bottom: -2, 
                            left: -2, 
                            background: 'linear-gradient(135deg, #ff9800, #f57c00)', 
                            color: 'white', 
                            fontSize: '8px', 
                            fontWeight: '900', 
                            padding: '1px 3px', 
                            borderRadius: '3px', 
                            border: '1px solid white', 
                            zIndex: 20 
                        }}>
                            GK
                        </div>
                    )}
                </div>
                <div style={{ 
                    background: 'rgba(56, 0, 60, 0.9)', 
                    color: 'white', 
                    fontSize: isMobile ? '9px' : '11px', 
                    padding: '4px 5px', 
                    borderRadius: '4px', 
                    marginTop: '6px', 
                    width: '95%', 
                    textAlign: 'center', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    borderBottom: '2.5px solid #00ff87', 
                    fontWeight: 'bold' 
                }}>
                    {player?.name || '--'}
                </div>
                <div style={{ 
                    background: isSub ? '#555' : 'linear-gradient(180deg, #4caf50, #388e3c)', 
                    color: 'white', 
                    fontSize: isMobile ? '10px' : '13px', 
                    fontWeight: '900', 
                    padding: '2px 10px', 
                    borderRadius: '12px', 
                    marginTop: '4px', 
                    border: '1.5px solid white' 
                }}>
                    {player?.score || '0'}
                </div>
            </div>
        );
    };

    const DreamTeamPitch = ({ players }) => {
        if(!players || players.length === 0) {
            return (
                <div style={{
                    textAlign: 'center', 
                    padding: '50px 20px', 
                    background: '#fff', 
                    borderRadius: '20px',
                    color: '#666'
                }}>
                    ⚽ لا توجد بيانات تشكيلة مثالية
                </div>
            );
        }
        
        const starters = players.filter(p => p.isStarter);
        const bench = players.filter(p => !p.isStarter).sort((a,b) => b.score - a.score);
        const gk = starters.find(p => p.position === 'GKP');
        const def = starters.filter(p => p.position === 'DEF');
        const mid = starters.filter(p => p.position === 'MID');
        let fwd = starters.filter(p => p.position === 'FWD');

        if (fwd.length === 3) {
            const sorted = [...fwd].sort((a, b) => b.score - a.score);
            fwd = [sorted[1], sorted[0], sorted[2]];
        } else if (fwd.length === 2) {
            const sorted = [...fwd].sort((a, b) => b.score - a.score);
            fwd = [sorted[1], sorted[0]];
        }

        return (
            <div className="dream-team-wrapper" style={{ 
                direction: 'ltr', 
                width: '100%', 
                marginBottom: '30px' 
            }}>
                {isAdmin && (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '10px', 
                        marginBottom: '15px', 
                        background: '#fff', 
                        padding: '12px 20px', 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
                        border: '1px solid #eee' 
                    }}>
                        <FaCog className="spin-slow" color="#38003c" />
                        <span style={{ 
                            fontWeight: 'bold', 
                            color: '#38003c', 
                            fontSize: isMobile ? '13px' : '14px' 
                        }}>
                            تكتيك التشكيلة:
                        </span>
                        <select 
                            value={tactic} 
                            onChange={(e) => handleTacticChange(e.target.value)} 
                            style={{ 
                                padding: '6px 12px', 
                                borderRadius: '8px', 
                                border: '2px solid #38003c', 
                                fontWeight: '900', 
                                cursor: 'pointer', 
                                outline: 'none', 
                                background: '#fff', 
                                color: '#38003c',
                                fontSize: isMobile ? '13px' : '14px'
                            }}
                        >
                            {['442', '433', '343', '352', '532', '541'].map(t => (
                                <option key={t} value={t}>
                                    {t.split('').join('-')}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                
                <div style={{ 
                    background: 'linear-gradient(180deg, #1b5e20 0%, #2e7d32 50%, #1b5e20 100%)', 
                    padding: isMobile ? '20px 5px' : '60px 10px', 
                    borderRadius: '20px', 
                    border: '4px solid #ffd700', 
                    minHeight: isMobile ? '380px' : '750px', 
                    position: 'relative', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-around', 
                    alignItems: 'center', 
                    boxShadow: '0 15px 40px rgba(0,0,0,0.4)' 
                }}>
                    <div style={{ 
                        position: 'absolute', 
                        inset: '15px', 
                        border: '1.5px solid rgba(255,255,255,0.2)', 
                        pointerEvents: 'none' 
                    }}></div>
                    <div style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: 0, 
                        right: 0, 
                        height: '1.5px', 
                        background: 'rgba(255,255,255,0.2)' 
                    }}></div>
                    <div style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)', 
                        width: isMobile ? '60px' : '160px', 
                        height: isMobile ? '60px' : '160px', 
                        border: '1.5px solid rgba(255,255,255,0.2)', 
                        borderRadius: '50%' 
                    }}></div>
                    <div style={{ 
                        position: 'absolute', 
                        top: '-1px', 
                        left: '50%', 
                        transform: 'translateX(-50%)', 
                        width: '45%', 
                        height: '15%', 
                        border: '1.5px solid rgba(255,255,255,0.2)', 
                        borderTop: 'none' 
                    }}></div>
                    <div style={{ 
                        position: 'absolute', 
                        bottom: '-1px', 
                        left: '50%', 
                        transform: 'translateX(-50%)', 
                        width: '45%', 
                        height: '15%', 
                        border: '1.5px solid rgba(255,255,255,0.2)', 
                        borderBottom: 'none' 
                    }}></div>
                    
                    <DreamPlayer player={gk} />
                    
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: isMobile ? '4px' : '20px', 
                        width: '100%', 
                        flexWrap: 'wrap' 
                    }}>
                        {def.map((p, i) => (
                            <DreamPlayer key={p.id || p._id || i} player={p} />
                        ))}
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: isMobile ? '4px' : '20px', 
                        width: '100%', 
                        flexWrap: 'wrap' 
                    }}>
                        {mid.map((p, i) => (
                            <DreamPlayer key={p.id || p._id || i} player={p} />
                        ))}
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: isMobile ? '8px' : '40px', 
                        width: '100%', 
                        flexWrap: 'wrap' 
                    }}>
                        {fwd.map((p, idx) => (
                            <DreamPlayer 
                                key={p.id || p._id || idx} 
                                player={p} 
                                isCenterForward={
                                    fwd.length === 3 ? idx === 1 : 
                                    (fwd.length === 2 ? idx === 1 : true)
                                } 
                            />
                        ))}
                    </div>
                </div>
                
                {bench.length > 0 && (
                    <div style={{ 
                        background: '#fff', 
                        padding: '15px', 
                        borderRadius: '20px', 
                        marginTop: '15px', 
                        boxShadow: '0 8px 25px rgba(0,0,0,0.08)', 
                        textAlign: 'center', 
                        border: '1px solid #eee' 
                    }}>
                        <h4 style={{ 
                            margin: '0 0 12px 0', 
                            fontSize: isMobile ? '14px' : '15px', 
                            color: '#38003c', 
                            fontWeight: '900' 
                        }}>
                            🛋️ دكة البدلاء المثالية
                        </h4>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: isMobile ? '6px' : '20px', 
                            flexWrap: 'nowrap', 
                            overflowX: 'auto', 
                            paddingBottom: '10px',
                            WebkitOverflowScrolling: 'touch'
                        }}>
                            {bench.map((p, i) => {
                                const isLeast = i === bench.length - 1 && bench.length > 1;
                                return (
                                    <div 
                                        key={p.id || p._id || i} 
                                        style={{ 
                                            paddingLeft: isLeast ? (isMobile ? '10px' : '30px') : '0', 
                                            borderLeft: isLeast ? '2px dashed #ddd' : 'none' 
                                        }}
                                    >
                                        <DreamPlayer player={p} isSub={true} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const StatCard = ({ title, name, value, subText, icon, color = "#38003c" }) => (
        <div style={{ 
            background: '#fff', 
            padding: isMobile ? '15px' : '20px', 
            borderRadius: '15px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)', 
            textAlign: 'center', 
            borderRight: `6px solid ${color}`,
            minHeight: isMobile ? '130px' : '150px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
        }}>
            <div style={{ marginBottom: '8px' }}>{icon}</div>
            <div style={{ 
                fontSize: isMobile ? '11px' : '12px', 
                color: '#666', 
                fontWeight: 'bold' 
            }}>
                {title}
            </div>
            <div style={{ 
                fontSize: isMobile ? '15px' : '18px', 
                fontWeight: '900', 
                color: '#333', 
                margin: '5px 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>
                {name || '--'}
            </div>
            <div style={{ 
                fontSize: isMobile ? '18px' : '20px', 
                color: color, 
                fontWeight: '900' 
            }}>
                {value || '0'} <small style={{ fontSize: '12px' }}>{subText}</small>
            </div>
        </div>
    );

    return (
        <div style={{ 
            padding: isMobile ? '12px' : '30px', 
            background: '#f8f9fb', 
            minHeight: '100vh', 
            direction: 'rtl',
            paddingBottom: isMobile ? '80px' : '40px'
        }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px', 
                gap: '12px' 
            }}>
                <button 
                    onClick={() => navigate('/dashboard')} 
                    style={{ 
                        background: '#fff', 
                        border: '1px solid #eee', 
                        width: isMobile ? '40px' : '45px', 
                        height: isMobile ? '40px' : '45px', 
                        borderRadius: '12px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#38003c',
                        flexShrink: 0
                    }}
                >
                    <FaArrowLeft size={20} />
                </button>
                <h1 style={{ 
                    margin: 0, 
                    color: '#38003c', 
                    fontSize: isMobile ? '20px' : '32px', 
                    fontWeight: '900',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    🏆 مركز الجوائز
                </h1>
            </div>

            {/* شريط التبويبات المحسن */}
            <div className="tab-container" style={{ 
                display: 'flex',
                overflowX: 'auto',
                marginBottom: '20px',
                background: '#fff',
                padding: '10px 8px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                {['gameweek', 'month', 'season', 'stats', 'form'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{ 
                            flex: '0 0 auto',
                            padding: isMobile ? '10px 14px' : '12px 18px',
                            margin: '0 4px',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeTab === tab ? '#38003c' : 'transparent',
                            color: activeTab === tab ? '#00ff87' : '#555',
                            fontSize: isMobile ? '13px' : '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: isMobile ? '85px' : '100px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {getTabIcon(tab)} 
                        <span style={{ marginRight: '6px' }}>
                            {tab === 'gameweek' ? 'جولة' : 
                             tab === 'month' ? 'شهر' : 
                             tab === 'season' ? 'موسم' : 
                             tab === 'stats' ? 'إحصائيات' : 'فورمة'}
                        </span>
                    </button>
                ))}
            </div>

            {loading && activeTab !== 'stats' ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '80px 20px' 
                }}>
                    <FaSpinner className="spin" size={40} color="#38003c" />
                    <p style={{ 
                        marginTop: '20px', 
                        color: '#666',
                        fontSize: isMobile ? '14px' : '16px'
                    }}>
                        جاري تحميل البيانات...
                    </p>
                </div>
            ) : (
                <div className="content-area">
                    {(activeTab === 'gameweek' || activeTab === 'month' || activeTab === 'season') && (
                        <>
                            {activeTab === 'gameweek' && (
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: isMobile ? '10px' : '20px', 
                                    marginBottom: '25px' 
                                }}>
                                    <button 
                                        onClick={() => setGw(g => Math.max(1, g - 1))} 
                                        style={{ 
                                            background: '#fff', 
                                            border: '1px solid #eee', 
                                            width: isMobile ? '36px' : '40px', 
                                            height: isMobile ? '36px' : '40px', 
                                            borderRadius: '50%', 
                                            cursor: 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}
                                    >
                                        <FaChevronRight />
                                    </button>
                                    <div style={{ 
                                        background: 'linear-gradient(135deg, #38003c, #5c0062)', 
                                        color: '#00ff87', 
                                        padding: isMobile ? '8px 20px' : '10px 40px', 
                                        borderRadius: '14px', 
                                        fontWeight: '900', 
                                        fontSize: isMobile ? '16px' : '20px', 
                                        minWidth: isMobile ? '140px' : '160px', 
                                        textAlign: 'center',
                                        flexShrink: 0
                                    }}>
                                        الجولة {gw}
                                    </div>
                                    <button 
                                        onClick={() => setGw(g => Math.min(38, g + 1))} 
                                        style={{ 
                                            background: '#fff', 
                                            border: '1px solid #eee', 
                                            width: isMobile ? '36px' : '40px', 
                                            height: isMobile ? '36px' : '40px', 
                                            borderRadius: '50%', 
                                            cursor: 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}
                                    >
                                        <FaChevronLeft />
                                    </button>
                                </div>
                            )}
                            
                            {activeTab === 'month' && monthsList.length > 0 && (
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: isMobile ? '8px' : '15px', 
                                    marginBottom: '25px' 
                                }}>
                                    <button 
                                        onClick={() => changeMonth(-1)} 
                                        disabled={selectedMonthIndex === 0}
                                        style={{ 
                                            background: '#fff', 
                                            width: isMobile ? '36px' : '40px', 
                                            height: isMobile ? '36px' : '40px', 
                                            borderRadius: '50%', 
                                            cursor: selectedMonthIndex === 0 ? 'default' : 'pointer', 
                                            opacity: selectedMonthIndex === 0 ? 0.3 : 1, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            border: 'none',
                                            flexShrink: 0
                                        }}
                                    >
                                        <FaChevronRight />
                                    </button>
                                    <div style={{ 
                                        textAlign: 'center', 
                                        background: 'white', 
                                        padding: isMobile ? '10px 20px' : '12px 30px', 
                                        borderRadius: '16px', 
                                        border: '2px solid #38003c', 
                                        minWidth: isMobile ? '180px' : '220px',
                                        flexShrink: 0
                                    }}>
                                        <div style={{ 
                                            fontWeight: '900', 
                                            color: '#38003c', 
                                            fontSize: isMobile ? '16px' : '18px' 
                                        }}>
                                            {monthsList[selectedMonthIndex]?.name || '--'}
                                        </div>
                                        <div style={{ 
                                            fontSize: isMobile ? '11px' : '12px', 
                                            color: '#666', 
                                            fontWeight: 'bold',
                                            marginTop: '4px'
                                        }}>
                                            ج {monthsList[selectedMonthIndex]?.range?.replace(',', ' - ') || '--'}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => changeMonth(1)} 
                                        disabled={selectedMonthIndex === monthsList.length - 1}
                                        style={{ 
                                            background: '#fff', 
                                            width: isMobile ? '36px' : '40px', 
                                            height: isMobile ? '36px' : '40px', 
                                            borderRadius: '50%', 
                                            cursor: selectedMonthIndex === monthsList.length - 1 ? 'default' : 'pointer', 
                                            opacity: selectedMonthIndex === monthsList.length - 1 ? 0.3 : 1, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            border: 'none',
                                            flexShrink: 0
                                        }}
                                    >
                                        <FaChevronLeft />
                                    </button>
                                </div>
                            )}
                            
                            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                                    gap: '15px', 
                                    marginBottom: '20px' 
                                }}>
                                    <StatCard 
                                        title={activeTab === 'season' ? 'بطل الموسم' : 'فريق الفترة'} 
                                        name={awards?.bestTeam?.name} 
                                        value={awards?.bestTeam?.totalScore} 
                                        subText="نقطة" 
                                        icon={<FaTrophy size={isMobile ? 22 : 25} color="#00c853"/>} 
                                        color="#00c853" 
                                    />
                                    <StatCard 
                                        title="لاعب الفترة (MVP)" 
                                        name={awards?.bestPlayer?.name} 
                                        value={awards?.bestPlayer?.score} 
                                        subText="نقطة" 
                                        icon={<FaStar size={isMobile ? 22 : 25} color="#2979ff"/>} 
                                        color="#2979ff" 
                                    />
                                </div>
                                
                                {awards?.dreamTeam ? (
                                    <DreamTeamPitch players={awards.dreamTeam} />
                                ) : (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '60px 20px', 
                                        background: '#fff', 
                                        borderRadius: '20px',
                                        color: '#666'
                                    }}>
                                        ⚽ لا توجد بيانات للفترة المحددة
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* تبويب الإحصائيات */}
                    {activeTab === 'stats' && (
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            {statsLoading ? (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '80px 20px',
                                    background: '#fff',
                                    borderRadius: '20px'
                                }}>
                                    <FaSpinner className="spin" size={40} color="#38003c" />
                                    <p style={{ 
                                        marginTop: '20px', 
                                        color: '#666',
                                        fontSize: isMobile ? '14px' : '16px'
                                    }}>
                                        جاري تحميل الإحصائيات...
                                    </p>
                                </div>
                            ) : statsData ? (
                                <>
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', 
                                        gap: '15px', 
                                        marginBottom: '25px' 
                                    }}>
                                        <StatCard 
                                            title="الأعلى جمعاً للنقاط (أفضل هجوم)" 
                                            name={statsData.bestAttack?.name} 
                                            value={statsData.bestAttack?.stats?.totalFplPoints} 
                                            subText="نقطة FPL" 
                                            icon={<FaTshirt color="#38003c" size={isMobile ? 22 : 25}/>} 
                                        />
                                        <StatCard 
                                            title="أعلى نقاط في جولة واحدة" 
                                            name={statsData.highestGwRecord?.teamName} 
                                            value={statsData.highestGwRecord?.points} 
                                            subText={`جولة ${statsData.highestGwRecord?.gw || '--'}`} 
                                            icon={<FaStar color="#ffd700" size={isMobile ? 22 : 25}/>} 
                                            color="#ffd700" 
                                        />
                                        <StatCard 
                                            title="أطول سلسلة دون هزيمة" 
                                            name={statsData.longestUnbeaten?.teamName} 
                                            value={statsData.longestUnbeaten?.maxUnbeaten} 
                                            subText="مباريات" 
                                            icon={<FaMedal color="#00c853" size={isMobile ? 22 : 25}/>} 
                                            color="#00c853" 
                                        />
                                        <StatCard 
                                            title="أطول سلسلة انتصارات" 
                                            name={statsData.longestWinStreak?.teamName} 
                                            value={statsData.longestWinStreak?.maxWinStreak} 
                                            subText="فوز متتالي" 
                                            icon={<FaTrophy color="#ff9800" size={isMobile ? 22 : 25}/>} 
                                            color="#ff9800" 
                                        />
                                        <StatCard 
                                            title="أطول سلسلة هزائم" 
                                            name={statsData.longestLosing?.teamName} 
                                            value={statsData.longestLosing?.maxLosing} 
                                            subText="خسارة متتالية" 
                                            icon={<FaHistory color="#d32f2f" size={isMobile ? 22 : 25}/>} 
                                            color="#d32f2f" 
                                        />
                                    </div>

                                    {/* قاعة المشاهير */}
                                    {statsData.hallOfFame && statsData.hallOfFame.length > 0 ? (
                                        <div style={{ 
                                            background: '#fff', 
                                            padding: isMobile ? '18px' : '25px', 
                                            borderRadius: '20px', 
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)', 
                                            border: '1px solid #eee' 
                                        }}>
                                            <h3 style={{ 
                                                margin: '0 0 18px 0', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '10px', 
                                                color: '#38003c', 
                                                fontWeight: '900',
                                                fontSize: isMobile ? '16px' : '18px'
                                            }}>
                                                ⭐ قاعة المشاهير (الأكثر ظهوراً في تشكيلة الأسبوع)
                                            </h3>
                                            <div style={{ 
                                                display: 'grid', 
                                                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', 
                                                gap: '12px' 
                                            }}>
                                                {statsData.hallOfFame.map((player, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        style={{ 
                                                            background: '#f8f9fb', 
                                                            padding: '15px', 
                                                            borderRadius: '12px', 
                                                            textAlign: 'center', 
                                                            borderBottom: '4px solid #ffd700', 
                                                            transition: '0.3s' 
                                                        }}
                                                    >
                                                        <div style={{ 
                                                            fontWeight: '900', 
                                                            color: '#333',
                                                            fontSize: isMobile ? '14px' : '15px',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {player.name}
                                                        </div>
                                                        <div style={{ 
                                                            fontSize: isMobile ? '11px' : '12px', 
                                                            color: '#666', 
                                                            marginTop: '5px',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {player.teamName}
                                                        </div>
                                                        <div style={{ 
                                                            background: '#38003c', 
                                                            color: '#00ff87', 
                                                            display: 'inline-block', 
                                                            padding: '3px 12px', 
                                                            borderRadius: '10px', 
                                                            fontSize: isMobile ? '10px' : '11px', 
                                                            marginTop: '10px', 
                                                            fontWeight: 'bold' 
                                                        }}>
                                                            {player.count} مرات ظهور
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ 
                                            textAlign: 'center', 
                                            padding: '50px 20px', 
                                            background: '#fff', 
                                            borderRadius: '20px',
                                            color: '#666'
                                        }}>
                                            لا توجد بيانات للمشاهير بعد
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '60px 20px', 
                                    background: '#fff', 
                                    borderRadius: '20px' 
                                }}>
                                    <p style={{ color: '#d32f2f', marginBottom: '20px' }}>
                                        حدث خطأ في تحميل الإحصائيات
                                    </p>
                                    <button 
                                        onClick={fetchExtendedStats}
                                        style={{ 
                                            padding: '10px 24px', 
                                            background: '#38003c', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '8px', 
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '14px'
                                        }}
                                    >
                                        إعادة المحاولة
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* تبويب الفورمة */}
                    {activeTab === 'form' && (
                        <div style={{ 
                            background: 'white', 
                            borderRadius: '20px', 
                            padding: isMobile ? '15px' : '25px', 
                            boxShadow: '0 10px 40px rgba(0,0,0,0.05)', 
                            maxWidth: '900px', 
                            margin: '0 auto' 
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                marginBottom: '20px', 
                                borderBottom: '3px solid #38003c', 
                                paddingBottom: '12px' 
                            }}>
                                <FaChartLine color="#38003c" size={isMobile ? 20 : 24} />
                                <h3 style={{ 
                                    margin: 0, 
                                    fontSize: isMobile ? '16px' : '20px', 
                                    fontWeight: '900' 
                                }}>
                                    سجل فورمة الفرق (آخر 5 مواجهات)
                                </h3>
                            </div>
                            
                            {formGuide.length > 0 ? (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ 
                                        width: '100%', 
                                        borderCollapse: 'separate', 
                                        borderSpacing: '0 8px' 
                                    }}>
                                        <tbody>
                                            {formGuide.map((team, idx) => (
                                                <tr key={team.teamId} style={{ background: '#fcfcfe' }}>
                                                    <td style={{ 
                                                        padding: isMobile ? '12px 8px' : '15px', 
                                                        fontWeight: '900', 
                                                        color: '#38003c', 
                                                        fontSize: isMobile ? '16px' : '18px', 
                                                        width: '40px',
                                                        textAlign: 'center' 
                                                    }}>
                                                        {idx + 1}
                                                    </td>
                                                    <td style={{ padding: isMobile ? '12px 8px' : '15px' }}>
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '10px' 
                                                        }}>
                                                            <img 
                                                                src={getLogoUrl(team.logoUrl)} 
                                                                style={{ 
                                                                    width: isMobile ? '30px' : '35px', 
                                                                    height: isMobile ? '30px' : '35px', 
                                                                    objectFit: 'contain' 
                                                                }} 
                                                                alt="logo" 
                                                            />
                                                            <span style={{ 
                                                                fontWeight: 'bold', 
                                                                fontSize: isMobile ? '14px' : '16px',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}>
                                                                {team.teamName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ 
                                                        padding: isMobile ? '12px 8px' : '15px', 
                                                        textAlign: 'center',
                                                        width: '150px'
                                                    }}>
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            justifyContent: 'center', 
                                                            flexDirection: 'row-reverse', 
                                                            gap: '4px' 
                                                        }}>
                                                            {team.form?.map((res, i) => (
                                                                <FormBadge key={i} result={res} />
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '50px 20px', 
                                    color: '#666' 
                                }}>
                                    لا توجد بيانات فورمة متاحة
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                .spin-slow { animation: spin 4s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                
                /* إخفاء شريط التمرير في Chrome/Safari */
                .tab-container::-webkit-scrollbar {
                    display: none;
                }
                
                @media (max-width: 768px) {
                    .dream-team-wrapper {
                        transform: scale(0.95);
                        transform-origin: top center;
                        margin: 0 -10px;
                        overflow-x: hidden;
                    }
                }
                
                @media (max-width: 480px) {
                    .dream-team-wrapper {
                        transform: scale(0.9);
                    }
                }
            `}</style>
        </div>
    );
};

const getTabIcon = (tab) => {
    const size = 16;
    switch(tab) {
        case 'gameweek': return <TbSoccerField size={size} style={{ marginLeft: '6px' }} />;
        case 'month': return <FaCalendarAlt size={size} style={{ marginLeft: '6px' }} />;
        case 'season': return <FaTrophy size={size} style={{ marginLeft: '6px' }} />;
        case 'stats': return <FaChartLine size={size} style={{ marginLeft: '6px' }} />;
        case 'form': return <FaChartLine size={size} style={{ marginLeft: '6px' }} />;
        default: return null;
    }
};

export default AwardsCenter;