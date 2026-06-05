// ============================================
// FIREBASE IMPORTS & CONFIGURATION
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAyWmacChzw5Wl-D_YkEObJw74qliw8OQs",
    authDomain: "shaghalni-web.firebaseapp.com",
    projectId: "shaghalni-web",
    storageBucket: "shaghalni-web.firebasestorage.app",
    messagingSenderId: "97870619288",
    appId: "1:97870619288:web:aa949c94ca59a39e0126ed",
    measurementId: "G-SW6K435LB1"
};

let app, db, auth;
let firebaseReady = false;
let isLoggedIn = false;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    firebaseReady = true;
    console.log("✅ Firebase متصل بنجاح");
} catch (error) {
    console.warn("⚠️ Firebase غير متصل:", error.message);
    firebaseReady = false;
}

// ============================================
// ADMIN CREDENTIALS (للخيار المحلي فقط)
// ============================================
const ADMIN_EMAIL = 'yemen@job.com';
const ADMIN_PASSWORD = 'admin1112004admin';

// ============================================
// STATE MANAGEMENT
// ============================================
let adminJobs = [];
let adminApplications = []; // تغيير من applicants إلى applications
let adminCompanies = [];
// ============================================
// LOADING INDICATOR
// ============================================
function showLoading() {
    let loadingEl = document.getElementById('globalLoading');
    if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'globalLoading';
        loadingEl.className = 'loading-overlay';
        loadingEl.innerHTML = `
            <div style="text-align:center;">
                <div class="loading-spinner"></div>
                <div class="loading-text">جاري التحميل...</div>
            </div>
        `;
        document.body.appendChild(loadingEl);
    }
    loadingEl.style.display = 'flex';
}

function hideLoading() {
    const loadingEl = document.getElementById('globalLoading');
    if (loadingEl) loadingEl.style.display = 'none';
}

// ============================================
// CACHE MANAGEMENT (لتحسين السرعة)
// ============================================
let cache = {
    jobs: { data: null, timestamp: 0, ttl: 30000 },
    applications: { data: null, timestamp: 0, ttl: 30000 },
    companies: { data: null, timestamp: 0, ttl: 60000 }
};

function refreshCache() {
    cache.jobs.data = null;
    cache.applications.data = null;
    cache.companies.data = null;
    console.log('🔄 تم تحديث الكاش');
}
// ============================================
// FIREBASE OPERATIONS
// ============================================

// جلب جميع الوظائف
async function fetchJobs(forceRefresh = false) {
    const now = Date.now();
    
    if (!forceRefresh && cache.jobs.data && (now - cache.jobs.timestamp) < cache.jobs.ttl) {
        console.log('📦 استخدام الكاش للوظائف');
        return cache.jobs.data;
    }
    
    showLoading();
    
    if (!firebaseReady || !db) {
        hideLoading();
        return JSON.parse(localStorage.getItem('adminJobs') || '[]');
    }
    
    try {
        const jobsRef = collection(db, 'jobs');
        const q = query(jobsRef, orderBy('postedAt', 'desc'));
        const snapshot = await getDocs(q);
        const jobs = [];
        snapshot.forEach(doc => {
            jobs.push({ id: doc.id, ...doc.data() });
        });
        
        cache.jobs = { data: jobs, timestamp: now, ttl: cache.jobs.ttl };
        
        hideLoading();
        return jobs;
    } catch (error) {
        hideLoading();
        console.error('خطأ في جلب الوظائف:', error);
        return JSON.parse(localStorage.getItem('adminJobs') || '[]');
    }
}
// جلب جميع الطلبات (applications) - هذا هو الجدول الجديد
async function fetchApplications(forceRefresh = false) {
    const now = Date.now();
    
    if (!forceRefresh && cache.applications.data && (now - cache.applications.timestamp) < cache.applications.ttl) {
        console.log('📦 استخدام الكاش للطلبات');
        return cache.applications.data;
    }
    
    showLoading();
    
    if (!firebaseReady || !db) {
        hideLoading();
        return JSON.parse(localStorage.getItem('adminApplications') || '[]');
    }
    
    try {
        const appsRef = collection(db, 'applications');
        const q = query(appsRef, orderBy('appliedAt', 'desc'));
        const snapshot = await getDocs(q);
        const applications = [];
        snapshot.forEach(doc => {
            applications.push({ id: doc.id, ...doc.data() });
        });
        
        cache.applications = { data: applications, timestamp: now, ttl: cache.applications.ttl };
        
        hideLoading();
        return applications;
    } catch (error) {
        hideLoading();
        console.error('خطأ في جلب الطلبات:', error);
        return JSON.parse(localStorage.getItem('adminApplications') || '[]');
    }
}
// جلب جميع الشركات
async function fetchCompanies(forceRefresh = false) {
    const now = Date.now();
    
    if (!forceRefresh && cache.companies.data && (now - cache.companies.timestamp) < cache.companies.ttl) {
        console.log('📦 استخدام الكاش للشركات');
        return cache.companies.data;
    }
    
    showLoading();
    
    if (!firebaseReady || !db) {
        hideLoading();
        return JSON.parse(localStorage.getItem('adminCompanies') || '[]');
    }
    
    try {
        const companiesRef = collection(db, 'companies');
        const snapshot = await getDocs(companiesRef);
        const companies = [];
        snapshot.forEach(doc => {
            companies.push({ id: doc.id, ...doc.data() });
        });
        
        cache.companies = { data: companies, timestamp: now, ttl: cache.companies.ttl };
        
        hideLoading();
        return companies;
    } catch (error) {
        hideLoading();
        console.error('خطأ في جلب الشركات:', error);
        return JSON.parse(localStorage.getItem('adminCompanies') || '[]');
    }
}

