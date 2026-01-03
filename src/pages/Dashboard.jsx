import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { TbSoccerField, TbReplace } from "react-icons/tb";
import { 
    FaUserTie, FaRunning, FaTrophy, FaCalendarAlt, FaChartBar, FaUsers, 
    FaSync, FaWhatsapp, FaCopy, FaShareAlt, FaCamera, FaCheckCircle, 
    FaLock, FaTimes, FaCheck, FaCrown, FaExclamationTriangle, FaSkullCrossbones, FaInfoCircle, FaFileExcel, FaClock
} from "react-icons/fa";

const Dashboard = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
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

  // 🆕 حالات ملفات الإكسل الجديدة (استيراد البيانات التاريخية)
  const [excelFile, setExcelFile] = useState(null); 
  const [penaltyExcelFile, setPenaltyExcelFile] = useState(null);

  // 🆕 ميزات إضافية: العداد والوميض
  const [deadlineData, setDeadlineData] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [needsLineupUpdate, setNeedsLineupUpdate] = useState(false);

  const isLeagueCreator = league && league.adminId === user._id;
  // 🛠 إصلاح SERVER_URL لضمان عمل اللوغو على كل البيئات
  const SERVER_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : ''; 

  useEffect(() => {
    fetchPLTeams();
    fetchMyLeagueData();
    fetchDeadlineStatus(); // جلب الديدلاين
    if (user.teamId) {
        checkMyTeamStatus();
        fetchNextOpponent(); 
        if (user.teamId !== 'created' && user.teamId !== 'joined') {
            fetchMyTeamDetails(); 
            checkIfLineupNeeded(); // فحص التشكيلة
        }
    }
    if (user.leagueId) fetchLeagueTeams();
  }, [user]);

  // دالة العداد والإشعار (إضافة برمجية)
  const fetchDeadlineStatus = async () => {
    try {
        const { data } = await API.get('/gameweek/status');
        setDeadlineData(data);
    } catch (err) { console.error("Deadline error"); }
  };

  const checkIfLineupNeeded = async () => {
    try {
        const { data: status } = await API.get('/gameweek/status');
        const nextGw = status.nextGwId || (status.id + 1);
        const { data: teamGwData } = await API.get(`/gameweek/team/${user.teamId}/${nextGw}`);
        if (teamGwData && teamGwData.isInherited) {
            setNeedsLineupUpdate(true);
        } else {
            setNeedsLineupUpdate(false);
        }
    } catch (err) { 
        if (err.response && err.response.status === 404) {
            setNeedsLineupUpdate(true);
        }
    }
  };

  useEffect(() => {
    if (!deadlineData) return;
    const timer = setInterval(() => {
        const now = new Date().getTime();
        const dest = new Date(deadlineData.deadline_time).getTime();
        const diff = dest - now;
        if (diff <= 0) {
            setTimeLeft("انتهى وقت التعديل ⛔");
            clearInterval(timer);
        } else {
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${d}ي ${h}س ${m}د ${s}ث`);
        }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadlineData]);

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
  
  const renderAutoUpdateMonitor = () => {
    if (!league) return null;

    const getStatusDetails = (status) => {
        switch (status) {
            case 'success': return { color: '#00ff85', text: 'النظام يعمل بكفاءة ✅', icon: <FaCheckCircle /> };
            case 'running': return { color: '#2196f3', text: 'جاري المزامنة الآن... ⏳', icon: <FaSync className="sync-icon-spin" /> };
            case 'failed': return { color: '#ff4b2b', text: 'فشل التحديث التلقائي ❌', icon: <FaExclamationTriangle /> };
            default: return { color: '#999', text: 'في انتظار أول دورة...', icon: <FaInfoCircle /> };
        }
    };

    const status = getStatusDetails(league.autoUpdateStatus);

    return (
        <div style={{
            background: '#38003c',
            padding: '15px',
            borderRadius: '12px',
            color: 'white',
            marginTop: '15px',
            borderRight: `6px solid ${status.color}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <div>
                <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>حالة المزامنة التلقائية (كل 5 دقائق)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                    {status.icon} {status.text}
                </div>
            </div>
            <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '10px', opacity: 0.7 }}>آخر مزامنة ناجحة</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {league.lastAutoUpdate ? new Date(league.lastAutoUpdate).toLocaleTimeString() : '--:--:--'}
                </div>
            </div>
        </div>
    );
};

  const renderRewardNotice = () => {
    if (!league || !league.lastGwWinner || !myTeamData) return null;
    const isWinner = league.lastGwWinner.teamId === myTeamData._id;
    if (!isWinner) return null;

    return (
        <div style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
            color: '#38003c',
            padding: '20px',
            borderRadius: '15px',
            marginBottom: '20px',
            border: '2px solid #FFB300',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 10px 25px rgba(255, 215, 0, 0.4)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ fontSize: '45px', animation: 'bounce 2s infinite' }}>🏆</div>
            <div style={{ flex: 1, zIndex: 2 }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '22px', fontWeight: '900' }}>👑 مبروك! أنتم أبطال الجولة {league.lastGwWinner.gameweek}</h3>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>
                    حقق فريقكم أعلى تنقيط في البطولة بـ ({league.lastGwWinner.points}) نقطة. 
                    تمت إضافة "نقطة ذهبية" لرصيدكم في الترتيب العام! ✨
                </p>
            </div>
            <div style={{ position: 'absolute', left: '-10px', opacity: 0.15, transform: 'rotate(-20deg)', zIndex: 1 }}>
                <FaTrophy size={100} />
            </div>
        </div>
    );
  };

  const renderPenaltyNotice = () => {
    if (!myTeamData || !myTeamData.missedDeadlines || myTeamData.missedDeadlines === 0) return null;

    const penaltyConfigs = {
        1: { bg: "#fff3e0", color: "#e65100", icon: <FaInfoCircle />, title: "تنبيه المخالفة الأولى", text: "لم يتم ضبط التشكيلة يدوياً في الجولة السابقة. يرجى مراجعة المناجير فوراً لتجنب خصم النقاط مستقبلاً!" },
        2: { bg: "#fbe9e7", color: "#d84315", icon: <FaExclamationTriangle />, title: "عقوبة المستوى الثاني", text: "تم خصم (1) نقطة من الترتيب العام للفريق بسبب نسيان التشكيلة للمرة الثانية. الانضباط مطلوب!" },
        3: { bg: "#ffebee", color: "#c62828", icon: <FaExclamationTriangle />, title: "عقوبة المستوى الثالث (تحذير أخير)", text: "تم خصم (2) نقطة إضافية. المخالفة القادمة تعني الإقصاء النهائي للفريق من البطولة!" },
        4: { bg: "#212121", color: "#ffffff", icon: <FaSkullCrossbones />, title: "قرار إقصاء الفريق", text: "تم إقصاء هذا الفريق نهائياً من البطولة بسبب تكرار المخالفات (4 مرات). النقاط المجمعة محفوظة." }
    };

    const level = myTeamData.missedDeadlines >= 4 ? 4 : myTeamData.missedDeadlines;
    const config = penaltyConfigs[level];

    return (
        <div style={{
            backgroundColor: config.bg,
            color: config.color,
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '25px',
            border: `2px solid ${config.color}`,
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            animation: level >= 3 ? 'pulse 2s infinite' : 'none'
        }}>
            <div style={{ fontSize: '35px' }}>{config.icon}</div>
            <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{config.title}</h3>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px' }}>{config.text}</p>
            </div>
            <div style={{ background: config.color, color: config.bg, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                المخالفة {myTeamData.missedDeadlines}
            </div>
        </div>
    );
  };

  const handleSyncGameweeks = async () => {
    if (!league) return;
    if (!window.confirm('هل تريد مزامنة مواعيد الديدلاين لجميع الجولات من سيرفر الفانتزي؟')) return;
    try {
      setIsSyncing(true);
      setMessage('جاري مزامنة المواعيد... ⏳');
      const { data } = await API.post('/gameweek/sync');
      setMessage(data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'فشلت المزامنة');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportExcel = async () => {
    if (!excelFile) return alert("الرجاء اختيار ملف Excel أولاً");
    const formData = new FormData();
    formData.append('file', excelFile);
    formData.append('leagueId', league._id);
    try {
      setIsSyncing(true);
      setMessage('جاري استيراد النتائج التاريخية... ⏳');
      const { data } = await API.post('/fixtures/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(`✅ ${data.message}`);
      setExcelFile(null);
    } catch (err) {
      setMessage(err.response?.data?.message || 'فشل استيراد النتائج');
    } finally { setIsSyncing(false); }
  };

  const handleImportPenalties = async () => {
    if (!penaltyExcelFile) return alert("الرجاء اختيار ملف سجل العقوبات");
    const formData = new FormData();
    formData.append('file', penaltyExcelFile);
    formData.append('leagueId', league._id);
    try {
      setIsSyncing(true);
      setMessage('جاري استيراد سجل المخالفات... ⏳');
      const { data } = await API.post('/teams/import-penalties-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(`✅ ${data.message}`);
      setPenaltyExcelFile(null);
      fetchLeagueTeams();
      fetchMyTeamDetails();
    } catch (err) {
      setMessage(err.response?.data?.message || 'فشل استيراد المخالفات');
    } finally { setIsSyncing(false); }
  };

  const handleApproveManager = async (teamId) => { try { await API.put('/teams/approve-manager', { teamId }); setMessage('✅ تم الاعتماد'); fetchPendingTeams(); } catch (err) { setMessage('فشل'); } };
  
  const handleApproveSub = async (teamId) => {
      if(!window.confirm('هل أنت متأكد؟ سيتم حذف اللاعب والسماح للاعب جديد بالانضمام.')) return;
      try {
          await API.put('/teams/approve-sub', { teamId });
          setMessage('✅ تمت الموافقة على التغيير');
          fetchPendingSubs();
          fetchLeagueTeams(); 
      } catch (err) { setMessage(err.response?.data?.message || 'فشل العملية'); }
  };

  const handleRejectSub = async (teamId) => {
      if(!window.confirm('هل تريد رفض الطلب؟')) return;
      try {
          await API.put('/teams/reject-sub', { teamId });
          setMessage('تم رفض الطلب');
          fetchPendingSubs();
      } catch (err) { setMessage('فشل'); }
  };

  const handleRequestSub = async (memberId) => {
      if(!window.confirm('هل أنت متأكد؟ لك الحق في تغيير واحد فقط في الموسم.')) return;
      try {
          await API.post('/teams/request-sub', { memberId, reason: 'طلب من المناجير' });
          setMessage('✅ تم إرسال الطلب لمدير البطولة');
          setShowSubModal(false);
          fetchMyTeamDetails(); 
      } catch (err) { setMessage(err.response?.data?.message || 'فشل الطلب'); }
  };

  const handleChangeManager = async (memberId, memberName) => {
    if (!window.confirm(`هل أنت متأكد أنك تريد تعيين "${memberName}" مناجيراً للفريق بدلاً منك؟\n\n⚠️ ستفقد صلاحيات إدارة الفريق وسيتم تسجيل خروجك لتحديث البيانات.`)) return;
    try {
        await API.put('/teams/change-manager', { newManagerId: memberId });
        alert(`✅ تم تسليم القيادة إلى ${memberName} بنجاح!\nسيتم توجيهك الآن لصفحة تسجيل الدخول.`);
        logout();
        navigate('/login');
    } catch (err) {
        setMessage(err.response?.data?.message || 'فشلت العملية');
    }
  };

  const handleCreateLeague = async () => { try { const { data } = await API.post('/leagues', { name: leagueName }); setMessage(`تم إنشاء: ${data.name}`); fetchMyLeagueData(); } catch (err) { setMessage('خطأ'); } };
  const handleGenerateFixtures = async () => { try { if (!league) return; const { data } = await API.post('/fixtures/generate', { leagueId: league._id }); setMessage(data.message); } catch (err) { setMessage('خطأ'); } };
  
  const handleCalculateScores = async () => {
      if(!league) return;
      if(!window.confirm('1. هل تريد حساب نقاط اللاعبين وتطبيق نظام العقوبات والمكافآت؟')) return;
      try { 
        const { data } = await API.post('/gameweek/calculate', { leagueId: league._id }); 
        setMessage(data.message); 
        fetchMyTeamDetails();
        fetchMyLeagueData();
      } catch (err) { setMessage('فشل الحساب'); }
  };

  const handleUpdateTable = async () => {
      if(!league) return;
      if(!window.confirm('2. هل تريد تحديث نتائج المباريات والترتيب؟ سيتم تصفير الجدول وإعادة الحساب بالكامل لضمان الدقة.')) return;
      try { const { data } = await API.put('/fixtures/update-table', { leagueId: league._id }); setMessage(data.message); } 
      catch (err) { setMessage('فشل التحديث'); }
  };

  const handleSyncPlayers = async () => {
    if(!league) return;
    if(!window.confirm('هل تريد جلب نقاط كل اللاعبين من الجولة 1؟')) return;
    try { 
        setMessage('جاري المزامنة... يرجى الانتظار ⏳');
        const { data } = await API.post('/leagues/sync-players', { leagueId: league._id }); 
        setMessage(data.message); 
    } catch (err) { setMessage('فشل المزامنة'); }
  };

  const handleSetGameweek = async () => { try { const { data } = await API.put('/leagues/set-gameweek', { leagueId: league._id, gw: manualGw }); setMessage(data.message); fetchMyLeagueData(); } catch (err) { setMessage('فشل'); } };
  const handleJoinLeague = async () => { try { const { data } = await API.post('/leagues/join', { code: leagueCode }); setMessage(data.message); updateUser({ ...user, leagueId: 'joined' }); } catch (err) { setMessage('كود خاطئ'); } };
  
  const handleCreateTeam = async () => { 
      if (!selectedTeam) { setMessage('الرجاء اختيار فريق من القائمة أولاً'); return; }
      try { 
          const { data } = await API.post('/teams', { teamName: selectedTeam }); 
          setMessage(data.message); 
          updateUser({ ...user, teamId: 'created' }); 
          setIsApproved(data.team.isApproved); 
      } catch (err) { setMessage('فشل إنشاء الفريق'); } 
  };
  
  const handleJoinTeamRequest = async () => { try { if(!targetTeamId) return; const { data } = await API.post('/teams/join-request', { teamId: targetTeamId }); setMessage(data.message); setSelectionMode(null); } catch (err) { setMessage('فشل'); } };

  const shareText = league ? `انضم إلينا في بطولة ${league.name} 🏆\nالكود الخاص بالدوري: *${league.code}*\nننتظر تحديك! ⚽🔥` : '';
  const handleCopyCode = () => { if(league?.code) { navigator.clipboard.writeText(league.code); setMessage('تم نسخ الكود للحافظة! 📋'); setTimeout(() => setMessage(''), 3000); } };
  const handleShareNative = async () => { if (navigator.share) { try { await navigator.share({ title: 'انضم لبطولتي', text: shareText, url: window.location.origin }); } catch (err) {} } else { handleCopyCode(); } };
  const handleShareWhatsapp = () => { const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`; window.open(url, '_blank'); };

  const handleLogoUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('logo', file);
      setUploading(true);
      try {
          await API.post('/leagues/logo', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          setMessage('تم رفع الشعار بنجاح! 📸');
          fetchMyLeagueData();
      } catch (err) { setMessage('فشل رفع الصورة'); }
      finally { setUploading(false); }
  };

  return (
    <div className="dashboard-container" style={{ padding: '40px', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
      
      {/* ⏳ 1. عداد الديدلاين العام (يظهر للجميع) */}
      {deadlineData && (
          <div className="deadline-banner-style" style={{ 
              background: '#38003c', color: '#00ff85', padding: '15px', borderRadius: '12px', 
              marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', fontSize: '20px',
              boxShadow: '0 5px 15px rgba(56,0,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' 
          }}>
              <FaClock /> إغلاق الجولة {deadlineData.nextGwId || (deadlineData.id + 1)} خلال: 
              <span style={{fontFamily: 'monospace', fontSize: '24px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 10px', borderRadius: '5px'}}>
                  {timeLeft}
              </span>
          </div>
      )}

      {/* 🚨 2. الإشعار الوامض للمناجير (فقط إذا لم يتم حفظ التشكيلة) */}
      {needsLineupUpdate && (
          <div className="blink-notice">
              ⚠️ تنبيه: لم يتم حفظ تشكيلة الجولة القادمة يدوياً! سارع بالدخول لغرفة التبديل لتجنب العقوبات.
          </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', borderBottom: '1px solid #ddd', paddingBottom: '20px' }}>
        <div>
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                {/* 🛡️ إصلاح اللوغو: إضافة minWidth ومنع التقلص لضمان ظهوره على الهاتف */}
                {league?.logoUrl && (
                    <div style={{ minWidth: '60px', width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #38003c', background: '#fff' }}>
                        <img 
                            src={`${SERVER_URL}${league.logoUrl}`} 
                            alt="League Logo" 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                    </div>
                )}
                <div>
                    <h1 style={{ margin: 0 }}>لوحة التحكم 📱</h1>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <p style={{ margin: '5px 0', color: '#666' }}>
                            أهلاً، {user.username} {user.role === 'admin' ? (isLeagueCreator ? ' (مدير البطولة 👑)' : ' (مشرف 🛠)') : ' (عضو)'}
                        </p>
                        {league && <span style={{background:'#e3f2fd', color:'#1565c0', padding:'2px 8px', borderRadius:'4px', fontSize:'12px', fontWeight:'bold'}}>الجولة الحالية: {league.currentGw}</span>}
                    </div>
                </div>
            </div>
        </div>
        <button onClick={logout} style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', height: '40px', borderRadius: '8px' }}>تسجيل خروج</button>
      </header>

      {message && <div style={{ backgroundColor: '#e0f7fa', padding: '15px', marginBottom: '20px', borderRadius: '5px', color: '#006064' }}>{message}</div>}

	  {isLeagueCreator && renderAutoUpdateMonitor()}
      {renderRewardNotice()}
      {renderPenaltyNotice()}

      {user.teamId && nextOpponent && nextOpponent.hasFixture && nextOpponent.opponent && (
        <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#38003c', borderBottom: '2px solid #38003c', paddingBottom: '10px', display: 'inline-block' }}>🔥 مواجهتك القادمة</h2>
            <div 
                onClick={() => navigate(`/team-history/${nextOpponent.opponent._id}`, { state: { team: nextOpponent.opponent, startGw: nextOpponent.gameweek } })} 
                style={{ background: 'linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%)', color: 'white', padding: '20px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 5px 15px rgba(106, 27, 154, 0.4)', transition: 'transform 0.2s', marginTop: '10px' }} 
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'} 
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'white', padding: '5px', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {nextOpponent.opponent.logoUrl && <img src={nextOpponent.opponent.logoUrl} style={{ width: '45px', height: '45px', objectFit: 'contain' }} />}
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', opacity: 0.8, color: '#e1bee7' }}>
                            {nextOpponent.isHome ? 'على أرضك (Home)' : 'خارج أرضك (Away)'} • GW{nextOpponent.gameweek}
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{nextOpponent.opponent.name}</div>
                        <div style={{ fontSize: '12px', color: '#ffeb3b', marginTop: '5px' }}>👈 اضغط للاطلاع على تاريخ الخصم</div>
                    </div>
                </div>
                <div style={{ fontSize: '30px', fontWeight: 'bold', opacity: 0.2 }}>VS</div>
            </div>
        </div>
      )}

      {user.role === 'admin' && (
        <div style={{ backgroundColor: '#f3e5f5', padding: '20px', borderRadius: '10px', marginBottom: '40px', border: '1px solid #ce93d8' }}>
          <h2 style={{ marginTop: 0, color: '#38003c' }}>🛠 أدوات الإدارة</h2>
          <div className="admin-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
             <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{marginTop:0, color:'#38003c'}}>1. إعدادات ومشاركة البطولة</h3>
              {league ? (
                  <div>
                      <p><strong>اسم البطولة:</strong> {league.name}</p>
                      <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '10px', border: '1px dashed #4caf50', textAlign: 'center', marginTop:'10px' }}>
                          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#2e7d32' }}>كود الانضمام:</p>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', color: '#1b5e20', marginBottom: '15px' }}>
                              {league.code}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <button onClick={handleCopyCode} style={{ background: 'white', border: '1px solid #ccc', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize:'12px' }}><FaCopy /> نسخ</button>
                              <button onClick={handleShareWhatsapp} style={{ background: '#25D366', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize:'12px', fontWeight:'bold' }}><FaWhatsapp size={16} /> واتساب</button>
                              <button onClick={handleShareNative} style={{ background: '#38003c', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize:'12px' }}><FaShareAlt /> مشاركة</button>
                          </div>
                      </div>
                      <div style={{marginTop:'20px', borderTop:'1px solid #eee', paddingTop:'15px'}}>
                          <label style={{fontSize:'14px', fontWeight:'bold', marginBottom:'10px', display:'block'}}>شعار البطولة:</label>
                          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                              <input type="file" id="logoUpload" accept="image/*" onChange={handleLogoUpload} style={{display:'none'}} />
                              <label htmlFor="logoUpload" style={{ background: '#2196f3', color: 'white', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'13px' }}>
                                  <FaCamera /> {uploading ? 'جاري الرفع...' : 'تغيير الشعار'}
                              </label>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div>
                      <input type="text" placeholder="اسم البطولة" value={leagueName} onChange={(e) => setLeagueName(e.target.value)} style={{ padding: '8px', borderRadius:'4px', border:'1px solid #ccc' }} />
                      <button onClick={handleCreateLeague} style={{ marginRight: '5px', padding: '8px', backgroundColor: '#38003c', color: 'white', border: 'none', borderRadius:'4px' }}>إنشاء</button>
                  </div>
              )}
            </div>

            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', opacity: league ? 1 : 0.5 }}>
              <h3>2. التحكم بالموسم والاستيراد</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={handleSyncGameweeks} disabled={!league || isSyncing} style={{ padding: '10px', width: '100%', backgroundColor: '#38003c', color: '#00ff85', border: 'none', fontWeight: 'bold', cursor: (league && !isSyncing) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <FaSync className={isSyncing ? "sync-icon-spin" : ""} /> 0. مزامنة مواعيد الجولات
                  </button>

                  <button onClick={handleGenerateFixtures} disabled={!league} style={{ padding: '10px', width: '100%', backgroundColor: '#00ff85', color: '#38003c', border: 'none', fontWeight: 'bold', cursor: league ? 'pointer' : 'not-allowed' }}>توليد جدول المباريات (CSV)</button>
                  
                  <div style={{ padding: '10px', border: '1px solid #2e7d32', borderRadius: '8px', background: '#f1f8e9' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', color: '#2e7d32', marginBottom: '5px' }}>
                        <FaFileExcel /> نتائج المباريات (Excel):
                    </label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input type="file" accept=".xlsx, .xls" onChange={(e) => setExcelFile(e.target.files[0])} style={{ fontSize: '10px', flex: 1 }} />
                        <button onClick={handleImportExcel} disabled={!excelFile || isSyncing} style={{ padding: '5px 10px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>رفع</button>
                    </div>
                  </div>

                  <div style={{ padding: '10px', border: '1px solid #d32f2f', borderRadius: '8px', background: '#ffebee' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'center', alignItems: 'center', gap: '5px', color: '#c62828', marginBottom: '5px' }}>
                        <FaSkullCrossbones /> سجل المخالفات (Excel):
                    </label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input type="file" accept=".xlsx, .xls" onChange={(e) => setPenaltyExcelFile(e.target.files[0])} style={{ fontSize: '10px', flex: 1 }} />
                        <button onClick={handleImportPenalties} disabled={!penaltyExcelFile || isSyncing} style={{ padding: '5px 10px', background: '#c62828', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>رفع</button>
                    </div>
                  </div>

                  <button onClick={handleCalculateScores} disabled={!league} style={{ padding: '10px', width: '100%', backgroundColor: '#2196f3', color: 'white', border: 'none', fontWeight: 'bold', cursor: league ? 'pointer' : 'not-allowed' }}>🔄 1. حساب النقاط والمكافآت (Current GW)</button>
                  <button onClick={handleUpdateTable} disabled={!league} style={{ padding: '10px', width: '100%', backgroundColor: '#673ab7', color: 'white', border: 'none', fontWeight: 'bold', cursor: league ? 'pointer' : 'not-allowed' }}>📊 2. تحديث جدول الترتيب (إعادة حساب)</button>
                  <button onClick={handleSyncPlayers} disabled={!league} style={{ padding: '10px', width: '100%', backgroundColor: '#ff9800', color: 'white', border: 'none', fontWeight: 'bold', cursor: league ? 'pointer' : 'not-allowed' }}><FaSync /> 3. مزامنة تاريخ الهدافين</button>

                  <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '5px' }}>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                            <input type="number" value={manualGw} onChange={(e) => setManualGw(e.target.value)} style={{ width: '60px', padding: '5px' }} />
                            <button onClick={handleSetGameweek} style={{ backgroundColor: '#ff9800', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', flex: 1 }}>تغيير GW</button>
                        </div>
                  </div>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, backgroundColor: '#fff3e0', padding: '15px', borderRadius: '8px', border: '1px solid #ffcc80' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#e65100' }}>🔔 طلبات فرق جديدة</h3>
                    {pendingTeams.length === 0 ? (<p style={{ textAlign: 'center', color: '#e65100', fontStyle: 'italic' }}>لا توجد طلبات</p>) : (<table style={{ width: '100%', backgroundColor: 'white' }}><tbody>{pendingTeams.map(team => (<tr key={team._id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '10px' }}>{team.managerId?.username} - {team.name}</td><td style={{ textAlign: 'left', padding: '10px' }}><button onClick={() => handleApproveManager(team._id)} style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>موافقة</button></td></tr>))}</tbody></table>)}
                </div>

                <div style={{ flex: 1, backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '8px', border: '1px solid #90caf9' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>🔄 طلبات تغيير لاعبين</h3>
                    {pendingSubs.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#1565c0', fontStyle: 'italic' }}>لا توجد طلبات تغيير</p>
                    ) : (
                        <table style={{ width: '100%', backgroundColor: 'white' }}>
                            <tbody>
                                {pendingSubs.map(team => (
                                    <tr key={team._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>
                                            <div style={{fontWeight:'bold', fontSize:'14px'}}>{team.name}</div>
                                            <div style={{fontSize:'12px', color:'#d32f2f'}}>طرد: {team.substitutionRequest.memberName}</div>
                                        </td>
                                        <td style={{ textAlign: 'left', padding: '10px', display:'flex', gap:'5px', justifyContent:'flex-end' }}>
                                            <button onClick={() => handleApproveSub(team._id)} style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}><FaCheck/></button>
                                            <button onClick={() => handleRejectSub(team._id)} style={{ backgroundColor: '#c62828', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}><FaTimes/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 style={{ color: '#38003c', borderBottom: '2px solid #38003c', paddingBottom: '10px', display: 'inline-block' }}>⚽ مسيرتي الكروية</h2>
        {(league || user.leagueId) ? (
            <div className="career-buttons-container" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button onClick={() => window.location.href = '/fixtures'} style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: 'white', color: '#38003c', border: '2px solid #38003c', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}><FaCalendarAlt size={24} /> المباريات</button>
                <button onClick={() => window.location.href = '/standings'} style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: 'white', color: '#38003c', border: '2px solid #38003c', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}><FaTrophy size={24} /> الترتيب</button>
                <button onClick={() => window.location.href = '/stats'} style={{ padding: '15px 30px', backgroundColor: 'white', color: '#38003c', border: '2px solid #38003c', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}><FaChartBar size={24} /> إحصائيات الفرق</button>
                <button onClick={() => window.location.href = '/player-stats'} style={{ padding: '15px 30px', backgroundColor: 'white', color: '#38003c', border: '2px solid #38003c', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}><FaRunning size={24} /> ترتيب الهدافين</button>
                {user.role === 'admin' && (
                    <button onClick={() => window.location.href = '/managers'} style={{ padding: '15px 30px', backgroundColor: 'white', color: '#38003c', border: '2px solid #38003c', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}><FaUsers size={24} /> المشاركون</button>
                )}
                <button onClick={() => window.location.href = '/awards'} style={{ padding: '15px 30px', backgroundColor: 'white', color: '#38003c', border: '2px solid #38003c', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}><FaTrophy size={24} /> الجوائز والفورمة</button>
            </div>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '20px' }}>
                <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                    <h3>1. الانضمام لبطولة</h3>
                    <input type="text" placeholder="كود البطولة" value={leagueCode} onChange={(e) => setLeagueCode(e.target.value)} style={{ padding: '8px', width: '60%', marginLeft: '10px' }} />
                    <button onClick={handleJoinLeague} style={{ padding: '8px 15px', backgroundColor: '#38003c', color: 'white', border: 'none' }}>انضمام</button>
                </div>
            </div>
        )}

        {(league || user.leagueId) && (
            <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                {!user.teamId ? (
                    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                        <h3 style={{marginBottom:'20px'}}>2. إنشاء أو الانضمام لفريق</h3>
                        {!selectionMode && (
                            <div style={{ display:'flex', gap:'20px', justifyContent:'center', flexWrap: 'wrap' }}>
                                <button onClick={() => { setSelectionMode('create'); fetchLeagueTeams(); }} style={{ padding:'15px 30px', background:'#38003c', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontSize:'16px', fontWeight:'bold', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
                                    <FaUserTie size={30} /> <span>أنا مناجير (إنشاء فريق)</span>
                                </button>
                                <button onClick={() => { setSelectionMode('join'); fetchLeagueTeams(); }} style={{ padding:'15px 30px', background:'#00ff85', color:'#38003c', border:'none', borderRadius:'10px', cursor:'pointer', fontSize:'16px', fontWeight:'bold', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
                                    <FaRunning size={30} /> <span>أنا لاعب (انضمام لفريق)</span>
                                </button>
                            </div>
                        )}
                        {selectionMode === 'create' && (
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '15px', maxHeight: '400px', overflowY: 'auto', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '10px', background: '#fff' }}>
                                    {plTeams.map((team) => {
                                        const isTaken = leagueTeams.some(t => t.name === team.name);
                                        const isSelected = selectedTeam === team.name;
                                        return (
                                            <div key={team.name} onClick={() => !isTaken && setSelectedTeam(team.name)} style={{ border: isSelected ? '3px solid #00ff85' : '1px solid #eee', borderRadius: '12px', padding: '10px', cursor: isTaken ? 'not-allowed' : 'pointer', opacity: isTaken ? 0.5 : 1, filter: isTaken ? 'grayscale(100%)' : 'none', backgroundColor: isSelected ? '#f1f8e9' : 'white', textAlign: 'center', position: 'relative', transition: 'transform 0.2s', transform: isSelected ? 'scale(1.05)' : 'scale(1)' }}>
                                                <img src={team.logo || team.logoUrl} alt={team.name} style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom:'5px' }} />
                                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>{team.name}</div>
                                                {isTaken && <FaLock style={{ position:'absolute', top:'5px', right:'5px', color:'#757575' }} />}
                                                {isSelected && <FaCheckCircle style={{ position:'absolute', top:'5px', right:'5px', color:'#00c853' }} />}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ marginTop: '20px', textAlign: 'center', display:'flex', gap:'10px', justifyContent:'center' }}>
                                    <button onClick={() => setSelectionMode(null)} style={{ padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>إلغاء</button>
                                    <button onClick={handleCreateTeam} disabled={!selectedTeam} style={{ padding: '10px 40px', backgroundColor: selectedTeam ? '#38003c' : '#999', color: 'white', border: 'none', borderRadius: '5px', cursor: selectedTeam ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '16px' }}>{selectedTeam ? `تأكيد اختيار ${selectedTeam}` : 'اختر فريقاً'}</button>
                                </div>
                            </div>
                        )}
                        {selectionMode === 'join' && (
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px', maxHeight: '400px', overflowY: 'auto', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '10px', background: '#fff' }}>
                                    {leagueTeams.map((team) => {
                                        const currentMembersCount = team.members ? team.members.length : 0;
                                        const isFull = currentMembersCount >= 4;
                                        const isSelected = targetTeamId === team._id;
                                        return (
                                            <div key={team._id} onClick={() => !isFull && setTargetTeamId(team._id)} style={{ border: isSelected ? '3px solid #00ff85' : (isFull ? '1px solid #ffcdd2' : '1px solid #eee'), borderRadius: '12px', padding: '10px', cursor: isFull ? 'not-allowed' : 'pointer', opacity: isFull ? 0.6 : 1, backgroundColor: isSelected ? '#f1f8e9' : (isFull ? '#ffebee' : 'white'), textAlign: 'center', position: 'relative', transition: 'transform 0.2s', transform: isSelected ? 'scale(1.05)' : 'scale(1)' }}>
                                                <img src={team.logoUrl || 'https://via.placeholder.com/60'} alt={team.name} style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom:'5px', filter: isFull ? 'grayscale(100%)' : 'none' }} />
                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>{team.name}</div>
                                                <div style={{ fontSize: '11px', color: '#666' }}>المدرب: {team.managerId?.username || 'غير معروف'}</div>
                                                <div style={{ fontSize: '11px', fontWeight:'bold', color: isFull ? 'red' : 'green', marginTop:'5px' }}>{isFull ? 'ممتلئ (4/4)' : `متاح (${currentMembersCount}/4)`}</div>
                                                {isFull && <FaLock style={{ position:'absolute', top:'5px', right:'5px', color:'#e57373' }} />}
                                                {isSelected && <FaCheckCircle style={{ position:'absolute', top:'5px', right:'5px', color:'#00c853' }} />}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ marginTop: '20px', textAlign: 'center', display:'flex', gap:'10px', justifyContent:'center' }}>
                                    <button onClick={() => setSelectionMode(null)} style={{ padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>إلغاء</button>
                                    <button onClick={handleJoinTeamRequest} disabled={!targetTeamId} style={{ padding: '10px 30px', backgroundColor: targetTeamId ? '#38003c' : '#999', color: 'white', border: 'none', borderRadius: '5px', cursor: targetTeamId ? 'pointer' : 'not-allowed', fontWeight:'bold' }}>إرسال طلب الانضمام</button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        {isApproved ? (
                            <div style={{display:'flex', gap:'15px', justifyContent:'center', flexWrap:'wrap'}}>
                                <button onClick={() => window.location.href = '/my-team'} style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#38003c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                                    <TbSoccerField size={24} /> إدارة تشكيلتي
                                </button>
                                {myTeamData && myTeamData.managerId && (myTeamData.managerId._id || myTeamData.managerId) === user._id && (
                                    <button onClick={() => setShowSubModal(true)} style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                                        <TbReplace size={24} /> إدارة أعضاء الفريق
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div style={{padding:'20px', background:'#fff3e0', display:'inline-block', borderRadius:'10px'}}>
                                <h3 style={{color: '#e65100', margin:0}}>⏳ بانتظار موافقة مدير البطولة...</h3>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Modal */}
      {showSubModal && myTeamData && (
          <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
              <div style={{background:'white', padding:'30px', borderRadius:'15px', width:'90%', maxWidth:'450px', textAlign:'center'}}>
                  <h3 style={{marginTop:0, color:'#38003c', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>إدارة أعضاء الفريق</h3>
                  <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'10px'}}>
                      {myTeamData.members?.filter(m => m._id !== user._id).map(member => (
                          <div key={member._id} style={{padding:'10px', border:'1px solid #eee', background:'#f9f9f9', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                              <span style={{fontWeight:'bold'}}>{member.username}</span>
                              <div style={{display:'flex', gap:'5px'}}>
                                  <button onClick={() => handleChangeManager(member._id, member.username)} style={{padding:'6px 10px', background:'#ff9800', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontSize:'12px'}}><FaCrown /> ترقية</button>
                                  <button onClick={() => handleRequestSub(member._id)} style={{padding:'6px 10px', background:'#d32f2f', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontSize:'12px'}}><TbReplace /> تغيير</button>
                              </div>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => setShowSubModal(false)} style={{marginTop:'20px', padding:'10px 30px', background:'#333', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>إغلاق</button>
              </div>
          </div>
      )}
      <style>{`
        .sync-icon-spin { animation: spin 1s linear infinite; } 
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .blink-notice {
            animation: blinker 1.5s linear infinite;
            background-color: #ff1744;
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            font-weight: bold;
            margin-bottom: 25px;
            font-size: 18px;
            box-shadow: 0 5px 20px rgba(255,23,68,0.4);
            border: 2px solid white;
        }

        @keyframes blinker { 50% { opacity: 0.3; } }
        
        @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            50% { transform: scale(1.02); box-shadow: 0 4px 25px rgba(0,0,0,0.2); }
            100% { transform: scale(1); box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
            40% {transform: translateY(-15px);}
            60% {transform: translateY(-8px);}
        }

        /* 📱 التوافق مع الهاتف - حل شامل دون المساس بالهيكل */
        @media (max-width: 768px) {
            .dashboard-container { padding: 15px !important; }
            header { flex-direction: column !important; text-align: center; gap: 20px; }
            .admin-grid-layout { grid-template-columns: 1fr !important; }
            .career-buttons-container { gap: 10px !important; }
            .career-buttons-container button { width: calc(50% - 15px) !important; padding: 12px 5px !important; font-size: 14px !important; }
            .deadline-banner-style { font-size: 14px !important; flex-direction: column; gap: 5px !important; }
            .deadline-banner-style span { font-size: 18px !important; }
            .blink-notice { font-size: 14px !important; padding: 12px !important; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;