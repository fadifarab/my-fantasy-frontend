import { useState, useEffect } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { FaChartBar, FaArrowRight } from "react-icons/fa";
import TournamentHeader from '../utils/TournamentHeader'; // استيراد الرأسية

const LeagueStats = () => {
    const [stats, setStats] = useState([]);
    const [currentGw, setCurrentGw] = useState(1);
    const [loading, setLoading] = useState(true);
    const [leagueLogo, setLeagueLogo] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        fetchStatsData();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchStatsData = async () => {
        try {
            // 1. جلب الإحصائيات
            const { data } = await API.get('/leagues/stats');
            setStats(data.stats);
            setCurrentGw(data.currentGw);

            // 2. جلب شعار البطولة (رابط PostImages)
            const { data: leagueData } = await API.get('/leagues/me');
            if (leagueData && leagueData.logoUrl) setLeagueLogo(leagueData.logoUrl);
        } catch (error) { 
            console.error("Error fetching stats:", error); 
        } finally { 
            setLoading(false); 
        }
    };

    if(loading) return <div style={{padding:'100px', textAlign:'center'}}>جاري حساب الإحصائيات... 🧮</div>;

    const gameweeks = Array.from({ length: currentGw }, (_, i) => i + 1);

    return (
        <div style={{ padding: isMobile ? '10px' : '20px', fontFamily: 'Arial', direction: 'rtl', background: '#f5f7fa', minHeight: '100vh' }}>
            
            {/* 🏆 رأسية البطولة الرسمية */}
            <TournamentHeader isMobile={isMobile} logoUrl={leagueLogo} />

            {/* 👕 شريط العنوان وزر العودة */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px', 
                gap: '15px',
                backgroundColor: 'white',
                padding: '10px 15px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 12px', cursor: 'pointer', border: 'none', borderRadius: '8px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaArrowRight color="#38003c" />
                </button>
                <h1 style={{ margin: 0, color: '#38003c', fontSize: isMobile ? '18px' : '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaChartBar /> إحصائيات الجولات
                </h1>
            </div>

            {/* 📊 جدول الإحصائيات الضخم */}
            <div style={{ 
                overflowX: 'auto', 
                background: 'white', 
                borderRadius: '15px', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                border: '1px solid #eee'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: '#38003c', color: 'white', textAlign: 'center' }}>
                            <th style={{ padding: '15px', position: 'sticky', right: 0, background: '#38003c', zIndex: 20, borderLeft: '2px solid #58005c' }}>الفريق / المدرب</th>
                            <th style={{ padding: '15px', background: '#00ff85', color: '#38003c', fontWeight:'bold', zIndex: 10 }}>المجموع</th>
                            {gameweeks.map(gw => (
                                <th key={gw} style={{ padding: '10px', minWidth: '60px', fontSize:'12px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>GW {gw}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((row, index) => (
                            <tr key={row.teamId} style={{ borderBottom: '1px solid #eee', textAlign: 'center', background: index % 2 === 0 ? 'white' : '#fcfcfc' }}>
                                {/* الخلية المثبتة */}
                                <td style={{ 
                                    padding: '12px', 
                                    position: 'sticky', 
                                    right: 0, 
                                    background: index % 2 === 0 ? 'white' : '#fcfcfc', 
                                    textAlign: 'right', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px', 
                                    borderLeft: '2px solid #eee',
                                    zIndex: 15
                                }}>
                                    <div style={{fontWeight:'bold', color:'#ccc', width:'20px', fontSize: '12px'}}>{index + 1}</div>
                                    <img 
                                        src={row.logoUrl || `/kits/${row.teamName}.png`} 
                                        style={{width:'30px', height:'30px', objectFit:'contain'}} 
                                        onError={(e) => { e.target.src = '/kits/default.png'; }}
                                    />
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{fontWeight:'bold', fontSize:'13px', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>{row.teamName}</div>
                                        <div style={{fontSize:'10px', color:'#888', whiteSpace: 'nowrap'}}>{row.managerName}</div>
                                    </div>
                                </td>
                                
                                {/* إجمالي النقاط */}
                                <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '15px', color: '#38003c', background: '#f0fff4', borderLeft: '1px solid #eee' }}>
                                    {row.totalScore}
                                </td>

                                {/* تاريخ الجولات */}
                                {gameweeks.map(gw => (
                                    <td key={gw} style={{ padding: '10px', color: row.history[gw] ? '#333' : '#ccc', fontSize: '13px' }}>
                                        {row.history[gw] !== undefined ? row.history[gw] : '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{marginTop:'15px', fontSize:'11px', color:'#888', backgroundColor: 'white', padding: '10px', borderRadius: '8px', display: 'inline-block'}}>
                💡 ملاحظة: النقاط المعروضة هي النقاط الصافية لكل جولة (بعد خصم نقاط الانتقالات الإضافية إن وجدت).
            </div>
        </div>
    );
};

export default LeagueStats;