// إضافة وظيفة
async function addJob(jobData) {
    if (!firebaseReady || !db) {
        const newJob = { ...jobData, id: Date.now().toString() };
        const localJobs = JSON.parse(localStorage.getItem('adminJobs') || '[]');
        localJobs.unshift(newJob);
        localStorage.setItem('adminJobs', JSON.stringify(localJobs));
        return newJob;
    }
    
    try {
        const docRef = await addDoc(collection(db, 'jobs'), {
            ...jobData,
            postedAt: serverTimestamp(),
            createdAt: serverTimestamp()
        });
        return { id: docRef.id, ...jobData };
    } catch (error) {
        console.error('خطأ في إضافة الوظيفة:', error);
        return null;
    }
}

// تحديث وظيفة
async function updateJob(jobId, jobData) {
    if (!firebaseReady || !db) {
        const localJobs = JSON.parse(localStorage.getItem('adminJobs') || '[]');
        const index = localJobs.findIndex(j => j.id === jobId);
        if (index >= 0) {
            localJobs[index] = { ...jobData, id: jobId };
            localStorage.setItem('adminJobs', JSON.stringify(localJobs));
        }
        return true;
    }
    
    try {
        const jobRef = doc(db, 'jobs', jobId);
        await updateDoc(jobRef, { ...jobData, updatedAt: serverTimestamp() });
        return true;
    } catch (error) {
        console.error('خطأ في تحديث الوظيفة:', error);
        return false;
    }
}

// حذف وظيفة
async function deleteJob(jobId) {
    if (!firebaseReady || !db) {
        let localJobs = JSON.parse(localStorage.getItem('adminJobs') || '[]');
        localJobs = localJobs.filter(j => j.id !== jobId);
        localStorage.setItem('adminJobs', JSON.stringify(localJobs));
        return true;
    }
    
    try {
        await deleteDoc(doc(db, 'jobs', jobId));
        return true;
    } catch (error) {
        console.error('خطأ في حذف الوظيفة:', error);
        return false;
    }
}

// تحديث حالة طلب (application)
async function updateApplicationStatus(applicationId, newStatus, notes = '') {
    if (!firebaseReady || !db) {
        const localApps = JSON.parse(localStorage.getItem('adminApplications') || '[]');
        const index = localApps.findIndex(a => a.id === applicationId);
        if (index >= 0) {
            localApps[index].status = newStatus;
            if (notes) localApps[index].adminNotes = notes;
            localApps[index].reviewedAt = new Date().toISOString();
            localStorage.setItem('adminApplications', JSON.stringify(localApps));
        }
        return true;
    }
    
    try {
        const appRef = doc(db, 'applications', applicationId);
        const updateData = { 
            status: newStatus, 
            reviewedAt: serverTimestamp() 
        };
        if (notes) updateData.adminNotes = notes;
        await updateDoc(appRef, updateData);
        return true;
    } catch (error) {
        console.error('خطأ في تحديث حالة الطلب:', error);
        return false;
    }
}

