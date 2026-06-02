// ============================================
// FIREBASE CONFIGURATION & IMPORTS
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAyWmacChzw5Wl-D_YkEObJw74qliw8OQs",
    authDomain: "shaghalni-web.firebaseapp.com",
    projectId: "shaghalni-web",
    storageBucket: "shaghalni-web.firebasestorage.app",
    messagingSenderId: "97870619288",
    appId: "1:97870619288:web:aa949c94ca59a39e0126ed",
    measurementId: "G-SW6K435LB1"
};

let app, auth, db, storage;
let firebaseReady = false;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    firebaseReady = true;
    console.log("✅ Firebase متصل بنجاح");
} catch (error) {
    console.warn("⚠️ Firebase غير متصل:", error.message);
    firebaseReady = false;
}

window.firebaseReady = firebaseReady;
window.auth = auth;
window.db = db;
window.storage = storage;
window.firebaseApp = app;

// ============================================
// البيانات الثابتة للتصنيفات والمدن
// ============================================
const yemeniCities = [
    'صنعاء', 'عدن', 'تعز', 'الحديدة', 'إب', 'المكلا', 'سيئون',
    'ذمار', 'عمران', 'مأرب', 'الغيظة', 'زبيد', 'بيحان', 'لحج', 'أبين'
];

const jobCategories = [
    { name: 'تكنولوجيا المعلومات', icon: 'fa-laptop-code' },
    { name: 'الهندسة', icon: 'fa-hard-hat' },
    { name: 'التعليم', icon: 'fa-chalkboard-teacher' },
    { name: 'الرعاية الصحية', icon: 'fa-stethoscope' },
    { name: 'المحاسبة والمالية', icon: 'fa-calculator' },
    { name: 'التسويق والمبيعات', icon: 'fa-bullhorn' },
    { name: 'الإدارة', icon: 'fa-user-tie' },
    { name: 'الخدمات اللوجستية', icon: 'fa-truck-fast' },
    { name: 'البناء والتشييد', icon: 'fa-building' },
    { name: 'المنظمات غير الحكومية', icon: 'fa-hand-holding-heart' },
    { name: 'النفط والغاز', icon: 'fa-oil-can' },
    { name: 'الاتصالات', icon: 'fa-satellite-dish' },
    { name: 'البنوك', icon: 'fa-landmark' },
    { name: 'الزراعة', icon: 'fa-seedling' },
];

// ============================================
// STATE MANAGEMENT
// ============================================
let allJobs = [];
let filteredJobs = [];
let currentUser = null;
let savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');

