import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BarChart3, Check, CheckCircle2, ChevronDown,
  CircleAlert, CircleHelp, Clock3, Copy, Download, Edit3, Eye, FileText, FileUp, Flame, Globe2, Grid2X2, Home,
  Layers3, Link2, ListChecks, Menu, Play, Plus, RefreshCw,
  Database, LoaderCircle, LogOut, Rocket, Search, Settings, Share2, ShieldCheck,
  Sparkles, Star, Trash2, Trophy, Users, WandSparkles, X, Zap
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { checkAnswer, deleteQuiz, fetchOwnerAttempts, fetchOwnerQuizzes, fetchPublicQuiz, saveQuiz, submitAttempt } from './lib/quizApi';
import { importQuizJson } from './lib/jsonImport';

const uid = () => globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 11);

const colors = ['purple', 'orange', 'blue', 'green'];
const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function useHashRoute() {
  const getRoute = () => window.location.hash.slice(1) || '/';
  const [route, setRoute] = useState(getRoute);
  useEffect(() => {
    const onChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const go = (path) => { window.location.hash = path; window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return [route, go];
}

function useSupabaseSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  useEffect(() => {
    if (!supabase) return;
    const finishAuthRedirect = (nextSession) => {
      const params = new URLSearchParams(window.location.search);
      const isEmailCallback = params.get('auth') === 'confirmed';
      const isTokenCallback = /access_token=|refresh_token=|type=signup/.test(window.location.hash);
      if (nextSession && (isEmailCallback || isTokenCallback)) {
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.hash = '/admin';
      }
    };
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); finishAuthRedirect(data.session); });
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession); setLoading(false);
      if (event === 'SIGNED_IN') finishAuthRedirect(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, loading };
}

function useQuizStore(userId) {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const reload = async () => {
    if (!userId) { setQuizzes([]); setAttempts([]); setLoaded(true); return; }
    setLoading(true); setLoaded(false); setError('');
    try {
      const [nextQuizzes, nextAttempts] = await Promise.all([fetchOwnerQuizzes(userId), fetchOwnerAttempts()]);
      setQuizzes(nextQuizzes); setAttempts(nextAttempts);
    }
    catch (err) { setError(err.message || 'Không thể tải dữ liệu từ Supabase.'); }
    finally { setLoading(false); setLoaded(true); }
  };
  useEffect(() => { reload(); }, [userId]);
  const persist = async (quiz, status) => { const saved = await saveQuiz(quiz, status); await reload(); return saved; };
  const remove = async (id) => { await deleteQuiz(id); await reload(); };
  return { quizzes, attempts, loading, loaded, error, reload, persist, remove };
}

const Logo = ({ onClick }) => (
  <button type="button" className="logo" onClick={onClick} aria-label="Quizora trang chủ">
    <span className="logo-mark"><Zap size={20} fill="currentColor" /></span><span>quizora</span>
  </button>
);

function PublicNav({ go, isLoggedIn }) {
  const [open, setOpen] = useState(false);
  const scrollTo = id => { setOpen(false); document.querySelector(id)?.scrollIntoView({ behavior:'smooth' }); };
  return <header className="public-nav wrap">
    <Logo onClick={() => go('/')} />
    <nav className={open ? 'nav-links open' : 'nav-links'}>
      <button onClick={()=>scrollTo('#features')}>Tính năng</button><button onClick={()=>scrollTo('#how')}>Cách hoạt động</button><button onClick={()=>scrollTo('#features')}>Cộng đồng</button>
    </nav>
    <div className="nav-actions"><button className="btn ghost hide-mobile" onClick={() => go('/admin')}>{isLoggedIn ? 'Dashboard' : 'Đăng nhập'}</button><button className="btn primary" onClick={() => go(isLoggedIn ? '/admin' : '/admin/new')}>{isLoggedIn ? 'Quản lý quiz' : 'Tạo quiz miễn phí'} <ArrowRight size={17}/></button></div>
    <button className="icon-btn mobile-menu" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
  </header>;
}

function Landing({ go, isLoggedIn }) {
  return <div className="landing">
    <PublicNav go={go} isLoggedIn={isLoggedIn}/>
    <main>
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15}/> Biến mỗi bài học thành một cuộc chơi</div>
          <h1>Học vui hơn.<br/><span>Nhớ lâu hơn.</span></h1>
          <p>Tạo bài trắc nghiệm cuốn hút trong vài phút, chia sẻ bằng một đường link và xem kết quả theo thời gian thực.</p>
          <div className="hero-actions"><button className="btn primary big" onClick={() => go('/admin/new')}><WandSparkles size={20}/> Tạo quiz đầu tiên</button><button className="btn soft big" onClick={() => document.querySelector('#how')?.scrollIntoView()}><Play size={18} fill="currentColor"/> Xem cách hoạt động</button></div>
          <div className="trust-row"><span className="avatars"><i>AN</i><i>MI</i><i>TH</i><i>+2k</i></span><span><b>4.9/5</b> từ giáo viên & học sinh</span></div>
        </div>
        <div className="hero-visual">
          <span className="float-pill pill-top"><Trophy size={16}/> +100 điểm</span>
          <span className="float-pill pill-side"><Flame size={16}/> 7 ngày streak!</span>
          <div className="quiz-preview-card">
            <div className="preview-top"><span>Khám phá vũ trụ</span><span className="timer"><Clock3 size={14}/> 00:18</span></div>
            <div className="preview-progress"><i/></div>
            <div className="preview-body"><span className="question-count">CÂU 3 / 10</span><div className="planet">🪐</div><h3>Hành tinh nào lớn nhất trong Hệ Mặt Trời?</h3>
              <div className="preview-options"><button>A <span>Trái Đất</span></button><button className="selected">B <span>Sao Mộc</span><CheckCircle2 size={18}/></button><button>C <span>Sao Hỏa</span></button><button>D <span>Sao Thổ</span></button></div>
            </div>
          </div>
          <div className="hero-orb one"/><div className="hero-orb two"/>
        </div>
      </section>
      <section className="logo-strip"><p>Được yêu thích bởi cộng đồng giáo dục</p><div><span>✦ EDUMATE</span><span>◈ STUDI</span><span>● LEARNUP</span><span>⌁ MINDSCHOOL</span><span>▲ KIDLAB</span></div></section>
      <section className="features wrap" id="features"><div className="section-heading"><span className="eyebrow">TẠO · CHIA SẺ · CHINH PHỤC</span><h2>Mọi thứ bạn cần cho một<br/>buổi học <em>không thể quên</em></h2><p>Đơn giản để bắt đầu, đủ mạnh để tạo nên khác biệt.</p></div>
        <div className="feature-grid">
          <article className="feature-card lavender"><div className="feature-icon"><WandSparkles/></div><h3>Tạo quiz siêu nhanh</h3><p>Soạn câu hỏi, chọn đáp án đúng và tùy chỉnh thời gian chỉ với vài thao tác.</p><div className="mini-editor"><div/><div className="long"/><span/><span/><span/><span/></div></article>
          <article className="feature-card peach"><div className="feature-icon"><Link2/></div><h3>Chia sẻ trong một chạm</h3><p>Xuất link riêng cho từng bộ đề. Người chơi truy cập được ngay, không cần tài khoản.</p><div className="mini-link"><Link2 size={18}/><span>quizora.app/q/space-101</span><Check size={17}/></div></article>
          <article className="feature-card mint"><div className="feature-icon"><BarChart3/></div><h3>Kết quả trực quan</h3><p>Theo dõi lượt chơi, điểm trung bình và câu hỏi khó nhất trong một màn hình.</p><div className="mini-chart"><i style={{height:'48%'}}/><i style={{height:'68%'}}/><i style={{height:'54%'}}/><i style={{height:'88%'}}/><i style={{height:'76%'}}/></div></article>
        </div>
      </section>
      <section className="how-section" id="how"><div className="wrap how-inner"><div><span className="eyebrow light"><Rocket size={15}/> BẮT ĐẦU DỄ NHƯ 1-2-3</span><h2>Từ ý tưởng đến một<br/>bài quiz thật “wow”</h2><div className="steps"><div><b>01</b><span><strong>Soạn nội dung</strong><small>Thêm câu hỏi và lựa chọn đáp án.</small></span></div><div><b>02</b><span><strong>Xuất bản & lấy link</strong><small>Một link riêng được tạo ngay lập tức.</small></span></div><div><b>03</b><span><strong>Chia sẻ & xem kết quả</strong><small>Người học làm bài trên mọi thiết bị.</small></span></div></div><button className="btn white big" onClick={() => go('/admin/new')}>Bắt đầu ngay <ArrowRight size={18}/></button></div>
          <div className="browser-mock"><div className="browser-bar"><i/><i/><i/><span>quizora.app/admin</span></div><div className="mock-content"><aside><div className="mock-logo"/><i/><i/><i/></aside><div className="mock-main"><span>Tổng quan</span><div className="mock-stats"><i/><i/><i/></div><div className="mock-table"><b/><i/><i/><i/></div></div></div></div>
        </div></section>
      <section className="cta wrap"><div><span className="cta-stars">✦ ✦ ✦</span><h2>Sẵn sàng biến giờ học<br/>thành giờ chơi?</h2><p>Hoàn toàn miễn phí để bắt đầu. Không cần thẻ tín dụng.</p><button className="btn dark big" onClick={() => go('/admin/new')}>Tạo quiz miễn phí <Sparkles size={18}/></button></div></section>
    </main>
    <footer className="footer wrap"><Logo onClick={() => go('/')}/><span>© 2026 Quizora. Made with 💜 for learners.</span><div><button onClick={()=>document.querySelector('#features')?.scrollIntoView({behavior:'smooth'})}>Tính năng</button><button onClick={()=>document.querySelector('#how')?.scrollIntoView({behavior:'smooth'})}>Hướng dẫn</button><button onClick={()=>go('/admin')}>Admin</button></div></footer>
  </div>;
}

