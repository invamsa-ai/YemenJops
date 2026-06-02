// ============================================
// FIREBASE CONFIGURATION & IMPORTS
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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
// البيانات الثابتة
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

// بيانات المحافظ الإلكترونية
const wallets = {
    'جوال': { name: 'جوال - Mobile Money', number: '770123456', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=770123456', recipient: 'شغلي للتشغيل والخدمات' },
    'كاش': { name: 'كاش - Cash', number: '780123456', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=780123456', recipient: 'شغلي للتشغيل والخدمات' },
    'جيب': { name: 'جيب - Jeeb', number: '790123456', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=790123456', recipient: 'شغلي للتشغيل والخدمات' },
    'فلوسك': { name: 'فلوسك - Floosak', number: '771234567', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=771234567', recipient: 'شغلي للتشغيل والخدمات' }
};

const APPLICATION_FEE = 1000; // 1000 ريال يمني

// ============================================
// STATE MANAGEMENT
// ============================================
let allJobs = [];
let filteredJobs = [];
let currentUser = null;
let savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
let pendingApplication = JSON.parse(localStorage.getItem('pendingApplication') || 'null');

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

// ============================================
// RENDER FUNCTIONS
// ============================================
function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    
    grid.innerHTML = jobCategories.map(cat => `
        <a href="#" class="category-card" onclick="filterByCategory('${cat.name}'); return false;">
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
        <div class="employer-card" onclick="filterByEmployer('${emp.name}')">
            <div class="emp-logo">${emp.logo}</div>
            <h4>${emp.name}</h4>
            <p class="emp-jobs">${emp.jobs} وظيفة متاحة</p>
            <p style="font-size:0.78rem;color:var(--text-muted);"><i class="fas fa-map-marker-alt"></i> ${emp.city}</p>
        </div>
    `).join('');
}

// ============================================
// عرض تفاصيل الوظيفة مع نظام الدفع
// ============================================
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
            <div class="modal" style="max-width:650px;text-align:right;">
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
                
                <div id="loginPrompt" style="display:${currentUser ? 'none' : 'block'};text-align:center; background:#f0f0f0; padding:15px; border-radius:var(--radius-sm);">
                    <p style="margin-bottom:10px;color:var(--text-light);"><i class="fas fa-info-circle"></i> يرجى تسجيل الدخول للتقديم على الوظيفة</p>
                    <button class="btn btn-primary" onclick="closeModal('jobDetailModal');setTimeout(()=>openModal('loginModal'),300);">
                        <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
                    </button>
                </div>
                
                <div id="applySection" style="display:${currentUser ? 'block' : 'none'};">
                    <button class="btn btn-primary btn-block btn-lg" onclick="startApplication('${jobIdStr}')" style="background:linear-gradient(135deg, #0088cc, #00a3e0);">
                        <i class="fas fa-paper-plane"></i> التقدم للوظيفة (رسوم التقديم ${APPLICATION_FEE} ريال)
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
// بدء عملية التقديم والدفع
// ============================================
async function startApplication(jobId) {
    const job = allJobs.find(j => String(j.id) === String(jobId));
    if (!job) return;
    
    if (!currentUser) {
        showToast('يرجى تسجيل الدخول أولاً', 'error');
        closeModal('jobDetailModal');
        setTimeout(() => openModal('loginModal'), 400);
        return;
    }
    
    // حفظ بيانات الطلب المعلق
    pendingApplication = {
        jobId: String(jobId),
        jobTitle: job.title,
        jobCompany: job.company,
        jobCity: job.city,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'مستخدم',
        timestamp: Date.now()
    };
    localStorage.setItem('pendingApplication', JSON.stringify(pendingApplication));
    
    closeModal('jobDetailModal');
    setTimeout(() => showPaymentModal(), 300);
}

// ============================================
// عرض نموذج الدفع
// ============================================
function showPaymentModal() {
    if (!pendingApplication) {
        showToast('لا توجد طلبات معلقة', 'error');
        return;
    }
    
    const walletsHTML = Object.entries(wallets).map(([key, wallet]) => `
        <div class="wallet-option" onclick="showWalletDetails('${key}')" style="cursor:pointer; text-align:center; padding:15px; border:2px solid var(--border); border-radius:var(--radius-md); transition:all 0.3s; background:white;">
            <i class="fas fa-wallet" style="font-size:32px; color:var(--primary);"></i>
            <h4 style="margin:8px 0 0 0;">${wallet.name}</h4>
        </div>
    `).join('');
    
    const paymentHTML = `
        <div class="modal-overlay active" id="paymentModal" onclick="if(event.target===this)closeModal('paymentModal')">
            <div class="modal" style="max-width:550px;text-align:right;">
                <button class="modal-close" onclick="closeModal('paymentModal')">&times;</button>
                <h2 style="text-align:center;"><i class="fas fa-credit-card"></i> إتمام التقديم</h2>
                
                <!-- بطاقة بيانات الطلب -->
                <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; padding:20px; border-radius:var(--radius-md); margin-bottom:20px;">
                    <h3 style="color:white; margin-bottom:15px;">📋 تفاصيل طلبك</h3>
                    <p><i class="fas fa-briefcase"></i> <strong>الوظيفة:</strong> ${pendingApplication.jobTitle}</p>
                    <p><i class="fas fa-building"></i> <strong>الشركة:</strong> ${pendingApplication.jobCompany}</p>
                    <p><i class="fas fa-map-marker-alt"></i> <strong>المدينة:</strong> ${pendingApplication.jobCity}</p>
                    <p><i class="fas fa-user"></i> <strong>مقدم الطلب:</strong> ${pendingApplication.userName}</p>
                    <p><i class="fas fa-envelope"></i> <strong>البريد:</strong> ${pendingApplication.userEmail}</p>
                    <hr style="border-color:rgba(255,255,255,0.3); margin:15px 0;">
                    <div style="font-size:1.5rem; text-align:center;">
                        <strong>المبلغ المطلوب:</strong> <span style="font-size:2rem;">${APPLICATION_FEE.toLocaleString()}</span> ريال يمني
                    </div>
                </div>
                
                <!-- اختيار المحفظة -->
                <div style="margin-bottom:20px;">
                    <h4 style="margin-bottom:15px;"><i class="fas fa-exchange-alt"></i> اختر طريقة الدفع:</h4>
                    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px;">
                        ${walletsHTML}
                    </div>
                </div>
                
                <!-- تفاصيل المحفظة (تظهر عند الاختيار) -->
                <div id="walletDetails" style="display:none; background:var(--bg-gray); padding:15px; border-radius:var(--radius-md); margin-bottom:20px;">
                    <div id="walletDetailsContent"></div>
                </div>
                
                <!-- نموذج تأكيد الدفع -->
                <div id="confirmPaymentSection" style="display:none;">
                    <div class="form-group">
                        <label><i class="fas fa-hashtag"></i> رقم العملية / الرقم المرجعي <span style="color:red;">*</span></label>
                        <input type="text" id="transactionRef" class="form-input" placeholder="أدخل رقم العملية من تطبيق المحفظة" required>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-image"></i> إرفاق صورة إشعار التحويل <span style="color:red;">*</span></label>
                        <input type="file" id="paymentProof" accept="image/*,.pdf" class="form-input">
                        <small style="color:var(--text-muted);">صورة من عملية التحويل (jpg, png, pdf)</small>
                    </div>
                    <button class="btn btn-primary btn-block btn-lg" onclick="confirmPayment()" id="confirmPaymentBtn">
                        <i class="fas fa-check-circle"></i> تأكيد الدفع وإرسال الطلب
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const existing = document.getElementById('paymentModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', paymentHTML);
    document.getElementById('paymentModal').classList.add('active');
}

// ============================================
// عرض تفاصيل المحفظة المختارة
// ============================================
function showWalletDetails(walletKey) {
    const wallet = wallets[walletKey];
    if (!wallet) return;
    
    const walletDetailsDiv = document.getElementById('walletDetails');
    const walletDetailsContent = document.getElementById('walletDetailsContent');
    const confirmSection = document.getElementById('confirmPaymentSection');
    
    walletDetailsContent.innerHTML = `
        <h4 style="margin-bottom:15px;"><i class="fas fa-university"></i> بيانات الدفع عبر ${wallet.name}</h4>
        <div style="text-align:center; margin-bottom:15px;">
            <img src="${wallet.qrCode}" alt="QR Code" style="width:150px; height:150px; border-radius:12px; margin-bottom:10px;">
            <div>
                <button class="btn btn-outline btn-sm" onclick="copyToClipboard('${wallet.number}')" style="margin-top:5px;">
                    <i class="fas fa-copy"></i> تحميل الباركود
                </button>
            </div>
        </div>
        <div style="background:white; padding:12px; border-radius:var(--radius-sm); margin-bottom:10px;">
            <p><strong><i class="fas fa-user-circle"></i> المستفيد:</strong> ${wallet.recipient}</p>
            <p><strong><i class="fas fa-mobile-alt"></i> رقم المحفظة:</strong> ${wallet.number}</p>
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button class="btn btn-primary btn-sm" onclick="copyToClipboard('${wallet.number}')" style="flex:1;">
                    <i class="fas fa-copy"></i> نسخ الرقم
                </button>
                <button class="btn btn-outline btn-sm" onclick="downloadQRCode('${wallet.qrCode}', '${wallet.name}')" style="flex:1;">
                    <i class="fas fa-download"></i> تحميل الباركود
                </button>
            </div>
        </div>
        <div style="background:#e8f5e9; padding:12px; border-radius:var(--radius-sm); text-align:center;">
            <i class="fas fa-info-circle"></i> يرجى تحويل المبلغ <strong>${APPLICATION_FEE.toLocaleString()} ريال</strong> إلى الرقم أعلاه، ثم إدخال بيانات التحويل بالأسفل
        </div>
    `;
    
    walletDetailsDiv.style.display = 'block';
    confirmSection.style.display = 'block';
    
    // حفظ المحفظة المختارة
    window.selectedWallet = walletKey;
}

// ============================================
// نسخ النص للحافظة
// ============================================
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast('✅ تم نسخ الرقم بنجاح', 'success');
}

// ============================================
// تحميل الباركود
// ============================================
function downloadQRCode(qrUrl, walletName) {
    fetch(qrUrl)
        .then(response => response.blob())
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `QR_${walletName}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('✅ تم تحميل الباركود', 'success');
        })
        .catch(() => showToast('❌ فشل تحميل الباركود', 'error'));
}

// ============================================
// تأكيد الدفع وإرسال الطلب
// ============================================
// ============================================
// تأكيد الدفع وإرسال الطلب (بدون Firebase Storage)
// ============================================
// ============================================
// تأكيد الدفع مع ضغط الصورة
// ============================================
// ============================================
// تأكيد الدفع مع ضغط الصورة (النسخة الصحيحة)
// ============================================
// ============================================
// تأكيد الدفع مع ضغط الصورة
// ============================================
async function confirmPayment() {
    const transactionRef = document.getElementById('transactionRef')?.value.trim();
    const paymentProof = document.getElementById('paymentProof')?.files[0];
    
    if (!transactionRef) {
        showToast('⚠️ يرجى إدخال رقم العملية', 'error');
        return;
    }
    
    if (!paymentProof) {
        showToast('⚠️ يرجى إرفاق صورة إشعار التحويل', 'error');
        return;
    }
    
    if (!pendingApplication) {
        showToast('⚠️ لا توجد بيانات طلب', 'error');
        return;
    }
    
    const MAX_SIZE = 5 * 1024 * 1024;
    
    if (paymentProof.size > MAX_SIZE) {
        showToast('⚠️ حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت', 'error');
        return;
    }
    
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';
    }
    
    try {
        showToast('📄 جاري ضغط وتحويل الصورة...', '');
        
        let compressedFile = paymentProof;
        
        if (paymentProof.type.startsWith('image/')) {
            compressedFile = await compressImage(paymentProof, 0.5, 800);
        }
        
        const proofBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('فشل قراءة الملف'));
            reader.readAsDataURL(compressedFile);
        });
        
        if (proofBase64.length > 1000000) {
            showToast('📄 الصورة لا تزال كبيرة، جاري ضغط إضافي...', '');
            const moreCompressed = await compressImage(paymentProof, 0.3, 600);
            const proofBase64Final = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('فشل قراءة الملف'));
                reader.readAsDataURL(moreCompressed);
            });
            
            if (proofBase64Final.length > 1000000) {
                throw new Error('الصورة كبيرة جداً. يرجى استخدام صورة أصغر (أقل من 500KB)');
            }
            
            await saveApplicationToFirestore(proofBase64Final, compressedFile.name);
        } else {
            await saveApplicationToFirestore(proofBase64, compressedFile.name);
        }
        
    } catch (error) {
        console.error('خطأ:', error);
        showToast('❌ ' + (error.message || 'فشل إرسال الطلب'), 'error');
        
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> تأكيد الدفع وإرسال الطلب';
        }
    }
}