// ============================================
// FIREBASE OPERATIONS
// ============================================
async function fetchJobsFromFirebase() {
    if (!window.firebaseReady || !window.db) {
        console.log('Firebase غير متصل - لا توجد بيانات');
        return [];
    }
    
    try {
        const jobsRef = collection(window.db, 'jobs');
        const q = query(jobsRef, orderBy('postedAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        const jobs = [];
        snapshot.forEach(doc => {
            jobs.push({ id: doc.id, ...doc.data() });
        });
        console.log(`✅ تم جلب ${jobs.length} وظيفة من Firebase`);
        return jobs;
    } catch (error) {
        console.warn('خطأ في جلب الوظائف:', error.message);
        return [];
    }
}

async function addJobToFirebase(jobData) {
    if (!window.firebaseReady || !window.db) return null;
    
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
    if (!grid) return;
    
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
    
    if (!container) return;

    if (!jobsToRender || jobsToRender.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>لا توجد وظائف منشورة حالياً</h3>
                <p>سيتم إضافة الوظائف قريباً من قبل المشرفين</p>
            </div>
        `;
        if (countEl) countEl.textContent = '(0 نتيجة)';
        return;
    }

    if (countEl) countEl.textContent = `(${jobsToRender.length} نتيجة)`;
    
    container.innerHTML = jobsToRender.map(job => {
        const jobIdStr = String(job.id);
        const isSaved = savedJobs.includes(jobIdStr);
        
        let postedDate = 'حديث';
        if (job.postedAt) {
            if (job.postedAt.seconds) {
                postedDate = new Date(job.postedAt.seconds * 1000).toLocaleDateString('ar');
            } else if (typeof job.postedAt === 'string') {
                postedDate = job.postedAt;
            }
        }
        
        return `
        <div class="job-card ${job.featured ? 'featured' : ''}" onclick="viewJobDetail('${jobIdStr}')">
            <div class="job-actions">
                <button class="btn-bookmark ${isSaved ? 'saved' : ''}"
                        onclick="event.stopPropagation(); toggleSaveJob('${jobIdStr}')"
                        title="حفظ الوظيفة">
                    <i class="fas fa-bookmark"></i>
                </button>
            </div>
            <div class="job-top">
                <div class="company-logo">${job.logo || (job.company ? job.company.charAt(0) : 'ش')}</div>
                <div class="job-info">
                    <h3>${job.title}</h3>
                    <span class="company-name">${job.company}</span>
                </div>
            </div>
            <div class="job-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${job.city}</span>
                <span><i class="fas fa-briefcase"></i> ${job.type || 'دوام كامل'}</span>
                ${job.salary ? `<span><i class="fas fa-money-bill-wave"></i> ${job.salary} ر.ي</span>` : ''}
                <span><i class="fas fa-calendar-alt"></i> ${postedDate}</span>
            </div>
            <div class="job-tags">
                ${job.urgent ? '<span class="job-tag urgent">🔴 عاجل</span>' : ''}
                ${job.featured ? '<span class="job-tag">⭐ مميزة</span>' : ''}
                ${(job.tags || []).slice(0, 3).map(t => `<span class="job-tag">${t}</span>`).join('')}
            </div>
        </div>
        `;
    }).join('');
}

function renderEmployers() {
    const grid = document.getElementById('employersGrid');
    if (!grid) return;
    
    const employersMap = {};
    allJobs.forEach(job => {
        if (!employersMap[job.company]) {
            employersMap[job.company] = {
                name: job.company,
                logo: job.logo || job.company.charAt(0),
                city: job.city,
                jobs: 0
            };
        }
        employersMap[job.company].jobs++;
    });
    
    const employers = Object.values(employersMap);
    
    if (employers.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:30px;">لا توجد شركات بعد</p>';
        return;
    }
    
    grid.innerHTML = employers.map(emp => `
        <div class="employer-card" onclick="filterByEmployer('${emp.name}')" title="وظائف ${emp.name}">
            <div class="emp-logo">${emp.logo}</div>
            <h4>${emp.name}</h4>
            <p class="emp-jobs">${emp.jobs} وظيفة متاحة</p>
            <p style="font-size:0.78rem;color:var(--text-muted);"><i class="fas fa-map-marker-alt"></i> ${emp.city}</p>
        </div>
    `).join('');
}

function viewJobDetail(jobId) {
    const job = allJobs.find(j => String(j.id) === String(jobId));
    if (!job) {
        showToast('لم يتم العثور على الوظيفة', 'error');
        return;
    }
    
    const jobIdStr = String(job.id);
    const isSaved = savedJobs.includes(jobIdStr);
    
    let postedDate = 'حديث';
    if (job.postedAt) {
        if (job.postedAt.seconds) {
            postedDate = new Date(job.postedAt.seconds * 1000).toLocaleDateString('ar');
        } else if (typeof job.postedAt === 'string') {
            postedDate = job.postedAt;
        }
    }
    
    const detailHTML = `
        <div class="modal-overlay active" id="jobDetailModal" onclick="if(event.target===this)closeModal('jobDetailModal')">
            <div class="modal" style="max-width:600px;text-align:right;">
                <button class="modal-close" onclick="closeModal('jobDetailModal')">&times;</button>
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                    <div class="company-logo" style="width:56px;height:56px;font-size:1.3rem;">${job.logo || (job.company ? job.company.charAt(0) : 'ش')}</div>
                    <div>
                        <h2 style="margin:0;font-size:1.25rem;">${job.title}</h2>
                        <p style="margin:0;color:var(--text-light);">${job.company} - ${job.city}</p>
                    </div>
                </div>
                <div class="job-meta" style="margin-bottom:14px;">
                    <span><i class="fas fa-briefcase"></i> ${job.type || 'دوام كامل'}</span>
                    ${job.salary ? `<span><i class="fas fa-money-bill-wave"></i> ${job.salary} ر.ي</span>` : ''}
                    <span><i class="fas fa-calendar-alt"></i> ${postedDate}</span>
                    <span><i class="fas fa-tag"></i> ${job.category}</span>
                </div>
                <div style="background:var(--bg-gray);padding:16px;border-radius:var(--radius-sm);margin-bottom:14px;">
                    <strong>الوصف الوظيفي:</strong>
                    <p style="margin-top:6px;color:var(--text-medium);">${job.description || 'يرجى التواصل مع جهة العمل لمزيد من التفاصيل.'}</p>
                </div>
                ${job.tags?.length ? `<div class="job-tags" style="margin-bottom:14px;">${job.tags.map(t => `<span class="job-tag">${t}</span>`).join('')}</div>` : ''}
                
                <div id="applicationForm" style="display:${currentUser ? 'block' : 'none'};">
                    <div class="form-group">
                        <label><i class="fas fa-file-pdf"></i> رفع السيرة الذاتية (PDF, DOC, DOCX)</label>
                     <input type="file" id="cvFile" accept=".pdf,.doc,.docx" class="form-input" style="padding:8px;">
<small style="color:var(--text-muted);">الحد الأقصى: 100 ميجابايت (PDF, DOC, DOCX)</small>
                    </div>
                    <button class="btn btn-primary btn-block btn-lg" onclick="applyForJob('${jobIdStr}')" id="applyBtn">
                        <i class="fas fa-paper-plane"></i> تقديم طلب التوظيف
                    </button>
                </div>
                <div id="loginPrompt" style="display:${currentUser ? 'none' : 'block'};text-align:center;">
                    <p style="margin-bottom:10px;color:var(--text-light);">يجب تسجيل الدخول للتقديم على الوظيفة</p>
                    <button class="btn btn-primary" onclick="closeModal('jobDetailModal');setTimeout(()=>openModal('loginModal'),300);">
                        <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
                    </button>
                </div>
                
                <button class="btn btn-outline btn-block" style="margin-top:8px;" onclick="toggleSaveJob('${jobIdStr}');closeModal('jobDetailModal');">
                    <i class="fas fa-bookmark"></i> ${isSaved ? 'محفوظة' : 'حفظ الوظيفة'}
                </button>
            </div>
        </div>
    `;
    
    const existing = document.getElementById('jobDetailModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', detailHTML);
    document.getElementById('jobDetailModal').classList.add('active');
}

// ============================================
// APPLY FOR JOB WITH LOADING & CV UPLOAD
// ============================================
// استبدل دالة applyForJob بهذا الكود
// ============================================
// APPLY FOR JOB WITH LOADING & CV UPLOAD (حتى 10MB)
// ============================================
async function applyForJob(jobId) {
    const job = allJobs.find(j => String(j.id) === String(jobId));
    
    if (!currentUser) {
        showToast('يرجى تسجيل الدخول أولاً للتقديم على الوظيفة', 'error');
        closeModal('jobDetailModal');
        setTimeout(() => openModal('loginModal'), 400);
        return;
    }
    
    if (!window.firebaseReady || !window.db) {
        showToast('خدمة التقديم غير متاحة حالياً', 'error');
        return;
    }
    
    const applyBtn = document.getElementById('applyBtn');
    const originalBtnText = applyBtn ? applyBtn.innerHTML : '';
    
    if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التقديم...';
        applyBtn.style.opacity = '0.7';
        applyBtn.style.cursor = 'not-allowed';
    }
    
    try {
        // جلب بيانات المستخدم
        let userName = 'مستخدم';
        let userEmail = currentUser.email || '';
        let userPhone = '';
        
        if (window.db) {
            const usersRef = collection(window.db, 'users');
            const q = query(usersRef, where('uid', '==', currentUser.uid), limit(1));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                const userData = snapshot.docs[0].data();
                userName = userData.name || currentUser.displayName || 'مستخدم';
                userEmail = userData.email || currentUser.email || '';
                userPhone = userData.phone || '';
            }
        }
        
        // رفع السيرة الذاتية - دعم حتى 100 ميجابايت
        let cvUrl = '';
        let cvFileName = '';
        const cvFileInput = document.getElementById('cvFile');
        
        if (cvFileInput && cvFileInput.files.length > 0) {
            const file = cvFileInput.files[0];
            const MAX_SIZE = 100 * 1024 * 1024; // 100 ميجابايت
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            
            // التحقق من الحجم
            if (file.size > MAX_SIZE) {
                throw new Error(`⚠️ حجم الملف كبير جداً (${fileSizeMB} MB). الحد الأقصى 100 MB`);
            }
            
            // التحقق من نوع الملف
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('❌ يرجى رفع ملف PDF أو DOC أو DOCX فقط');
            }
            
            showToast(`📄 جاري رفع السيرة الذاتية (${fileSizeMB} MB)...`, '');
            
            if (window.storage && firebaseReady) {
                // رفع إلى Firebase Storage
                const fileName = `${currentUser.uid}_${Date.now()}_${file.name}`;
                const storageRef = ref(window.storage, `cvs/${fileName}`);
                const uploadTask = uploadBytesResumable(storageRef, file);
                
                cvUrl = await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            showToast(`⏳ جاري الرفع... ${Math.round(progress)}%`, '');
                        },
                        (error) => reject(error),
                        async () => {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(url);
                        }
                    );
                });
                
                cvFileName = file.name;
                showToast(`✅ تم رفع السيرة الذاتية بنجاح`, 'success');
            } else {
                // استخدام Base64 كحل بديل (للملفات الصغيرة فقط)
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error('خدمة التخزين غير متاحة للملفات الكبيرة. يرجى المحاولة لاحقاً.');
                }
                
                cvUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                cvFileName = file.name;
            }
        } else {
            showToast('⚠️ يرجى اختيار السيرة الذاتية قبل التقديم', 'error');
            if (applyBtn) {
                applyBtn.disabled = false;
                applyBtn.innerHTML = originalBtnText;
                applyBtn.style.opacity = '1';
            }
            return;
        }
        
        // حفظ بيانات المتقدم
        await addDoc(collection(window.db, 'applicants'), {
            userId: currentUser.uid,
            name: userName,
            email: userEmail,
            phone: userPhone,
            jobId: String(jobId),
            jobTitle: job?.title || '',
            jobCompany: job?.company || '',
            jobCity: job?.city || '',
            cvUrl: cvUrl,
            cvFileName: cvFileName,
            cvSize: cvFileInput.files[0]?.size || 0,
            status: 'جديد',
            appliedAt: serverTimestamp(),
            createdAt: serverTimestamp()
        });
        
        showToast(`🎉 تم تقديم طلبك لوظيفة "${job?.title || ''}" بنجاح!`, 'success');
        
        if (applyBtn) {
            applyBtn.innerHTML = '<i class="fas fa-check"></i> تم التقديم بنجاح';
            applyBtn.style.background = '#10b981';
            applyBtn.disabled = true;
        }
        
        setTimeout(() => closeModal('jobDetailModal'), 2000);
        
    } catch (error) {
        console.error('خطأ في التقديم:', error);
        showToast(error.message || '❌ فشل التقديم، حاول مرة أخرى', 'error');
        
        if (applyBtn) {
            applyBtn.disabled = false;
            applyBtn.innerHTML = originalBtnText;
            applyBtn.style.opacity = '1';
        }
    }
}
function toggleSaveJob(jobId) {
    const jobIdStr = String(jobId);
    if (savedJobs.includes(jobIdStr)) {
        savedJobs = savedJobs.filter(id => id !== jobIdStr);
        showToast('تم إلغاء حفظ الوظيفة', '');
    } else {
        savedJobs.push(jobIdStr);
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
    document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function applyFilters(overrideKeyword = null) {
    const keyword = overrideKeyword !== null ? overrideKeyword : (document.getElementById('searchKeyword')?.value || '').toLowerCase().trim();
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
            const jobSalary = parseInt(String(job.salary).replace(/[^0-9]/g, ''));
            if (jobSalary < minSalary) return false;
        }
        return true;
    });

    renderJobs(filteredJobs);
}

function resetFilters() {
    const filterCity = document.getElementById('filterCity');
    const filterCategory = document.getElementById('filterCategory');
    const filterJobType = document.getElementById('filterJobType');
    const filterMinSalary = document.getElementById('filterMinSalary');
    const filterFeatured = document.getElementById('filterFeatured');
    const searchKeyword = document.getElementById('searchKeyword');
    const searchCity = document.getElementById('searchCity');
    const searchCategory = document.getElementById('searchCategory');
    
    if (filterCity) filterCity.value = '';
    if (filterCategory) filterCategory.value = '';
    if (filterJobType) filterJobType.value = '';
    if (filterMinSalary) filterMinSalary.value = '';
    if (filterFeatured) filterFeatured.checked = false;
    if (searchKeyword) searchKeyword.value = '';
    if (searchCity) searchCity.value = '';
    if (searchCategory) searchCategory.value = '';
    
    filteredJobs = [...allJobs];
    renderJobs(filteredJobs);
    showToast('تم إعادة ضبط الفلاتر', '');
}

function filterByCategory(category) {
    const filterCategory = document.getElementById('filterCategory');
    const searchCategory = document.getElementById('searchCategory');
    if (filterCategory) filterCategory.value = category;
    if (searchCategory) searchCategory.value = category;
    applyFilters();
    document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filterByEmployer(employerName) {
    const searchKeyword = document.getElementById('searchKeyword');
    if (searchKeyword) searchKeyword.value = employerName;
    applyFilters(employerName.toLowerCase());
    document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function searchByCity(city) {
    const filterCity = document.getElementById('filterCity');
    const searchCity = document.getElementById('searchCity');
    if (filterCity) filterCity.value = city;
    if (searchCity) searchCity.value = city;
    applyFilters();
    document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// AUTHENTICATION HANDLERS
// ============================================
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

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
            if (error.code === 'auth/invalid-credential') {
                showToast('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
            } else {
                showToast('فشل تسجيل الدخول. تحقق من بياناتك.', 'error');
            }
        }
    } else {
        showToast('خدمة التسجيل غير متاحة حالياً', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('regName')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const city = document.getElementById('regCity')?.value;
    const role = document.getElementById('regRole')?.value;
    const phone = document.getElementById('regPhone')?.value || '';

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
                    phone,
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
        showToast('خدمة التسجيل غير متاحة حالياً', 'error');
    }
}

function updateNavForLoggedInUser() {
    const navActions = document.querySelector('.nav-actions');
    if (currentUser && navActions) {
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
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
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
    if (!navbar) return;
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
    allJobs = await fetchJobsFromFirebase();
    filteredJobs = [...allJobs];

    renderCategories();
    renderJobs(filteredJobs);
    renderEmployers();

    const statJobs = document.getElementById('statJobs');
    if (statJobs) statJobs.textContent = allJobs.length.toLocaleString('ar') + '+';

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
    console.log('🔥 Firebase:', window.firebaseReady ? 'متصل' : 'غير متصل');
}

document.addEventListener('DOMContentLoaded', init);

// ============================================
// تعريض الدوال للنطاق العام
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
