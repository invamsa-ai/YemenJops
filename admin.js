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
let adminJobs = JSON.parse(localStorage.getItem('adminJobs') || '[]');
let adminApplicants = JSON.parse(localStorage.getItem('adminApplicants') || '[]');
let adminCompanies = JSON.parse(localStorage.getItem('adminCompanies') || '[]');
let isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

// بيانات افتراضية للتجربة
if (adminJobs.length === 0) {
    adminJobs = [
        { id: 1, title: 'مطور واجهات أمامية', company: 'شركة سبأفون', city: 'صنعاء', category: 'تكنولوجيا المعلومات', type: 'دوام كامل', salary: '250,000', featured: true, urgent: true, description: 'نبحث عن مطور واجهات أمامية', tags: ['React', 'JavaScript'], postedAt: '2026-05-28' },
        { id: 2, title: 'محاسب مالي', company: 'البنك اليمني', city: 'صنعاء', category: 'المحاسبة والمالية', type: 'دوام كامل', salary: '180,000', featured: false, urgent: false, description: 'مطلوب محاسب مالي', tags: ['محاسبة'], postedAt: '2026-05-27' },
    ];
    localStorage.setItem('adminJobs', JSON.stringify(adminJobs));
}

if (adminCompanies.length === 0) {
    adminCompanies = [
        { id: 1, name: 'شركة سبأفون', logo: 'س', industry: 'الاتصالات', city: 'صنعاء', jobs: 12 },
        { id: 2, name: 'البنك اليمني للإنشاء والتعمير', logo: 'ب', industry: 'البنوك', city: 'صنعاء', jobs: 15 },
        { id: 3, name: 'يمن موبايل', logo: 'ي', industry: 'الاتصالات', city: 'صنعاء', jobs: 8 },
    ];
    localStorage.setItem('adminCompanies', JSON.stringify(adminCompanies));
}