// دالة ضغط الصورة
function compressImage(file, quality = 0.5, maxWidth = 800) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                }, 'image/jpeg', quality);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// دالة حفظ الطلب في Firestore
async function saveApplicationToFirestore(proofBase64, fileName) {
    showToast('💾 جاري حفظ الطلب...', '');
    
    const applicationData = {
        userId: pendingApplication.userId,
        userEmail: pendingApplication.userEmail,
        userName: pendingApplication.userName,
        jobId: pendingApplication.jobId,
        jobTitle: pendingApplication.jobTitle,
        jobCompany: pendingApplication.jobCompany,
        jobCity: pendingApplication.jobCity,
        transactionRef: document.getElementById('transactionRef').value.trim(),
        paymentProofBase64: proofBase64,
        paymentProofName: fileName,
        paymentProofSize: proofBase64.length,
        walletUsed: window.selectedWallet || 'غير محدد',
        amount: APPLICATION_FEE,
        status: 'قيد المراجعة',
        appliedAt: serverTimestamp(),
        createdAt: serverTimestamp()
    };
    
    await addDoc(collection(window.db, 'applications'), applicationData);
    
    localStorage.removeItem('pendingApplication');
    pendingApplication = null;
    
    showToast('🎉 تم تقديم طلبك بنجاح! طلبك قيد المراجعة', 'success');
    closeModal('paymentModal');
    
    setTimeout(() => showSuccessMessage(), 500);
}