// حذف طلب
async function deleteApplication(applicationId) {
    if (!firebaseReady || !db) {
        let localApps = JSON.parse(localStorage.getItem('adminApplications') || '[]');
        localApps = localApps.filter(a => a.id !== applicationId);
        localStorage.setItem('adminApplications', JSON.stringify(localApps));
        return true;
    }
    
    try {
        await deleteDoc(doc(db, 'applications', applicationId));
        return true;
    } catch (error) {
        console.error('خطأ في حذف الطلب:', error);
        return false;
    }
}

// إضافة شركة
async function addCompany(companyData) {
    if (!firebaseReady || !db) {
        const newCompany = { ...companyData, id: Date.now().toString() };
        const localCompanies = JSON.parse(localStorage.getItem('adminCompanies') || '[]');
        localCompanies.push(newCompany);
        localStorage.setItem('adminCompanies', JSON.stringify(localCompanies));
        return newCompany;
    }
    
    try {
        const docRef = await addDoc(collection(db, 'companies'), {
            ...companyData,
            createdAt: serverTimestamp()
        });
        return { id: docRef.id, ...companyData };
    } catch (error) {
        console.error('خطأ في إضافة الشركة:', error);
        return null;
    }
}

// حذف شركة
async function deleteCompany(companyId) {
    if (!firebaseReady || !db) {
        let localCompanies = JSON.parse(localStorage.getItem('adminCompanies') || '[]');
        localCompanies = localCompanies.filter(c => c.id !== companyId);
        localStorage.setItem('adminCompanies', JSON.stringify(localCompanies));
        return true;
    }
    
    try {
        await deleteDoc(doc(db, 'companies', companyId));
        return true;
    } catch (error) {
        console.error('خطأ في حذف الشركة:', error);
        return false;
    }
}

// ============================================
// AUTHENTICATION (باستخدام Firebase Auth)
// ============================================
async function handleAdminLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('adminEmail')?.value.trim();
    const password = document.getElementById('adminPassword')?.value;
    
    if (!email || !password) {
        showToast('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
        return;
    }
    
    if (!firebaseReady || !auth) {
        // وضع التخزين المحلي
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            showToast('تم تسجيل الدخول بنجاح (وضع محلي)! 🎉', 'success');
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 800);
        } else {
            showToast('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
        }
        return;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('adminUid', userCredential.user.uid);
        showToast('تم تسجيل الدخول بنجاح! 🎉', 'success');
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 800);
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        if (error.code === 'auth/invalid-credential') {
            showToast('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
        } else {
            showToast('فشل تسجيل الدخول: ' + error.message, 'error');
        }
    }
}

function checkAdminAuth() {
    isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    
    if (!isLoggedIn && !window.location.href.includes('admin-login.html')) {
        window.location.href = 'admin-login.html';
    }
}

async function handleAdminLogout() {
    if (firebaseReady && auth) {
        try {
            await signOut(auth);
        } catch (e) { /* ignore */ }
    }
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUid');
    showToast('تم تسجيل الخروج بنجاح', 'success');
    setTimeout(() => {
        window.location.href = 'admin-login.html';
    }, 500);
}

// ============================================
// TOGGLE PASSWORD
// ============================================
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('adminPassword');
    const icon = document.querySelector('.toggle-password i');
    
    if (passwordInput?.type === 'password') {
        passwordInput.type = 'text';
        icon?.classList.remove('fa-eye');
        icon?.classList.add('fa-eye-slash');
    } else if (passwordInput) {
        passwordInput.type = 'password';
        icon?.classList.remove('fa-eye-slash');
        icon?.classList.add('fa-eye');
    }
}

// ============================================
// SIDEBAR TOGGLE
// ============================================
function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const main = document.getElementById('adminMain');
    if (sidebar && main) {
        sidebar.classList.toggle('collapsed');
        main.classList.toggle('expanded');
    }
}

