import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { TbSoccerField, TbReplace } from "react-icons/tb";
import { 
    FaUserTie, FaRunning, FaTrophy, FaCalendarAlt, FaChartBar, FaUsers, 
    FaSync, FaWhatsapp, FaCopy, FaShareAlt, FaCamera, FaCheckCircle, 
    FaLock, FaTimes, FaCheck, FaCrown, FaExclamationTriangle, FaSkullCrossbones, FaInfoCircle, FaFileExcel
} from "react-icons/fa";

const Dashboard = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // --- إضافة منطق اكتشاف حجم الشاشة ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [league, setLeague] = useState(null);
  const [plTeams, setPlTeams] = useState([]); 
  const [leagueTeams, setLeagueTeams] = useState([]);
  const [pendingTeams, setPendingTeams] = useState([]); 
  const [pendingSubs, setPendingSubs] = useState([]);   
  const [isApproved, setIsApproved] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null);
  const [leagueName, setLeagueName] = useState('');
  const [leagueCode, setLeagueCode] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(''); 
  const [targetTeamId, setTargetTeamId] = useState(''); 
  const [message, setMessage] = useState('');
  const [manualGw, setManualGw] = useState(17);
  const [nextOpponent, setNextOpponent] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); 
  const [myTeamData, setMyTeamData] = useState(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null); 
  const [penaltyExcelFile, setPenaltyExcelFile] = useState(null);

  const isLeagueCreator = league && league.adminId === user._id;
  // تحديث رابط السيرفر ليعمل على Render
  const SERVER_URL = 'https://fpl-zeddine.onrender.com'; 

  useEffect(() => {
    fetchPLTeams();
    fetchMyLeagueData();
    if (user.teamId) {
        checkMyTeamStatus();
        fetchNextOpponent(); 
        if (user.teamId !== 'created' && user.teamId !== 'joined') {
            fetchMyTeamDetails(); 
        }
    }
    if (user.leagueId) fetchLeagueTeams();
  }, [user]);

  const fetchMyLeagueData = async () => {
      try {
          const { data } = await API.get('/leagues/me');
          setLeague(data);
          if (data && data.adminId === user._id) {
              fetchPendingTeams();
              fetchPendingSubs(); 
          }
      } catch (error) { console.log("No league found"); }
  };

  const fetchPLTeams = async () => { try { const { data } = await API.get('/teams/pl-teams'); setPlTeams(data); } catch (error) {} };
  const fetchLeagueTeams = async () => { try { const { data } = await API.get('/leagues/teams'); setLeagueTeams(data); } catch (error) {} };
  const fetchPendingTeams = async () => { try { const { data } = await API.get('/teams/pending'); setPendingTeams(data); } catch (error) {} };
  const fetchPendingSubs = async () => { 
      try { 
          const { data } = await API.get('/leagues/teams'); 
          const subs = data.filter(t => t.substitutionRequest && t.substitutionRequest.memberId);
          setPendingSubs(subs);
      } catch (error) {} 
  };
  const checkMyTeamStatus = async () => { try { const { data } = await API.get('/teams/me'); setIsApproved(data.isApproved); } catch (error) {} };
  const fetchMyTeamDetails = async () => {
      try {
          const { data } = await API.get('/teams/me');
          setMyTeamData(data);
      } catch (error) { console.error(error); }
  };
  const fetchNextOpponent = async () => {
    try {
        const { data } = await API.get('/fixtures/next-opponent');
        setNextOpponent(data);
    } catch (error) { console.error(error); }
  };

  // المكونات الفرعية (إشعارات الجوائز والعقوبات)
  const renderRewardNotice = () => {
    if (!league || !league.lastGwWinner || !myTeamData) return null;
    const isWinner = league.lastGwWinner.teamId === myTeamData._id;
    if (!isWinner) return null;

    return (
        <div style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
            color: '#38003c',
            padding: isMobile ? '15px' : '20px',
            borderRadius: '15px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: '15px',
            boxShadow: '0 10px 25px rgba(255, 215, 0, 0.4)',
            textAlign: isMobile ? 'center' : 'right'
        }}>
            <div style={{ fontSize: isMobile ? '35px' : '45px' }}>🏆</div>
            <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: isMobile ? '18px' : '22px', fontWeight: '900' }}>👑 مبروك! بطل الجولة {league.lastGwWinner.gameweek}</h3>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: isMobile ? '14px' : '16px' }}>
                    حقق فريقكم ({league.lastGwWinner.points}) نقطة. تمت إضافة "نقطة ذهبية" ✨
                </p>
            </div>
        </div>
    );
  };

  const renderPenaltyNotice = () => {
    if (!myTeamData || !myTeamData.missedDeadlines || myTeamData.missedDeadlines === 0) return null;
    const penaltyConfigs = {
        1: { bg: "#fff3e0", color: "#e65100", icon: <FaInfoCircle />, title: "تنبيه المخالفة 1", text: "يرجى مراجعة المناجير لتجنب الخصم!" },
        2: { bg: "#fbe9e7", color: "#d84315", icon: <FaExclamationTriangle />, title: "خصم نقطة!", text: "تم خصم نقطة واحدة بسبب تكرار المخالفة." },
        3: { bg: "#ffebee", color: "#c62828", icon: <FaExclamationTriangle />, title: "تحذير أخير (-2 pts)", text: "المخالفة القادمة تعني الإقصاء!" },
        4: { bg: "#212121", color: "#ffffff", icon: <FaSkullCrossbones />, title: "إقصاء الفريق", text: "تم إقصاء الفريق نهائياً لتكرار المخالفات." }
    };
    const level = myTeamData.missedDeadlines >= 4 ? 4 : myTeamData.missedDeadlines;
    const config = penaltyConfigs[level];

    return (
        <div style={{
            backgroundColor: config.bg, color: config.color, padding: '15px', borderRadius: '12px', marginBottom: '25px', border: `2px solid ${config.color}`,
            display: 'flex', alignItems: 'center', gap: '15px'
        }}>
            <div style={{ fontSize: '30px' }}>{config.icon}</div>
            <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{config.title}</h3>
                <p style={{ margin: 0, fontSize: '13px', fontWeight:'bold' }}>{config.text}</p>
            </div>
        </div>
    );
  };

  // دوال المعالجة (نفس المنطق الخاص بك)
  const handleSyncGameweeks = async () => {
    if (!league) return;
    if (!window.confirm('مزامنة المواعيد؟')) return;
    try { setIsSyncing(true); setMessage('جاري المزامنة... ⏳'); const { data } = await API.post('/gameweek/sync'); setMessage(data.message); } 
    catch (err) { setMessage('فشلت المزامنة'); } finally { setIsSyncing(false); }
  };

  const handleImportExcel = async () => {
    if (!excelFile) return alert("اختر ملف Excel");
    const formData = new FormData();
    formData.append('file', excelFile); formData.append('leagueId', league._id);
    try { setIsSyncing(true); const { data } = await API.post('/fixtures/import-excel', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); setMessage(`✅ ${data.message}`); setExcelFile(null); } 
    catch (err) { setMessage('فشل استيراد النتائج'); } finally { setIsSyncing(false); }
  };

  const handleImportPenalties = async () => {
    if (!penaltyExcelFile) return alert("اختر ملف العقوبات");
    const formData = new FormData();
    formData.append('file', penaltyExcelFile); formData.append('leagueId', league._id);
    try { setIsSyncing(true); const { data } = await API.post('/teams/import-penalties-excel', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); setMessage(`✅ ${data.message}`); setPenaltyExcelFile(null); fetchLeagueTeams(); fetchMyTeamDetails(); } 
    catch (err) { setMessage('فشل الاستيراد'); } finally { setIsSyncing(false); }
  };

  const handleApproveManager = async (teamId) => { try { await API.put('/teams/approve-manager', { teamId }); setMessage('✅ تم الاعتماد'); fetchPendingTeams(); } catch (err) { setMessage('فشل'); } };
  const handleApproveSub = async (teamId) => { if(!window.confirm('موافقة على التغيير؟')) return; try { await API.put('/teams/approve-sub', { teamId }); setMessage('✅ تم التغيير'); fetchPendingSubs(); fetchLeagueTeams(); } catch (err) { setMessage('فشل العملية'); } };
  const handleRejectSub = async (teamId) => { if(!window.confirm('رفض الطلب؟')) return; try { await API.put('/teams/reject-sub', { teamId }); setMessage('تم الرفض'); fetchPendingSubs(); } catch (err) { setMessage('فشل'); } };
  const handleRequestSub = async (memberId) => { if(!window.confirm('طلب تغيير؟')) return; try { await API.post('/teams/request-sub', { memberId, reason: 'طلب مناجير' }); setMessage('✅ تم الإرسال للمدير'); setShowSubModal(false); fetchMyTeamDetails(); } catch (err) { setMessage('فشل الطلب'); } };
  const handleChangeManager = async (memberId, memberName) => { if (!window.confirm(`تعيين ${memberName} مناجيراً؟`)) return; try { await API.put('/teams/change-manager', { newManagerId: memberId }); logout(); navigate('/login'); } catch (err) { setMessage('فشلت العملية'); } };
  const handleCreateLeague = async () => { try { const { data } = await API.post('/leagues', { name: leagueName }); setMessage(`تم إنشاء: ${data.name}`); fetchMyLeagueData(); } catch (err) { setMessage('خطأ'); } };
  const handleGenerateFixtures = async () => { try { if (!league) return; const { data } = await API.post('/fixtures/generate', { leagueId: league._id }); setMessage(data.message); } catch (err) { setMessage('خطأ'); } };
  const handleCalculateScores = async () => { if(!league) return; if(!window.confirm('حساب النقاط؟')) return; try { const { data } = await API.post('/gameweek/calculate', { leagueId: league._id }); setMessage(data.message); fetchMyTeamDetails(); fetchMyLeagueData(); } catch (err) { setMessage('فشل الحساب'); } };
  const handleUpdateTable = async () => { if(!league) return; if(!window.confirm('تحديث الترتيب؟')) return; try { const { data } = await API.put('/fixtures/update-table', { leagueId: league._id }); setMessage(data.message); } catch (err) { setMessage('فشل التحديث'); } };
  const handleSyncPlayers = async () => { if(!league) return; if(!window.confirm('مزامنة تاريخ الهدافين؟')) return; try { setMessage('جاري المزامنة... ⏳'); const { data } = await API.post('/leagues/sync-players', { leagueId: league._id }); setMessage(data.message); } catch (err) { setMessage('فشل المزامنة'); } };
  const handleSetGameweek = async () => { try { const { data } = await API.put('/leagues/set-gameweek', { leagueId: league._id, gw: manualGw }); setMessage(data.message); fetchMyLeagueData(); } catch (err) { setMessage('فشل'); } };
  const handleJoinLeague = async () => { try { const { data } = await API.post('/leagues/join', { code: leagueCode }); setMessage(data.message); updateUser({ ...user, leagueId: 'joined' }); } catch (err) { setMessage('كود خاطئ'); } };
  const handleCreateTeam = async () => { if (!selectedTeam) { setMessage('اختر فريقاً'); return; } try { const { data } = await API.post('/teams', { teamName: selectedTeam }); setMessage(data.message); updateUser({ ...user, teamId: 'created' }); setIsApproved(data.team.isApproved); } catch (err) { setMessage('فشل'); } };
  const handleJoinTeamRequest = async () => { try { if(!targetTeamId) return; const { data } = await API.post('/teams/join-request', { teamId: targetTeamId }); setMessage(data.message); setSelectionMode(null); } catch (err) { setMessage('فشل'); } };

  const shareText = league ? `انضم إلينا في بطولة ${league.name} 🏆\nالكود: *${league.code}*` : '';
  const handleCopyCode = () => { if(league?.code) { navigator.clipboard.writeText(league.code); setMessage('تم النسخ! 📋'); setTimeout(() => setMessage(''), 3000); } };
  const handleShareNative = async () => { if (navigator.share) { try { await navigator.share({ title: 'البطولة', text: shareText, url: window.location.origin }); } catch (err) {} } else { handleCopyCode(); } };
  const handleShareWhatsapp = () => { const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`; window.open(url, '_blank'); };

  const handleLogoUpload = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const formData = new FormData(); formData.append('logo', file);
      setUploading(true);
      try { await API.post('/leagues/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); setMessage('تم الرفع! 📸'); fetchMyLeagueData(); } 
      catch (err) { setMessage('فشل الرفع'); } finally { setUploading(false); }
  };

  return (
    <div style={{ padding: isMobile ? '20px' : '40px', fontFamily: 'Arial, sans-serif', direction: 'rtl', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '30px', borderBottom: '1px solid #ddd', paddingBottom: '20px', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {league?.logoUrl && (
                <img src={`${SERVER_URL}${league.logoUrl}`} alt="Logo" style={{ width: '55px', height: '55px', borderRadius: '50%', border: '2px solid #38003c', backgroundColor: 'white' }} />
            )}
            <div>
                <h1 style={{ margin: 0, fontSize: isMobile ? '22px' : '28px' }}>لوحة التحكم 📱</h1>
                <p style={{ margin: '5px 0', color: '#666', fontSize: '13px' }}>
                    أهلاً، {user.username} {league && <span style={{ color: '#1565c0', fontWeight: 'bold' }}> • GW {league.currentGw}</span>}
                </p>
            </div>
        </div>
        <button onClick={logout} style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>خروج</button>
      </header>

      {message && <div style={{ backgroundColor: '#e0f7fa', padding: '12px', marginBottom: '20px', borderRadius: '8px', color: '#006064', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>{message}</div>}

      {renderRewardNotice()}
      {renderPenaltyNotice()}

      {/* Next Opponent */}
      {user.teamId && nextOpponent && nextOpponent.hasFixture && nextOpponent.opponent && (
        <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#38003c', borderRight: '4px solid #38003c', paddingRight: '10px', marginBottom: '15px' }}>🔥 مواجهتك القادمة</h3>
            <div onClick={() => navigate(`/team-history/${nextOpponent.opponent._id}`, { state: { team: nextOpponent.opponent, startGw: nextOpponent.gameweek } })} style={{ background: 'linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%)', color: 'white', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'white', padding: '5px', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {nextOpponent.opponent.logoUrl && <img src={nextOpponent.opponent.logoUrl} style={{ width: '35px', height: '35px', objectFit: 'contain' }} />}
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', opacity: 0.8 }}>{nextOpponent.isHome ? 'بملعبك' : 'خارج ملعبك'} • GW{nextOpponent.gameweek}</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{nextOpponent.opponent.name}</div>
                    </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', opacity: 0.3 }}>VS</div>
            </div>
        </div>
      )}

      {/* Admin Tools */}
      {user.role === 'admin' && (
        <div style={{ backgroundColor: '#f3e5f5', padding: isMobile ? '15px' : '25px', borderRadius: '15px', marginBottom: '40px', border: '1px solid #ce93d8' }}>
          <h3 style={{ marginTop: 0, color: '#38003c', textAlign: 'center' }}>🛠 إدارة البطولة</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
              
             <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h4 style={{marginTop:0, fontSize: '15px'}}>1. الإعدادات والمشاركة</h4>
              {league ? (
                  <div>
                      <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1b5e20', marginBottom: '10px' }}>{league.code}</div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <button onClick={handleCopyCode} style={{ background: '#eee', border: 'none', padding: '6px 10px', borderRadius: '5px', fontSize:'11px' }}>نسخ</button>
                              <button onClick={handleShareWhatsapp} style={{ background: '#25D366', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '5px', fontSize:'11px' }}>واتساب</button>
                          </div>
                      </div>
                      <div style={{marginTop:'15px'}}>
                          <input type="file" id="logoUpload" accept="image/*" onChange={handleLogoUpload} style={{display:'none'}} />
                          <label htmlFor="logoUpload" style={{ background: '#2196f3', color: 'white', padding: '8px', borderRadius: '5px', cursor: 'pointer', display:'block', textAlign:'center', fontSize:'12px' }}>
                              <FaCamera /> {uploading ? 'جاري الرفع...' : 'تغيير الشعار'}
                          </label>
                      </div>
                  </div>
              ) : (
                  <div style={{display:'flex', gap:'5px'}}>
                      <input type="text" placeholder="اسم البطولة" value={leagueName} onChange={(e) => setLeagueName(e.target.value)} style={{ padding: '8px', flex: 1, borderRadius:'5px', border:'1px solid #ddd' }} />
                      <button onClick={handleCreateLeague} style={{ padding: '8px', backgroundColor: '#38003c', color: 'white', border: 'none', borderRadius:'5px' }}>إنشاء</button>
                  </div>
              )}
            </div>

            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px' }}>
              <h4 style={{marginTop:0, fontSize: '15px'}}>2. التحكم والاستيراد</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={handleSyncGameweeks} style={{ padding: '8px', background: '#38003c', color: '#00ff85', border: 'none', borderRadius: '5px', fontWeight: 'bold', fontSize: '12px' }}><FaSync /> مزامنة المواعيد</button>
                  
                  <div style={{ padding: '8px', border: '1px solid #2e7d32', borderRadius: '8px', background: '#f1f8e9' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2e7d32', marginBottom: '5px' }}>استيراد النتائج (Excel):</div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input type="file" onChange={(e) => setExcelFile(e.target.files[0])} style={{ fontSize: '10px', flex: 1 }} />
                        <button onClick={handleImportExcel} style={{ padding: '4px 8px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', fontSize: '10px' }}>رفع</button>
                    </div>
                  </div>

                  <button onClick={handleCalculateScores} style={{ padding: '8px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px' }}>1. حساب النقاط</button>
                  <button onClick={handleUpdateTable} style={{ padding: '8px', background: '#673ab7', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px' }}>2. تحديث الترتيب</button>
              </div>
            </div>

            {/* Tables for requests */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '15px' }}>
                <div style={{ flex: 1, backgroundColor: '#fff3e0', padding: '12px', borderRadius: '10px', border: '1px solid #ffcc80' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>🔔 طلبات الفرق</h4>
                    {pendingTeams.length === 0 ? <p style={{fontSize:'12px', textAlign:'center'}}>لا توجد طلبات</p> : (
                        <table style={{ width: '100%', fontSize: '12px' }}><tbody>{pendingTeams.map(team => (<tr key={team._id}><td style={{padding:'5px'}}>{team.name}</td><td style={{textAlign:'left'}}><button onClick={() => handleApproveManager(team._id)} style={{background:'#2e7d32', color:'white', border:'none', padding:'4px 8px', borderRadius:'4px'}}>قبول</button></td></tr>))}</tbody></table>
                    )}
                </div>
                <div style={{ flex: 1, backgroundColor: '#e3f2fd', padding: '12px', borderRadius: '10px', border: '1px solid #90caf9' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>🔄 طلبات التغيير</h4>
                    {pendingSubs.length === 0 ? <p style={{fontSize:'12px', textAlign:'center'}}>لا توجد طلبات</p> : (
                        <table style={{ width: '100%', fontSize: '12px' }}><tbody>{pendingSubs.map(team => (<tr key={team._id}><td style={{padding:'5px'}}>{team.name}</td><td style={{textAlign:'left'}}><button onClick={() => handleApproveSub(team._id)} style={{background:'#2e7d32', color:'white', border:'none', padding:'4px 8px', borderRadius:'4px'}}><FaCheck/></button></td></tr>))}</tbody></table>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Career Section */}
      <div>
        <h3 style={{ color: '#38003c', borderRight: '4px solid #38003c', paddingRight: '10px', marginBottom: '20px' }}>⚽ مسيرتي الكروية</h3>
        {(league || user.leagueId) ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '12px', marginTop: '10px' }}>
                <button onClick={() => navigate('/fixtures')} style={{ padding: '15px 10px', background: 'white', color: '#38003c', border: '2px solid #38003c', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}><FaCalendarAlt size={20} /> المباريات</button>
                <button onClick={() => navigate('/standings')} style={{ padding: '15px 10px', background: 'white', color: '#38003c', border: '2px solid #38003c', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}><FaTrophy size={20} /> الترتيب</button>
                <button onClick={() => navigate('/stats')} style={{ padding: '15px 10px', background: 'white', color: '#38003c', border: '2px solid #38003c', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}><FaChartBar size={20} /> الفرق</button>
                <button onClick={() => navigate('/player-stats')} style={{ padding: '15px 10px', background: 'white', color: '#38003c', border: '2px solid #38003c', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}><FaRunning size={20} /> الهدافين</button>
                <button onClick={() => navigate('/awards')} style={{ padding: '15px 10px', background: 'white', color: '#38003c', border: '2px solid #38003c', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}><FaTrophy size={20} /> الجوائز</button>
                {user.role === 'admin' && <button onClick={() => navigate('/managers')} style={{ padding: '15px 10px', background: 'white', color: '#38003c', border: '2px solid #38003c', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}><FaUsers size={20} /> المشاركون</button>}
            </div>
        ) : (
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '15px', textAlign: 'center' }}>
                <p>لم تنضم لأي بطولة بعد</p>
                <input type="text" placeholder="كود البطولة" value={leagueCode} onChange={(e) => setLeagueCode(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '70%', marginBottom: '10px' }} />
                <button onClick={handleJoinLeague} style={{ padding: '10px 25px', background: '#38003c', color: 'white', border: 'none', borderRadius: '8px', width: '100%' }}>انضمام الآن</button>
            </div>
        )}

        {/* Team Management */}
        {(league || user.leagueId) && (
            <div style={{ marginTop: '30px' }}>
                {!user.teamId ? (
                    <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '15px', textAlign: 'center' }}>
                        <h4 style={{marginBottom:'15px'}}>خطوتك التالية: إنشاء أو انضمام لفريق</h4>
                        {!selectionMode && (
                            <div style={{ display:'flex', gap:'10px', flexDirection:'column' }}>
                                <button onClick={() => { setSelectionMode('create'); fetchLeagueTeams(); }} style={{ padding:'12px', background:'#38003c', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold' }}>أنا مناجير (إنشاء فريق)</button>
                                <button onClick={() => { setSelectionMode('join'); fetchLeagueTeams(); }} style={{ padding:'12px', background:'#00ff85', color:'#38003c', border:'none', borderRadius:'10px', fontWeight:'bold' }}>أنا لاعب (انضمام لفريق)</button>
                            </div>
                        )}
                        {selectionMode === 'create' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px', maxHeight: '300px', overflowY: 'auto', background: '#fff', padding: '10px', borderRadius: '10px' }}>
                                {plTeams.map((team) => (
                                    <div key={team.name} onClick={() => !leagueTeams.some(t => t.name === team.name) && setSelectedTeam(team.name)} style={{ border: selectedTeam === team.name ? '2px solid #00ff85' : '1px solid #eee', padding: '5px', borderRadius: '8px', opacity: leagueTeams.some(t => t.name === team.name) ? 0.3 : 1 }}>
                                        <img src={team.logo || team.logoUrl} alt={team.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                        <div style={{ fontSize: '10px' }}>{team.name}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {selectionMode && <button onClick={() => setSelectionMode(null)} style={{marginTop:'10px', fontSize:'12px', color:'#666', border:'none', background:'none'}}>إلغاء</button>}
                        {selectedTeam && <button onClick={handleCreateTeam} style={{marginTop:'15px', padding:'10px', width:'100%', background:'#38003c', color:'white', border:'none', borderRadius:'8px'}}>تأكيد {selectedTeam}</button>}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        {isApproved ? (
                            <div style={{display:'flex', gap:'10px', flexDirection:'column'}}>
                                <button onClick={() => navigate('/my-team')} style={{ padding: '15px', background: '#38003c', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                                    <TbSoccerField size={24} /> إدارة تشكيلتي
                                </button>
                                {myTeamData && myTeamData.managerId && (myTeamData.managerId._id || myTeamData.managerId) === user._id && (
                                    <button onClick={() => setShowSubModal(true)} style={{ padding: '12px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '12px', fontSize:'14px', fontWeight:'bold' }}>
                                        <TbReplace /> إدارة أعضاء الفريق
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div style={{padding:'15px', background:'#fff3e0', borderRadius:'10px', color: '#e65100', fontSize:'14px', fontWeight:'bold'}}>⏳ بانتظار موافقة مدير البطولة...</div>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Styles & Animation */}
      <style>{`
        .sync-icon-spin { animation: spin 1s linear infinite; } 
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Modal Overlay */}
      {showSubModal && (
          <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.7)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000, padding: '20px'}}>
              <div style={{background:'white', padding:'20px', borderRadius:'15px', width:'100%', maxWidth:'400px'}}>
                  <h4 style={{marginTop:0, borderBottom:'1px solid #eee', paddingBottom:'10px'}}>إدارة أعضاء الفريق</h4>
                  {myTeamData.members?.filter(m => m._id !== user._id).map(member => (
                      <div key={member._id} style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                          <span style={{fontWeight:'bold', fontSize:'14px'}}>{member.username}</span>
                          <div style={{display:'flex', gap:'5px'}}>
                              <button onClick={() => handleRequestSub(member._id)} style={{padding:'5px 10px', background:'#d32f2f', color:'white', border:'none', borderRadius:'5px', fontSize:'11px'}}>تغيير</button>
                          </div>
                      </div>
                  ))}
                  <button onClick={() => setShowSubModal(false)} style={{marginTop:'20px', width:'100%', padding:'10px', background:'#333', color:'white', border:'none', borderRadius:'8px'}}>إغلاق</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;