// ============================================
// عرض رسالة الطمأنة
// ============================================
function showSuccessMessage() {
    const messageHTML = `
        <div class="modal-overlay active" id="successModal" onclick="if(event.target===this)closeModal('successModal')">
            <div class="modal" style="max-width:450px; text-align:center;">
                <button class="modal-close" onclick="closeModal('successModal')">&times;</button>
                <div style="background:linear-gradient(135deg, #10b981, #059669); color:white; padding:30px; border-radius:var(--radius-md); margin:-20px -20px 20px -20px;">
                    <i class="fas fa-check-circle" style="font-size:64px;"></i>
                    <h2 style="color:white; margin-top:10px;">تم التقديم بنجاح!</h2>
                </div>
                <p style="font-size:1.1rem; margin-bottom:15px;">✅ طلبك قيد المراجعة</p>
                <p style="color:var(--text-medium);">سيتم التواصل معك عبر رسالة نصية (SMS) فور تأكيد طلبك للوظيفة</p>
                <hr style="margin:20px 0;">
                <button class="btn btn-primary" onclick="closeModal('successModal')">
                    <i class="fas fa-check"></i> حسناً
                </button>
            </div>
        </div>
    `;
    
    const existing = document.getElementById('successModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', messageHTML);
    document.getElementById('successModal').classList.add('active');
    
    setTimeout(() => {
        const modal = document.getElementById('successModal');
        if (modal) modal.classList.remove('active');
    }, 5000);
}

// ============================================
// استعادة الطلب المعلق بعد تحديث الصفحة
// ============================================
function checkPendingApplication() {
    if (pendingApplication && currentUser && pendingApplication.userId === currentUser.uid) {
        showToast('📋 يوجد طلب قيد الإكمال، استكمل عملية الدفع', '');
        setTimeout(() => showPaymentModal(), 1000);
    }
}

// ============================================
// باقي الدوال
// ============================================
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
            checkPendingApplication();
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
        } catch (e) { }
    }
    currentUser = null;
    localStorage.removeItem('pendingApplication');
    pendingApplication = null;
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
// MOBILE MENU & OTHERS
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
                checkPendingApplication();
            } else {
                currentUser = null;
            }
        });
    }

    console.log('🚀 شغلي جاهز للعمل');
}

document.addEventListener('DOMContentLoaded', init);

// ============================================
// EXPOSE FUNCTIONS
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
window.startApplication = startApplication;
window.showWalletDetails = showWalletDetails;
window.copyToClipboard = copyToClipboard;
window.downloadQRCode = downloadQRCode;
window.confirmPayment = confirmPayment;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
