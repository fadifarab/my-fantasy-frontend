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

    // ✅ اكتشاف نوع الشاشة للتجاوب
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
        // تعديل الرابط ليعمل على البيئة السحابية والمحلية
        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
        return `${baseUrl}${url.replace(/\\/g, '/')}`;
    };

    // 1. التهيئة (تم تعديل المنطق ليعرض الجولة الحالية مباشرة ✅)
    useEffect(() => {
        const init = async () => {
            try {
                const statusRes = await API.get('/gameweek/status');
                const currentGwId = statusRes.data.id || 1;
                
                // ✅ عرض الجولة الحالية أولاً كما طلبت
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

    // 2. جلب البيانات
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
            <div style={{ 
                position: 'relative', 
                width: size, 
                height: size, 
                display: 'flex', 
                justifyContent: 'center' 
            }}>
                <img 
                    src={kitSrc} 
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain', 
                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' 
                    }}
                    onError={(e) => { e.target.src = '/kits/default.png'; }} 
                    alt={`Kit for ${teamName}`}
                />
            </div>
        );
    };

    const DreamPlayer = ({ player, isSub = false, isCenterForward = false }) => {
        const getSize = () => {
            if (isMobile) {
                if (isCenterForward) return 50;
                if (isSub) return 30;
                return 40;
            }
            if (isTablet) {
                if (isCenterForward) return 65;
                if (isSub) return 45;
                return 55;
            }
            if (isCenterForward) return 75;
            if (isSub) return 50;
            return 65;
        };

        const getContainerWidth = () => {
            if (isMobile) return '60px';
            if (isTablet) return '75px';
            return '90px';
        };

        const size = getSize();
        const containerWidth = getContainerWidth();

        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                width: containerWidth, 
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
                            size={isMobile ? 12 : isTablet ? 16 : 20} 
                            style={{ 
                                position: 'absolute', 
                                top: -8, 
                                right: -4, 
                                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' 
                            }} 
                        />
                    )}
                </div>
                <div style={{ 
                    background: '#38003c', 
                    color: 'white', 
                    fontSize: isMobile ? '8px' : isTablet ? '9px' : '10px', 
                    padding: '2px 4px', 
                    borderRadius: '4px', 
                    marginTop: '4px', 
                    width: '100%', 
                    textAlign: 'center', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    borderBottom: '2px solid #00ff87' 
                }}>
                    {player?.name || '--'}
                </div>
                <div style={{ 
                    background: isSub ? '#777' : '#4caf50', 
                    color: 'white', 
                    fontSize: isMobile ? '9px' : isTablet ? '10px' : '12px', 
                    fontWeight: 'bold', 
                    padding: '0 6px', 
                    borderRadius: '10px', 
                    marginTop: '2px', 
                    border: '1px solid white',
                    minWidth: isMobile ? '25px' : '30px'
                }}>
                    {player?.score || '0'}
                </div>
            </div>
        );
    };

    const DreamTeamPitch = ({ players }) => {
        if(!players || players.length === 0) return (
            <div style={{
                textAlign:'center', 
                padding:'40px', 
                background:'#fff', 
                borderRadius:'15px',
                fontSize: isMobile ? '14px' : '16px'
            }}>
                لا توجد بيانات لهذه الفترة بعد
            </div>
        );
        
        const starters = players.filter(p => p.isStarter);
        const bench = players.filter(p => !p.isStarter);
        const gk = starters.find(p => p.position === 'GKP');
        const def = starters.filter(p => p.position === 'DEF');
        const mid = starters.filter(p => p.position === 'MID');
        const fwd = starters.filter(p => p.position === 'FWD');

        const getPlayerGap = () => {
            if (isMobile) return '5px';
            if (isTablet) return '10px';
            return '20px';
        };

        const getForwardGap = () => {
            if (isMobile) return '8px';
            if (isTablet) return '15px';
            return '30px';
        };

        const getPitchPadding = () => {
            if (isMobile) return '15px 5px';
            if (isTablet) return '30px 10px';
            return '40px 10px';
        };

        const getPitchMinHeight = () => {
            if (isMobile) return '400px';
            if (isTablet) return '550px';
            return '700px';
        };

        return (
            <div className="pitch-container" style={{ direction: 'ltr', width: '100%' }}>
                <div style={{ 
                    background: 'linear-gradient(180deg, #1b5e20 0%, #2e7d32 50%, #1b5e20 100%)', 
                    padding: getPitchPadding(), 
                    borderRadius: '15px', 
                    border: '3px solid #ffd700', 
                    minHeight: getPitchMinHeight(), 
                    position: 'relative', 
                    overflow: 'hidden',
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-around', 
                    alignItems: 'center', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    width: '100%'
                }}>
                    {/* Pitch markings */}
                    <div style={{ 
                        position: 'absolute', 
                        inset: '10px', 
                        border: '1px solid rgba(255,255,255,0.2)', 
                        pointerEvents: 'none' 
                    }}></div>
                    <div style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: 0, 
                        right: 0, 
                        height: '1px', 
                        background: 'rgba(255,255,255,0.2)' 
                    }}></div>
                    
                    <DreamPlayer player={gk} />
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: getPlayerGap(), 
                        width: '100%',
                        flexWrap: 'wrap'
                    }}>
                        {def.map(p => <DreamPlayer key={p.id} player={p} />)}
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: getPlayerGap(), 
                        width: '100%',
                        flexWrap: 'wrap'
                    }}>
                        {mid.map(p => <DreamPlayer key={p.id} player={p} />)}
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: getForwardGap(), 
                        width: '100%',
                        flexWrap: 'wrap'
                    }}>
                        {fwd.map((p, idx) => <DreamPlayer key={p.id} player={p} isCenterForward={idx === 1} />)}
                    </div>
                </div>

                <div style={{ 
                    background: 'white', 
                    padding: isMobile ? '10px' : '12px', 
                    borderRadius: '15px', 
                    marginTop: '15px', 
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)', 
                    textAlign: 'center',
                    width: '100%'
                }}>
                    <h4 style={{ 
                        margin: '0 0 10px 0', 
                        fontSize: isMobile ? '13px' : '14px', 
                        color: '#38003c' 
                    }}>
                        دكة البدلاء
                    </h4>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: isMobile ? '5px' : '8px', 
                        flexWrap: 'wrap'
                    }}>
                        {bench.map(p => <DreamPlayer key={p.id} player={p} isSub={true} />)}
                    </div>
                </div>
            </div>
        );
    };

    // تحديد الأيقونة لكل تبويب
    const getTabIcon = (tab) => {
        switch(tab) {
            case 'gameweek':
                return <TbSoccerField style={{ marginLeft: '5px' }} />;
            case 'month':
                return <FaCalendarAlt style={{ marginLeft: '5px' }} />;
            case 'season':
                return <FaTrophy style={{ marginLeft: '5px' }} />;
            case 'form':
                return <FaChartLine style={{ marginLeft: '5px' }} />;
            default:
                return null;
        }
    };

    // تحديد نص كل تبويب
    const getTabText = (tab) => {
        switch(tab) {
            case 'gameweek':
                return 'جولة';
            case 'month':
                return 'شهر';
            case 'season':
                return 'موسم';
            case 'form':
                return 'فورمة';
            default:
                return tab;
        }
    };

    return (
        <div style={{ 
            padding: isMobile ? '10px' : '20px', 
            background: '#f0f2f5', 
            minHeight: '100vh', 
            direction: 'rtl',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px', 
                gap: isMobile ? '8px' : '12px',
                flexWrap: 'wrap'
            }}>
                <button 
                    onClick={() => navigate('/dashboard')} 
                    style={{ 
                        background: 'white', 
                        border: 'none', 
                        width: isMobile ? '35px' : '40px', 
                        height: isMobile ? '35px' : '40px', 
                        borderRadius: '50%', 
                        cursor:'pointer', 
                        boxShadow:'0 2px 5px rgba(0,0,0,0.1)', 
                        display:'flex', 
                        alignItems:'center', 
                        justifyContent:'center',
                        flexShrink: 0
                    }}
                >
                    <FaArrowLeft size={isMobile ? 16 : 20} />
                </button>
                <h1 style={{ 
                    margin: 0, 
                    color: '#38003c', 
                    fontSize: isMobile ? '18px' : isTablet ? '22px' : '26px', 
                    fontWeight: '900',
                    flex: 1,
                    minWidth: 0
                }}>
                    🏆 التشكيلات المثالية
                </h1>
            </div>

            {/* ✅ Tabs: متجاوبة للهاتف مع الأيقونات */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '5px', 
                marginBottom: '20px', 
                background: '#fff', 
                padding: '5px', 
                borderRadius: '30px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch'
            }}>
                {['gameweek', 'month', 'season', 'form'].map((tab) => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        style={{ 
                            flex: isMobile ? '0 0 auto' : 1, 
                            padding: isMobile ? '8px 12px' : '10px 20px', 
                            borderRadius: '25px', 
                            border: 'none', 
                            background: activeTab === tab ? '#38003c' : 'transparent', 
                            color: activeTab === tab ? 'white' : '#555', 
                            fontSize: isMobile ? '11px' : '14px', 
                            fontWeight: 'bold', 
                            cursor: 'pointer', 
                            transition: '0.3s',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {getTabIcon(tab)}
                        {getTabText(tab)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{
                    textAlign:'center', 
                    padding: isMobile ? '50px 20px' : '100px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <FaSpinner className="spin" size={isMobile ? 25 : 30} color="#38003c" />
                    <p style={{
                        marginTop:'10px', 
                        fontWeight:'bold',
                        fontSize: isMobile ? '14px' : '16px'
                    }}>
                        جاري استخراج البيانات...
                    </p>
                </div>
            ) : (
                <div className="content-area" style={{ width: '100%' }}>
                    {/* Controls */}
                    {activeTab === 'gameweek' && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: isMobile ? '10px' : '20px', 
                            marginBottom: '20px',
                            flexWrap: 'wrap'
                        }}>
                            <button 
                                onClick={() => setGw(g => Math.max(1, g - 1))} 
                                style={{ 
                                    background: '#fff', 
                                    border: 'none', 
                                    width: isMobile ? '30px' : '35px', 
                                    height: isMobile ? '30px' : '35px', 
                                    borderRadius: '50%', 
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)', 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <FaChevronRight size={isMobile ? 14 : 16} />
                            </button>
                            <div style={{ 
                                background: '#38003c', 
                                color: '#00ff87', 
                                padding: isMobile ? '6px 15px' : '8px 25px', 
                                borderRadius: '10px', 
                                fontWeight: '900', 
                                fontSize: isMobile ? '16px' : '18px',
                                textAlign: 'center',
                                minWidth: '100px'
                            }}>
                                GW {gw}
                            </div>
                            <button 
                                onClick={() => setGw(g => Math.min(38, g + 1))} 
                                style={{ 
                                    background: '#fff', 
                                    border: 'none', 
                                    width: isMobile ? '30px' : '35px', 
                                    height: isMobile ? '30px' : '35px', 
                                    borderRadius: '50%', 
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)', 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <FaChevronLeft size={isMobile ? 14 : 16} />
                            </button>
                        </div>
                    )}

                    {activeTab === 'month' && monthsList.length > 0 && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: isMobile ? '5px' : '10px', 
                            marginBottom: '20px',
                            flexWrap: 'wrap'
                        }}>
                            <button 
                                onClick={() => changeMonth(-1)} 
                                disabled={selectedMonthIndex === 0} 
                                style={{ 
                                    border: 'none', 
                                    background: '#fff', 
                                    padding: isMobile ? '8px' : '10px', 
                                    borderRadius: '50%', 
                                    cursor: 'pointer', 
                                    opacity: selectedMonthIndex === 0 ? 0.3 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <FaChevronRight size={isMobile ? 14 : 16} />
                            </button>
                            <div style={{ 
                                textAlign: 'center', 
                                background: 'white', 
                                padding: isMobile ? '8px 15px' : '10px 20px', 
                                borderRadius: '15px', 
                                border: '2px solid #38003c',
                                minWidth: isMobile ? '150px' : '200px'
                            }}>
                                <div style={{ 
                                    fontWeight: '900', 
                                    color: '#38003c',
                                    fontSize: isMobile ? '14px' : '16px'
                                }}>
                                    {monthsList[selectedMonthIndex].name}
                                </div>
                                <div style={{ 
                                    fontSize: isMobile ? '9px' : '10px', 
                                    color: '#666',
                                    marginTop: '2px'
                                }}>
                                    جولات: {monthsList[selectedMonthIndex].range.replace(',', ' - ')}
                                </div>
                            </div>
                            <button 
                                onClick={() => changeMonth(1)} 
                                disabled={selectedMonthIndex === monthsList.length - 1} 
                                style={{ 
                                    border: 'none', 
                                    background: '#fff', 
                                    padding: isMobile ? '8px' : '10px', 
                                    borderRadius: '50%', 
                                    cursor: 'pointer', 
                                    opacity: selectedMonthIndex === monthsList.length - 1 ? 0.3 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <FaChevronLeft size={isMobile ? 14 : 16} />
                            </button>
                        </div>
                    )}

                    {(activeTab === 'gameweek' || activeTab === 'month' || activeTab === 'season') && (
                        <div style={{ 
                            maxWidth: '900px', 
                            margin: '0 auto',
                            width: '100%'
                        }}>
                            {/* Best Cards */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', 
                                gap: isMobile ? '10px' : '15px', 
                                marginBottom: '20px',
                                width: '100%'
                            }}>
                                <div style={{ 
                                    background: '#fff', 
                                    padding: isMobile ? '12px' : '15px', 
                                    borderRadius: '15px', 
                                    textAlign: 'center', 
                                    borderRight: '6px solid #00c853', 
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    width: '100%'
                                }}>
                                    <FaTrophy size={isMobile ? 25 : 30} color="#00c853" style={{marginBottom:'10px'}} />
                                    <div style={{ 
                                        fontSize: isMobile ? '11px' : '12px', 
                                        color: '#666',
                                        marginBottom: '5px'
                                    }}>
                                        {activeTab === 'season' ? 'بطل الموسم' : 'بطل الفترة'}
                                    </div>
                                    <div style={{ 
                                        fontSize: isMobile ? '18px' : '20px', 
                                        fontWeight: '900', 
                                        color: '#333',
                                        marginBottom: '5px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {awards?.bestTeam?.name || '--'}
                                    </div>
                                    <div style={{ 
                                        fontSize: isMobile ? '16px' : '18px', 
                                        color: '#00c853', 
                                        fontWeight: 'bold'
                                    }}>
                                        {awards?.bestTeam?.totalScore || '0'} <small>نقطة</small>
                                    </div>
                                </div>
                                <div style={{ 
                                    background: '#fff', 
                                    padding: isMobile ? '12px' : '15px', 
                                    borderRadius: '15px', 
                                    textAlign: 'center', 
                                    borderRight: '6px solid #2979ff', 
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    width: '100%'
                                }}>
                                    <FaStar size={isMobile ? 25 : 30} color="#2979ff" style={{marginBottom:'10px'}} />
                                    <div style={{ 
                                        fontSize: isMobile ? '11px' : '12px', 
                                        color: '#666',
                                        marginBottom: '5px'
                                    }}>
                                        أفضل لاعب (MVP)
                                    </div>
                                    <div style={{ 
                                        fontSize: isMobile ? '18px' : '20px', 
                                        fontWeight: '900', 
                                        color: '#333',
                                        marginBottom: '5px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {awards?.bestPlayer?.name || '--'}
                                    </div>
                                    <div style={{ 
                                        fontSize: isMobile ? '16px' : '18px', 
                                        color: '#2979ff', 
                                        fontWeight: 'bold'
                                    }}>
                                        {awards?.bestPlayer?.score || '0'} <small>نقطة</small>
                                    </div>
                                </div>
                            </div>

                            <DreamTeamPitch players={awards?.dreamTeam} />
                        </div>
                    )}

                    {activeTab === 'form' && (
                        <div style={{ 
                            background: 'white', 
                            borderRadius: '15px', 
                            padding: isMobile ? '10px' : '20px', 
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)', 
                            maxWidth: '800px', 
                            margin: '0 auto',
                            width: '100%',
                            overflow: 'hidden'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px', 
                                marginBottom: '15px', 
                                borderBottom: '2px solid #38003c', 
                                paddingBottom: '10px',
                                flexWrap: 'wrap'
                            }}>
                                <FaChartLine color="#38003c" size={isMobile ? 18 : 20} />
                                <h3 style={{ 
                                    margin: 0, 
                                    fontSize: isMobile ? '16px' : '20px',
                                    flex: 1,
                                    minWidth: 0
                                }}>
                                    سجل أداء الفرق (آخر 5 مواجهات)
                                </h3>
                            </div>
                            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                <table style={{ 
                                    width: '100%', 
                                    borderCollapse: 'collapse',
                                    minWidth: isMobile ? '400px' : 'auto'
                                }}>
                                    <thead>
                                        <tr style={{ textAlign: 'right', fontSize: isMobile ? '11px' : '12px', color: '#666' }}>
                                            <th style={{ padding: isMobile ? '8px' : '10px', textAlign: 'right' }}>الفريق</th>
                                            <th style={{ padding: isMobile ? '8px' : '10px', textAlign: 'center' }}>النتائج</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formGuide.map((team, idx) => (
                                            <tr key={team.teamId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                <td style={{ 
                                                    padding: isMobile ? '8px' : '10px', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px',
                                                    minWidth: isMobile ? '150px' : 'auto'
                                                }}>
                                                    <span style={{ 
                                                        fontSize: isMobile ? '10px' : '11px', 
                                                        color: '#999', 
                                                        width: isMobile ? '12px' : '15px',
                                                        flexShrink: 0
                                                    }}>
                                                        {idx + 1}
                                                    </span>
                                                    <img 
                                                        src={getLogoUrl(team.logoUrl)} 
                                                        style={{ 
                                                            width: isMobile ? '25px' : '35px', 
                                                            height: isMobile ? '25px' : '35px', 
                                                            objectFit: 'contain',
                                                            flexShrink: 0
                                                        }} 
                                                        alt={team.teamName}
                                                    />
                                                    <span style={{ 
                                                        fontWeight: 'bold', 
                                                        fontSize: isMobile ? '12px' : '15px', 
                                                        whiteSpace:'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        flex: 1
                                                    }}>
                                                        {team.teamName}
                                                    </span>
                                                </td>
                                                <td style={{ 
                                                    padding: isMobile ? '8px' : '10px', 
                                                    textAlign: 'center',
                                                    minWidth: isMobile ? '120px' : 'auto'
                                                }}>
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'center', 
                                                        flexDirection: 'row-reverse',
                                                        flexWrap: 'wrap',
                                                        gap: '2px'
                                                    }}>
                                                        {team.form.map((res, i) => (
                                                            <FormBadge key={i} result={res} />
                                                        ))}
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
                    .pitch-container { 
                        transform: scale(0.95); 
                        transform-origin: top center; 
                        margin: 0 -5px;
                    }
                }
                @media (max-width: 480px) {
                    .pitch-container { 
                        transform: scale(0.9); 
                        transform-origin: top center;
                    }
                }
                * {
                    box-sizing: border-box;
                }
                table {
                    width: 100%;
                }
            `}</style>
        </div>
    );
};

export default AwardsCenter;