function AdminShell({ go, children, active = 'dashboard', user }) {
  const [collapsed, setCollapsed] = useState(false);
  const userLabel = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Quản trị viên';
  const initials = userLabel.slice(0, 2).toUpperCase();
  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: <Grid2X2/>, path: '/admin' },
    { id: 'quizzes', label: 'Bộ câu hỏi', icon: <ListChecks/>, path: '/admin/quizzes' },
    { id: 'results', label: 'Kết quả', icon: <BarChart3/>, path: '/admin/results' },
    { id: 'participants', label: 'Người tham gia', icon: <Users/>, path: '/admin/participants' }
  ];
  return <div className={collapsed ? 'admin-shell collapsed' : 'admin-shell'}>
    <aside className="sidebar">
      <div className="sidebar-head"><Logo onClick={() => go('/')}/><button onClick={() => setCollapsed(!collapsed)} className="collapse-btn"><Menu size={19}/></button></div>
      <nav>{navItems.map(item=><button key={item.id} className={active === item.id ? 'active':''} onClick={() => go(item.path)}>{item.icon}<span>{item.label}</span></button>)}</nav>
      <div className="sidebar-bottom"><button onClick={()=>go('/')}><CircleHelp/><span>Trợ giúp</span></button><button onClick={() => supabase.auth.signOut()}><LogOut/><span>Đăng xuất</span></button><div className="user-chip"><span className="user-avatar">{initials}</span><span><b>{userLabel}</b><small>{user?.email || 'Quản trị viên'}</small></span><ChevronDown size={16}/></div></div>
    </aside>
    <main className="admin-main">{children}</main>
    <nav className="mobile-admin-nav" aria-label="Điều hướng quản trị">{navItems.map(item=><button key={item.id} className={active === item.id ? 'active':''} onClick={() => go(item.path)}>{item.icon}<span>{item.label}</span></button>)}</nav>
  </div>;
}

function StatCard({ icon, label, value, trend, tone }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><div><span>{label}</span><strong>{value}</strong>{trend&&<small className={trend?.startsWith('+') ? 'up' : ''}>{trend}</small>}</div></article>;
}