// ============================================
// PAGE SWITCHING
// ============================================
async function switchPage(pageName, navItem) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (navItem) navItem.classList.add('active');
    
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    
    const pageElement = document.getElementById(`${pageName}-page`);
    if (pageElement) pageElement.classList.add('active');
    
    const titles = {
        'dashboard': 'لوحة التحكم',
        'jobs': 'إدارة الوظائف',
        'applications': 'طلبات التقديم',  // تغيير من applicants
        'companies': 'إدارة الشركات',
        'settings': 'الإعدادات'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[pageName] || 'لوحة التحكم';
    
    if (pageName === 'dashboard') await loadDashboard();
    if (pageName === 'jobs') await loadJobsTable();
    if (pageName === 'applications') await loadApplicationsTable();
    if (pageName === 'companies') await loadCompaniesTable();
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
    showLoading();
    
    const [jobs, applications, companies] = await Promise.all([
        fetchJobs(),
        fetchApplications(),
        fetchCompanies()
    ]);
    
    adminJobs = jobs;
    adminApplications = applications;
    adminCompanies = companies;
    
    const totalJobsEl = document.getElementById('totalJobs');
    const totalApplicantsEl = document.getElementById('totalApplicants');
    const totalCompaniesEl = document.getElementById('totalCompanies');
    const totalRevenueEl = document.getElementById('totalRevenue');
    
    if (totalJobsEl) totalJobsEl.textContent = adminJobs.length;
    if (totalApplicantsEl) totalApplicantsEl.textContent = adminApplications.length;
    if (totalCompaniesEl) totalCompaniesEl.textContent = adminCompanies.length;
    
    const totalRevenue = adminApplications.length * 1000;
    if (totalRevenueEl) totalRevenueEl.textContent = totalRevenue.toLocaleString() + ' ر.ي';
    
    const jobsCountEl = document.getElementById('jobsCount');
    const applicantsCountEl = document.getElementById('applicantsCount');
    const companiesCountEl = document.getElementById('companiesCount');
    
    if (jobsCountEl) jobsCountEl.textContent = adminJobs.length;
    if (applicantsCountEl) applicantsCountEl.textContent = adminApplications.length;
    if (companiesCountEl) companiesCountEl.textContent = adminCompanies.length;
    
    const recentJobs = [...adminJobs].slice(-5).reverse();
    const recentJobsList = document.getElementById('recentJobsList');
    if (recentJobsList) {
        recentJobsList.innerHTML = recentJobs.map(job => `
            <div class="recent-item">
                <div class="item-info">
                    <div class="item-icon"><i class="fas fa-briefcase"></i></div>
                    <div class="item-details">
                        <h4>${job.title || 'بدون عنوان'}</h4>
                        <span>${job.company || 'غير محدد'} - ${job.city || ''}</span>
                    </div>
                </div>
                <span class="item-badge badge-new">${job.type || 'دوام كامل'}</span>
            </div>
        `).join('') || '<p style="text-align:center;color:var(--text-muted);">لا توجد وظائف بعد</p>';
    }
    
    const recentApps = [...adminApplications].slice(-5).reverse();
    const recentAppsList = document.getElementById('recentApplicantsList');
    if (recentAppsList) {
        recentAppsList.innerHTML = recentApps.map(app => `
            <div class="recent-item">
                <div class="item-info">
                    <div class="item-icon"><i class="fas fa-user"></i></div>
                    <div class="item-details">
                        <h4>${app.userName || 'غير محدد'}</h4>
                        <span>${app.jobTitle || 'غير محدد'}</span>
                    </div>
                </div>
                <span class="item-badge ${getStatusBadgeClass(app.status)}">${app.status || 'جديد'}</span>
            </div>
        `).join('') || '<p style="text-align:center;color:var(--text-muted);">لا يوجد طلبات بعد</p>';
    }
    
    hideLoading();
}
function getStatusBadgeClass(status) {
    const classes = {
        'جديد': 'badge-new',
        'قيد المراجعة': 'badge-review',
        'مقبول': 'badge-accepted',
        'مرفوض': 'badge-rejected'
    };
    return classes[status] || 'badge-new';
}

