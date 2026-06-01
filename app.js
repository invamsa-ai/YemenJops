// ============================================
// FIREBASE CONFIGURATION & IMPORTS
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// استبدل هذه القيم بمشروع Firebase الخاص بك
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAyWmacChzw5Wl-D_YkEObJw74qliw8OQs",
  authDomain: "shaghalni-web.firebaseapp.com",
  projectId: "shaghalni-web",
  storageBucket: "shaghalni-web.firebasestorage.app",
  messagingSenderId: "97870619288",
  appId: "1:97870619288:web:aa949c94ca59a39e0126ed",
  measurementId: "G-SW6K435LB1"
};

let app, auth, db;
let firebaseReady = false;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseReady = true;
    console.log("✅ Firebase متصل بنجاح");
} catch (error) {
    console.warn("⚠️ Firebase غير متصل - استخدام البيانات المحلية:", error.message);
    firebaseReady = false;
}

// جعل الكائنات متاحة لبقية الكود
window.firebaseReady = firebaseReady;
window.auth = auth;
window.db = db;
window.firebaseApp = app;

// ============================================
// البيانات اليمنية - وظائف تجريبية
// ============================================
const yemeniCities = [
    'صنعاء', 'عدن', 'تعز', 'الحديدة', 'إب', 'المكلا', 'سيئون',
    'ذمار', 'عمران', 'مأرب', 'الغيظة', 'زبيد', 'بيحان', 'لحج', 'أبين'
];

const jobCategories = [
    { name: 'تكنولوجيا المعلومات', icon: 'fa-laptop-code', color: '#0d6b4f' },
    { name: 'الهندسة', icon: 'fa-hard-hat', color: '#2563eb' },
    { name: 'التعليم', icon: 'fa-chalkboard-teacher', color: '#7c3aed' },
    { name: 'الرعاية الصحية', icon: 'fa-stethoscope', color: '#dc2626' },
    { name: 'المحاسبة والمالية', icon: 'fa-calculator', color: '#059669' },
    { name: 'التسويق والمبيعات', icon: 'fa-bullhorn', color: '#f4a024' },
    { name: 'الإدارة', icon: 'fa-user-tie', color: '#4f46e5' },
    { name: 'الخدمات اللوجستية', icon: 'fa-truck-fast', color: '#0891b2' },
    { name: 'البناء والتشييد', icon: 'fa-building', color: '#b45309' },
    { name: 'المنظمات غير الحكومية', icon: 'fa-hand-holding-heart', color: '#be123c' },
    { name: 'النفط والغاز', icon: 'fa-oil-can', color: '#1e40af' },
    { name: 'الاتصالات', icon: 'fa-satellite-dish', color: '#0e7490' },
    { name: 'البنوك', icon: 'fa-landmark', color: '#047857' },
    { name: 'الزراعة', icon: 'fa-seedling', color: '#15803d' },
];

const employersData = [
    { name: 'شركة سبأفون', logo: 'س', industry: 'الاتصالات', jobs: 12, city: 'صنعاء' },
    { name: 'يمن موبايل', logo: 'ي', industry: 'الاتصالات', jobs: 8, city: 'صنعاء' },
    { name: 'البنك اليمني للإنشاء والتعمير', logo: 'ب', industry: 'البنوك', jobs: 15, city: 'صنعاء' },
    { name: 'شركة النفط اليمنية', logo: 'ن', industry: 'النفط والغاز', jobs: 20, city: 'صنعاء' },
    { name: 'منظمة اليونيسف - اليمن', logo: 'U', industry: 'المنظمات غير الحكومية', jobs: 25, city: 'صنعاء' },
    { name: 'مستشفى الثورة العام', logo: 'م', industry: 'الرعاية الصحية', jobs: 18, city: 'صنعاء' },
    { name: 'جامعة عدن', logo: 'ج', industry: 'التعليم', jobs: 10, city: 'عدن' },
    { name: 'ميناء عدن', logo: 'م', industry: 'الخدمات اللوجستية', jobs: 6, city: 'عدن' },
    { name: 'شركة تعز للصناعات الغذائية', logo: 'ت', industry: 'الإدارة', jobs: 9, city: 'تعز' },
    { name: 'مؤسسة مأرب الخيرية', logo: 'خ', industry: 'المنظمات غير الحكومية', jobs: 14, city: 'مأرب' },
];

