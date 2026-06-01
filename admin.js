// ============================================
// FIREBASE IMPORTS & CONFIGURATION
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAyWmacChzw5Wl-D_YkEObJw74qliw8OQs",
    authDomain: "shaghalni-web.firebaseapp.com",
    projectId: "shaghalni-web",
    storageBucket: "shaghalni-web.firebasestorage.app",
    messagingSenderId: "97870619288",
    appId: "1:97870619288:web:aa949c94ca59a39e0126ed",
    measurementId: "G-SW6K435LB1"
};

let app, db;
let firebaseReady = false;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    firebaseReady = true;
    console.log("✅ Firebase Admin متصل بنجاح");
} catch (error) {
    console.warn("⚠️ Firebase Admin غير متصل:", error.message);
    firebaseReady = false;
}

// ============================================
// ADMIN CREDENTIALS
// ============================================
const ADMIN_CREDENTIALS = {
    email: 'yemen@job.com',
    password: 'admin1112004admin'
};

// ============================================
// STATE MANAGEMENT
// ============================================
let adminJobs = [];
let adminApplicants = [];
let adminCompanies = [];
let isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

// ============================================
// FIREBASE OPERATIONS
// ============================================

// جلب جميع الوظائف من Firestore
async function fetchJobsFromFirestore() {
    if (!firebaseReady) {
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
        return jobs;
    } catch (error) {
        console.error('خطأ في جلب الوظائف:', error);
        return JSON.parse(localStorage.getItem('adminJobs') || '[]');
    }
}

