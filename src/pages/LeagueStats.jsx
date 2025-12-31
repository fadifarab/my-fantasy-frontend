import { useState, useEffect } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { FaChartBar, FaTable } from "react-icons/fa";

const LeagueStats = () => {
    const [stats, setStats] = useState([]);
    const [currentGw, setCurrentGw] = useState(1);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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

    // توليد مصفوفة للجولات من 1 إلى الجولة الحالية
    const gameweeks = Array.from({ length: currentGw }, (_, i) => i + 1);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', background: '#f5f7fa', minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 15px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>⬅ عودة</button>
                <h1 style={{ margin: 0, color: '#38003c' }}><FaChartBar /> إحصائيات البطولة</h1>
            </div>

            <div style={{ overflowX: 'auto', background: 'white', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: '#38003c', color: 'white', textAlign: 'center' }}>
                            <th style={{ padding: '15px', position: 'sticky', right: 0, background: '#38003c', zIndex: 10 }}>الفريق / المدرب</th>
                            <th style={{ padding: '15px', background: '#00ff85', color: '#38003c', fontWeight:'bold' }}>المجموع</th>
                            {gameweeks.map(gw => (
                                <th key={gw} style={{ padding: '10px', minWidth: '60px', fontSize:'12px' }}>GW{gw}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((row, index) => (
                            <tr key={row.teamId} style={{ borderBottom: '1px solid #eee', textAlign: 'center', background: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                <td style={{ padding: '12px', position: 'sticky', right: 0, background: index % 2 === 0 ? 'white' : '#f9f9f9', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid #eee' }}>
                                    <div style={{fontWeight:'bold', color:'#999', width:'20px'}}>{index + 1}</div>
                                    <img src={row.logoUrl} style={{width:'30px', height:'30px', objectFit:'contain'}} />
                                    <div>
                                        <div style={{fontWeight:'bold', fontSize:'14px'}}>{row.teamName}</div>
                                        <div style={{fontSize:'11px', color:'#666'}}>{row.managerName}</div>
                                    </div>
                                </td>
                                
                                <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '16px', color: '#38003c', background: '#e0f2f1' }}>
                                    {row.totalScore}
                                </td>

                                {gameweeks.map(gw => (
                                    <td key={gw} style={{ padding: '10px', color: row.history[gw] ? '#333' : '#ccc' }}>
                                        {row.history[gw] !== undefined ? row.history[gw] : '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{marginTop:'10px', fontSize:'12px', color:'#666'}}>* النقاط المعروضة هي النقاط الصافية (بعد خصم الانتقالات).</div>
        </div>
    );
};

export default LeagueStats;