// ============================================
// JOBS MANAGEMENT
// ============================================
async function loadJobsTable() {
    adminJobs = await fetchJobs();
    
    const tbody = document.getElementById('jobsTableBody');
    if (!tbody) return;
    
    if (adminJobs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">لا توجد وظائف بعد - اضغط "إضافة وظيفة" لإضافة أول وظيفة</td></tr>`;
        return;
    }
    
    tbody.innerHTML = adminJobs.map((job, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${job.title || 'بدون عنوان'}</strong></td>
            <td>${job.company || '-'}</td>
            <td>${job.city || '-'}</td>
            <td>${job.category || '-'}</td>
            <td>
                ${job.urgent ? '<span class="item-badge badge-rejected">عاجل</span> ' : ''}
                ${job.featured ? '<span class="item-badge badge-accepted">مميزة</span>' : ''}
                ${!job.urgent && !job.featured ? '<span style="color:var(--text-muted);">عادية</span>' : ''}
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-edit" onclick="editJob('${job.id}')" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteJobHandler('${job.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddJobModal() {
    document.getElementById('jobModalTitle').textContent = 'إضافة وظيفة جديدة';
    document.getElementById('jobForm').reset();
    document.getElementById('jobId').value = '';
    openModal('jobModal');
}

function editJob(jobId) {
    const job = adminJobs.find(j => String(j.id) === String(jobId));
    if (!job) return;
    
    document.getElementById('jobModalTitle').textContent = 'تعديل وظيفة';
    document.getElementById('jobId').value = job.id;
    document.getElementById('jobTitle').value = job.title || '';
    document.getElementById('jobCompany').value = job.company || '';
    document.getElementById('jobCity').value = job.city || 'صنعاء';
    document.getElementById('jobCategory').value = job.category || '';
    document.getElementById('jobType').value = job.type || 'دوام كامل';
    document.getElementById('jobSalary').value = job.salary || '';
    document.getElementById('jobDescription').value = job.description || '';
    document.getElementById('jobTags').value = (job.tags || []).join(', ');
    document.getElementById('jobFeatured').checked = job.featured || false;
    document.getElementById('jobUrgent').checked = job.urgent || false;
    
    openModal('jobModal');
}

async function saveJob(event) {
    event.preventDefault();
    
    const jobId = document.getElementById('jobId').value;
    const jobData = {
        title: document.getElementById('jobTitle').value,
        company: document.getElementById('jobCompany').value,
        city: document.getElementById('jobCity').value,
        category: document.getElementById('jobCategory').value,
        type: document.getElementById('jobType').value,
        salary: document.getElementById('jobSalary').value,
        description: document.getElementById('jobDescription').value,
        tags: document.getElementById('jobTags').value.split(',').map(t => t.trim()).filter(t => t),
        featured: document.getElementById('jobFeatured').checked,
        urgent: document.getElementById('jobUrgent').checked,
    };
    
    let success;
    if (jobId) {
        success = await updateJob(jobId, jobData);
        if (success) showToast('تم تحديث الوظيفة بنجاح ✅', 'success');
        else showToast('فشل تحديث الوظيفة', 'error');
    } else {
        const newJob = await addJob(jobData);
        success = !!newJob;
        if (success) showToast('تم إضافة الوظيفة بنجاح 🎉', 'success');
        else showToast('فشل إضافة الوظيفة', 'error');
    }
    
    if (success) {
           refreshCache();
        closeModal('jobModal');
        await loadJobsTable();
        await loadDashboard();
    }
}

async function deleteJobHandler(jobId) {
    if (!confirm('هل أنت متأكد من حذف هذه الوظيفة؟')) return;
    
    const success = await deleteJob(jobId);
    if (success) {
        refreshCache();
        showToast('تم حذف الوظيفة بنجاح', 'success');
        await loadJobsTable();
        await loadDashboard();
    } else {
        showToast('فشل حذف الوظيفة', 'error');
    }
}

// ============================================
// APPLICATIONS MANAGEMENT (الطلبات)
// ============================================
async function loadApplicationsTable() {
    adminApplications = await fetchApplications();
    
    const tbody = document.getElementById('applicationsTableBody');
    if (!tbody) return;
    
    if (adminApplications.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted);">لا يوجد طلبات تقديم بعد</td></tr>`;
        return;
    }
    
    const filtered = getFilteredApplications();
    
    tbody.innerHTML = filtered.map((app, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${app.userName || 'غير محدد'}</strong></td>
            <td>${app.jobTitle || 'غير محدد'}</td>
            <td>${app.userEmail || '-'}</td>
            <td>${app.transactionRef || '-'}</td>
            <td>${app.amount ? app.amount.toLocaleString() + ' ر.ي' : '1000 ر.ي'}</td>
            <td>
                <span class="item-badge ${getStatusBadgeClass(app.status)}">${app.status || 'جديد'}</span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-view" onclick="viewApplication('${app.id}')" title="عرض التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-edit" onclick="updateApplicationStatusModal('${app.id}')" title="تغيير الحالة">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteApplicationHandler('${app.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getFilteredApplications() {
    const jobFilter = document.getElementById('filterApplicantJob')?.value || '';
    const statusFilter = document.getElementById('filterApplicantStatus')?.value || '';
    
    return adminApplications.filter(app => {
        if (jobFilter && app.jobTitle !== jobFilter) return false;
        if (statusFilter && app.status !== statusFilter) return false;
        return true;
    });
}

function filterApplications() {
    loadApplicationsTable();
}

// عرض تفاصيل الطلب
function viewApplication(appId) {
    const app = adminApplications.find(a => a.id === appId);
    if (!app) return;
    
    const content = document.getElementById('applicantDetailContent');
    if (!content) return;
    
    const appliedDate = app.appliedAt 
        ? new Date(app.appliedAt.seconds ? app.appliedAt.seconds * 1000 : app.appliedAt).toLocaleDateString('ar')
        : 'غير محدد';
    
    // عرض صورة الإشعار إذا كانت موجودة
    let proofImageHtml = '';
    if (app.paymentProofBase64) {
        proofImageHtml = `
            <div style="margin-top:10px;">
                <strong>صورة إشعار التحويل:</strong>
                <div style="margin-top:8px;">
                    <img src="${app.paymentProofBase64}" alt="إشعار التحويل" style="max-width:200px; border-radius:8px; border:1px solid #ddd;">
                </div>
                <div style="margin-top:5px;">
                    <a href="${app.paymentProofBase64}" download="${app.paymentProofName || 'proof.png'}" class="btn btn-outline btn-sm">
                        <i class="fas fa-download"></i> تحميل الصورة
                    </a>
                </div>
            </div>
        `;
    } else if (app.paymentProofUrl) {
        proofImageHtml = `
            <div style="margin-top:10px;">
                <strong>صورة إشعار التحويل:</strong>
                <div style="margin-top:8px;">
                    <img src="${app.paymentProofUrl}" alt="إشعار التحويل" style="max-width:200px; border-radius:8px; border:1px solid #ddd;">
                </div>
                <div style="margin-top:5px;">
                    <a href="${app.paymentProofUrl}" target="_blank" class="btn btn-outline btn-sm">
                        <i class="fas fa-external-link-alt"></i> فتح الصورة
                    </a>
                </div>
            </div>
        `;
    } else {
        proofImageHtml = '<p style="color:var(--text-muted); margin-top:5px;"><i class="fas fa-info-circle"></i> لم يتم رفع صورة إشعار</p>';
    }
    
    content.innerHTML = `
        <h3 style="margin-bottom:15px;">📋 تفاصيل طلب التقديم</h3>
        <div style="background:var(--bg-gray);padding:20px;border-radius:var(--radius);">
            <h4 style="margin-bottom:10px;">👤 بيانات المتقدم</h4>
            <p><strong>الاسم:</strong> ${app.userName || 'غير محدد'}</p>
            <p><strong>البريد الإلكتروني:</strong> ${app.userEmail || 'غير محدد'}</p>
            
            <hr style="margin:15px 0;">
            <h4 style="margin-bottom:10px;">💼 بيانات الوظيفة</h4>
            <p><strong>الوظيفة:</strong> ${app.jobTitle || 'غير محدد'}</p>
            <p><strong>الشركة:</strong> ${app.jobCompany || 'غير محدد'}</p>
            <p><strong>المدينة:</strong> ${app.jobCity || 'غير محدد'}</p>
            
            <hr style="margin:15px 0;">
            <h4 style="margin-bottom:10px;">💰 بيانات الدفع</h4>
            <p><strong>المبلغ المدفوع:</strong> ${(app.amount || 1000).toLocaleString()} ريال يمني</p>
            <p><strong>رقم العملية:</strong> ${app.transactionRef || 'غير مدخل'}</p>
            <p><strong>طريقة الدفع:</strong> ${app.walletUsed || 'غير محددة'}</p>
            
            <hr style="margin:15px 0;">
            <h4 style="margin-bottom:10px;">📎 إثبات الدفع</h4>
            ${proofImageHtml}
            
            <hr style="margin:15px 0;">
            <h4 style="margin-bottom:10px;">📊 حالة الطلب</h4>
            <p><strong>الحالة الحالية:</strong> ${app.status || 'جديد'}</p>
            <p><strong>تاريخ التقديم:</strong> ${appliedDate}</p>
            ${app.reviewedAt ? `<p><strong>تاريخ المراجعة:</strong> ${new Date(app.reviewedAt.seconds ? app.reviewedAt.seconds * 1000 : app.reviewedAt).toLocaleDateString('ar')}</p>` : ''}
            ${app.adminNotes ? `<p><strong>ملاحظات الإدارة:</strong> ${app.adminNotes}</p>` : ''}
        </div>
        <div style="margin-top:15px;display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="changeApplicationStatus('${app.id}', 'مقبول')">
                <i class="fas fa-check"></i> قبول
            </button>
            <button class="btn" style="background:#f59e0b;color:#fff;" onclick="changeApplicationStatus('${app.id}', 'قيد المراجعة')">
                <i class="fas fa-clock"></i> قيد المراجعة
            </button>
            <button class="btn" style="background:#dc2626;color:#fff;" onclick="changeApplicationStatus('${app.id}', 'مرفوض')">
                <i class="fas fa-times"></i> رفض
            </button>
        </div>
    `;
    
    openModal('applicantDetailModal');
}

// فتح نافذة تغيير الحالة
function updateApplicationStatusModal(appId) {
    const app = adminApplications.find(a => a.id === appId);
    if (!app) return;
    
    const content = document.getElementById('applicantDetailContent');
    if (!content) return;
    
    content.innerHTML = `
        <h3 style="margin-bottom:15px;">تغيير حالة الطلب</h3>
        <div style="background:var(--bg-gray);padding:20px;border-radius:var(--radius);">
            <p><strong>المتقدم:</strong> ${app.userName}</p>
            <p><strong>الوظيفة:</strong> ${app.jobTitle}</p>
            <div class="form-group" style="margin-top:15px;">
                <label>اختر الحالة الجديدة</label>
                <select id="newStatusSelect" class="form-input">
                    <option value="جديد" ${app.status === 'جديد' ? 'selected' : ''}>جديد</option>
                    <option value="قيد المراجعة" ${app.status === 'قيد المراجعة' ? 'selected' : ''}>قيد المراجعة</option>
                    <option value="مقبول" ${app.status === 'مقبول' ? 'selected' : ''}>مقبول</option>
                    <option value="مرفوض" ${app.status === 'مرفوض' ? 'selected' : ''}>مرفوض</option>
                </select>
            </div>
            <div class="form-group">
                <label>ملاحظات (اختياري)</label>
                <textarea id="adminNotes" class="form-input" rows="3" placeholder="أضف ملاحظات..."></textarea>
            </div>
            <button class="btn btn-primary btn-block" onclick="saveApplicationStatus('${app.id}')">
                <i class="fas fa-save"></i> حفظ التغييرات
            </button>
        </div>
    `;
    
    openModal('applicantDetailModal');
}

async function saveApplicationStatus(appId) {
    const newStatus = document.getElementById('newStatusSelect')?.value;
    const notes = document.getElementById('adminNotes')?.value || '';
    
    if (!newStatus) return;
    
    const success = await updateApplicationStatus(appId, newStatus, notes);
    if (success) {
         refreshCache(); 
        showToast(`تم تحديث الحالة إلى "${newStatus}"`, 'success');
        closeModal('applicantDetailModal');
        await loadApplicationsTable();
        await loadDashboard();
    } else {
        showToast('فشل تحديث الحالة', 'error');
    }
}

async function changeApplicationStatus(appId, newStatus) {
    const success = await updateApplicationStatus(appId, newStatus);
    if (success) {
         refreshCache();
        showToast(`تم تحديث الحالة إلى "${newStatus}"`, 'success');
        closeModal('applicantDetailModal');
        await loadApplicationsTable();
        await loadDashboard();
    } else {
        showToast('فشل تحديث الحالة', 'error');
    }
}

async function deleteApplicationHandler(appId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    
    const success = await deleteApplication(appId);
    if (success) {
        refreshCache();
        showToast('تم حذف الطلب بنجاح', 'success');
        await loadApplicationsTable();
        await loadDashboard();
    } else {
        showToast('فشل حذف الطلب', 'error');
    }
}

// ============================================
// COMPANIES MANAGEMENT
// ============================================
async function loadCompaniesTable() {
    adminCompanies = await fetchCompanies();
    
    const tbody = document.getElementById('companiesTableBody');
    if (!tbody) return;
    
    if (adminCompanies.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">لا توجد شركات بعد - اضغط "إضافة شركة" لإضافة أول شركة</td></tr>`;
        return;
    }
    
    tbody.innerHTML = adminCompanies.map((company, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>
                <div style="width:40px;height:40px;background:var(--primary-light);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;color:var(--primary);">
                    ${company.logo || company.name?.charAt(0) || 'ش'}
                </div>
            </td>
            <td><strong>${company.name || '-'}</strong></td>
            <td>${company.industry || '-'}</td>
            <td>${company.city || '-'}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-delete" onclick="deleteCompanyHandler('${company.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddCompanyModal() {
    document.getElementById('companyForm').reset();
    openModal('companyModal');
}

async function saveCompany(event) {
    event.preventDefault();
    
    const companyData = {
        name: document.getElementById('companyName')?.value,
        industry: document.getElementById('companyIndustry')?.value,
        city: document.getElementById('companyCity')?.value,
        logo: document.getElementById('companyLogo')?.value,
        jobs: 0
    };
    
    const newCompany = await addCompany(companyData);
    if (newCompany) {
        refreshCache();
        closeModal('companyModal');
        await loadCompaniesTable();
        await loadDashboard();
        showToast('تم إضافة الشركة بنجاح 🎉', 'success');
    } else {
        showToast('فشل إضافة الشركة', 'error');
    }
}

async function deleteCompanyHandler(companyId) {
    if (!confirm('هل أنت متأكد من حذف هذه الشركة؟')) return;
    
    const success = await deleteCompany(companyId);
    if (success) {
          refreshCache();
        showToast('تم حذف الشركة بنجاح', 'success');
        await loadCompaniesTable();
        await loadDashboard();
    } else {
        showToast('فشل حذف الشركة', 'error');
    }
}

// ============================================
// SETTINGS
// ============================================
function saveSettings(event) {
    event.preventDefault();
    
    const settings = {
        siteName: document.getElementById('siteName')?.value,
        siteEmail: document.getElementById('siteEmail')?.value,
        sitePhone: document.getElementById('sitePhone')?.value,
        siteAddress: document.getElementById('siteAddress')?.value
    };
    
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    showToast('تم حفظ الإعدادات بنجاح ✅', 'success');
}

function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('كلمات المرور غير متطابقة', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    showToast('تم تغيير كلمة المرور بنجاح 🔒 (للمستخدم المحلي فقط)', 'success');
    document.getElementById('passwordForm')?.reset();
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
    }, 3000);
}

// ============================================
// NOTIFICATIONS
// ============================================
function showNotifications() {
    showToast('لا توجد إشعارات جديدة', '');
}

// ============================================
// INITIALIZATION
// ============================================
async function initAdminDashboard() {
    checkAdminAuth();
    
    // تحميل الإعدادات المحفوظة
    const savedSettings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
    if (savedSettings.siteName && document.getElementById('siteName')) 
        document.getElementById('siteName').value = savedSettings.siteName;
    if (savedSettings.siteEmail && document.getElementById('siteEmail')) 
        document.getElementById('siteEmail').value = savedSettings.siteEmail;
    if (savedSettings.sitePhone && document.getElementById('sitePhone')) 
        document.getElementById('sitePhone').value = savedSettings.sitePhone;
    if (savedSettings.siteAddress && document.getElementById('siteAddress')) 
        document.getElementById('siteAddress').value = savedSettings.siteAddress;
    
    // تحميل البيانات
    await loadDashboard();
    
    console.log('🚀 لوحة تحكم شغلي جاهزة');
    console.log('🔥 Firebase:', firebaseReady ? 'متصل' : 'وضع محلي');
    console.log('📊 الوظائف:', adminJobs.length);
    console.log('📋 الطلبات:', adminApplications.length);
    console.log('🏢 الشركات:', adminCompanies.length);
}

// بدء التشغيل
if (document.querySelector('.admin-dashboard-body')) {
    document.addEventListener('DOMContentLoaded', initAdminDashboard);
}

// ============================================
// تعريض الدوال للنطاق العام
// ============================================
window.handleAdminLogin = handleAdminLogin;
window.handleAdminLogout = handleAdminLogout;
window.togglePasswordVisibility = togglePasswordVisibility;
window.toggleSidebar = toggleSidebar;
window.switchPage = switchPage;
window.openAddJobModal = openAddJobModal;
window.editJob = editJob;
window.saveJob = saveJob;
window.deleteJobHandler = deleteJobHandler;
window.filterApplications = filterApplications;
window.viewApplication = viewApplication;
window.updateApplicationStatusModal = updateApplicationStatusModal;
window.saveApplicationStatus = saveApplicationStatus;
window.changeApplicationStatus = changeApplicationStatus;
window.deleteApplicationHandler = deleteApplicationHandler;
window.openAddCompanyModal = openAddCompanyModal;
window.saveCompany = saveCompany;
window.deleteCompanyHandler = deleteCompanyHandler;
window.saveSettings = saveSettings;
window.changePassword = changePassword;
window.openModal = openModal;
window.closeModal = closeModal;
window.showNotifications = showNotifications;
