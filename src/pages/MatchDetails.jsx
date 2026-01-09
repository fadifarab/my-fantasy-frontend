import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { 
    FaArrowLeft, FaCamera, FaSpinner, FaCrown, FaExchangeAlt, 
    FaTshirt, FaStar, FaUserAlt, FaMinusCircle, FaShieldAlt
} from "react-icons/fa";
import html2canvas from 'html2canvas';

const CHIPS_CONFIG = {
    'tripleCaptain': { label: 'TRIPLE CAPTAIN', icon: <FaCrown />, color: '#ffd700', bg: 'rgba(255, 215, 0, 0.15)' },
    'benchBoost': { label: 'BENCH BOOST', icon: <FaExchangeAlt />, color: '#00ff85', bg: 'rgba(0, 255, 133, 0.15)' },
    'freeHit': { label: 'FREE HIT', icon: <FaTshirt />, color: '#00ccff', bg: 'rgba(0, 204, 255, 0.15)' },
    'theBest': { label: 'THE BEST', icon: <FaStar />, color: '#ff00ff', bg: 'rgba(255, 0, 255, 0.15)' }
};

const SafeLogo = ({ url, size = 80, isLeague = false }) => {
    const [imgSrc, setImgSrc] = useState('');
    const SERVER_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    useEffect(() => {
        if (!url) return;
        const fetchImg = async () => {
            try {
                if (url.startsWith('/uploads')) { setImgSrc(`${SERVER_URL}${url}`); } 
                else {
                    const { data } = await API.post('/teams/proxy-image', { imageUrl: url });
                    if (data.base64) setImgSrc(data.base64);
                }
            } catch (err) { console.error(err); }
        };
        fetchImg();
    }, [url, SERVER_URL]);

    return (
        <div style={{ width: size, height: size, background: '#fff', borderRadius: isLeague ? '8px' : '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', padding: '5px', border: '1px solid #f0f0f0', flexShrink: 0 }}>
            {imgSrc ? <img src={imgSrc} style={{ width: '90%', height: '90%', objectFit: 'contain' }} alt="L" /> : <FaShieldAlt size={size * 0.5} color="#ccc" />}
        </div>
    );
};

