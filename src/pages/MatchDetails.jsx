import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { FaArrowLeft, FaBolt, FaExclamationTriangle, FaUserAlt, FaCamera, FaSpinner } from "react-icons/fa";
import html2canvas from 'html2canvas';

// ✅ SafeLogo: الحل النهائي (SVG)
const SafeLogo = ({ url }) => {
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
                if (data.base64) {
                    setImgSrc(data.base64);
                }
            } catch (err) {
                console.error("Proxy failed for:", url);
                setImgSrc('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBase64();
    }, [url]);

    if (isLoading) return <div style={{width:'60px', height:'60px', borderRadius:'50%', background:'#eee'}}></div>;

    return (
        <svg 
            width="80" 
            height="80" 
            viewBox="0 0 80 80" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', margin: 'auto' }}
        >
            <image 
                href={imgSrc} 
                width="60"  
                height="60" 
                x="10"
                y="10"
                preserveAspectRatio="xMidYMid meet" 
            />
        </svg>
    );
};

const MatchDetails = () => {
    const { fixtureId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);
    const matchRef = useRef(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/fixtures/details/${fixtureId}`);
                setData(res.data);
            } catch (err) { setError(err.response?.data?.message || 'تعذر تحميل البيانات'); } 
            finally { setLoading(false); }
        };
        fetchDetails();
    }, [fixtureId]);

    const sortLineup = (lineup) => {
        if (!lineup) return [];
        return [...lineup].sort((a, b) => {
            if (a.isCaptain) return -1;
            if (b.isCaptain) return 1;
            if (a.isStarter && !b.isStarter) return -1;
            if (!a.isStarter && b.isStarter) return 1;
            return 0;
        });
    };

    const handleExportImage = async () => {
        if (!matchRef.current) return;
        setExporting(true);
        try {
            const element = matchRef.current;
            window.scrollTo(0, 0);
            await new Promise(resolve => setTimeout(resolve, 800));

            const canvas = await html2canvas(element, {
                scale: 2, 
                useCORS: true, 
                allowTaint: true,
                backgroundColor: '#f5f7fa',
                logging: false,
                height: element.scrollHeight, 
                windowHeight: element.scrollHeight, 
                scrollY: -window.scrollY,
            });
            
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `GW${data.fixture.gameweek}-Match.png`;
            link.click();
        } catch (error) {
            console.error("Export failed:", error);
            alert("فشل تصدير الصورة");
        }
        setExporting(false);
    };

    if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontSize:'20px'}}>⚽ جاري تحميل المباراة...</div>;
    if (error) return <div style={{textAlign:'center', padding:'50px', color:'red'}}>{error} <br/><button onClick={()=>navigate(-1)}>عودة</button></div>;
    if (!data) return null;

    const { fixture, homeLineup, awayLineup, warning } = data;
    const sortedHome = sortLineup(homeLineup?.lineup);
    const sortedAway = sortLineup(awayLineup?.lineup);

    // ✅✅✅ تحديث المكون لحساب نقاط الكابتن ✅✅✅
    // نستقبل teamActiveChip لمعرفة ما إذا كان التريبل مفعلاً
    const PlayerCard = ({ player, isHome, teamActiveChip }) => {
        if (!player) return <div style={{height:'60px'}}></div>;
        
        const hit = player.transferCost || 0;
        
        // 1. هل خاصية التريبل كابتن مفعلة؟
        const isTripleCaptain = teamActiveChip === 'tripleCaptain';

        // 2. حساب المضاعف (Multiplier)
        let multiplier = 1;
        if (player.isCaptain) {
            multiplier = isTripleCaptain ? 3 : 2; // ×3 للتريبل، ×2 للكابتن العادي
        }

        // 3. النقاط النهائية للعرض
        const displayScore = (player.finalScore ?? 0) * multiplier;

        return (
            <div style={{ display: 'flex', flexDirection: isHome ? 'row' : 'row-reverse', alignItems: 'center', padding: '10px 15px', marginBottom: '8px', borderRadius: '10px', backgroundColor: player.isStarter ? 'white' : '#e0e0e0', borderLeft: isHome ? '5px solid #38003c' : 'none', borderRight: !isHome ? '5px solid #00ff85' : 'none', boxShadow: '0 3px 6px rgba(0,0,0,0.08)', opacity: player.isStarter ? 1 : 0.8, height: '60px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: isHome ? 'row' : 'row-reverse', alignItems: 'center', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isHome ? 'row' : 'row-reverse' }}>
                        {player.isCaptain && ( <span title="Captain" style={{ width: '22px', height: '22px', backgroundColor: '#ffeb3b', color: 'black', borderRadius: '50%', border: '2px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', fontFamily: 'Arial Black', boxShadow:'0 2px 4px rgba(0,0,0,0.1)' }}>C</span> )}
                        <span style={{ fontWeight: 'bold', fontSize: '15px', color: player.isStarter ? '#333' : '#666', whiteSpace: 'nowrap' }}>{player.userId?.username}</span>
                        {/* عرض شارة TC إذا كانت الخاصية مفعلة */}
                        {isTripleCaptain && player.isCaptain && ( <span style={{fontSize:'10px', background:'black', color:'white', padding:'2px 5px', borderRadius:'4px', fontWeight:'bold'}}>TC</span> )}
                        {!player.isStarter && <span style={{fontSize:'10px', background:'#999', color:'white', padding:'1px 4px', borderRadius:'3px'}}>BENCH</span>}
                    </div>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {hit > 0 && ( <span style={{ backgroundColor: '#ffebee', color: '#d32f2f', border: '1px solid #ffcdd2', borderRadius: '6px', padding: '4px 12px', fontSize: '13px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '26px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>-{hit} Hits</span> )}
                    </div>
                </div>
                {/* عرض النقاط المحسوبة (displayScore) بدلاً من النقاط الخام */}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: player.isStarter ? (isHome ? '#38003c' : '#009688') : '#757575', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize:'18px', boxShadow: '0 3px 6px rgba(0,0,0,0.2)', marginLeft: isHome ? '10px' : '0', marginRight: isHome ? '0' : '10px', border: hit > 0 ? '2px solid #d32f2f' : 'none' }}>
                    {displayScore}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f7fa', minHeight: '100vh', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '5px', color:'#555', fontWeight:'bold' }}> <FaArrowLeft /> قائمة المباريات </button>
                <button onClick={handleExportImage} disabled={exporting} style={{ background: '#38003c', color: '#00ff85', border: 'none', borderRadius: '20px', padding: '8px 15px', cursor: exporting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}> 
                    {exporting ? <FaSpinner className="fa-spin"/> : <FaCamera />} {exporting ? 'جاري الحفظ...' : 'حفظ كصورة'}
                </button>
            </div>
            {warning && <div style={{background:'#fff3e0', color:'#e65100', padding:'10px', borderRadius:'8px', marginBottom:'20px', textAlign:'center', border:'1px solid #ffe0b2'}}><FaExclamationTriangle/> {warning}</div>}
            
            <div ref={matchRef} style={{ padding: '10px', backgroundColor: '#f5f7fa', minHeight: 'fit-content' }}>
                <div style={{ background: 'linear-gradient(135deg, #38003c 0%, #1a001b 100%)', borderRadius: '20px', padding: '30px', color: 'white', boxShadow: '0 10px 20px rgba(56, 0, 60, 0.3)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    
                    {/* شعار المضيف */}
                    <div style={{ textAlign: 'center', flex: 1, minWidth: '120px' }}>
                        <div style={{
                            background:'white', 
                            width:'80px', 
                            height:'80px', 
                            borderRadius:'50%', 
                            margin:'0 auto 10px', 
                            boxShadow:'0 4px 10px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0', 
                            overflow: 'hidden' 
                        }}> 
                            <SafeLogo url={fixture.homeTeamId?.logoUrl} />
                        </div>
                        <h2 style={{ margin: '5px 0', fontSize: '18px' }}>{fixture.homeTeamId?.name}</h2>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}><FaUserAlt size={10}/> {fixture.homeTeamId?.managerId?.username}</div>
                        {homeLineup?.activeChip && homeLineup.activeChip !== 'none' && ( <div style={{ marginTop: '8px', background: '#e91e63', padding: '4px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold', display:'inline-block' }}> <FaBolt /> {homeLineup.activeChip.toUpperCase()} </div> )}
                    </div>

                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '15px 30px', borderRadius: '15px', backdropFilter: 'blur(5px)' }}>
                        <div style={{ fontSize: '14px', marginBottom: '5px', color: '#00ff85', fontWeight:'bold' }}>GW {fixture.gameweek}</div>
                        <div style={{ fontSize: '48px', fontWeight: 'bold', letterSpacing: '2px', fontFamily:'Impact' }}> {fixture.isFinished ? <span dir="ltr">{fixture.homeScore} - {fixture.awayScore}</span> : <span style={{fontSize:'32px'}}>VS</span>} </div>
                    </div>

                    {/* شعار الضيف */}
                    <div style={{ textAlign: 'center', flex: 1, minWidth: '120px' }}>
                        <div style={{
                            background:'white', 
                            width:'80px', 
                            height:'80px', 
                            borderRadius:'50%', 
                            margin:'0 auto 10px', 
                            boxShadow:'0 4px 10px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0',
                            overflow: 'hidden'
                        }}> 
                             <SafeLogo url={fixture.awayTeamId?.logoUrl} />
                        </div>
                        <h2 style={{ margin: '5px 0', fontSize: '18px' }}>{fixture.awayTeamId?.name}</h2>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}><FaUserAlt size={10}/> {fixture.awayTeamId?.managerId?.username}</div>
                        {awayLineup?.activeChip && awayLineup.activeChip !== 'none' && ( <div style={{ marginTop: '8px', background: '#e91e63', padding: '4px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold', display:'inline-block' }}> <FaBolt /> {awayLineup.activeChip.toUpperCase()} </div> )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ borderBottom: '3px solid #38003c', paddingBottom: '10px', color: '#38003c', marginTop:0 }}>{fixture.homeTeamId?.name}</h3>
                        {sortedHome?.length > 0 ? ( sortedHome.map((p, i) => {
                            const isFirstBench = !p.isStarter && (i === 0 || sortedHome[i-1].isStarter);
                            // ✅ نمرر teamActiveChip إلى PlayerCard
                            return ( <div key={i}> {isFirstBench && <div style={{textAlign: 'center', margin: '15px 0 10px', fontSize: '12px', color: '#999', borderBottom:'1px dashed #ccc'}}>--- دكة الاحتياط ---</div>} <PlayerCard player={p} isHome={true} teamActiveChip={homeLineup?.activeChip} /> </div> );
                        }) ) : <p style={{textAlign:'center', color:'#999'}}>لم يتم ضبط التشكيلة</p>}
                    </div>

                    <div style={{ background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ borderBottom: '3px solid #00ff85', paddingBottom: '10px', color: '#00796b', marginTop:0 }}>{fixture.awayTeamId?.name}</h3>
                        {sortedAway?.length > 0 ? ( sortedAway.map((p, i) => {
                            const isFirstBench = !p.isStarter && (i === 0 || sortedAway[i-1].isStarter);
                            // ✅ نمرر teamActiveChip إلى PlayerCard
                            return ( <div key={i}> {isFirstBench && <div style={{textAlign: 'center', margin: '15px 0 10px', fontSize: '12px', color: '#999', borderBottom:'1px dashed #ccc'}}>--- دكة الاحتياط ---</div>} <PlayerCard player={p} isHome={false} teamActiveChip={awayLineup?.activeChip} /> </div> );
                        }) ) : <p style={{textAlign:'center', color:'#999'}}>لم يتم ضبط التشكيلة</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default MatchDetails;