// بيانات الوظائف التجريبية
const mockJobs = [
    { id: 1, title: 'مطور واجهات أمامية (Frontend Developer)', company: 'شركة سبأفون', logo: 'س', city: 'صنعاء',
        category: 'تكنولوجيا المعلومات', type: 'دوام كامل', salary: '250,000', featured: true, urgent: true,
        description: 'نبحث عن مطور واجهات أمامية بخبرة 3+ سنوات في React و Vue.js للعمل على تطوير منصات رقمية.',
        postedAt: '2026-05-28', tags: ['React', 'Vue.js', 'JavaScript', 'CSS'] },
    { id: 2, title: 'محاسب مالي', company: 'البنك اليمني للإنشاء والتعمير', logo: 'ب', city: 'صنعاء',
        category: 'المحاسبة والمالية', type: 'دوام كامل', salary: '180,000', featured: true, urgent: false,
        description: 'مطلوب محاسب مالي بخبرة في القطاع المصرفي وإجادة استخدام الأنظمة المحاسبية.',
        postedAt: '2026-05-27', tags: ['محاسبة', 'تقارير مالية', 'Excel'] },
    { id: 3, title: 'مهندس مدني - مشاريع الطرق', company: 'شركة النفط اليمنية', logo: 'ن', city: 'مأرب',
        category: 'الهندسة', type: 'مشروع مؤقت', salary: '320,000', featured: true, urgent: true,
        description: 'مطلوب مهندس مدني للإشراف على مشاريع البنية التحتية في منطقة مأرب. خبرة 5 سنوات minimum.',
        postedAt: '2026-05-26', tags: ['هندسة مدنية', 'إشراف', 'طرق'] },
    { id: 4, title: 'طبيب عام', company: 'مستشفى الثورة العام', logo: 'م', city: 'صنعاء', category: 'الرعاية الصحية',
        type: 'دوام كامل', salary: '280,000', featured: false, urgent: true,
        description: 'مستشفى الثورة العام يعلن عن حاجته لأطباء عامين للعمل في أقسام الطوارئ.',
        postedAt: '2026-05-25', tags: ['طب عام', 'طوارئ', 'رعاية صحية'] },
    { id: 5, title: 'مدرس لغة إنجليزية', company: 'جامعة عدن', logo: 'ج', city: 'عدن', category: 'التعليم',
        type: 'دوام جزئي', salary: '120,000', featured: false, urgent: false,
        description: 'مطلوب مدرس لغة إنجليزية للتدريس في كلية الآداب. يفضل الحاصلون على شهادة TESOL.',
        postedAt: '2026-05-24', tags: ['لغة إنجليزية', 'تدريس', 'TESOL'] },
    { id: 6, title: 'أخصائي تسويق رقمي', company: 'يمن موبايل', logo: 'ي', city: 'صنعاء', category: 'التسويق والمبيعات',
        type: 'دوام كامل', salary: '200,000', featured: true, urgent: false,
        description: 'نبحث عن أخصائي تسويق رقمي لإدارة الحملات الإعلانية على وسائل التواصل الاجتماعي.',
        postedAt: '2026-05-23', tags: ['تسويق رقمي', 'SEO', 'إعلانات'] },
    { id: 7, title: 'مدير مشروع - منظمات إنسانية', company: 'منظمة اليونيسف - اليمن', logo: 'U', city: 'صنعاء',
        category: 'المنظمات غير الحكومية', type: 'دوام كامل', salary: '450,000', featured: true, urgent: false,
        description: 'إدارة مشاريع المساعدات الإنسانية في المناطق المتضررة. خبرة في العمل الميداني مطلوبة.',
        postedAt: '2026-05-22', tags: ['إدارة مشاريع', 'عمل إنساني', 'لغة إنجليزية'] },
    { id: 8, title: 'فني اتصالات', company: 'شركة سبأفون', logo: 'س', city: 'تعز', category: 'الاتصالات',
        type: 'دوام كامل', salary: '140,000', featured: false, urgent: false,
        description: 'صيانة وتركيب أبراج الاتصالات في محافظة تعز والمناطق المجاورة.',
        postedAt: '2026-05-21', tags: ['اتصالات', 'صيانة', 'أبراج'] },
    { id: 9, title: 'مهندس بترول', company: 'شركة النفط اليمنية', logo: 'ن', city: 'المكلا', category: 'النفط والغاز',
        type: 'دوام كامل', salary: '500,000', featured: true, urgent: true,
        description: 'مطلوب مهندس بترول للعمل في الحقول النفطية بمنطقة المسيلة. خبرة 7+ سنوات.',
        postedAt: '2026-05-20', tags: ['بترول', 'حفر', 'هندسة نفط'] },
    { id: 10, title: 'مندوب مبيعات أدوية', company: 'مستشفى الثورة العام', logo: 'م', city: 'الحديدة',
        category: 'التسويق والمبيعات', type: 'دوام كامل', salary: '160,000', featured: false, urgent: false,
        description: 'تسويق وبيع المستحضرات الدوائية للصيدليات والمستشفيات في محافظة الحديدة.',
        postedAt: '2026-05-19', tags: ['مبيعات', 'أدوية', 'علاقات عامة'] },
    { id: 11, title: 'مصمم جرافيك', company: 'يمن موبايل', logo: 'ي', city: 'عدن', category: 'تكنولوجيا المعلومات',
        type: 'عن بعد', salary: '130,000', featured: false, urgent: false,
        description: 'تصميم المحتوى البصري للحملات التسويقية. إجادة Adobe Creative Suite.',
        postedAt: '2026-05-18', tags: ['Graphic Design', 'Photoshop', 'Illustrator'] },
    { id: 12, title: 'ممرض / ممرضة', company: 'مستشفى الثورة العام', logo: 'م', city: 'إب', category: 'الرعاية الصحية',
        type: 'دوام كامل', salary: '110,000', featured: false, urgent: true,
        description: 'مطلوب ممرضين للعمل في أقسام الجراحة والباطنية. ترخيص مزاولة المهنة مطلوب.',
        postedAt: '2026-05-17', tags: ['تمريض', 'رعاية صحية', 'ترخيص'] },
    { id: 13, title: 'مدير موارد بشرية', company: 'البنك اليمني للإنشاء والتعمير', logo: 'ب', city: 'صنعاء',
        category: 'الإدارة', type: 'دوام كامل', salary: '300,000', featured: true, urgent: false,
        description: 'إدارة شؤون الموظفين والتوظيف والتدريب. خبرة في HR Management Systems.',
        postedAt: '2026-05-16', tags: ['HR', 'إدارة', 'توظيف'] },
    { id: 14, title: 'سائق نقل ثقيل', company: 'ميناء عدن', logo: 'م', city: 'عدن', category: 'الخدمات اللوجستية',
        type: 'دوام كامل', salary: '100,000', featured: false, urgent: false,
        description: 'نقل البضائع داخل الميناء وإلى المستودعات. رخصة قيادة نقل ثقيل سارية.',
        postedAt: '2026-05-15', tags: ['نقل', 'لوجستيات', 'رخصة'] },
    { id: 15, title: 'مهندس زراعي', company: 'شركة تعز للصناعات الغذائية', logo: 'ت', city: 'تعز', category: 'الزراعة',
        type: 'دوام كامل', salary: '170,000', featured: false, urgent: false,
        description: 'الإشراف على المزارع التعاقدية وتطوير الإنتاج الزراعي لمصانع الأغذية.',
        postedAt: '2026-05-14', tags: ['زراعة', 'إنتاج غذائي', 'إشراف'] },
];