const MatchDetails = () => {
    const { fixtureId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [leagueInfo, setLeagueInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const matchRef = useRef(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/fixtures/details/${fixtureId}`);
                setData(res.data);
                const leagueRes = await API.get('/leagues/me');
                setLeagueInfo(leagueRes.data);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        fetchDetails();
    }, [fixtureId]);

    const handleExportImage = async () => {
        if (!matchRef.current) return;
        setExporting(true);
        try {
            const canvas = await html2canvas(matchRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.href = canvas.toDataURL("image/png");
            link.download = `MatchResult.png`;
            link.click();
        } catch (error) { alert("خطأ في التصدير"); } 
        finally { setExporting(false); }
    };

    if (loading || !data) return <div style={{display:'flex', height:'100vh', justifyContent:'center', alignItems:'center'}}><FaSpinner className="fa-spin" size={40} color="#37003c" /></div>;

    const { fixture, homeLineup, awayLineup } = data;
    const maxRows = Math.max(homeLineup?.lineup?.length || 0, awayLineup?.lineup?.length || 0);

    const PlayerBox = ({ player, isHome, activeChip }) => {
        if (!player) return <div style={{ flex: 1 }}></div>;
        const raw = player.rawPoints || 0;
        const hits = player.transferCost || 0;
        const final = player.finalScore || 0;
        const multiplier = player.isCaptain ? (activeChip === 'tripleCaptain' ? 3 : 2) : 1;

        return (
            <div style={{ 
                flex: 1, 
                padding: '8px 8px', 
                background: player.isStarter ? '#fff' : 'rgba(240, 240, 240, 0.6)', 
                borderRadius: '15px', 
                border: player.isStarter ? '1.5px solid #f0f0f0' : '1px dashed #ccc', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '6px'
            }}>
                <div style={{ display: 'flex', flexDirection: isHome ? 'row' : 'row-reverse', alignItems: 'center', gap: '8px' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '10px', 
                            background: isHome ? '#37003c' : '#00ff85', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                        }}>
                            <FaUserAlt color={isHome ? '#fff' : '#37003c'} size={14} />
                        </div>
                        {player.isCaptain && (
                            <div style={{ 
                                position: 'absolute', 
                                top: -3, 
                                right: -3, 
                                background: '#ffd700', 
                                borderRadius: '50%', 
                                padding: '2px', 
                                border: '1px solid #fff' 
                            }}>
                                <FaCrown size={8} color="#000" />
                            </div>
                        )}
                    </div>
                    <div style={{ 
                        fontWeight: '800', 
                        fontSize: '12px', 
                        color: '#1a1a1a', 
                        flex: 1, 
                        textAlign: isHome ? 'right' : 'left', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                    }}>
                        {player.userId?.username}
                    </div>
                </div>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    borderTop: '1px solid #f5f5f5', 
                    paddingTop: '6px' 
                }}>
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '3px', 
                        textAlign: isHome ? 'right' : 'left' 
                    }}>
                        <div style={{ fontSize: '10px', color: '#666', fontWeight: '700' }}>RAW: {raw}</div>
                        {hits > 0 && <div style={{ fontSize: '10px', color: '#ff1744', fontWeight: '700' }}>HITS: -{hits}</div>}
                        {player.isCaptain && (
                            <div style={{ fontSize: '9px', color: '#37003c', fontWeight: '700' }}>
                                {multiplier === 3 ? 'TRIPLE' : 'X2'} CAPTAIN
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: isHome ? 'left' : 'right' }}>
                        <div style={{ 
                            fontSize: '24px', 
                            fontWeight: '800', 
                            color: isHome ? '#37003c' : '#00a859', 
                            lineHeight: 1 
                        }}>
                            {final}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ 
            padding: '10px', 
            background: '#f0f2f5', 
            minHeight: '100vh', 
            direction: 'rtl', 
            fontFamily: 'Arial, sans-serif',
            maxWidth: '100%',
            overflowX: 'hidden'
        }}>
            {/* شريط التنقل */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '15px',
                padding: '0 5px'
            }}>
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ 
                        background: '#fff', 
                        border: 'none', 
                        padding: '8px 12px', 
                        borderRadius: '8px', 
                        fontWeight: '700', 
                        color: '#37003c', 
                        fontSize: '13px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                >
                    ⬅ عودة
                </button>
                <button 
                    onClick={handleExportImage} 
                    disabled={exporting} 
                    style={{ 
                        background: '#37003c', 
                        color: '#00ff85', 
                        border: 'none', 
                        padding: '8px 12px', 
                        borderRadius: '8px', 
                        fontWeight: '700', 
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                >
                    {exporting ? <FaSpinner className="fa-spin" size={14} /> : <><FaCamera size={14} /> مشاركة</>}
                </button>
            </div>

            {/* البطاقة الرئيسية */}
            <div 
                ref={matchRef} 
                style={{ 
                    background: '#fff', 
                    borderRadius: '25px', 
                    overflow: 'hidden', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    width: '100%',
                    maxWidth: '500px',
                    margin: '0 auto'
                }}
            >
                {/* رأس البطاقة */}
                <div style={{ 
                    padding: '15px', 
                    background: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '10px', 
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <SafeLogo url={leagueInfo?.logoUrl} size={40} isLeague={true} />
                    <div style={{ 
                        fontWeight: '800', 
                        fontSize: '18px', 
                        color: '#37003c',
                        textAlign: 'center'
                    }}>
                        {leagueInfo?.name?.toUpperCase() || 'FANTASY LEAGUE'}
                    </div>
                </div>

                {/* قسم النتيجة */}
                <div style={{ 
                    background: 'linear-gradient(180deg, #37003c 0%, #1a001c 100%)', 
                    padding: '25px 5px', 
                    color: '#fff'
                }}>
                    <div style={{ 
                        textAlign: 'center', 
                        fontSize: '12px', 
                        fontWeight: '700', 
                        color: '#00ff85', 
                        marginBottom: '15px', 
                        letterSpacing: '2px'
                    }}>
                        GAMEWEEK {fixture.gameweek}
                    </div>
                    
                    {/* تصميم الفريقين والنتيجة */}
                    <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        alignItems: 'start',
                        justifyItems: 'center',
                        gap: '5px'
                    }}>
                        
                        {/* الفريق المضيف */}
                        <div style={{ 
                            textAlign: 'center', 
                            width: '100%',
                            padding: '0 5px'
                        }}>
                            <SafeLogo url={fixture.homeTeamId?.logoUrl} size={70} />
                            <div style={{ 
                                marginTop: '8px', 
                                fontSize: '14px', 
                                fontWeight: '800',
                                minHeight: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: '1.2'
                            }}>
                                {fixture.homeTeamId?.name}
                            </div>
                            <div style={{ 
                                height: '30px', 
                                marginTop: '8px', 
                                display: 'flex', 
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                {homeLineup?.activeChip && homeLineup.activeChip !== 'none' && (
                                    <div style={{ 
                                        background: CHIPS_CONFIG[homeLineup.activeChip].bg, 
                                        color: CHIPS_CONFIG[homeLineup.activeChip].color, 
                                        padding: '3px 8px', 
                                        borderRadius: '8px', 
                                        fontSize: '9px', 
                                        fontWeight: '700', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px', 
                                        border: `1px solid ${CHIPS_CONFIG[homeLineup.activeChip].color}`,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {CHIPS_CONFIG[homeLineup.activeChip].icon} {CHIPS_CONFIG[homeLineup.activeChip].label}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* النتيجة */}
                        <div style={{ 
                            textAlign: 'center', 
                            width: '100%',
                            paddingTop: '5px'
                        }}>
                            <div style={{ 
                                fontSize: '60px', 
                                fontWeight: '900', 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                gap: '5px', 
                                lineHeight: '1'
                            }}>
                                <span>{fixture.awayScore}</span>
                                <span style={{ opacity: 0.2, fontSize: '30px' }}>:</span>
                                <span>{fixture.homeScore}</span>
                            </div>
                            <div style={{ 
                                color: '#00ff85', 
                                fontSize: '11px', 
                                fontWeight: '700', 
                                letterSpacing: '2px', 
                                marginTop: '8px'
                            }}>
                                FINAL RESULT
                            </div>
                        </div>

                        {/* الفريق الضيف */}
                        <div style={{ 
                            textAlign: 'center', 
                            width: '100%',
                            padding: '0 5px'
                        }}>
                            <SafeLogo url={fixture.awayTeamId?.logoUrl} size={70} />
                            <div style={{ 
                                marginTop: '8px', 
                                fontSize: '14px', 
                                fontWeight: '800',
                                minHeight: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: '1.2'
                            }}>
                                {fixture.awayTeamId?.name}
                            </div>
                            <div style={{ 
                                height: '30px', 
                                marginTop: '8px', 
                                display: 'flex', 
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                {awayLineup?.activeChip && awayLineup.activeChip !== 'none' && (
                                    <div style={{ 
                                        background: CHIPS_CONFIG[awayLineup.activeChip].bg, 
                                        color: CHIPS_CONFIG[awayLineup.activeChip].color, 
                                        padding: '3px 8px', 
                                        borderRadius: '8px', 
                                        fontSize: '9px', 
                                        fontWeight: '700', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px', 
                                        border: `1px solid ${CHIPS_CONFIG[awayLineup.activeChip].color}`,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {CHIPS_CONFIG[awayLineup.activeChip].icon} {CHIPS_CONFIG[awayLineup.activeChip].label}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* مقارنة اللاعبين */}
                <div style={{ padding: '20px 10px' }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '0 8px 10px', 
                        borderBottom: '1px solid #f0f0f0', 
                        marginBottom: '10px'
                    }}>
                        <div style={{ 
                            fontWeight: '800', 
                            fontSize: '13px', 
                            color: '#37003c',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}>
                            <span>📍</span> AWAY
                        </div>
                        <div style={{ 
                            fontWeight: '800', 
                            fontSize: '13px', 
                            color: '#00a859',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}>
                            HOME <span>📍</span>
                        </div>
                    </div>

                    {Array.from({ length: maxRows }).map((_, i) => {
                        const hPlayer = homeLineup?.lineup?.[i];
                        const aPlayer = awayLineup?.lineup?.[i];
                        const showBenchHeader = (hPlayer && !hPlayer.isStarter && (i === 0 || homeLineup.lineup[i-1].isStarter)) || 
                                              (aPlayer && !aPlayer.isStarter && (i === 0 || awayLineup.lineup[i-1].isStarter));

                        return (
                            <div key={i}>
                                {showBenchHeader && (
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px', 
                                        margin: '20px 0 15px'
                                    }}>
                                        <div style={{ 
                                            height: '1px', 
                                            flex: 1, 
                                            background: '#f0f0f0' 
                                        }}></div>
                                        <div style={{ 
                                            fontWeight: '700', 
                                            fontSize: '12px', 
                                            color: '#aaa', 
                                            letterSpacing: '1px',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            SUBSTITUTES / BENCH
                                        </div>
                                        <div style={{ 
                                            height: '1px', 
                                            flex: 1, 
                                            background: '#f0f0f0' 
                                        }}></div>
                                    </div>
                                )}
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '8px', 
                                    marginBottom: '10px'
                                }}>
                                    <PlayerBox player={hPlayer} isHome={true} activeChip={homeLineup?.activeChip} />
                                    <PlayerBox player={aPlayer} isHome={false} activeChip={awayLineup?.activeChip} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* تذييل البطاقة */}
                <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    background: '#f9f9f9', 
                    borderTop: '1px solid #eee'
                }}>
                    <div style={{ 
                        fontWeight: '800', 
                        fontSize: '13px', 
                        color: '#37003c', 
                        letterSpacing: '1px'
                    }}>
                        {leagueInfo?.name?.toUpperCase() || 'FANTASY LEAGUE'} PRO
                    </div>
                </div>
            </div>
            
            {/* CSS للتدوير */}
            <style>{`
                .fa-spin { 
                    animation: spin 2s linear infinite; 
                } 
                @keyframes spin { 
                    100% { 
                        transform: rotate(360deg); 
                    } 
                }
                @media (max-width: 360px) {
                    .fa-spin { 
                        font-size: 12px !important; 
                    }
                }
            `}</style>
        </div>
    );
};

export default MatchDetails;