function ShareModal({ quiz, onClose }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const url = `${window.location.origin}${window.location.pathname}#/quiz/${quiz.id}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setCopyError(''); setTimeout(() => setCopied(false), 1800); }
    catch { setCopyError('Trình duyệt chặn sao chép tự động. Hãy chọn và sao chép đường link bên trên.'); }
  };
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="share-modal" onMouseDown={e => e.stopPropagation()}>
    <button className="modal-close" onClick={onClose}><X/></button><span className="share-icon"><Share2/></span><h2>Quiz đã sẵn sàng!</h2><p>Chia sẻ đường link bên dưới để mọi người bắt đầu làm bài.</p>
    <div className="share-quiz"><span className={`quiz-emoji ${quiz.color}`}>{quiz.emoji}</span><div><b>{quiz.title}</b><small>{quiz.questions.length} câu hỏi · {quiz.timeLimit} giây/câu</small></div></div>
    <label className="link-label">LINK THAM GIA</label><div className="copy-field"><Link2/><input readOnly value={url}/><button onClick={copy}>{copied ? <Check/> : <Copy/>}{copied ? 'Đã chép' : 'Sao chép'}</button></div>
    {copyError&&<div className="data-error">{copyError}</div>}
    <div className="share-hint"><ShieldCheck/><span>Người tham gia không cần đăng nhập để làm bài</span></div>
    <button className="btn primary full" onClick={() => { window.open(url, '_blank'); }}><Eye size={18}/> Xem trang người làm bài</button>
  </div></div>;
}

function downloadQuizJson(quiz) {
  const payload = {
    title: quiz.title, description: quiz.description, emoji: quiz.emoji,
    questions: quiz.questions.map(question => ({
      text: question.text, type: question.type, options: question.options,
      correct: answerLetters[question.correct], explanation: question.explanation || ''
    }))
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `${quiz.title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'quizora'}.json`;
  link.click(); URL.revokeObjectURL(url);
}

function Dashboard({ go, quizzes, attempts, onDelete, onReload, loading, error, user, active = 'dashboard' }) {
  const [shareQuiz, setShareQuiz] = useState(null);
  const [query, setQuery] = useState('');
  const [actionError, setActionError] = useState('');
  const filtered = quizzes.filter(q => q.title.toLowerCase().includes(query.toLowerCase()));
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'bạn';
  const today = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const average = attempts.length ? Math.round(attempts.reduce((sum,item)=>sum+(item.score/item.total*100),0)/attempts.length) : 0;
  const participantCount = new Set(attempts.map(item=>item.participantName.trim().toLocaleLowerCase('vi-VN'))).size;
  const remove = async (id) => { if (!window.confirm('Bạn muốn xóa bộ câu hỏi này?')) return; try { setActionError(''); await onDelete(id); } catch (err) { setActionError(err.message); } };
  return <AdminShell go={go} user={user} active={active}>
    <header className="admin-top"><div><span>Không gian làm việc /</span><b>Tổng quan</b></div><button className="notification refresh-btn" disabled={loading} onClick={onReload} aria-label="Làm mới dữ liệu"><RefreshCw className={loading?'spin':''}/></button></header>
    <div className="admin-content">
      <section className="welcome"><div><p>{today}</p><h1>Xin chào, {displayName}! <span>👋</span></h1><small>Dữ liệu dưới đây được tính trực tiếp từ các lượt làm bài.</small></div><button className="btn primary big" onClick={() => go('/admin/new')}><Plus/> Tạo bộ câu hỏi</button></section>
      <section className="stats-grid"><StatCard tone="purple" icon={<Layers3/>} label="Tổng bộ câu hỏi" value={quizzes.length} trend={`${quizzes.filter(q=>q.status==='published').length} đã xuất bản`}/><StatCard tone="orange" icon={<Play/>} label="Lượt hoàn thành" value={attempts.length.toLocaleString('vi-VN')} trend="Lưu thật trên Supabase"/><StatCard tone="blue" icon={<BarChart3/>} label="Điểm trung bình" value={`${average}%`} trend={attempts.length?'Tính trên toàn bộ lượt làm':'Chưa có dữ liệu'}/><StatCard tone="green" icon={<Users/>} label="Người tham gia" value={participantCount.toLocaleString('vi-VN')} trend="Theo tên người làm bài"/></section>
      {(error || actionError) && <div className="data-error">{error || actionError}</div>}
      <section className="dashboard-panel"><div className="panel-head"><div><h2>Bộ câu hỏi của bạn</h2><p>Dữ liệu được đồng bộ trực tiếp từ Supabase.</p></div><div className="panel-tools"><label className="search"><Search/><input placeholder="Tìm bộ câu hỏi..." value={query} onChange={e=>setQuery(e.target.value)}/></label></div></div>
        <div className="quiz-table"><div className="table-header"><span>BỘ CÂU HỎI</span><span>TRẠNG THÁI</span><span>LƯỢT CHƠI</span><span>ĐIỂM TB</span><span>NGÀY TẠO</span><span></span></div>
          {filtered.map(quiz => <div className="table-row" key={quiz.id}><div className="quiz-name"><span className={`quiz-emoji ${quiz.color}`}>{quiz.emoji}</span><span><b>{quiz.title}</b><small>{quiz.questions.length} câu hỏi · {quiz.timeLimit} giây/câu</small></span></div><span><i className={`status ${quiz.status}`}/>{quiz.status === 'published' ? 'Đã xuất bản':'Bản nháp'}</span><b>{quiz.plays.toLocaleString('vi-VN')}</b><b>{quiz.average ? `${quiz.average}%`:'—'}</b><span>{quiz.createdAt}</span><div className="row-actions"><button title={quiz.status==='published'?'Chia sẻ':'Xuất bản để chia sẻ'} disabled={quiz.status!=='published'} onClick={() => setShareQuiz(quiz)}><Share2/></button><button title="Tải bản sao JSON" onClick={() => downloadQuizJson(quiz)}><Download/></button><button title="Chỉnh sửa" onClick={() => go(`/admin/edit/${quiz.id}`)}><Edit3/></button><button title="Xóa" onClick={() => remove(quiz.id)}><Trash2/></button></div></div>)}
          {loading && <div className="empty-state"><LoaderCircle className="spin"/><h3>Đang tải dữ liệu</h3><p>Quizora đang kết nối tới Supabase...</p></div>}
          {!loading && !filtered.length && <div className="empty-state"><Database/><h3>{query ? 'Không tìm thấy bộ câu hỏi' : 'Chưa có bộ câu hỏi nào'}</h3><p>{query ? 'Thử tìm bằng một từ khóa khác nhé.' : 'Tạo bộ đề đầu tiên, dữ liệu sẽ được lưu thật trên Supabase.'}</p>{!query&&<button className="btn primary" onClick={()=>go('/admin/new')}><Plus/> Tạo ngay</button>}</div>}
        </div>
      </section>
      <section className="tip-banner"><span><Sparkles/></span><div><b>Mẹo nhỏ từ Quizora</b><p>Thêm giải thích ngắn cho mỗi câu để người học hiểu ngay sau khi trả lời.</p></div><button onClick={()=>go('/admin/results')}>Xem kết quả thật <ArrowRight/></button></section>
    </div>{shareQuiz && <ShareModal quiz={shareQuiz} onClose={()=>setShareQuiz(null)}/>} 
  </AdminShell>;
}

function Analytics({ go, quizzes, attempts, user, mode = 'results', loading, error, onReload }) {
  const [quizId, setQuizId] = useState('all');
  const filtered = quizId === 'all' ? attempts : attempts.filter(item=>item.quizId===quizId);
  const average = filtered.length ? Math.round(filtered.reduce((sum,item)=>sum+(item.score/item.total*100),0)/filtered.length) : 0;
  const best = filtered.length ? Math.max(...filtered.map(item=>Math.round(item.score/item.total*100))) : 0;
  const selectedQuiz = quizzes.find(item=>item.id===quizId);
  const participantRows = useMemo(() => {
    const groups = new Map();
    filtered.forEach(item => {
      const key = item.participantName.trim().toLocaleLowerCase('vi-VN');
      const current = groups.get(key) || { name:item.participantName, attempts:0, percentages:[], lastAt:item.completedAt, lastLabel:item.completedLabel };
      current.attempts += 1; current.percentages.push(item.score/item.total*100);
      if (new Date(item.completedAt) > new Date(current.lastAt)) { current.lastAt=item.completedAt; current.lastLabel=item.completedLabel; }
      groups.set(key,current);
    });
    return [...groups.values()].map(item=>({...item, average:Math.round(item.percentages.reduce((a,b)=>a+b,0)/item.percentages.length), best:Math.round(Math.max(...item.percentages))})).sort((a,b)=>b.average-a.average);
  }, [filtered]);
  const questionStats = useMemo(() => {
    if (!selectedQuiz) return [];
    const relevant = attempts.filter(item=>item.quizId===selectedQuiz.id);
    return selectedQuiz.questions.map((question,index)=>{
      const answered = relevant.filter(item=>item.answers[index]!==null&&item.answers[index]!==undefined);
      const correct = answered.filter(item=>Number(item.answers[index])===question.correct).length;
      return { index, text:question.text, answered:answered.length, rate:answered.length?Math.round(correct/answered.length*100):0 };
    }).sort((a,b)=>a.rate-b.rate);
  }, [attempts, selectedQuiz]);
  const exportCsv = () => {
    const escape = value => `"${String(value??'').replaceAll('"','""')}"`;
    const rows = [['Người tham gia','Bộ câu hỏi','Điểm','Tổng câu','Tỉ lệ','Hoàn thành'],...filtered.map(item=>[item.participantName,item.quizTitle,item.score,item.total,`${Math.round(item.score/item.total*100)}%`,item.completedLabel])];
    const blob = new Blob([`\ufeff${rows.map(row=>row.map(escape).join(',')).join('\n')}`],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='quizora-ket-qua.csv';link.click();URL.revokeObjectURL(url);
  };
  return <AdminShell go={go} active={mode} user={user}>
    <header className="admin-top"><div><span>Không gian làm việc /</span><b>{mode==='participants'?'Người tham gia':'Kết quả'}</b></div><button className="notification refresh-btn" disabled={loading} onClick={onReload} aria-label="Làm mới dữ liệu"><RefreshCw className={loading?'spin':''}/></button></header>
    <div className="admin-content analytics-page">
      <section className="analytics-heading"><div><span className="eyebrow"><BarChart3/> DỮ LIỆU THỜI GIAN THỰC</span><h1>{mode==='participants'?'Hồ sơ người tham gia':'Hiệu quả các bộ câu hỏi'}</h1><p>{mode==='participants'?'Theo dõi số lượt làm, điểm trung bình và thành tích tốt nhất.':'Mỗi con số đều được tổng hợp từ bảng quiz_attempts trên Supabase.'}</p></div><div className="analytics-actions"><label className="quiz-filter">Bộ câu hỏi<select value={quizId} onChange={event=>setQuizId(event.target.value)}><option value="all">Tất cả bộ câu hỏi</option>{quizzes.map(quiz=><option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}</select></label><button className="btn soft" disabled={!filtered.length} onClick={exportCsv}><Download/> Xuất CSV</button></div></section>
      {error&&<div className="data-error">{error}</div>}
      <section className="stats-grid analytics-stats"><StatCard tone="purple" icon={<Play/>} label="Lượt hoàn thành" value={filtered.length}/><StatCard tone="blue" icon={<BarChart3/>} label="Điểm trung bình" value={`${average}%`}/><StatCard tone="orange" icon={<Trophy/>} label="Điểm cao nhất" value={`${best}%`}/><StatCard tone="green" icon={<Users/>} label="Người tham gia" value={participantRows.length}/></section>
      {loading?<div className="empty-state analytics-empty"><LoaderCircle className="spin"/><h3>Đang tải thống kê</h3></div>:mode==='participants'?<section className="analytics-panel"><div className="panel-head"><div><h2>Danh sách người tham gia</h2><p>Gộp các lượt làm có cùng tên, không phân biệt chữ hoa/thường.</p></div></div><div className="analytics-table"><div className="analytics-row header"><span>NGƯỜI THAM GIA</span><span>SỐ LƯỢT</span><span>ĐIỂM TB</span><span>TỐT NHẤT</span><span>GẦN NHẤT</span></div>{participantRows.map((item,index)=><div className="analytics-row" key={`${item.name}-${index}`}><div className="participant-cell"><span>{item.name.slice(0,2).toUpperCase()}</span><b>{item.name}</b></div><b>{item.attempts}</b><span className="score-badge">{item.average}%</span><b>{item.best}%</b><span>{item.lastLabel}</span></div>)}{!participantRows.length&&<AnalyticsEmpty/>}</div></section>:<div className="analytics-grid"><section className="analytics-panel"><div className="panel-head"><div><h2>Lượt làm gần đây</h2><p>{quizId==='all'?'Toàn bộ bộ câu hỏi':selectedQuiz?.title}</p></div></div><div className="attempt-list">{filtered.slice(0,12).map(item=><article key={item.id}><span className="attempt-avatar">{item.participantName.slice(0,2).toUpperCase()}</span><div><b>{item.participantName}</b><small>{item.quizTitle} · {item.completedLabel}</small></div><strong>{Math.round(item.score/item.total*100)}%</strong></article>)}{!filtered.length&&<AnalyticsEmpty/>}</div></section><section className="analytics-panel"><div className="panel-head"><div><h2>Câu hỏi cần cải thiện</h2><p>{selectedQuiz?'Xếp theo tỉ lệ trả lời đúng thấp nhất':'Chọn một bộ đề để phân tích từng câu.'}</p></div></div>{selectedQuiz?<div className="difficulty-list">{questionStats.slice(0,10).map(item=><article key={item.index}><div><b>Câu {item.index+1}</b><span>{item.text}</span><small>{item.answered} lượt trả lời</small></div><strong>{item.rate}%</strong><i><span style={{width:`${item.rate}%`}}/></i></article>)}</div>:<AnalyticsEmpty message="Chọn một bộ câu hỏi ở phía trên để xem câu khó."/>}</section></div>}
    </div>
  </AdminShell>;
}

function AnalyticsEmpty({ message='Chưa có lượt làm bài nào để thống kê.' }) {
  return <div className="empty-state analytics-empty"><BarChart3/><h3>Chưa có dữ liệu</h3><p>{message}</p></div>;
}

const emptyQuestion = () => ({ id: uid(), text: '', type: 'choice', options: ['', '', '', ''], correct: 0, explanation: '' });

function JsonImportModal({ onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (!file) { setError('Hãy chọn một file JSON.'); return; }
    setBusy(true); setError('');
    try { await onImport(file); onClose(); }
    catch (err) { setError(err.message || 'Không thể đọc file JSON.'); }
    finally { setBusy(false); }
  };
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="import-modal" onMouseDown={event=>event.stopPropagation()}><button className="modal-close" aria-label="Đóng" onClick={onClose}><X/></button><span className="share-icon"><FileText/></span><h2>Nhập bộ câu hỏi JSON</h2><p>Upload một file <b>.json</b>, Quizora sẽ kiểm tra cấu trúc trước khi thêm vào bộ đề.</p><label className={file?'json-dropzone has-file':'json-dropzone'}><input type="file" accept=".json,application/json" onChange={event=>setFile(event.target.files?.[0]||null)}/>{file?<><CheckCircle2/><b>{file.name}</b><small>{Math.ceil(file.size/1024)} KB · Bấm để chọn file khác</small></>:<><FileUp/><b>Chọn file JSON</b><small>Tối đa 5 MB · Trắc nghiệm, Đúng/Sai và giải thích đáp án</small></>}</label><div className="json-format"><b>Cấu trúc ngắn gọn</b><pre>{`{\n  "title": "Bộ câu hỏi mẫu",\n  "questions": [\n    {\n      "text": "2 + 2 bằng mấy?",\n      "type": "choice",\n      "options": ["3", "4", "5"],\n      "correct": "B",\n      "explanation": "2 + 2 = 4"\n    }\n  ]\n}`}</pre><a className="template-link" href="/quiz-template.json" download><FileText/> Tải file JSON mẫu</a></div>{error&&<div className="data-error">{error}</div>}<div className="import-actions"><button className="btn soft" onClick={onClose}>Hủy</button><button className="btn primary" disabled={busy||!file} onClick={submit}>{busy?<LoaderCircle className="spin"/>:<FileUp/>} Nhập câu hỏi</button></div></div></div>;
}

function Editor({ go, quizzes, onSave, id, user }) {
  const existing = quizzes.find(q => q.id === id);
  const initialQuiz = existing || { id: null, title: 'Bộ câu hỏi chưa đặt tên', description: '', emoji: '✨', color: 'purple', status: 'draft', plays: 0, average: 0, createdAt: new Date().toLocaleDateString('vi-VN'), timeLimit: 20, questions: [emptyQuestion()] };
  const [quiz, setQuiz] = useState(initialQuiz);
  const savedSnapshot = useRef(JSON.stringify(initialQuiz));
  const [selected, setSelected] = useState(0);
  const [share, setShare] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importNotice, setImportNotice] = useState(null);
  const question = quiz.questions[selected];
  const dirty = JSON.stringify(quiz) !== savedSnapshot.current;
  useEffect(()=>{
    const warn = event => { if (dirty) { event.preventDefault(); event.returnValue=''; } };
    window.addEventListener('beforeunload',warn); return ()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);
  const guardedGo = path => { if (!dirty || window.confirm('Bạn có thay đổi chưa lưu. Bạn vẫn muốn rời khỏi trang?')) go(path); };
  const setQuestion = (patch) => setQuiz(q => ({...q, questions: q.questions.map((x,i)=>i===selected?{...x,...patch}:x)}));
  const save = async (publish = false) => {
    const hasBlank = !quiz.title.trim() || quiz.questions.some(q => !q.text.trim() || q.options.length < 2 || q.options.length > 8 || q.options.some(option => !option.trim()));
    if (hasBlank) { setSaveError('Vui lòng nhập tiêu đề, nội dung và từ 2 đến 8 đáp án cho mỗi câu.'); return; }
    if (quiz.questions.some(q=>q.needsReview)) { setSaveError('Có câu nhập từ JSON chưa xác định được đáp án đúng. Hãy chọn đáp án cho các câu được đánh dấu.'); return; }
    setSaving(true); setSaveError('');
    try {
      const final = await onSave(quiz, publish ? 'published' : quiz.status);
      savedSnapshot.current=JSON.stringify(final); setQuiz(final); setSaved(true); setTimeout(()=>setSaved(false),1500); if (publish) setShare(true);
    } catch (err) { setSaveError(err.message || 'Không thể lưu dữ liệu lên Supabase.'); }
    finally { setSaving(false); }
  };
  const addQuestion = () => { setQuiz(q=>({...q,questions:[...q.questions,emptyQuestion()]})); setSelected(quiz.questions.length); };
  const deleteQuestion = (index) => { if(quiz.questions.length===1) return; setQuiz(q=>({...q,questions:q.questions.filter((_,i)=>i!==index)})); setSelected(Math.max(0, selected > index ? selected-1 : Math.min(selected, quiz.questions.length-2))); };
  const setQuestionType = type => setQuestion(type === 'true_false'
    ? { type, options: ['Đúng', 'Sai'], correct: 0, needsReview: false }
    : { type, options: question.type === 'true_false' ? ['', '', ''] : question.options, correct: 0, needsReview: false });
  const addOption = () => { if(question.type==='true_false'||question.options.length>=8)return; setQuestion({options:[...question.options,'']}); };
  const removeOption = index => {
    if(question.type==='true_false'||question.options.length<=2)return;
    const options=question.options.filter((_,i)=>i!==index);
    const correct=question.correct===index?0:question.correct>index?question.correct-1:question.correct;
    setQuestion({options,correct,needsReview:false});
  };
  const importJson = async file => {
    const { questions, warnings, meta } = await importQuizJson(file);
    const replaceBlank = quiz.questions.length===1 && !quiz.questions[0].text.trim();
    const startIndex = replaceBlank ? 0 : quiz.questions.length;
    setQuiz(current=>({...current,title:meta.title&&(current.title==='Bộ câu hỏi chưa đặt tên'||!current.title.trim())?meta.title:current.title,description:meta.description||current.description,emoji:meta.emoji||current.emoji,questions:replaceBlank?questions:[...current.questions,...questions]}));
    setSelected(startIndex);
    setImportNotice({ message:`Đã nhập ${questions.length} câu hỏi${warnings.length?` · ${warnings.length} mục cần lưu ý`:''}.`, warnings });
  };
  return <AdminShell go={guardedGo} active="quizzes" user={user}>
    <header className="editor-top"><button className="back-btn" aria-label="Quay lại" onClick={()=>guardedGo('/admin')}><ArrowLeft/></button><div className="editable-title"><input aria-label="Tên bộ câu hỏi" value={quiz.title} onChange={e=>setQuiz({...quiz,title:e.target.value})}/><span>{saved ? 'Đã lưu lên Supabase' : dirty ? 'Có thay đổi chưa lưu' : 'Đã đồng bộ'}</span></div><div className="editor-actions"><button className="btn import-json-btn" onClick={()=>setImportOpen(true)}><FileUp/> Nhập JSON</button><button className="btn soft" disabled={saving||!dirty} onClick={()=>save(false)}>{saving?<LoaderCircle className="spin"/>:saved?<Check/>:null} {quiz.status==='published'?'Lưu thay đổi':'Lưu nháp'}</button><button className="btn primary" disabled={saving} onClick={()=>save(true)}><Rocket/> Xuất bản & lấy link</button></div></header>
    <div className="editor-layout">
      <aside className="question-list"><div className="question-list-head"><b>Câu hỏi</b><span>{quiz.questions.length}</span></div><div className="question-scroll">{quiz.questions.map((q,i)=><button className={`${i===selected?'question-item active':'question-item'} ${q.needsReview?'needs-review':''}`} key={q.id} onClick={()=>setSelected(i)}><span>{q.needsReview?'!':i+1}</span><div><b>{q.text || 'Câu hỏi chưa có nội dung'}</b><small>{q.type==='true_false'?'Đúng / Sai':`Trắc nghiệm · ${q.options.length} lựa chọn`}</small></div><Trash2 onClick={e=>{e.stopPropagation();deleteQuestion(i)}}/></button>)}</div><button className="add-question" onClick={addQuestion}><Plus/> Thêm câu hỏi</button></aside>
      <main className="question-editor"><div className="editor-canvas">
          {saveError&&<div className="data-error">{saveError}</div>}
          {importNotice&&<div className="import-notice detailed"><CheckCircle2/><span><b>{importNotice.message}</b>{importNotice.warnings?.length>0&&<small>{importNotice.warnings.slice(0,4).join(' · ')}{importNotice.warnings.length>4?'…':''}</small>}</span><button aria-label="Đóng thông báo" onClick={()=>setImportNotice(null)}><X/></button></div>}
          {question.needsReview&&<div className="review-warning"><CircleAlert/><span>Câu này được nhập từ JSON nhưng chưa nhận dạng được đáp án. Hãy chọn đáp án đúng.</span></div>}
          <div className="mobile-question-nav"><button disabled={selected===0} onClick={()=>setSelected(value=>Math.max(0,value-1))}><ArrowLeft/></button><label><span>Câu hỏi</span><select value={selected} onChange={event=>setSelected(Number(event.target.value))}>{quiz.questions.map((item,index)=><option value={index} key={item.id}>Câu {index+1}: {item.text||'Chưa có nội dung'}</option>)}</select></label><button disabled={selected===quiz.questions.length-1} onClick={()=>setSelected(value=>Math.min(quiz.questions.length-1,value+1))}><ArrowRight/></button></div>
          <div className="editor-meta"><span>CÂU {selected+1}</span><div className="editor-meta-actions"><div className="question-type-switch"><button className={question.type!=='true_false'?'active':''} onClick={()=>setQuestionType('choice')}>Trắc nghiệm</button><button className={question.type==='true_false'?'active':''} onClick={()=>setQuestionType('true_false')}>Đúng / Sai</button></div><label><Clock3/> <select value={quiz.timeLimit} onChange={e=>setQuiz({...quiz,timeLimit:Number(e.target.value)})}><option value="10">10 giây</option><option value="20">20 giây</option><option value="30">30 giây</option><option value="60">60 giây</option></select></label></div></div>
          <textarea className="question-input" value={question.text} onChange={e=>setQuestion({text:e.target.value})} placeholder="Nhập nội dung câu hỏi của bạn..." rows="2"/>
          <p className="answer-label">{question.type==='true_false'?'CHỌN ĐÚNG HOẶC SAI':'CÁC LỰA CHỌN'} <span>Chọn dấu tích cho đáp án đúng</span></p>
          <div className="answer-editor-grid">{question.options.map((opt,i)=><div className={question.correct===i?'answer-editor correct':'answer-editor'} key={i}><button className="answer-check" onClick={()=>setQuestion({correct:i,needsReview:false})}>{question.correct===i?<Check/>:answerLetters[i]}</button><input disabled={question.type==='true_false'} value={opt} onChange={e=>{const options=[...question.options];options[i]=e.target.value;setQuestion({options})}} placeholder={`Nhập đáp án ${answerLetters[i]}...`}/>{question.correct===i&&<span className="correct-label">Đáp án đúng</span>}{question.type!=='true_false'&&question.options.length>2&&<button className="remove-option" title="Xóa lựa chọn" onClick={()=>removeOption(i)}><X/></button>}</div>)}</div>
          <div className="answer-tools"><span>{question.type==='true_false'?'Hai lựa chọn được tạo tự động.':`${question.options.length}/8 lựa chọn`}</span>{question.type!=='true_false'&&<button disabled={question.options.length>=8} onClick={addOption}><Plus/> Thêm lựa chọn</button>}</div>
          <div className="explanation-box"><span><CircleHelp/></span><label><b>Giải thích đáp án</b><small>Hiển thị cho người chơi sau khi nộp bài.</small><textarea rows="3" value={question.explanation||''} onChange={e=>setQuestion({explanation:e.target.value})} placeholder="Ví dụ: Hà Nội là thủ đô của Việt Nam từ năm 1010..."/></label></div>
          <div className="quiz-settings"><h3><Settings/> Thiết lập bộ đề</h3><div className="settings-row"><label>Biểu tượng<input className="emoji-input" value={quiz.emoji} onChange={e=>setQuiz({...quiz,emoji:e.target.value})}/></label><label>Màu chủ đề<div className="color-picker">{colors.map(c=><button key={c} className={`${c} ${quiz.color===c?'active':''}`} onClick={()=>setQuiz({...quiz,color:c})}>{quiz.color===c&&<Check/>}</button>)}</div></label><label>Mô tả<input value={quiz.description} onChange={e=>setQuiz({...quiz,description:e.target.value})} placeholder="Mô tả ngắn về bộ đề"/></label></div></div>
        </div><div className="editor-footer"><span>{dirty?<CircleAlert/>:<CheckCircle2/>} {dirty?'Có thay đổi chưa lưu':'Mọi thay đổi đã được lưu'}</span><button className="btn primary" onClick={addQuestion}>Thêm câu tiếp theo <ArrowRight/></button></div></main>
    </div>
    {share&&<ShareModal quiz={quiz} onClose={()=>setShare(false)}/>}
    {importOpen && (
      <JsonImportModal onClose={()=>setImportOpen(false)} onImport={importJson}/>
    )}
  </AdminShell>;
}

function QuizPlayer({ quiz, go }) {
  const [phase, setPhase] = useState('intro');
  const [name, setName] = useState('');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(()=>Array(quiz?.questions?.length||0).fill(null));
  const [selected, setSelected] = useState(null);
  const [time, setTime] = useState(quiz?.timeLimit || 20);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [playError, setPlayError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);
  const [points, setPoints] = useState(0);
  const [retryQueue, setRetryQueue] = useState([]);
  const [round, setRound] = useState('main');
  const [retryPosition, setRetryPosition] = useState(0);
  const question = quiz?.questions[index];
  useEffect(() => {
    if (phase !== 'playing' || done || checking) return;
    if (time <= 0) { submitAnswer(null); return; }
    const timer = setTimeout(()=>setTime(t=>t-1),1000); return ()=>clearTimeout(timer);
  }, [phase,time,done,checking,index]);
  useEffect(()=>{
    if (phase!=='playing'||done||checking) return;
    const handleKey = event => {
      const key=event.key.toUpperCase();
      const byLetter=answerLetters.indexOf(key);
      const byNumber=/^[1-8]$/.test(event.key)?Number(event.key)-1:-1;
      const optionIndex=byLetter>=0?byLetter:byNumber;
      if(optionIndex>=0&&optionIndex<(question?.options?.length||0)){event.preventDefault();chooseAnswer(optionIndex);}
    };
    window.addEventListener('keydown',handleKey); return()=>window.removeEventListener('keydown',handleKey);
  },[phase,done,checking,index,question]);
  if (!quiz) return <NotFound go={go}/>;
  function chooseAnswer(answer) {
    if(done||checkingRef.current) return;
    setSelected(answer);
    submitAnswer(answer);
  }
  async function submitAnswer(answer = selected) {
    if(done||checkingRef.current) return;
    checkingRef.current=true;
    setChecking(true); setPlayError('');
    try {
      const checked = await checkAnswer(quiz.id, question.id, answer);
      const nextAnswers=[...answers]; nextAnswers[index]=answer; setAnswers(nextAnswers);
      const earned = checked.is_correct ? (round==='main' ? 700 + time*15 : 350 + time*5) : 0;
      setFeedback({...checked,earned}); setPoints(value=>value+earned); setDone(true);
      if(!checked.is_correct && round==='main') setRetryQueue(queue=>queue.includes(index)?queue:[...queue,index]);
    } catch(err) {
      if(/Database chưa có chức năng chấm từng câu/i.test(err.message||'')) {
        const nextAnswers=[...answers]; nextAnswers[index]=answer; setAnswers(nextAnswers);
        setFeedback({pending:true,earned:0,explanation:err.message}); setDone(true);
      } else setPlayError(err.message || 'Không thể kiểm tra đáp án.');
    }
    finally { checkingRef.current=false; setChecking(false); }
  }
  const finishAttempt = async () => {
    setPhase('submitting');
    try { setResult(await submitAttempt(quiz.id,name,answers)); setPhase('result'); }
    catch(err) { setSubmitError(err.message || 'Không thể gửi bài làm.'); setPhase('submit-error'); }
  };
  const nextQuestion = () => {
    setDone(false); setSelected(null); setFeedback(null); setPlayError(''); setTime(quiz.timeLimit);
    if(round==='main' && index<quiz.questions.length-1){setIndex(index+1);return;}
    if(round==='main' && retryQueue.length){setRound('retry');setRetryPosition(0);setIndex(retryQueue[0]);return;}
    if(round==='retry' && retryPosition<retryQueue.length-1){const next=retryPosition+1;setRetryPosition(next);setIndex(retryQueue[next]);return;}
    finishAttempt();
  };
  const resetGame = () => {checkingRef.current=false;setChecking(false);setPhase('intro');setIndex(0);setAnswers(Array(quiz.questions.length).fill(null));setSelected(null);setDone(false);setResult(null);setFeedback(null);setPoints(0);setRetryQueue([]);setRound('main');setRetryPosition(0);setTime(quiz.timeLimit)};
  const score = Number(result?.score || 0);
  const percent = Math.round(Number(result?.percent || 0));
  const resultLabel = percent>=80?'HOÀN THÀNH XUẤT SẮC!':percent>=50?'TIẾN BỘ RẤT TỐT!':'CỐ GẮNG THÊM MỘT CHÚT!';
  const resultTitle = percent>=80?`Làm tốt lắm, ${name}!`:percent>=50?`Khá lắm, ${name}!`:`Đừng bỏ cuộc, ${name}!`;
  if (phase === 'intro') return <div className={`player-page player-${quiz.color}`}><div className="player-nav"><Logo onClick={()=>go('/')}/><button aria-label="Đóng" onClick={()=>go('/')}><X/></button></div><div className="intro-card"><span className={`intro-emoji ${quiz.color}`}>{quiz.emoji}</span><span className="public-badge"><Globe2/> BÀI TRẮC NGHIỆM CÔNG KHAI</span><h1>{quiz.title}</h1><p>{quiz.description}</p><div className="quiz-facts"><span><ListChecks/><b>{quiz.questions.length}</b><small>Câu hỏi</small></span><span><Clock3/><b>{quiz.timeLimit}s</b><small>Mỗi câu</small></span><span><Users/><b>{quiz.plays.toLocaleString('vi-VN')}</b><small>Lượt chơi</small></span></div><label className="name-field"><span>TÊN CỦA BẠN</span><input autoFocus maxLength="80" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&name.trim()&&setPhase('playing')} placeholder="Nhập tên để bắt đầu..."/></label><button className="btn primary huge full" disabled={!name.trim()} onClick={()=>setPhase('playing')}>Bắt đầu ngay <ArrowRight/></button><small className="privacy"><ShieldCheck/> Kết quả của bạn chỉ được chia sẻ với người tạo quiz</small></div><span className="deco deco-1">✦</span><span className="deco deco-2">●</span><span className="deco deco-3">▲</span></div>;
  if (phase === 'submitting') return <LoadingScreen label="Đang chấm điểm trên Supabase..."/>;
  if (phase === 'submit-error') return <div className="not-found"><span><Database size={80}/></span><h1>Chưa thể gửi bài</h1><p>{submitError}</p><button className="btn primary" onClick={async()=>{setPhase('submitting');try{setResult(await submitAttempt(quiz.id,name,answers));setPhase('result')}catch(err){setSubmitError(err.message);setPhase('submit-error')}}}>Thử gửi lại</button></div>;
  if (phase === 'result') return <div className="result-page"><div className="confetti c1">★</div><div className="confetti c2">●</div><div className="confetti c3">◆</div><div className="result-card expanded"><div className="result-trophy"><Trophy/></div><span className="result-label">{resultLabel}</span><h1>{resultTitle}</h1><p>Bạn đã hoàn thành “{quiz.title}”{retryQueue.length?` và ôn lại ${retryQueue.length} câu cần củng cố.`:'.'}</p><div className="result-summary"><div className="score-ring" style={{'--score':`${percent*3.6}deg`}}><div><strong>{percent}%</strong><span>ĐIỂM SỐ</span></div></div><div className="result-stats"><span><CheckCircle2/><b>{score}</b><small>Đúng</small></span><span><X/><b>{quiz.questions.length-score}</b><small>Sai</small></span><span><Star/><b>{points.toLocaleString('vi-VN')}</b><small>Điểm game</small></span></div></div>{result?.review?.length>0&&<div className="answer-review"><div className="review-title"><h2>Xem lại đáp án</h2><span>{score}/{quiz.questions.length} câu đúng</span></div>{result.review.map((item,i)=>{const q=quiz.questions[item.position]||quiz.questions[i];const isCorrect=item.selected===item.correct;return <article className={isCorrect?'review-item correct':'review-item wrong'} key={item.position}><div className="review-question"><span>{item.position+1}</span><div><b>{q?.text}</b><small>{isCorrect?'Trả lời chính xác':'Cần xem lại'}</small></div>{isCorrect?<CheckCircle2/>:<X/>}</div><div className="review-answer"><span>Đáp án đúng</span><b>{answerLetters[item.correct]}. {q?.options?.[item.correct]}</b></div>{item.explanation&&<div className="review-explanation"><CircleHelp/><p>{item.explanation}</p></div>}</article>})}</div>}<div className="result-actions"><button className="btn soft big" onClick={resetGame}><Play/> Chơi lại</button><button className="btn primary big" onClick={()=>go('/')}><Home/> Về trang chủ</button></div></div></div>;
  const progress = round==='main' ? (index+1)/quiz.questions.length*100 : (retryPosition+1)/Math.max(retryQueue.length,1)*100;
  return <div className={`play-screen player-${quiz.color}`}><header className="play-header"><Logo onClick={()=>go('/')}/><div className="play-hud"><div className="points-pill"><Star fill="currentColor"/><span><b>{points.toLocaleString('vi-VN')}</b> điểm</span></div><div className="player-name"><span>{name.slice(0,2).toUpperCase()}</span><b>{name}</b></div></div><button aria-label="Thoát bài làm" onClick={()=>window.confirm('Bạn muốn thoát bài đang làm?')&&go('/')}><X/></button></header><div className="play-progress"><i style={{width:`${progress}%`}}/></div><main className="play-main"><div className="play-meta"><span>{round==='retry'?`ÔN LẠI ${retryPosition+1} / ${retryQueue.length}`:`CÂU HỎI ${index+1} / ${quiz.questions.length}`}</span><div className={time<=5?'countdown danger':'countdown'}><Clock3/><b>{time}</b><small>GIÂY</small></div>{round==='retry'&&<span className="retry-badge"><Flame/> Câu cần củng cố</span>}</div><h1>{question.text}</h1>{playError&&<div className="data-error">{playError}</div>}<div className="play-options">{question.options.map((opt,i)=>{let state=selected===i?'selected':'';if(done&&feedback&&!feedback.pending){if(i===feedback.correct)state='correct';else if(i===selected)state='wrong'}return <button key={i} aria-pressed={selected===i} disabled={done||checking} className={state} onClick={()=>chooseAnswer(i)}><span>{answerLetters[i]}</span><b>{opt || `Đáp án ${answerLetters[i]}`}</b>{checking&&selected===i?<LoaderCircle className="spin"/>:done&&feedback&&!feedback.pending&&i===feedback.correct?<CheckCircle2/>:selected===i?<CheckCircle2/>:null}</button>})}</div>{!done&&<div className={checking?'answer-tap-hint checking':'answer-tap-hint'}>{checking?<><LoaderCircle className="spin"/> Đang chấm đáp án...</>:<>Chạm vào một đáp án để trả lời ngay</>}</div>}{done&&feedback&&<div className={feedback.pending?'instant-feedback neutral':feedback.is_correct?'instant-feedback success':'instant-feedback error'}><span>{feedback.is_correct?<CheckCircle2/>:<CircleAlert/>}</span><div><b>{feedback.pending?'Cần nâng cấp database để xem đúng/sai ngay':feedback.is_correct?`Chính xác! +${feedback.earned} điểm`:round==='main'?'Chưa đúng — đã thêm vào vòng ôn lại':'Chưa đúng — hãy xem kỹ phần giải thích'}</b><p>{feedback.explanation||`Đáp án đúng là ${answerLetters[feedback.correct]}. ${question.options[feedback.correct]}`}</p></div></div>}{done&&<button className="btn next-btn ready" onClick={nextQuestion}>{round==='main'&&index===quiz.questions.length-1?(retryQueue.length?'Bắt đầu ôn lại':'Xem kết quả'):round==='retry'&&retryPosition===retryQueue.length-1?'Xem kết quả':'Câu tiếp theo'} <ArrowRight/></button>}</main></div>;
}

