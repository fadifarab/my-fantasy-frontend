import { useState, useEffect } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { FaChartBar } from "react-icons/fa";

const LeagueStats = () => {
    const [stats, setStats] = useState([]);
    const [currentGw, setCurrentGw] = useState(1);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // --- اكتشاف حجم الشاشة ---
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await API.get('/leagues/stats');
                setStats(data.stats);
                setCurrentGw(data.currentGw);
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchStats();
    }, []);

    if(loading) return <div style={{padding:'40px', textAlign:'center'}}>جاري حساب الإحصائيات... 🧮</div>;

    const gameweeks = Array.from({ length: currentGw }, (_, i) => i + 1);

    return (
        <div style={{ padding: isMobile ? '10px' : '20px', fontFamily: 'Arial', direction: 'rtl', background: '#f5f7fa', minHeight: '100vh' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '10px' }}>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 12px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>⬅ عودة</button>
                <h2 style={{ margin: 0, color: '#38003c', fontSize: isMobile ? '18px' : '24px' }}><FaChartBar /> إحصائيات البطولة</h2>
            </div>

            {/* Table Container with Scroll */}
            <div style={{ 
                overflowX: 'auto', 
                background: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                WebkitOverflowScrolling: 'touch' // تمرير ناعم في الآيفون
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '600px' : '900px' }}>
                    <thead>
                        <tr style={{ background: '#38003c', color: 'white', textAlign: 'center' }}>
                            {/* تثبيت العمود الأول في الهاتف */}
                            <th style={{ 
                                padding: isMobile ? '10px' : '15px', 
                                position: 'sticky', 
                                right: 0, 
                                background: '#38003c', 
                                zIndex: 20,
                                fontSize: isMobile ? '12px' : '14px'
                            }}>الفريق</th>
                            
                            <th style={{ padding: '10px', background: '#00ff85', color: '#38003c', fontSize: isMobile ? '12px' : '14px' }}>المجموع</th>
                            
                            {gameweeks.map(gw => (
                                <th key={gw} style={{ padding: '8px', minWidth: '50px', fontSize: isMobile ? '11px' : '12px' }}>GW{gw}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((row, index) => (
                            <tr key={row.teamId} style={{ borderBottom: '1px solid #eee', textAlign: 'center', background: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                
                                {/* خلية الفريق المثبتة */}
                                <td style={{ 
                                    padding: '8px 10px', 
                                    position: 'sticky', 
                                    right: 0, 
                                    background: index % 2 === 0 ? 'white' : '#f9f9f9', 
                                    textAlign: 'right', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    borderLeft: '1px solid #eee',
                                    zIndex: 10
                                }}>
                                    <div style={{fontWeight:'bold', color:'#999', width:'15px', fontSize: '12px'}}>{index + 1}</div>
                                    <img src={row.logoUrl} style={{width: isMobile ? '25px' : '30px', height: isMobile ? '25px' : '30px', objectFit:'contain'}} />
                                    <div>
                                        <div style={{fontWeight:'bold', fontSize: isMobile ? '12px' : '14px', whiteSpace: 'nowrap'}}>{row.teamName}</div>
                                        {!isMobile && <div style={{fontSize:'11px', color:'#666'}}>{row.managerName}</div>}
                                    </div>
                                </td>
                                
                                <td style={{ padding: '10px', fontWeight: 'bold', fontSize: isMobile ? '14px' : '16px', color: '#38003c', background: '#e0f2f1' }}>
                                    {row.totalScore}
                                </td>

                                {gameweeks.map(gw => (
                                    <td key={gw} style={{ padding: '8px', fontSize: isMobile ? '12px' : '13px', color: row.history[gw] ? '#333' : '#ccc' }}>
                                        {row.history[gw] !== undefined ? row.history[gw] : '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div style={{marginTop:'12px', fontSize: isMobile ? '10px' : '12px', color:'#666', textAlign: 'center'}}>
                * النقاط المعروضة هي النقاط الصافية (بعد خصم الانتقالات).<br/>
                {isMobile && "مرر الجدول لليسار لمشاهدة باقي الجولات ⬅️"}
            </div>
        </div>
    );
};

export default LeagueStats;