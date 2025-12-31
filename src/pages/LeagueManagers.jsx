import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaUserTie, FaShieldAlt, FaCrown, FaArrowUp, FaArrowDown, FaUser, FaTrash, FaExternalLinkAlt } from "react-icons/fa";

const LeagueManagers = () => {
    const { user } = useContext(AuthContext); 
    const [managers, setManagers] = useState([]);
    const [league, setLeague] = useState(null);
    const navigate = useNavigate();
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const leagueRes = await API.get('/leagues/me').catch(() => null);
            const managersRes = await API.get('/leagues/managers');
            if(leagueRes) setLeague(leagueRes.data);
            setManagers(managersRes.data);
        } catch (error) { console.error(error); }
    };

    // ترقية داخل الدوري (League Admin)
    const handlePromote = async (memberId, name) => {
        if(!window.confirm(`هل أنت متأكد من ترقية ${name}؟`)) return;
        try {
            const { data } = await API.put('/leagues/promote', { memberId });
            setMessage(data.message);
            fetchData();
        } catch (err) { setMessage('فشل تنفيذ الطلب'); }
    };

    // سحب صلاحيات داخل الدوري
    const handleDemote = async (memberId, name) => {
        if(!window.confirm(`هل أنت متأكد من سحب الصلاحيات من ${name}؟`)) return;
        try {
            const { data } = await API.put('/leagues/demote', { memberId });
            setMessage(data.message);
            fetchData();
        } catch (err) { setMessage('فشل تنفيذ الطلب'); }
    };

    // ✅ دالة الطرد (حذف المستخدم نهائياً - System Admin)
    const handleKick = async (memberId, name) => {
        if(!window.confirm(`⚠️ تحذير: هل أنت متأكد من طرد اللاعب "${name}" وحذفه نهائياً من التطبيق؟`)) return;
        try {
            // استخدام رابط الحذف الذي أنشأناه في الباك-إند
            await API.delete(`/auth/${memberId}`);
            setMessage(`تم طرد ${name} بنجاح`);
            // تحديث القائمة محلياً
            setManagers(managers.filter(m => m._id !== memberId));
        } catch (err) { 
            setMessage(err.response?.data?.message || 'فشل عملية الطرد'); 
        }
    };

    // هل المستخدم الحالي هو مالك الدوري؟
    const isLeagueOwner = league && league.adminId === user._id;
    // هل المستخدم الحالي هو مسؤول النظام؟
    const isSystemAdmin = user && user.role === 'admin';

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl', background: '#f5f7fa', minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '15px' }}>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 15px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight:'bold', color:'#555' }}>⬅ عودة</button>
                <h1 style={{ margin: 0, color: '#38003c' }}>👥 إدارة المشاركين</h1>
            </div>

            {message && <div style={{background:'#e8f5e9', color:'green', padding:'15px', borderRadius:'8px', marginBottom:'20px', textAlign:'center', fontWeight:'bold', border:'1px solid #c8e6c9'}}>{message}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {managers.map(manager => {
                    let displayRole = 'لاعب';
                    let roleIcon = <FaUser />;
                    let roleColor = '#607d8b'; // رمادي

                    // 1. هل هو أدمن النظام؟
                    if (manager.role === 'admin') {
                        displayRole = 'مدير البطولة 👑';
                        roleIcon = <FaCrown />;
                        roleColor = '#e65100'; // برتقالي
                    } 
                    // 2. هل لديه فريق وهو مالكه؟
                    else if (manager.teamId && manager.teamId.managerId) {
                        const ownerId = manager.teamId.managerId._id 
                                        ? manager.teamId.managerId._id.toString() 
                                        : manager.teamId.managerId.toString();
                        
                        const currentManagerId = manager._id.toString();

                        if (ownerId === currentManagerId) {
                            displayRole = 'مناجير (مالك) 👔';
                            roleIcon = <FaUserTie />;
                            roleColor = '#38003c'; // بنفسجي
                        }
                    }

                    return (
                        <div key={manager._id} style={{ background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center', borderTop: `5px solid ${roleColor}`, position:'relative' }}>
                            
                            {/* أيقونة الرتبة */}
                            <div style={{ width: '70px', height: '70px', background: '#f9f9f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '28px', color: roleColor, boxShadow:'0 2px 5px rgba(0,0,0,0.05)' }}>
                                {roleIcon}
                            </div>
                            
                            <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{manager.username}</h3>
                            <p style={{ margin: '0 0 15px 0', color: roleColor, fontSize: '14px', fontWeight:'bold' }}>{displayRole}</p>

                            {/* عرض FPL ID مع رابط */}
                            {manager.fplId && (
                                <div style={{marginBottom:'15px', fontSize:'13px', color:'#666'}}>
                                    <span style={{fontWeight:'bold'}}>FPL ID:</span> {manager.fplId}
                                    <a href={`https://fantasy.premierleague.com/entry/${manager.fplId}/history`} target="_blank" rel="noreferrer" style={{marginRight:'5px', color:'#38003c'}}>
                                        <FaExternalLinkAlt size={10}/>
                                    </a>
                                </div>
                            )}

                            {manager.teamId ? (
                                <div style={{ background: '#e0f2f1', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom:'15px', fontSize:'14px' }}>
                                    <FaShieldAlt color="#009688" />
                                    <span style={{ fontWeight: 'bold', color: '#00796b' }}>{manager.teamId.name}</span>
                                </div>
                            ) : (
                                <div style={{marginBottom:'15px', padding:'10px', background:'#f5f5f5', borderRadius:'8px', color:'#999', fontSize:'13px'}}>🚫 بدون فريق</div>
                            )}

                            {/* أزرار التحكم */}
                            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap' }}>
                                
                                {/* أزرار مالك الدوري (الترقية/السحب) */}
                                {isLeagueOwner && manager._id !== user._id && (
                                    <>
                                        {/* هنا يمكنك إضافة منطق الترقية لإدارة الدوري إذا كان لديك حقل isLeagueAdmin */}
                                        <button onClick={() => handlePromote(manager._id, manager.username)} style={{background:'#e3f2fd', color:'#1565c0', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}> <FaArrowUp /> ترقية </button>
                                        <button onClick={() => handleDemote(manager._id, manager.username)} style={{background:'#fff3e0', color:'#e65100', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}> <FaArrowDown /> سحب </button>
                                    </>
                                )}

                                {/* ✅ زر الطرد (يظهر فقط لمسؤول النظام) */}
                                {isSystemAdmin && manager._id !== user._id && (
                                    <button 
                                        onClick={() => handleKick(manager._id, manager.username)} 
                                        style={{
                                            background: '#ffebee', 
                                            color: '#c62828', 
                                            border: '1px solid #ffcdd2', 
                                            padding: '6px 12px', 
                                            borderRadius: '6px', 
                                            cursor: 'pointer', 
                                            fontSize: '12px', 
                                            fontWeight: 'bold', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '4px'
                                        }}
                                        title="حذف المستخدم نهائياً"
                                    > 
                                        <FaTrash /> طرد 
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export default LeagueManagers;