// ============================================
// STATE MANAGEMENT
// ============================================
let allJobs = [...mockJobs];
let filteredJobs = [...mockJobs];
let currentUser = null;
let savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');

// ============================================
// FIREBASE OPERATIONS (مع fallback محلي)
// ============================================
async function fetchJobsFromFirebase() {
    if (!window.firebaseReady || !window.db) {
        console.log('استخدام البيانات المحلية (Firebase غير متصل)');
        return [...mockJobs];
    }
    try {
        const jobsRef = collection(window.db, 'jobs');
        const q = query(jobsRef, orderBy('postedAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        const jobs = [];
     snapshot.forEach(doc => {
    jobs.push({ id: doc.id, ...doc.data() });
});
        return jobs.length > 0 ? jobs : [...mockJobs];
    } catch (error) {
        console.warn('خطأ في جلب الوظائف من Firebase:', error.message);
        return [...mockJobs];
    }
}

async function addJobToFirebase(jobData) {
    if (!window.firebaseReady || !window.db) {
        const newJob = { id: Date.now(), ...jobData, postedAt: new Date().toISOString().split('T')[0] };
        allJobs.unshift(newJob);
        return newJob;
    }
    try {
        const docRef = await addDoc(collection(window.db, 'jobs'), {
            ...jobData,
            postedAt: serverTimestamp(),
            createdAt: serverTimestamp()
        });
        return { id: docRef.id, ...jobData };
    } catch (error) {
        console.warn('خطأ في إضافة الوظيفة:', error.message);
        return null;
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================
function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    grid.innerHTML = jobCategories.map(cat => `
        <a href="#" class="category-card" onclick="filterByCategory('${cat.name}'); return false;" title="وظائف ${cat.name} في اليمن">
            <div class="cat-icon"><i class="fas ${cat.icon}"></i></div>
            <div class="cat-name">${cat.name}</div>
            <div class="cat-count">${countJobsByCategory(cat.name)} وظيفة</div>
        </a>
    `).join('');
}

function countJobsByCategory(category) {
    return allJobs.filter(j => j.category === category).length;
}

function renderJobs(jobsToRender) {
    const container = document.getElementById('jobsList');
    const countEl = document.getElementById('resultCount');

    if (!jobsToRender || jobsToRender.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>لا توجد وظائف مطابقة</h3>
                <p>حاول تعديل معايير البحث أو التصفية</p>
            </div>
        `;
        countEl.textContent = '(0 نتيجة)';
        return;
    }

    countEl.textContent = `(${jobsToRender.length} نتيجة)`;
    container.innerHTML = jobsToRender.map(job => `
        <div class="job-card ${job.featured ? 'featured' : ''}" onclick="viewJobDetail(${job.id})">
            <div class="job-actions">
                <button class="btn-bookmark ${(savedJobs.includes(job.id) || savedJobs.includes(String(job.id))) ? 'saved' : ''}"
                        onclick="event.stopPropagation(); toggleSaveJob(${job.id})"
                        title="حفظ الوظيفة">
                    <i class="fas fa-bookmark"></i>
                </button>
            </div>
            <div class="job-top">
                <div class="company-logo">${job.logo || 'ش'}</div>
                <div class="job-info">
                    <h3>${job.title}</h3>
                    <span class="company-name">${job.company}</span>
                </div>
            </div>
            <div class="job-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${job.city}</span>
                <span><i class="fas fa-briefcase"></i> ${job.type || 'دوام كامل'}</span>
                ${job.salary ? `<span><i class="fas fa-money-bill-wave"></i> ${job.salary} ر.ي</span>` : ''}
                <span><i class="fas fa-calendar-alt"></i> ${job.postedAt || 'حديث'}</span>
            </div>
            <div class="job-tags">
                ${job.urgent ? '<span class="job-tag urgent">🔴 عاجل</span>' : ''}
                ${job.featured ? '<span class="job-tag">⭐ مميزة</span>' : ''}
                ${(job.tags || []).slice(0, 3).map(t => `<span class="job-tag">${t}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function renderEmployers() {
    const grid = document.getElementById('employersGrid');
    grid.innerHTML = employersData.map(emp => `
        <div class="employer-card" onclick="filterByEmployer('${emp.name}')" title="وظائف ${emp.name}">
            <div class="emp-logo">${emp.logo}</div>
            <h4>${emp.name}</h4>
            <p class="emp-jobs">${emp.jobs} وظيفة متاحة</p>
            <p style="font-size:0.78rem;color:var(--text-muted);"><i class="fas fa-map-marker-alt"></i> ${emp.city}</p>
        </div>
    `).join('');
}

function viewJobDetail(jobId) {
    const job = allJobs.find(j => j.id == jobId || j.id === jobId);
    if (!job) return;
    const detailHTML = `
        <div class="modal-overlay active" id="jobDetailModal" onclick="if(event.target===this)closeModal('jobDetailModal')">
            <div class="modal" style="max-width:600px;text-align:right;">
                <button class="modal-close" onclick="closeModal('jobDetailModal')">&times;</button>
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                    <div class="company-logo" style="width:56px;height:56px;font-size:1.3rem;">${job.logo||'ش'}</div>
                    <div>
                        <h2 style="margin:0;font-size:1.25rem;">${job.title}</h2>
                        <p style="margin:0;color:var(--text-light);">${job.company} - ${job.city}</p>
                    </div>
                </div>
                <div class="job-meta" style="margin-bottom:14px;">
                    <span><i class="fas fa-briefcase"></i> ${job.type||'دوام كامل'}</span>
                    ${job.salary?`<span><i class="fas fa-money-bill-wave"></i> ${job.salary} ر.ي</span>`:''}
                    <span><i class="fas fa-calendar-alt"></i> ${job.postedAt||'حديث'}</span>
                    <span><i class="fas fa-tag"></i> ${job.category}</span>
                </div>
                <div style="background:var(--bg-gray);padding:16px;border-radius:var(--radius-sm);margin-bottom:14px;">
                    <strong>الوصف الوظيفي:</strong>
                    <p style="margin-top:6px;color:var(--text-medium);">${job.description||'يرجى التواصل مع جهة العمل لمزيد من التفاصيل.'}</p>
                </div>
                ${job.tags?.length?`<div class="job-tags" style="margin-bottom:14px;">${job.tags.map(t=>`<span class="job-tag">${t}</span>`).join('')}</div>`:''}
                <button class="btn btn-primary btn-block btn-lg" onclick="applyForJob(${job.id})">
                    <i class="fas fa-paper-plane"></i> تقديم طلب التوظيف
                </button>
                <button class="btn btn-outline btn-block" style="margin-top:8px;" onclick="toggleSaveJob(${job.id});closeModal('jobDetailModal');">
                    <i class="fas fa-bookmark"></i> ${savedJobs.includes(job.id)?'محفوظة':'حفظ الوظيفة'}
                </button>
            </div>
        </div>
    `;
    const existing = document.getElementById('jobDetailModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', detailHTML);
    document.getElementById('jobDetailModal').classList.add('active');
}

function applyForJob(jobId) {
    const job = allJobs.find(j => j.id == jobId || j.id === jobId);
    if (!currentUser) {
        showToast('يرجى تسجيل الدخول أولاً للتقديم على الوظيفة', 'error');
        closeModal('jobDetailModal');
        setTimeout(() => openModal('loginModal'), 400);
        return;
    }
    showToast(`تم تقديم طلبك لوظيفة "${job?.title||''}" بنجاح! 🎉`, 'success');
    closeModal('jobDetailModal');
}

function toggleSaveJob(jobId) {
    if (savedJobs.includes(jobId)) {
        savedJobs = savedJobs.filter(id => id !== jobId);
        showToast('تم إلغاء حفظ الوظيفة', '');
    } else {
        savedJobs.push(jobId);
        showToast('تم حفظ الوظيفة بنجاح ⭐', 'success');
    }
    localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
    renderJobs(filteredJobs);
}

// ============================================
// SEARCH & FILTER
// ============================================
function searchJobs() {
    const keyword = (document.getElementById('searchKeyword')?.value || '').toLowerCase().trim();
    const city = document.getElementById('searchCity')?.value || '';
    const category = document.getElementById('searchCategory')?.value || '';

    if (city) document.getElementById('filterCity').value = city;
    if (category) document.getElementById('filterCategory').value = category;

    applyFilters(keyword);
    document.getElementById('jobs-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function applyFilters(overrideKeyword = null) {
    const keyword = overrideKeyword || (document.getElementById('searchKeyword')?.value || '').toLowerCase().trim();
    const city = document.getElementById('filterCity')?.value || '';
    const category = document.getElementById('filterCategory')?.value || '';
    const jobType = document.getElementById('filterJobType')?.value || '';
    const minSalaryStr = document.getElementById('filterMinSalary')?.value || '';
    const featuredOnly = document.getElementById('filterFeatured')?.checked || false;
    const minSalary = minSalaryStr ? parseInt(minSalaryStr.replace(/[^0-9]/g, '')) : 0;

    filteredJobs = allJobs.filter(job => {
        if (keyword && !job.title.toLowerCase().includes(keyword) &&
            !job.company.toLowerCase().includes(keyword) &&
            !(job.tags || []).some(t => t.toLowerCase().includes(keyword)) &&
            !job.category.toLowerCase().includes(keyword)) {
            return false;
        }
        if (city && job.city !== city) return false;
        if (category && job.category !== category) return false;
        if (jobType && job.type !== jobType) return false;
        if (featuredOnly && !job.featured) return false;
        if (minSalary > 0 && job.salary) {
            const jobSalary = parseInt(job.salary.replace(/[^0-9]/g, ''));
            if (jobSalary < minSalary) return false;
        }
        return true;
    });

    renderJobs(filteredJobs);
}

function resetFilters() {
    document.getElementById('filterCity').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterJobType').value = '';
    document.getElementById('filterMinSalary').value = '';
    document.getElementById('filterFeatured').checked = false;
    document.getElementById('searchKeyword').value = '';
    document.getElementById('searchCity').value = '';
    document.getElementById('searchCategory').value = '';
    filteredJobs = [...allJobs];
    renderJobs(filteredJobs);
    showToast('تم إعادة ضبط الفلاتر', '');
}

function filterByCategory(category) {
    document.getElementById('filterCategory').value = category;
    document.getElementById('searchCategory').value = category;
    applyFilters();
    document.getElementById('jobs-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filterByEmployer(employerName) {
    document.getElementById('searchKeyword').value = employerName;
    applyFilters(employerName.toLowerCase());
    document.getElementById('jobs-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function searchByCity(city) {
    document.getElementById('filterCity').value = city;
    document.getElementById('searchCity').value = city;
    applyFilters();
    document.getElementById('jobs-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// AUTHENTICATION HANDLERS
// ============================================
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showToast('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
        return;
    }

    if (window.firebaseReady && window.auth) {
        try {
            const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
            currentUser = userCredential.user;
            showToast(`مرحباً بعودتك! 👋`, 'success');
            closeModal('loginModal');
            updateNavForLoggedInUser();
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            showToast('فشل تسجيل الدخول. تحقق من بياناتك.', 'error');
        }
    } else {
        currentUser = { email, displayName: email.split('@')[0], uid: 'local-' + Date.now() };
        showToast(`مرحباً! تم تسجيل الدخول (وضع محلي) 👋`, 'success');
        closeModal('loginModal');
        updateNavForLoggedInUser();
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const city = document.getElementById('regCity').value;
    const role = document.getElementById('regRole').value;

    if (!name || !email || !password) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    if (password.length < 6) {
        showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }

    if (window.firebaseReady && window.auth) {
        try {
            const userCredential = await createUserWithEmailAndPassword(window.auth, email, password);
            currentUser = userCredential.user;
            if (window.db) {
                await addDoc(collection(window.db, 'users'), {
                    uid: userCredential.user.uid,
                    name,
                    email,
                    city,
                    role,
                    createdAt: serverTimestamp()
                });
            }
            showToast(`تم إنشاء الحساب بنجاح! 🎉`, 'success');
            closeModal('registerModal');
            updateNavForLoggedInUser();
        } catch (error) {
            console.error('خطأ في التسجيل:', error);
            if (error.code === 'auth/email-already-in-use') {
                showToast('البريد الإلكتروني مستخدم بالفعل', 'error');
            } else {
                showToast('فشل إنشاء الحساب. حاول مرة أخرى.', 'error');
            }
        }
    } else {
        currentUser = { email, displayName: name, uid: 'local-' + Date.now(), city, role };
        showToast(`تم إنشاء الحساب بنجاح! (وضع محلي) 🎉`, 'success');
        closeModal('registerModal');
        updateNavForLoggedInUser();
    }
}

function updateNavForLoggedInUser() {
    const navActions = document.querySelector('.nav-actions');
    if (currentUser) {
        const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'مستخدم';
        navActions.innerHTML = `
            <span style="font-weight:600;color:var(--primary);font-size:0.9rem;">
                <i class="fas fa-user-circle"></i> ${displayName}
            </span>
            <button class="btn btn-outline btn-sm" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt"></i> خروج
            </button>
        `;
    }
}

async function handleLogout() {
    if (window.firebaseReady && window.auth) {
        try {
            await signOut(window.auth);
        } catch (e) { /* ignore */ }
    }
    currentUser = null;
    showToast('تم تسجيل الخروج بنجاح', '');
    location.reload();
}

// ============================================
// MODAL HELPERS
// ============================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function switchModal(fromId, toId) {
    closeModal(fromId);
    setTimeout(() => openModal(toId), 300);
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// MOBILE MENU
// ============================================
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
            });
        });
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && e.target !== menuToggle && !menuToggle.contains(e.target)) {
                navLinks.classList.remove('open');
            }
        });
    }
}

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
function setupNavbarScroll() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ============================================
// KEYBOARD SUPPORT
// ============================================
function setupKeyboardShortcuts() {
    const searchInputs = ['searchKeyword', 'filterMinSalary'];
    searchInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchJobs();
                }
            });
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================
async function init() {
    const jobs = await fetchJobsFromFirebase();
    allJobs = jobs;
    filteredJobs = [...allJobs];

    renderCategories();
    renderJobs(filteredJobs);
    renderEmployers();

    document.getElementById('statJobs').textContent = allJobs.length.toLocaleString('ar') + '+';

    setupMobileMenu();
    setupNavbarScroll();
    setupKeyboardShortcuts();

    if (window.firebaseReady && window.auth) {
        onAuthStateChanged(window.auth, (user) => {
            if (user) {
                currentUser = user;
                updateNavForLoggedInUser();
            } else {
                currentUser = null;
            }
        });
    }

    console.log('🚀 شغلي - موقع التوظيف اليمني جاهز للعمل');
    console.log('📊 عدد الوظائف:', allJobs.length);
    console.log('🏢 عدد جهات العمل:', employersData.length);
    console.log('🔥 Firebase:', window.firebaseReady ? 'متصل' : 'وضع محلي');
}

// بدء التشغيل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', init);

// ============================================
// تعريض الدوال للنطاق العام (للاستخدام في HTML)
// ============================================
window.searchJobs = searchJobs;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.filterByCategory = filterByCategory;
window.filterByEmployer = filterByEmployer;
window.searchByCity = searchByCity;
window.openModal = openModal;
window.closeModal = closeModal;
window.switchModal = switchModal;
window.viewJobDetail = viewJobDetail;
window.toggleSaveJob = toggleSaveJob;
window.applyForJob = applyForJob;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