if (adminApplicants.length === 0) {
    adminApplicants = [
        { id: 1, name: 'أحمد محمد', email: 'ahmed@example.com', jobTitle: 'مطور واجهات أمامية', jobId: 1, status: 'جديد', appliedAt: '2026-05-29', phone: '770123456' },
        { id: 2, name: 'فاطمة علي', email: 'fatima@example.com', jobTitle: 'محاسب مالي', jobId: 2, status: 'قيد المراجعة', appliedAt: '2026-05-30', phone: '771654321' },
    ];
    localStorage.setItem('adminApplicants', JSON.stringify(adminApplicants));
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
        
        // حفظ حالة "تذكرني"
        if (document.getElementById('rememberMe').checked) {
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
    
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('expanded');
}

// ============================================
// PAGE SWITCHING
// ============================================
function switchPage(pageName, navItem) {
    // تحديث الناف
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (navItem) navItem.classList.add('active');
    
    // إخفاء كل الصفحات
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    
    // إظهار الصفحة المطلوبة
    const pageElement = document.getElementById(`${pageName}-page`);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    // تحديث العنوان
    const titles = {
        'dashboard': 'لوحة التحكم',
        'jobs': 'إدارة الوظائف',
        'applicants': 'إدارة المتقدمين',
        'companies': 'إدارة الشركات',
        'settings': 'الإعدادات'
    };
    document.getElementById('pageTitle').textContent = titles[pageName] || 'لوحة التحكم';
    
    // تحميل بيانات الصفحة
    if (pageName === 'dashboard') loadDashboard();
    if (pageName === 'jobs') loadJobsTable();
    if (pageName === 'applicants') loadApplicantsTable();
    if (pageName === 'companies') loadCompaniesTable();
}

// ============================================
// DASHBOARD
// ============================================
function loadDashboard() {
    document.getElementById('totalJobs').textContent = adminJobs.length;
    document.getElementById('totalApplicants').textContent = adminApplicants.length;
    document.getElementById('totalCompanies').textContent = adminCompanies.length;
    document.getElementById('totalViews').textContent = Math.floor(Math.random() * 500) + 100;
    
    document.getElementById('jobsCount').textContent = adminJobs.length;
    document.getElementById('applicantsCount').textContent = adminApplicants.length;
    document.getElementById('companiesCount').textContent = adminCompanies.length;
    
    // آخر الوظائف
    const recentJobs = [...adminJobs].slice(-5).reverse();
    document.getElementById('recentJobsList').innerHTML = recentJobs.map(job => `
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
    `).join('');
    
    // آخر المتقدمين
    const recentApplicants = [...adminApplicants].slice(-5).reverse();
    document.getElementById('recentApplicantsList').innerHTML = recentApplicants.map(app => `
        <div class="recent-item">
            <div class="item-info">
                <div class="item-icon"><i class="fas fa-user"></i></div>
                <div class="item-details">
                    <h4>${app.name}</h4>
                    <span>${app.jobTitle}</span>
                </div>
            </div>
            <span class="item-badge ${getStatusBadgeClass(app.status)}">${app.status}</span>
        </div>
    `).join('');
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
function loadJobsTable() {
    const tbody = document.getElementById('jobsTableBody');
    tbody.innerHTML = adminJobs.map((job, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${job.title}</strong></td>
            <td>${job.company}</td>
            <td>${job.city}</td>
            <td>${job.category}</td>
            <td>
                ${job.urgent ? '<span class="item-badge badge-rejected">عاجل</span>' : ''}
                ${job.featured ? '<span class="item-badge badge-accepted">مميزة</span>' : ''}
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-edit" onclick="editJob(${job.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteJob(${job.id})" title="حذف">
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
    document.getElementById('jobTitle').value = job.title;
    document.getElementById('jobCompany').value = job.company;
    document.getElementById('jobCity').value = job.city;
    document.getElementById('jobCategory').value = job.category;
    document.getElementById('jobType').value = job.type;
    document.getElementById('jobSalary').value = job.salary;
    document.getElementById('jobDescription').value = job.description || '';
    document.getElementById('jobTags').value = (job.tags || []).join(', ');
    document.getElementById('jobFeatured').checked = job.featured;
    document.getElementById('jobUrgent').checked = job.urgent;
    
    openModal('jobModal');
}

function saveJob(event) {
    event.preventDefault();
    
    const jobData = {
        id: document.getElementById('jobId').value ? parseInt(document.getElementById('jobId').value) : Date.now(),
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
        postedAt: new Date().toISOString().split('T')[0]
    };
    
    const existingIndex = adminJobs.findIndex(j => j.id === jobData.id);
    
    if (existingIndex >= 0) {
        adminJobs[existingIndex] = jobData;
        showToast('تم تحديث الوظيفة بنجاح ✅', 'success');
    } else {
        adminJobs.unshift(jobData);
        showToast('تم إضافة الوظيفة بنجاح 🎉', 'success');
    }
    
    localStorage.setItem('adminJobs', JSON.stringify(adminJobs));
    closeModal('jobModal');
    loadJobsTable();
    loadDashboard();
}

function deleteJob(jobId) {
    if (confirm('هل أنت متأكد من حذف هذه الوظيفة؟')) {
        adminJobs = adminJobs.filter(j => j.id !== jobId);
        localStorage.setItem('adminJobs', JSON.stringify(adminJobs));
        loadJobsTable();
        loadDashboard();
        showToast('تم حذف الوظيفة بنجاح', 'success');
    }
}

// ============================================
// APPLICANTS MANAGEMENT
// ============================================
function loadApplicantsTable() {
    const tbody = document.getElementById('applicantsTableBody');
    const filtered = getFilteredApplicants();
    
    tbody.innerHTML = filtered.map((app, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${app.name}</strong></td>
            <td>${app.jobTitle}</td>
            <td>${app.email}</td>
            <td>${app.appliedAt}</td>
            <td>
                <span class="item-badge ${getStatusBadgeClass(app.status)}">${app.status}</span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-view" onclick="viewApplicant(${app.id})" title="عرض">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-edit" onclick="updateApplicantStatus(${app.id})" title="تغيير الحالة">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteApplicant(${app.id})" title="حذف">
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
    
    document.getElementById('applicantDetailContent').innerHTML = `
        <h3 style="margin-bottom:15px;">تفاصيل المتقدم</h3>
        <div style="background:var(--bg-gray);padding:20px;border-radius:var(--radius);">
            <p><strong>الاسم:</strong> ${app.name}</p>
            <p><strong>البريد:</strong> ${app.email}</p>
            <p><strong>الهاتف:</strong> ${app.phone || 'غير متوفر'}</p>
            <p><strong>الوظيفة:</strong> ${app.jobTitle}</p>
            <p><strong>تاريخ التقديم:</strong> ${app.appliedAt}</p>
            <p><strong>الحالة:</strong> ${app.status}</p>
        </div>
        <div style="margin-top:15px;display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="changeApplicantStatus(${app.id}, 'مقبول')">
                <i class="fas fa-check"></i> قبول
            </button>
            <button class="btn" style="background:#f59e0b;color:#fff;" onclick="changeApplicantStatus(${app.id}, 'قيد المراجعة')">
                <i class="fas fa-clock"></i> قيد المراجعة
            </button>
            <button class="btn" style="background:#dc2626;color:#fff;" onclick="changeApplicantStatus(${app.id}, 'مرفوض')">
                <i class="fas fa-times"></i> رفض
            </button>
        </div>
    `;
    
    openModal('applicantDetailModal');
}

function changeApplicantStatus(appId, newStatus) {
    const app = adminApplicants.find(a => a.id === appId);
    if (app) {
        app.status = newStatus;
        localStorage.setItem('adminApplicants', JSON.stringify(adminApplicants));
        showToast(`تم تحديث الحالة إلى "${newStatus}"`, 'success');
        closeModal('applicantDetailModal');
        loadApplicantsTable();
        loadDashboard();
    }
}

function updateApplicantStatus(appId) {
    const app = adminApplicants.find(a => a.id === appId);
    if (!app) return;
    
    const statuses = ['جديد', 'قيد المراجعة', 'مقبول', 'مرفوض'];
    const currentIndex = statuses.indexOf(app.status);
    const newStatus = statuses[(currentIndex + 1) % statuses.length];
    
    app.status = newStatus;
    localStorage.setItem('adminApplicants', JSON.stringify(adminApplicants));
    loadApplicantsTable();
    loadDashboard();
    showToast(`تم تغيير الحالة إلى "${newStatus}"`, 'success');
}

function deleteApplicant(appId) {
    if (confirm('هل أنت متأكد من حذف هذا المتقدم؟')) {
        adminApplicants = adminApplicants.filter(a => a.id !== appId);
        localStorage.setItem('adminApplicants', JSON.stringify(adminApplicants));
        loadApplicantsTable();
        loadDashboard();
        showToast('تم حذف المتقدم بنجاح', 'success');
    }
}

// ============================================
// COMPANIES MANAGEMENT
// ============================================
function loadCompaniesTable() {
    const tbody = document.getElementById('companiesTableBody');
    tbody.innerHTML = adminCompanies.map((company, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>
                <div style="width:40px;height:40px;background:var(--primary-light);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;color:var(--primary);">
                    ${company.logo}
                </div>
            </td>
            <td><strong>${company.name}</strong></td>
            <td>${company.industry}</td>
            <td>${company.city}</td>
            <td>${company.jobs}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-delete" onclick="deleteCompany(${company.id})" title="حذف">
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

function saveCompany(event) {
    event.preventDefault();
    
    const companyData = {
        id: Date.now(),
        name: document.getElementById('companyName').value,
        industry: document.getElementById('companyIndustry').value,
        city: document.getElementById('companyCity').value,
        logo: document.getElementById('companyLogo').value,
        jobs: 0
    };
    
    adminCompanies.push(companyData);
    localStorage.setItem('adminCompanies', JSON.stringify(adminCompanies));
    closeModal('companyModal');
    loadCompaniesTable();
    loadDashboard();
    showToast('تم إضافة الشركة بنجاح 🎉', 'success');
}

function deleteCompany(companyId) {
    if (confirm('هل أنت متأكد من حذف هذه الشركة؟')) {
        adminCompanies = adminCompanies.filter(c => c.id !== companyId);
        localStorage.setItem('adminCompanies', JSON.stringify(adminCompanies));
        loadCompaniesTable();
        loadDashboard();
        showToast('تم حذف الشركة بنجاح', 'success');
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
    
    // في الوضع الحقيقي، يتم تحديث كلمة المرور في Firebase
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
function initAdminDashboard() {
    checkAdminAuth();
    
    // تحميل الإعدادات المحفوظة
    const savedSettings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
    if (savedSettings.siteName) document.getElementById('siteName').value = savedSettings.siteName;
    if (savedSettings.siteEmail) document.getElementById('siteEmail').value = savedSettings.siteEmail;
    if (savedSettings.sitePhone) document.getElementById('sitePhone').value = savedSettings.sitePhone;
    if (savedSettings.siteAddress) document.getElementById('siteAddress').value = savedSettings.siteAddress;
    
    // تحميل الصفحة الافتراضية
    loadDashboard();
    
    // محاكاة إشعارات
    if (Math.random() > 0.5) {
        document.getElementById('notificationDot').classList.add('active');
    }
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