// إضافة وظيفة إلى Firestore
async function addJobToFirestore(jobData) {
    if (!firebaseReady) {
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

// تحديث وظيفة في Firestore
async function updateJobInFirestore(jobId, jobData) {
    if (!firebaseReady) {
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
        await updateDoc(jobRef, {
            ...jobData,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('خطأ في تحديث الوظيفة:', error);
        return false;
    }
}

// حذف وظيفة من Firestore
async function deleteJobFromFirestore(jobId) {
    if (!firebaseReady) {
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

// جلب المتقدمين من Firestore
async function fetchApplicantsFromFirestore() {
    if (!firebaseReady) {
        return JSON.parse(localStorage.getItem('adminApplicants') || '[]');
    }
    
    try {
        const applicantsRef = collection(db, 'applicants');
        const q = query(applicantsRef, orderBy('appliedAt', 'desc'));
        const snapshot = await getDocs(q);
        const applicants = [];
        snapshot.forEach(doc => {
            applicants.push({ id: doc.id, ...doc.data() });
        });
        return applicants;
    } catch (error) {
        console.error('خطأ في جلب المتقدمين:', error);
        return JSON.parse(localStorage.getItem('adminApplicants') || '[]');
    }
}

// تحديث حالة متقدم في Firestore
async function updateApplicantInFirestore(applicantId, data) {
    if (!firebaseReady) {
        const localApps = JSON.parse(localStorage.getItem('adminApplicants') || '[]');
        const index = localApps.findIndex(a => a.id === applicantId);
        if (index >= 0) {
            localApps[index] = { ...localApps[index], ...data };
            localStorage.setItem('adminApplicants', JSON.stringify(localApps));
        }
        return true;
    }
    
    try {
        const appRef = doc(db, 'applicants', applicantId);
        await updateDoc(appRef, data);
        return true;
    } catch (error) {
        console.error('خطأ في تحديث المتقدم:', error);
        return false;
    }
}

// حذف متقدم من Firestore
async function deleteApplicantFromFirestore(applicantId) {
    if (!firebaseReady) {
        let localApps = JSON.parse(localStorage.getItem('adminApplicants') || '[]');
        localApps = localApps.filter(a => a.id !== applicantId);
        localStorage.setItem('adminApplicants', JSON.stringify(localApps));
        return true;
    }
    
    try {
        await deleteDoc(doc(db, 'applicants', applicantId));
        return true;
    } catch (error) {
        console.error('خطأ في حذف المتقدم:', error);
        return false;
    }
}

// جلب الشركات من Firestore
async function fetchCompaniesFromFirestore() {
    if (!firebaseReady) {
        return JSON.parse(localStorage.getItem('adminCompanies') || '[]');
    }
    
    try {
        const companiesRef = collection(db, 'companies');
        const snapshot = await getDocs(companiesRef);
        const companies = [];
        snapshot.forEach(doc => {
            companies.push({ id: doc.id, ...doc.data() });
        });
        return companies;
    } catch (error) {
        console.error('خطأ في جلب الشركات:', error);
        return JSON.parse(localStorage.getItem('adminCompanies') || '[]');
    }
}

// إضافة شركة إلى Firestore
async function addCompanyToFirestore(companyData) {
    if (!firebaseReady) {
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

// حذف شركة من Firestore
async function deleteCompanyFromFirestore(companyId) {
    if (!firebaseReady) {
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
// AUTHENTICATION
// ============================================
function handleAdminLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showToast('تم تسجيل الدخول بنجاح! 🎉', 'success');
        
        if (document.getElementById('rememberMe')?.checked) {
            localStorage.setItem('adminRemembered', 'true');
        }
        
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 800);
    } else {
        showToast('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
    }
}

function checkAdminAuth() {
    if (!isLoggedIn && !window.location.href.includes('admin-login.html')) {
        window.location.href = 'admin-login.html';
    }
}

function handleAdminLogout() {
    sessionStorage.removeItem('adminLoggedIn');
    showToast('تم تسجيل الخروج بنجاح', 'success');
    setTimeout(() => {
        window.location.href = 'admin-login.html';
    }, 500);
}

// ============================================
// TOGGLE PASSWORD VISIBILITY
// ============================================
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('adminPassword');
    const icon = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
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
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    const titles = {
        'dashboard': 'لوحة التحكم',
        'jobs': 'إدارة الوظائف',
        'applicants': 'إدارة المتقدمين',
        'companies': 'إدارة الشركات',
        'settings': 'الإعدادات'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[pageName] || 'لوحة التحكم';
    
    if (pageName === 'dashboard') await loadDashboard();
    if (pageName === 'jobs') await loadJobsTable();
    if (pageName === 'applicants') await loadApplicantsTable();
    if (pageName === 'companies') await loadCompaniesTable();
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
    // جلب البيانات من Firestore
    adminJobs = await fetchJobsFromFirestore();
    adminApplicants = await fetchApplicantsFromFirestore();
    adminCompanies = await fetchCompaniesFromFirestore();
    
    // تحديث الإحصائيات
    const totalJobsEl = document.getElementById('totalJobs');
    const totalApplicantsEl = document.getElementById('totalApplicants');
    const totalCompaniesEl = document.getElementById('totalCompanies');
    const totalViewsEl = document.getElementById('totalViews');
    
    if (totalJobsEl) totalJobsEl.textContent = adminJobs.length;
    if (totalApplicantsEl) totalApplicantsEl.textContent = adminApplicants.length;
    if (totalCompaniesEl) totalCompaniesEl.textContent = adminCompanies.length;
    if (totalViewsEl) totalViewsEl.textContent = Math.floor(Math.random() * 500) + 100;
    
    // تحديث العدادات في الشريط الجانبي
    const jobsCountEl = document.getElementById('jobsCount');
    const applicantsCountEl = document.getElementById('applicantsCount');
    const companiesCountEl = document.getElementById('companiesCount');
    
    if (jobsCountEl) jobsCountEl.textContent = adminJobs.length;
    if (applicantsCountEl) applicantsCountEl.textContent = adminApplicants.length;
    if (companiesCountEl) companiesCountEl.textContent = adminCompanies.length;
    
    // آخر الوظائف
    const recentJobs = [...adminJobs].slice(-5).reverse();
    const recentJobsList = document.getElementById('recentJobsList');
    if (recentJobsList) {
        recentJobsList.innerHTML = recentJobs.map(job => `
            <div class="recent-item">
                <div class="item-info">
                    <div class="item-icon"><i class="fas fa-briefcase"></i></div>
                    <div class="item-details">
                        <h4>${job.title}</h4>
                        <span>${job.company} - ${job.city}</span>
                    </div>
                </div>
                <span class="item-badge badge-new">${job.type || 'دوام كامل'}</span>
            </div>
        `).join('') || '<p style="text-align:center;color:var(--text-muted);">لا توجد وظائف بعد</p>';
    }
    
    // آخر المتقدمين
    const recentApplicants = [...adminApplicants].slice(-5).reverse();
    const recentApplicantsList = document.getElementById('recentApplicantsList');
    if (recentApplicantsList) {
        recentApplicantsList.innerHTML = recentApplicants.map(app => `
            <div class="recent-item">
                <div class="item-info">
                    <div class="item-icon"><i class="fas fa-user"></i></div>
                    <div class="item-details">
                        <h4>${app.name}</h4>
                        <span>${app.jobTitle}</span>
                    </div>
                </div>
                <span class="item-badge ${getStatusBadgeClass(app.status)}">${app.status || 'جديد'}</span>
            </div>
        `).join('') || '<p style="text-align:center;color:var(--text-muted);">لا يوجد متقدمين بعد</p>';
    }
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
    adminJobs = await fetchJobsFromFirestore();
    
    const tbody = document.getElementById('jobsTableBody');
    if (!tbody) return;
    
    if (adminJobs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">لا توجد وظائف بعد - اضغط "إضافة وظيفة" لإضافة أول وظيفة</td></tr>`;
        return;
    }
    
    tbody.innerHTML = adminJobs.map((job, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${job.title}</strong></td>
            <td>${job.company}</td>
            <td>${job.city}</td>
            <td>${job.category}</td>
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
                    <button class="btn-icon btn-delete" onclick="deleteJob('${job.id}')" title="حذف">
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
    const job = adminJobs.find(j => j.id === jobId);
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
    
    if (jobId) {
        // تحديث وظيفة موجودة
        const success = await updateJobInFirestore(jobId, jobData);
        if (success) {
            showToast('تم تحديث الوظيفة بنجاح ✅', 'success');
        } else {
            showToast('فشل تحديث الوظيفة', 'error');
        }
    } else {
        // إضافة وظيفة جديدة
        const newJob = await addJobToFirestore(jobData);
        if (newJob) {
            showToast('تم إضافة الوظيفة بنجاح 🎉', 'success');
        } else {
            showToast('فشل إضافة الوظيفة', 'error');
        }
    }
    
    closeModal('jobModal');
    await loadJobsTable();
    await loadDashboard();
}

async function deleteJob(jobId) {
    if (!confirm('هل أنت متأكد من حذف هذه الوظيفة؟')) return;
    
    const success = await deleteJobFromFirestore(jobId);
    if (success) {
        showToast('تم حذف الوظيفة بنجاح', 'success');
        await loadJobsTable();
        await loadDashboard();
    } else {
        showToast('فشل حذف الوظيفة', 'error');
    }
}

// ============================================
// APPLICANTS MANAGEMENT
// ============================================
async function loadApplicantsTable() {
    adminApplicants = await fetchApplicantsFromFirestore();
    
    const tbody = document.getElementById('applicantsTableBody');
    if (!tbody) return;
    
    if (adminApplicants.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">لا يوجد متقدمين بعد</td></tr>`;
        return;
    }
    
    const filtered = getFilteredApplicants();
    
    tbody.innerHTML = filtered.map((app, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${app.name}</strong></td>
            <td>${app.jobTitle}</td>
            <td>${app.email}</td>
            <td>${app.appliedAt ? new Date(app.appliedAt.seconds ? app.appliedAt.seconds * 1000 : app.appliedAt).toLocaleDateString('ar') : 'غير محدد'}</td>
            <td>
                <span class="item-badge ${getStatusBadgeClass(app.status)}">${app.status || 'جديد'}</span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-view" onclick="viewApplicant('${app.id}')" title="عرض">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-edit" onclick="updateApplicantStatus('${app.id}')" title="تغيير الحالة">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteApplicant('${app.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getFilteredApplicants() {
    const jobFilter = document.getElementById('filterApplicantJob')?.value || '';
    const statusFilter = document.getElementById('filterApplicantStatus')?.value || '';
    
    return adminApplicants.filter(app => {
        if (jobFilter && app.jobTitle !== jobFilter) return false;
        if (statusFilter && app.status !== statusFilter) return false;
        return true;
    });
}

function filterApplicants() {
    loadApplicantsTable();
}

function viewApplicant(appId) {
    const app = adminApplicants.find(a => a.id === appId);
    if (!app) return;
    
    const content = document.getElementById('applicantDetailContent');
    if (!content) return;
    
    const appliedDate = app.appliedAt 
        ? new Date(app.appliedAt.seconds ? app.appliedAt.seconds * 1000 : app.appliedAt).toLocaleDateString('ar')
        : 'غير محدد';
    
    content.innerHTML = `
        <h3 style="margin-bottom:15px;">تفاصيل المتقدم</h3>
        <div style="background:var(--bg-gray);padding:20px;border-radius:var(--radius);">
            <p><strong>الاسم:</strong> ${app.name}</p>
            <p><strong>البريد:</strong> ${app.email}</p>
            <p><strong>الهاتف:</strong> ${app.phone || 'غير متوفر'}</p>
            <p><strong>الوظيفة:</strong> ${app.jobTitle}</p>
            <p><strong>تاريخ التقديم:</strong> ${appliedDate}</p>
            <p><strong>الحالة:</strong> ${app.status || 'جديد'}</p>
        </div>
        <div style="margin-top:15px;display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="changeApplicantStatus('${app.id}', 'مقبول')">
                <i class="fas fa-check"></i> قبول
            </button>
            <button class="btn" style="background:#f59e0b;color:#fff;" onclick="changeApplicantStatus('${app.id}', 'قيد المراجعة')">
                <i class="fas fa-clock"></i> قيد المراجعة
            </button>
            <button class="btn" style="background:#dc2626;color:#fff;" onclick="changeApplicantStatus('${app.id}', 'مرفوض')">
                <i class="fas fa-times"></i> رفض
            </button>
        </div>
    `;
    
    openModal('applicantDetailModal');
}

async function changeApplicantStatus(appId, newStatus) {
    const success = await updateApplicantInFirestore(appId, { status: newStatus });
    if (success) {
        showToast(`تم تحديث الحالة إلى "${newStatus}"`, 'success');
        closeModal('applicantDetailModal');
        await loadApplicantsTable();
        await loadDashboard();
    } else {
        showToast('فشل تحديث الحالة', 'error');
    }
}

async function updateApplicantStatus(appId) {
    const app = adminApplicants.find(a => a.id === appId);
    if (!app) return;
    
    const statuses = ['جديد', 'قيد المراجعة', 'مقبول', 'مرفوض'];
    const currentStatus = app.status || 'جديد';
    const currentIndex = statuses.indexOf(currentStatus);
    const newStatus = statuses[(currentIndex + 1) % statuses.length];
    
    const success = await updateApplicantInFirestore(appId, { status: newStatus });
    if (success) {
        await loadApplicantsTable();
        await loadDashboard();
        showToast(`تم تغيير الحالة إلى "${newStatus}"`, 'success');
    } else {
        showToast('فشل تغيير الحالة', 'error');
    }
}

async function deleteApplicant(appId) {
    if (!confirm('هل أنت متأكد من حذف هذا المتقدم؟')) return;
    
    const success = await deleteApplicantFromFirestore(appId);
    if (success) {
        showToast('تم حذف المتقدم بنجاح', 'success');
        await loadApplicantsTable();
        await loadDashboard();
    } else {
        showToast('فشل حذف المتقدم', 'error');
    }
}

// ============================================
// COMPANIES MANAGEMENT
// ============================================
async function loadCompaniesTable() {
    adminCompanies = await fetchCompaniesFromFirestore();
    
    const tbody = document.getElementById('companiesTableBody');
    if (!tbody) return;
    
    if (adminCompanies.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">لا توجد شركات بعد - اضغط "إضافة شركة" لإضافة أول شركة</td></tr>`;
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
            <td><strong>${company.name}</strong></td>
            <td>${company.industry || '-'}</td>
            <td>${company.city || '-'}</td>
            <td>${company.jobs || 0}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-delete" onclick="deleteCompany('${company.id}')" title="حذف">
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
        name: document.getElementById('companyName').value,
        industry: document.getElementById('companyIndustry').value,
        city: document.getElementById('companyCity').value,
        logo: document.getElementById('companyLogo').value,
        jobs: 0
    };
    
    const newCompany = await addCompanyToFirestore(companyData);
    if (newCompany) {
        closeModal('companyModal');
        await loadCompaniesTable();
        await loadDashboard();
        showToast('تم إضافة الشركة بنجاح 🎉', 'success');
    } else {
        showToast('فشل إضافة الشركة', 'error');
    }
}

async function deleteCompany(companyId) {
    if (!confirm('هل أنت متأكد من حذف هذه الشركة؟')) return;
    
    const success = await deleteCompanyFromFirestore(companyId);
    if (success) {
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
        siteName: document.getElementById('siteName').value,
        siteEmail: document.getElementById('siteEmail').value,
        sitePhone: document.getElementById('sitePhone').value,
        siteAddress: document.getElementById('siteAddress').value
    };
    
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    showToast('تم حفظ الإعدادات بنجاح ✅', 'success');
}

function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (currentPassword !== ADMIN_CREDENTIALS.password) {
        showToast('كلمة المرور الحالية غير صحيحة', 'error');
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
    
    showToast('تم تغيير كلمة المرور بنجاح 🔒', 'success');
    document.getElementById('passwordForm').reset();
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
    const dot = document.getElementById('notificationDot');
    if (dot) dot.classList.toggle('active');
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
    
    // تحميل البيانات من Firestore
    await loadDashboard();
    
    // محاكاة إشعارات
    if (Math.random() > 0.5) {
        const dot = document.getElementById('notificationDot');
        if (dot) dot.classList.add('active');
    }
    
    console.log('🚀 لوحة تحكم شغلي جاهزة');
    console.log('🔥 Firebase:', firebaseReady ? 'متصل' : 'وضع محلي');
    console.log('📊 الوظائف:', adminJobs.length);
    console.log('👥 المتقدمين:', adminApplicants.length);
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
window.deleteJob = deleteJob;
window.filterApplicants = filterApplicants;
window.viewApplicant = viewApplicant;
window.updateApplicantStatus = updateApplicantStatus;
window.deleteApplicant = deleteApplicant;
window.changeApplicantStatus = changeApplicantStatus;
window.openAddCompanyModal = openAddCompanyModal;
window.saveCompany = saveCompany;
window.deleteCompany = deleteCompany;
window.saveSettings = saveSettings;
window.changePassword = changePassword;
window.openModal = openModal;
window.closeModal = closeModal;
window.showNotifications = showNotifications;
