import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BarChart3, BookOpen, Check, CheckCircle2, ChevronDown,
  CircleHelp, Clock3, Copy, Crown, Edit3, Eye, Flame, Globe2, Grid2X2, Home,
  Layers3, Link2, ListChecks, Menu, MoreHorizontal, PartyPopper, Play, Plus,
  Database, LoaderCircle, LogOut, Rocket, Search, Settings, Share2, ShieldCheck,
  Sparkles, Star, Trash2, Trophy, Users, WandSparkles, X, Zap
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { deleteQuiz, fetchOwnerQuizzes, fetchPublicQuiz, saveQuiz, submitAttempt } from './lib/quizApi';

const uid = () => Math.random().toString(36).slice(2, 9);

const colors = ['purple', 'orange', 'blue', 'green'];
const answerLetters = ['A', 'B', 'C', 'D'];

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
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, loading };
}

function useQuizStore(userId) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reload = async () => {
    if (!userId) { setQuizzes([]); return; }
    setLoading(true); setError('');
    try { setQuizzes(await fetchOwnerQuizzes(userId)); }
    catch (err) { setError(err.message || 'Không thể tải dữ liệu từ Supabase.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, [userId]);
  const persist = async (quiz, status) => { const saved = await saveQuiz(quiz, status); await reload(); return saved; };
  const remove = async (id) => { await deleteQuiz(id); await reload(); };
  return { quizzes, loading, error, reload, persist, remove };
}

const Logo = ({ onClick }) => (
  <button className="logo" onClick={onClick} aria-label="Quizora trang chủ">
    <span className="logo-mark"><Zap size={20} fill="currentColor" /></span><span>quizora</span>
  </button>
);

function PublicNav({ go }) {
  const [open, setOpen] = useState(false);
  return <header className="public-nav wrap">
    <Logo onClick={() => go('/')} />
    <nav className={open ? 'nav-links open' : 'nav-links'}>
      <a href="#features">Tính năng</a><a href="#how">Cách hoạt động</a><a href="#reviews">Cộng đồng</a>
    </nav>
    <div className="nav-actions"><button className="btn ghost hide-mobile" onClick={() => go('/admin')}>Đăng nhập</button><button className="btn primary" onClick={() => go('/admin')}>Tạo quiz miễn phí <ArrowRight size={17}/></button></div>
    <button className="icon-btn mobile-menu" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
  </header>;
}

function Landing({ go }) {
  return <div className="landing">
    <PublicNav go={go}/>
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
    <footer className="footer wrap"><Logo onClick={() => go('/')}/><span>© 2026 Quizora. Made with 💜 for learners.</span><div><a href="#features">Tính năng</a><a href="#how">Hướng dẫn</a><a href="#admin">Admin</a></div></footer>
  </div>;
}

function AdminShell({ go, children, active = 'dashboard', user }) {
  const [collapsed, setCollapsed] = useState(false);
  return <div className={collapsed ? 'admin-shell collapsed' : 'admin-shell'}>
    <aside className="sidebar">
      <div className="sidebar-head"><Logo onClick={() => go('/')}/><button onClick={() => setCollapsed(!collapsed)} className="collapse-btn"><Menu size={19}/></button></div>
      <nav><button className={active === 'dashboard' ? 'active':''} onClick={() => go('/admin')}><Grid2X2/><span>Tổng quan</span></button><button className={active === 'quizzes' ? 'active':''} onClick={() => go('/admin')}><ListChecks/><span>Bộ câu hỏi</span></button><button><BarChart3/><span>Kết quả</span></button><button><Users/><span>Người tham gia</span></button></nav>
      <div className="sidebar-bottom"><button><CircleHelp/><span>Trợ giúp</span></button><button onClick={() => supabase.auth.signOut()}><LogOut/><span>Đăng xuất</span></button><div className="user-chip"><span className="user-avatar">AD</span><span><b>Admin</b><small>{user?.email || 'Quản trị viên'}</small></span><ChevronDown size={16}/></div></div>
    </aside>
    <main className="admin-main">{children}</main>
  </div>;
}

function StatCard({ icon, label, value, trend, tone }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><div><span>{label}</span><strong>{value}</strong><small className={trend?.startsWith('+') ? 'up' : ''}>{trend}</small></div></article>;
}

function ShareModal({ quiz, onClose }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}${window.location.pathname}#/quiz/${quiz.id}`;
  const copy = async () => { try { await navigator.clipboard.writeText(url); } catch {} setCopied(true); setTimeout(() => setCopied(false), 1800); };
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="share-modal" onMouseDown={e => e.stopPropagation()}>
    <button className="modal-close" onClick={onClose}><X/></button><span className="share-icon"><Share2/></span><h2>Quiz đã sẵn sàng!</h2><p>Chia sẻ đường link bên dưới để mọi người bắt đầu làm bài.</p>
    <div className="share-quiz"><span className={`quiz-emoji ${quiz.color}`}>{quiz.emoji}</span><div><b>{quiz.title}</b><small>{quiz.questions.length} câu hỏi · {quiz.timeLimit} giây/câu</small></div></div>
    <label className="link-label">LINK THAM GIA</label><div className="copy-field"><Link2/><input readOnly value={url}/><button onClick={copy}>{copied ? <Check/> : <Copy/>}{copied ? 'Đã chép' : 'Sao chép'}</button></div>
    <div className="share-hint"><ShieldCheck/><span>Người tham gia không cần đăng nhập để làm bài</span></div>
    <button className="btn primary full" onClick={() => { window.open(url, '_blank'); }}><Eye size={18}/> Xem trang người làm bài</button>
  </div></div>;
}

function Dashboard({ go, quizzes, onDelete, loading, error, user }) {
  const [shareQuiz, setShareQuiz] = useState(null);
  const [query, setQuery] = useState('');
  const [actionError, setActionError] = useState('');
  const filtered = quizzes.filter(q => q.title.toLowerCase().includes(query.toLowerCase()));
  const remove = async (id) => { if (!window.confirm('Bạn muốn xóa bộ câu hỏi này?')) return; try { setActionError(''); await onDelete(id); } catch (err) { setActionError(err.message); } };
  return <AdminShell go={go} user={user}>
    <header className="admin-top"><div><span>Không gian làm việc /</span><b>Tổng quan</b></div><button className="notification">●</button></header>
    <div className="admin-content">
      <section className="welcome"><div><p>Thứ Ba, 14 tháng 7</p><h1>Chào buổi sáng, Minh! <span>👋</span></h1><small>Sẵn sàng tạo nên một buổi học thật thú vị chưa?</small></div><button className="btn primary big" onClick={() => go('/admin/new')}><Plus/> Tạo bộ câu hỏi</button></section>
      <section className="stats-grid"><StatCard tone="purple" icon={<Layers3/>} label="Tổng bộ câu hỏi" value={quizzes.length} trend="+2 tháng này"/><StatCard tone="orange" icon={<Play/>} label="Lượt tham gia" value={quizzes.reduce((a,q)=>a+q.plays,0).toLocaleString('vi-VN')} trend="+18.4% so với tháng trước"/><StatCard tone="blue" icon={<BarChart3/>} label="Điểm trung bình" value={`${Math.round(quizzes.filter(q=>q.average).reduce((a,q)=>a+q.average,0)/(quizzes.filter(q=>q.average).length || 1))}%`} trend="+3.2% so với tháng trước"/><StatCard tone="green" icon={<Trophy/>} label="Tỉ lệ hoàn thành" value="91%" trend="+5.1% so với tháng trước"/></section>
      {(error || actionError) && <div className="data-error">{error || actionError}</div>}
      <section className="dashboard-panel"><div className="panel-head"><div><h2>Bộ câu hỏi của bạn</h2><p>Dữ liệu được đồng bộ trực tiếp từ Supabase.</p></div><div className="panel-tools"><label className="search"><Search/><input placeholder="Tìm bộ câu hỏi..." value={query} onChange={e=>setQuery(e.target.value)}/></label><button className="icon-btn"><MoreHorizontal/></button></div></div>
        <div className="quiz-table"><div className="table-header"><span>BỘ CÂU HỎI</span><span>TRẠNG THÁI</span><span>LƯỢT CHƠI</span><span>ĐIỂM TB</span><span>NGÀY TẠO</span><span></span></div>
          {filtered.map(quiz => <div className="table-row" key={quiz.id}><div className="quiz-name"><span className={`quiz-emoji ${quiz.color}`}>{quiz.emoji}</span><span><b>{quiz.title}</b><small>{quiz.questions.length} câu hỏi · {quiz.timeLimit} giây/câu</small></span></div><span><i className={`status ${quiz.status}`}/>{quiz.status === 'published' ? 'Đã xuất bản':'Bản nháp'}</span><b>{quiz.plays.toLocaleString('vi-VN')}</b><b>{quiz.average ? `${quiz.average}%`:'—'}</b><span>{quiz.createdAt}</span><div className="row-actions"><button title="Chia sẻ" onClick={() => setShareQuiz(quiz)}><Share2/></button><button title="Chỉnh sửa" onClick={() => go(`/admin/edit/${quiz.id}`)}><Edit3/></button><button title="Xóa" onClick={() => remove(quiz.id)}><Trash2/></button></div></div>)}
          {loading && <div className="empty-state"><LoaderCircle className="spin"/><h3>Đang tải dữ liệu</h3><p>Quizora đang kết nối tới Supabase...</p></div>}
          {!loading && !filtered.length && <div className="empty-state"><Database/><h3>{query ? 'Không tìm thấy bộ câu hỏi' : 'Chưa có bộ câu hỏi nào'}</h3><p>{query ? 'Thử tìm bằng một từ khóa khác nhé.' : 'Tạo bộ đề đầu tiên, dữ liệu sẽ được lưu thật trên Supabase.'}</p>{!query&&<button className="btn primary" onClick={()=>go('/admin/new')}><Plus/> Tạo ngay</button>}</div>}
        </div>
      </section>
      <section className="tip-banner"><span><Sparkles/></span><div><b>Mẹo nhỏ từ Quizora</b><p>Các bộ đề có từ 7–12 câu hỏi thường có tỉ lệ hoàn thành cao hơn 34%.</p></div><button>Tìm hiểu thêm <ArrowRight/></button></section>
    </div>{shareQuiz && <ShareModal quiz={shareQuiz} onClose={()=>setShareQuiz(null)}/>} 
  </AdminShell>;
}

const emptyQuestion = () => ({ id: uid(), text: '', options: ['', '', '', ''], correct: 0 });

function Editor({ go, quizzes, onSave, id, user }) {
  const existing = quizzes.find(q => q.id === id);
  const [quiz, setQuiz] = useState(existing || { id: null, title: 'Bộ câu hỏi chưa đặt tên', description: '', emoji: '✨', color: 'purple', status: 'draft', plays: 0, average: 0, createdAt: new Date().toLocaleDateString('vi-VN'), timeLimit: 20, questions: [emptyQuestion()] });
  const [selected, setSelected] = useState(0);
  const [share, setShare] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const question = quiz.questions[selected];
  const setQuestion = (patch) => setQuiz(q => ({...q, questions: q.questions.map((x,i)=>i===selected?{...x,...patch}:x)}));
  const save = async (publish = false) => {
    const hasBlank = !quiz.title.trim() || quiz.questions.some(q => !q.text.trim() || q.options.some(option => !option.trim()));
    if (hasBlank) { setSaveError('Vui lòng nhập đầy đủ tiêu đề, câu hỏi và cả 4 đáp án trước khi lưu.'); return; }
    setSaving(true); setSaveError('');
    try {
      const final = await onSave(quiz, publish ? 'published' : quiz.status);
      setQuiz(final); setSaved(true); setTimeout(()=>setSaved(false),1500); if (publish) setShare(true);
    } catch (err) { setSaveError(err.message || 'Không thể lưu dữ liệu lên Supabase.'); }
    finally { setSaving(false); }
  };
  const addQuestion = () => { setQuiz(q=>({...q,questions:[...q.questions,emptyQuestion()]})); setSelected(quiz.questions.length); };
  const deleteQuestion = (index) => { if(quiz.questions.length===1) return; setQuiz(q=>({...q,questions:q.questions.filter((_,i)=>i!==index)})); setSelected(Math.max(0, selected > index ? selected-1 : Math.min(selected, quiz.questions.length-2))); };
  return <AdminShell go={go} active="quizzes" user={user}>
    <header className="editor-top"><button className="back-btn" onClick={()=>go('/admin')}><ArrowLeft/></button><div className="editable-title"><input value={quiz.title} onChange={e=>setQuiz({...quiz,title:e.target.value})}/><span>{saved ? 'Đã lưu lên Supabase' : 'Chưa lưu thay đổi'}</span></div><div className="editor-actions"><button className="btn soft" disabled={saving} onClick={()=>save(false)}>{saving?<LoaderCircle className="spin"/>:saved?<Check/>:null} Lưu nháp</button><button className="btn primary" disabled={saving} onClick={()=>save(true)}><Rocket/> Xuất bản & lấy link</button></div></header>
    <div className="editor-layout">
      <aside className="question-list"><div className="question-list-head"><b>Câu hỏi</b><span>{quiz.questions.length}</span></div><div className="question-scroll">{quiz.questions.map((q,i)=><button className={i===selected?'question-item active':'question-item'} key={q.id} onClick={()=>setSelected(i)}><span>{i+1}</span><div><b>{q.text || 'Câu hỏi chưa có nội dung'}</b><small>Trắc nghiệm · 4 lựa chọn</small></div><Trash2 onClick={e=>{e.stopPropagation();deleteQuestion(i)}}/></button>)}</div><button className="add-question" onClick={addQuestion}><Plus/> Thêm câu hỏi</button></aside>
      <main className="question-editor"><div className="editor-canvas">{saveError&&<div className="data-error">{saveError}</div>}<div className="editor-meta"><span>CÂU {selected+1}</span><label><Clock3/> <select value={quiz.timeLimit} onChange={e=>setQuiz({...quiz,timeLimit:Number(e.target.value)})}><option value="10">10 giây</option><option value="20">20 giây</option><option value="30">30 giây</option><option value="60">60 giây</option></select></label></div><textarea className="question-input" value={question.text} onChange={e=>setQuestion({text:e.target.value})} placeholder="Nhập nội dung câu hỏi của bạn..." rows="2"/><p className="answer-label">CÁC LỰA CHỌN <span>Chọn dấu tích cho đáp án đúng</span></p><div className="answer-editor-grid">{question.options.map((opt,i)=><div className={question.correct===i?'answer-editor correct':'answer-editor'} key={i}><button onClick={()=>setQuestion({correct:i})}>{question.correct===i?<Check/>:answerLetters[i]}</button><input value={opt} onChange={e=>{const options=[...question.options];options[i]=e.target.value;setQuestion({options})}} placeholder={`Nhập đáp án ${answerLetters[i]}...`}/>{question.correct===i&&<span>Đáp án đúng</span>}</div>)}</div>
          <div className="quiz-settings"><h3><Settings/> Thiết lập bộ đề</h3><div className="settings-row"><label>Biểu tượng<input className="emoji-input" value={quiz.emoji} onChange={e=>setQuiz({...quiz,emoji:e.target.value})}/></label><label>Màu chủ đề<div className="color-picker">{colors.map(c=><button key={c} className={`${c} ${quiz.color===c?'active':''}`} onClick={()=>setQuiz({...quiz,color:c})}>{quiz.color===c&&<Check/>}</button>)}</div></label><label>Mô tả<input value={quiz.description} onChange={e=>setQuiz({...quiz,description:e.target.value})} placeholder="Mô tả ngắn về bộ đề"/></label></div></div>
        </div><div className="editor-footer"><span><CheckCircle2/> Mọi thay đổi đã được ghi nhận</span><button className="btn primary" onClick={addQuestion}>Thêm câu tiếp theo <ArrowRight/></button></div></main>
    </div>{share&&<ShareModal quiz={quiz} onClose={()=>setShare(false)}/>} 
  </AdminShell>;
}

function QuizPlayer({ quiz, go }) {
  const [phase, setPhase] = useState('intro');
  const [name, setName] = useState('');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [time, setTime] = useState(quiz?.timeLimit || 20);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const question = quiz?.questions[index];
  useEffect(() => {
    if (phase !== 'playing' || done) return;
    if (time <= 0) { submitAnswer(null); return; }
    const timer = setTimeout(()=>setTime(t=>t-1),1000); return ()=>clearTimeout(timer);
  }, [phase,time,done]);
  if (!quiz) return <NotFound go={go}/>;
  function submitAnswer(answer = selected) {
    if(done) return; setDone(true); const nextAnswers=[...answers,answer]; setAnswers(nextAnswers);
    setTimeout(async ()=>{
      if(index<quiz.questions.length-1){ setIndex(index+1); setSelected(null); setDone(false); setTime(quiz.timeLimit); return; }
      setPhase('submitting');
      try { setResult(await submitAttempt(quiz.id, name, nextAnswers)); setPhase('result'); }
      catch (err) { setSubmitError(err.message || 'Không thể gửi bài làm.'); setPhase('submit-error'); }
    },700);
  }
  const score = Number(result?.score || 0);
  const percent = Math.round(Number(result?.percent || 0));
  if (phase === 'intro') return <div className={`player-page player-${quiz.color}`}><div className="player-nav"><Logo onClick={()=>go('/')}/><button onClick={()=>go('/')}><X/></button></div><div className="intro-card"><span className={`intro-emoji ${quiz.color}`}>{quiz.emoji}</span><span className="public-badge"><Globe2/> BÀI TRẮC NGHIỆM CÔNG KHAI</span><h1>{quiz.title}</h1><p>{quiz.description}</p><div className="quiz-facts"><span><ListChecks/><b>{quiz.questions.length}</b><small>Câu hỏi</small></span><span><Clock3/><b>{quiz.timeLimit}s</b><small>Mỗi câu</small></span><span><Users/><b>{quiz.plays.toLocaleString('vi-VN')}</b><small>Lượt chơi</small></span></div><label className="name-field"><span>TÊN CỦA BẠN</span><input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&name.trim()&&setPhase('playing')} placeholder="Nhập tên để bắt đầu..."/></label><button className="btn primary huge full" disabled={!name.trim()} onClick={()=>setPhase('playing')}>Bắt đầu ngay <ArrowRight/></button><small className="privacy"><ShieldCheck/> Kết quả của bạn chỉ được chia sẻ với người tạo quiz</small></div><span className="deco deco-1">✦</span><span className="deco deco-2">●</span><span className="deco deco-3">▲</span></div>;
  if (phase === 'submitting') return <LoadingScreen label="Đang chấm điểm trên Supabase..."/>;
  if (phase === 'submit-error') return <div className="not-found"><span><Database size={80}/></span><h1>Chưa thể gửi bài</h1><p>{submitError}</p><button className="btn primary" onClick={async()=>{setPhase('submitting');try{setResult(await submitAttempt(quiz.id,name,answers));setPhase('result')}catch(err){setSubmitError(err.message);setPhase('submit-error')}}}>Thử gửi lại</button></div>;
  if (phase === 'result') return <div className="result-page"><div className="confetti c1">★</div><div className="confetti c2">●</div><div className="confetti c3">◆</div><div className="result-card"><div className="result-trophy"><Trophy/></div><span className="result-label">HOÀN THÀNH XUẤT SẮC!</span><h1>Làm tốt lắm, {name}!</h1><p>Bạn đã hoàn thành “{quiz.title}”</p><div className="score-ring" style={{'--score':`${percent*3.6}deg`}}><div><strong>{percent}%</strong><span>ĐIỂM SỐ</span></div></div><div className="result-stats"><span><CheckCircle2/><b>{score}</b><small>Đúng</small></span><span><X/><b>{quiz.questions.length-score}</b><small>Sai</small></span><span><Flame/><b>{Math.max(1,score)}</b><small>Chuỗi tốt nhất</small></span></div><div className="result-actions"><button className="btn soft big" onClick={()=>{setPhase('intro');setIndex(0);setAnswers([]);setSelected(null);setDone(false);}}><Play/> Chơi lại</button><button className="btn primary big" onClick={()=>go('/')}><Home/> Về trang chủ</button></div></div></div>;
  return <div className={`play-screen player-${quiz.color}`}><header className="play-header"><Logo onClick={()=>go('/')}/><div className="player-name"><span>{name.slice(0,2).toUpperCase()}</span><b>{name}</b></div><button onClick={()=>go('/')}><X/></button></header><div className="play-progress"><i style={{width:`${(index+1)/quiz.questions.length*100}%`}}/></div><main className="play-main"><div className="play-meta"><span>CÂU HỎI {index+1} / {quiz.questions.length}</span><div className={time<=5?'countdown danger':'countdown'}><Clock3/><b>{time}</b><small>GIÂY</small></div></div><h1>{question.text}</h1><div className="play-options">{question.options.map((opt,i)=><button key={i} disabled={done} className={selected===i?'selected':''} onClick={()=>setSelected(i)}><span>{answerLetters[i]}</span><b>{opt || `Đáp án ${answerLetters[i]}`}</b>{selected===i&&<CheckCircle2/>}</button>)}</div><button className="btn next-btn" disabled={selected===null||done} onClick={()=>submitAnswer()}>Xác nhận đáp án <ArrowRight/></button></main></div>;
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
    const emailRedirectTo = `${window.location.origin}${window.location.pathname}#/admin`;
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
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}#/admin` } });
    setBusy(false); setMessage(error ? authMessage(error) : 'Đã gửi lại email xác nhận. Hãy kiểm tra cả thư rác/spam.');
  };
  return <div className="auth-page"><div className="auth-side"><Logo onClick={()=>go('/')}/><div><span className="eyebrow light"><ShieldCheck/> ADMIN QUIZORA</span><h1>Tạo bài học<br/>khiến ai cũng<br/><em>muốn tham gia.</em></h1><p>Dữ liệu được bảo vệ bằng Supabase Auth và Row Level Security.</p></div><small>© 2026 Quizora</small></div><div className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><span className="mobile-auth-logo"><Logo onClick={()=>go('/')}/></span><h2>{mode==='login'?'Chào mừng trở lại':'Tạo tài khoản admin'}</h2><p>{mode==='login'?'Đăng nhập để quản lý các bộ câu hỏi của bạn.':'Bắt đầu tạo và chia sẻ quiz với dữ liệu thật.'}</p>{message&&<div className="data-error">{message}</div>}{canResend&&<button className="auth-resend" type="button" disabled={busy} onClick={resend}>Gửi lại email xác nhận</button>}<label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com"/></label><label>Mật khẩu<input type="password" required minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự"/></label><button className="btn primary huge full" disabled={busy}>{busy?<LoaderCircle className="spin"/>:null}{mode==='login'?'Đăng nhập':'Tạo tài khoản'} <ArrowRight/></button><div className="auth-switch">{mode==='login'?'Chưa có tài khoản?':'Đã có tài khoản?'} <button type="button" onClick={()=>{setMode(mode==='login'?'signup':'login');setMessage('');setCanResend(false)}}>{mode==='login'?'Đăng ký ngay':'Đăng nhập'}</button></div></form></div></div>;
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
  if (route === '/') return <Landing go={go}/>;
  if (route.startsWith('/quiz/')) {
    if (!isSupabaseConfigured) return <SetupScreen go={go}/>;
    return <PublicQuizRoute id={route.split('?')[0].split('/').pop()} go={go}/>;
  }
  if (route.startsWith('/admin')) {
    if (!isSupabaseConfigured) return <SetupScreen go={go}/>;
    if (authLoading) return <LoadingScreen label="Đang kiểm tra phiên đăng nhập..."/>;
    if (!session) return <AuthScreen go={go}/>;
    if (route === '/admin') return <Dashboard go={go} quizzes={store.quizzes} onDelete={store.remove} loading={store.loading} error={store.error} user={session.user}/>;
    if (route === '/admin/new') return <Editor go={go} quizzes={store.quizzes} onSave={store.persist} user={session.user}/>;
    if (route.startsWith('/admin/edit/')) {
      if (store.loading) return <LoadingScreen label="Đang tải bộ câu hỏi..."/>;
      const id = route.split('/').pop();
      if (!store.quizzes.some(q=>q.id===id)) return <NotFound go={go}/>;
      return <Editor go={go} quizzes={store.quizzes} onSave={store.persist} user={session.user} id={id}/>;
    }
  }
  return <NotFound go={go}/>;
}
