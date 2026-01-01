import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { FaArrowLeft, FaBolt, FaUserAlt, FaCamera, FaSpinner, FaTrophy } from "react-icons/fa";
import html2canvas from 'html2canvas';

// ✅ SafeLogo المصحح: يضمن الحجم الثابت والاحتواء الكامل
const SafeLogo = ({ url, size = 60 }) => {
    const [imgSrc, setImgSrc] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!url) {
            setImgSrc('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'); 
            setIsLoading(false);
            return;
        }
        const fetchBase64 = async () => {
            try {
                const { data } = await API.post('/teams/proxy-image', { imageUrl: url });
                if (data.base64) setImgSrc(data.base64);
            } catch (err) {
                setImgSrc('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
            } finally { setIsLoading(false); }
        };
        fetchBase64();
    }, [url]);

    return (
        <div style={{ 
            width: `${size}px`, 
            height: `${size}px`, 
            minWidth: `${size}px`, // ضمان عدم تقلص الحاوية
            minHeight: `${size}px`,
            background: '#fff',
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            overflow: 'hidden', 
            border: '2px solid rgba(255,255,255,0.4)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            position: 'relative'
        }}>
            {!isLoading && (
                <img 
                    src={imgSrc} 
                    alt="Logo" 
                    style={{ 
                        maxWidth: '90%', // ترك مسافة أمان
                        maxHeight: '90%', 
                        objectFit: 'contain',
                        display: 'block'
                    }} 
                />
            )}
        </div>
    );
};

const MatchDetails = () => {
    const { fixtureId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const matchRef = useRef(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/fixtures/details/${fixtureId}`);
                setData(res.data);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        fetchDetails();
    }, [fixtureId]);

    const handleExportImage = async () => {
        if (!matchRef.current) return;
        setExporting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 600)); // وقت إضافي لضمان ثبات الصور
            const canvas = await html2canvas(matchRef.current, {
                scale: 2, 
                useCORS: true,
                allowTaint: false, // نستخدم false لأننا نعتمد على base64
                backgroundColor: '#f5f7fa',
                logging: false,
                width: matchRef.current.offsetWidth,
                height: matchRef.current.offsetHeight
            });

            const link = document.createElement('a');
            link.href = canvas.toDataURL("image/png", 1.0);
            link.download = `Match-Result.png`;
            link.click();
        } catch (error) {
            alert("حدث خطأ أثناء حفظ الصورة");
        } finally {
            setExporting(false);
        }
    };

    const sortLineup = (lineup) => {
        if (!lineup) return [];
        return [...lineup].sort((a, b) => (b.isCaptain - a.isCaptain) || (b.isStarter - a.isStarter));
    };

    if (loading || !data) return <div style={{textAlign:'center', padding:'100px'}}><FaSpinner className="fa-spin" /></div>;

    const { fixture, homeLineup, awayLineup } = data;

    const PlayerCard = ({ player, isHome }) => (
        <div style={{ 
            display: 'flex', flexDirection: isHome ? 'row' : 'row-reverse', 
            alignItems: 'center', padding: '10px 15px', marginBottom: '8px', 
            borderRadius: '12px', backgroundColor: player.isStarter ? 'white' : '#f8f8f8', 
            borderRight: !isHome ? '5px solid #00ff85' : 'none',
            borderLeft: isHome ? '5px solid #38003c' : 'none',
            boxShadow: '0 3px 6px rgba(0,0,0,0.06)',
            position: 'relative',
            height: '60px' // طول ثابت للبطاقة
        }}>
            {/* جهة الاسم */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexDirection: isHome ? 'row' : 'row-reverse', width: '40%' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ width: '32px', height: '32px', background: '#eee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaUserAlt size={14} color={player.isStarter ? '#38003c' : '#bbb'} />
                    </div>
                    {player.isCaptain && (
                        <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ffd700', color: '#000', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid white' }}>C</span>
                    )}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333', whiteSpace: 'nowrap' }}>{player.userId?.username}</div>
            </div>

            {/* ✅ بوكس الهيت (توسط السطر تماماً) */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {player.transferCost > 0 && (
                    <span style={{ backgroundColor: '#ffebee', color: '#d32f2f', border: '1px solid #ffcdd2', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold' }}>
                        -{player.transferCost} Hits
                    </span>
                )}
            </div>

            {/* جهة النتيجة */}
            <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ fontWeight: '900', fontSize: '18px', color: player.isStarter ? (isHome ? '#38003c' : '#00a859') : '#999' }}>
                    {player.finalScore ?? 0}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f7fa', minHeight: '100vh', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '850px', margin: '0 auto 20px' }}>
                <button onClick={() => navigate(-1)} style={{ background: '#fff', border: 'none', borderRadius: '8px', padding: '8px 15px', fontWeight: 'bold', cursor: 'pointer' }}><FaArrowLeft /> عودة</button>
                <button onClick={handleExportImage} disabled={exporting} style={{ background: '#38003c', color: '#00ff85', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {exporting ? <FaSpinner className="fa-spin" /> : <><FaCamera /> حفظ الصورة</>}
                </button>
            </div>

            <div ref={matchRef} style={{ maxWidth: '850px', margin: '0 auto', background: '#fff', borderRadius: '25px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                {/* الترويسة المثالية */}
                <div style={{ background: 'linear-gradient(135deg, #38003c 0%, #240028 100%)', padding: '40px 20px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                        
                        <div style={{ flex: 2, textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <SafeLogo url={fixture.homeTeamId?.logoUrl} size={90} />
                            </div>
                            <h4 style={{ marginTop: '12px', fontSize: '18px', fontWeight: '900' }}>{fixture.homeTeamId?.name}</h4>
                        </div>

                        <div style={{ flex: 3, textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#00ff85', fontWeight: 'bold', marginBottom: '5px' }}>GAMEWEEK {fixture.gameweek}</div>
                            <div style={{ fontSize: '60px', fontWeight: '900', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                                <span>{fixture.homeScore}</span><span style={{opacity:0.3}}>:</span><span>{fixture.awayScore}</span>
                            </div>
                        </div>

                        <div style={{ flex: 2, textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <SafeLogo url={fixture.awayTeamId?.logoUrl} size={90} />
                            </div>
                            <h4 style={{ marginTop: '12px', fontSize: '18px', fontWeight: '900' }}>{fixture.awayTeamId?.name}</h4>
                        </div>
                    </div>
                </div>

                {/* التشكيلات */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '25px' }}>
                    <div>
                        <div style={{ padding: '8px', borderBottom: '3px solid #38003c', marginBottom: '15px', fontWeight: 'bold', color: '#38003c', textAlign: 'center' }}>صاحب الأرض</div>
                        {sortLineup(homeLineup?.lineup).map((p, i) => <PlayerCard key={i} player={p} isHome={true} />)}
                    </div>
                    <div>
                        <div style={{ padding: '8px', borderBottom: '3px solid #00ff85', marginBottom: '15px', fontWeight: 'bold', color: '#00796b', textAlign: 'center' }}>الضيوف</div>
                        {sortLineup(awayLineup?.lineup).map((p, i) => <PlayerCard key={i} player={p} isHome={false} />)}
                    </div>
                </div>
            </div>
            <style>{`.fa-spin { animation: spin 2s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default MatchDetails;