function LoadingScreen({ label = 'Đang tải dữ liệu...' }) {
  return <div className="loading-screen"><span className="loading-mark"><Zap fill="currentColor"/></span><LoaderCircle className="spin"/><p>{label}</p></div>;
}

function SetupScreen({ go }) {
  return <div className="setup-page"><Logo onClick={()=>go('/')}/><div className="setup-card"><span className="share-icon"><Database/></span><h1>Kết nối Supabase</h1><p>Project đã sẵn sàng dùng dữ liệu thật. Hãy tạo file <code>.env</code> từ <code>.env.example</code> và điền thông tin project của bạn.</p><div className="env-example"><span>VITE_SUPABASE_URL=https://...supabase.co</span><span>VITE_SUPABASE_ANON_KEY=sb_publishable_...</span></div><ol><li>Chạy toàn bộ file <code>supabase/schema.sql</code> trong SQL Editor.</li><li>Điền URL và Publishable key vào file <code>.env</code>.</li><li>Khởi động lại lệnh <code>npm run dev</code>.</li></ol><button className="btn soft full" onClick={()=>go('/')}><ArrowLeft/> Về trang chủ</button></div></div>;
}

function AuthScreen({ go }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [canResend, setCanResend] = useState(false);
  const authMessage = (error) => {
    if (error?.code === 'email_not_confirmed' || /email not confirmed/i.test(error?.message || '')) return 'Email chưa được xác nhận. Hãy mở email Supabase đã gửi hoặc bấm “Gửi lại email xác nhận”.';
    if (error?.code === 'invalid_credentials' || /invalid login credentials/i.test(error?.message || '')) return 'Email hoặc mật khẩu không đúng. Nếu vừa đăng ký, hãy kiểm tra email xác nhận trước.';
    if (error?.code === 'user_already_exists' || /already registered/i.test(error?.message || '')) return 'Email này đã được đăng ký. Hãy chuyển sang đăng nhập.';
    return error?.message || 'Không thể xác thực tài khoản.';
  };
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setMessage(''); setCanResend(false);
    const emailRedirectTo = `${window.location.origin}${window.location.pathname}?auth=confirmed`;
    const action = mode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password, options: { emailRedirectTo } });
    const { data, error } = await action; setBusy(false);
    if (error) { setMessage(authMessage(error)); setCanResend(error.code === 'email_not_confirmed' || /confirm|credentials/i.test(error.message || '')); return; }
    if (mode === 'signup' && !data.session) { setMessage('Đã tạo tài khoản. Supabase vừa gửi email xác nhận; hãy bấm link trong email rồi đăng nhập.'); setCanResend(true); }
  };
  const resend = async () => {
    if (!email) { setMessage('Nhập email cần xác nhận trước.'); return; }
    setBusy(true); setMessage('');
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}?auth=confirmed` } });
    setBusy(false); setMessage(error ? authMessage(error) : 'Đã gửi lại email xác nhận. Hãy kiểm tra cả thư rác/spam.');
  };
  return <div className="auth-page"><div className="auth-side"><Logo onClick={()=>go('/')}/><div><span className="eyebrow light"><ShieldCheck/> ADMIN QUIZORA</span><h1>Tạo bài học<br/>khiến ai cũng<br/><em>muốn tham gia.</em></h1><p>Dữ liệu được bảo vệ bằng Supabase Auth và Row Level Security.</p></div><small>© 2026 Quizora</small></div><div className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><span className="mobile-auth-logo"><Logo onClick={()=>go('/')}/></span><h2>{mode==='login'?'Chào mừng trở lại':'Tạo tài khoản admin'}</h2><p>{mode==='login'?'Đăng nhập để quản lý các bộ câu hỏi của bạn.':'Bắt đầu tạo và chia sẻ quiz với dữ liệu thật.'}</p>{message&&<div className={/^Đã/.test(message)?'data-success':'data-error'}>{message}</div>}{canResend&&<button className="auth-resend" type="button" disabled={busy} onClick={resend}>Gửi lại email xác nhận</button>}<label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com"/></label><label>Mật khẩu<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} required minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự"/></label><button className="btn primary huge full" disabled={busy}>{busy?<LoaderCircle className="spin"/>:null}{mode==='login'?'Đăng nhập':'Tạo tài khoản'} <ArrowRight/></button><div className="auth-switch">{mode==='login'?'Chưa có tài khoản?':'Đã có tài khoản?'} <button type="button" onClick={()=>{setMode(mode==='login'?'signup':'login');setMessage('');setCanResend(false)}}>{mode==='login'?'Đăng ký ngay':'Đăng nhập'}</button></div></form></div></div>;
}

function PublicQuizRoute({ id, go }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetchPublicQuiz(id).then(data=>{if(active)setQuiz(data)}).catch(err=>{if(active)setError(err.message)}).finally(()=>{if(active)setLoading(false)});
    return ()=>{active=false};
  }, [id]);
  if (loading) return <LoadingScreen label="Đang tải bộ câu hỏi từ Supabase..."/>;
  if (error || !quiz) return <NotFound go={go}/>;
  return <QuizPlayer quiz={quiz} go={go}/>;
}

function NotFound({go}) { return <div className="not-found"><span>404</span><h1>Không tìm thấy trang</h1><p>Đường link có thể đã hết hạn hoặc không tồn tại.</p><button className="btn primary" onClick={()=>go('/')}><Home/> Về trang chủ</button></div>; }

export function App() {
  const [route, go] = useHashRoute();
  const { session, loading: authLoading } = useSupabaseSession();
  const store = useQuizStore(session?.user?.id);
  if (route === '/') return <Landing go={go} isLoggedIn={Boolean(session)}/>;
  if (route.startsWith('/quiz/')) {
    if (!isSupabaseConfigured) return <SetupScreen go={go}/>;
    return <PublicQuizRoute id={route.split('?')[0].split('/').pop()} go={go}/>;
  }
  if (route.startsWith('/admin')) {
    if (!isSupabaseConfigured) return <SetupScreen go={go}/>;
    if (authLoading) return <LoadingScreen label="Đang kiểm tra phiên đăng nhập..."/>;
    if (!session) return <AuthScreen go={go}/>;
    if (route === '/admin') return <Dashboard go={go} quizzes={store.quizzes} attempts={store.attempts} onDelete={store.remove} onReload={store.reload} loading={store.loading} error={store.error} user={session.user}/>;
    if (route === '/admin/quizzes') return <Dashboard go={go} quizzes={store.quizzes} attempts={store.attempts} onDelete={store.remove} onReload={store.reload} loading={store.loading} error={store.error} user={session.user} active="quizzes"/>;
    if (route === '/admin/results') return <Analytics go={go} quizzes={store.quizzes} attempts={store.attempts} onReload={store.reload} loading={store.loading} error={store.error} user={session.user} mode="results"/>;
    if (route === '/admin/participants') return <Analytics go={go} quizzes={store.quizzes} attempts={store.attempts} onReload={store.reload} loading={store.loading} error={store.error} user={session.user} mode="participants"/>;
    if (route === '/admin/new') return <Editor go={go} quizzes={store.quizzes} onSave={store.persist} user={session.user}/>;
    if (route.startsWith('/admin/edit/')) {
      if (!store.loaded || store.loading) return <LoadingScreen label="Đang tải bộ câu hỏi..."/>;
      const id = route.split('/').pop();
      if (!store.quizzes.some(q=>q.id===id)) return <NotFound go={go}/>;
      return <Editor go={go} quizzes={store.quizzes} onSave={store.persist} user={session.user} id={id}/>;
    }
  }
  return <NotFound go={go}/>;
}
