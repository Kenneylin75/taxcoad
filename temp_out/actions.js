"use server";
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentRole = getCurrentRole;
exports.getCurrentUser = getCurrentUser;
exports.fetchDistributorProfile = fetchDistributorProfile;
exports.fetchDistributorTeam = fetchDistributorTeam;
exports.addSalesMember = addSalesMember;
exports.fetchFreeApplications = fetchFreeApplications;
exports.approveTempleByDistributor = approveTempleByDistributor;
exports.rejectTempleByDistributor = rejectTempleByDistributor;
exports.submitFreeAccountApplication = submitFreeAccountApplication;
exports.fetchTeamVisitations = fetchTeamVisitations;
exports.fetchDistributorCapacity = fetchDistributorCapacity;
exports.fetchDistributorCommissionSummary = fetchDistributorCommissionSummary;
exports.fetchRentPlans = fetchRentPlans;
exports.updateSalesCommission = updateSalesCommission;
exports.fetchSalesTools = fetchSalesTools;
exports.fetchEContracts = fetchEContracts;
exports.submitEContract = submitEContract;
exports.fetchSalesProfile = fetchSalesProfile;
exports.fetchCommissionHistory = fetchCommissionHistory;
exports.fetchSalesPerformance = fetchSalesPerformance;
exports.fetchServiceDefinitions = fetchServiceDefinitions;
exports.fetchLampCategories = fetchLampCategories;
exports.fetchLampRecords = fetchLampRecords;
exports.fetchGuestFiles = fetchGuestFiles;
exports.fetchVisitationRecords = fetchVisitationRecords;
exports.addVisitationRecord = addVisitationRecord;
// --- Mock Data ---
var mockFreeApplications = [
    {
        id: 'app-001',
        templeName: '大甲鎮瀾宮 (模擬測試)',
        submittedBy: '王業務',
        submittedRole: 'DistSales',
        timestamp: '2026-04-29 10:00',
        status: 'Pending',
        monthlyRent: 3600,
        setupFee: 12000,
        freeMonths: 2,
        city: "台中市",
        district: "大甲區",
        chairpersonName: "顏清標",
        currentUsers: 82
    }
];
var mockVisitationRecords = [
    { id: 'v1', salesName: '王業務', templeName: '大甲鎮瀾宮', date: '2026-05-05', visitIndex: 1, notes: '初次拜訪，說明方案', status: 'Completed', importance: 'High' },
    { id: 'v2', salesName: '王業務', templeName: '北港朝天宮', date: '2026-05-05', visitIndex: 2, notes: '追蹤合約簽署進度', status: 'Planned', importance: 'Medium' }
];
var mockDistributorTeam = [
    { id: 'sales-001', name: '王業務', account: 'wang_sales01', usedQuota: 35, commissionRate: 0.15, totalSales: 420000 },
    { id: 'sales-002', name: '李業務', account: 'lee_sales02', usedQuota: 12, commissionRate: 0.12, totalSales: 150000 }
];
var mockDistProfile = {
    id: 'dist-1',
    name: '誠信經銷有限公司',
    account: 'dist_admin_01',
    password: 'password123',
    planId: 'p-160',
    planName: '160萬 / 2年 / 100帳戶',
    totalQuota: 100,
    usedQuota: 35,
    startDate: '2026-01-01',
    expiryDate: '2027-12-31',
    linkedSuperSales: '陳超業',
    linkedSuperAdmin: '超級管理員',
    phone: '02-2345-6789',
    address: '台北市信義區忠孝東路五段100號'
};
// --- Actions ---
function getCurrentRole() {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, 'SuperAdmin'];
    }); });
}
function getCurrentUser() {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, { id: 1, name: '超級管理員', appRole: 'SuperAdmin' }];
    }); });
}
function fetchDistributorProfile() {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, mockDistProfile];
    }); });
}
function fetchDistributorTeam() {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, mockDistributorTeam];
    }); });
}
function addSalesMember(data) {
    return __awaiter(this, void 0, void 0, function () {
        var newMember;
        return __generator(this, function (_a) {
            newMember = __assign(__assign({ id: 'sales-' + Date.now() }, data), { usedQuota: 0, totalSales: 0, joinedAt: new Date().toISOString().split('T')[0] });
            mockDistributorTeam.push(newMember);
            return [2 /*return*/, { success: true }];
        });
    });
}
function fetchFreeApplications() {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, mockFreeApplications];
    }); });
}
function approveTempleByDistributor(applicationId) {
    return __awaiter(this, void 0, void 0, function () {
        var app;
        return __generator(this, function (_a) {
            app = mockFreeApplications.find(function (a) { return a.id === applicationId; });
            if (app) {
                app.status = 'Approved';
                return [2 /*return*/, { success: true }];
            }
            return [2 /*return*/, { success: false }];
        });
    });
}
function rejectTempleByDistributor(applicationId, reason) {
    return __awaiter(this, void 0, void 0, function () {
        var app;
        return __generator(this, function (_a) {
            app = mockFreeApplications.find(function (a) { return a.id === applicationId; });
            if (app) {
                app.status = 'Rejected';
                app.rejectionReason = reason;
                return [2 /*return*/, { success: true }];
            }
            return [2 /*return*/, { success: false }];
        });
    });
}
function submitFreeAccountApplication(data) {
    return __awaiter(this, void 0, void 0, function () {
        var newApp;
        return __generator(this, function (_a) {
            newApp = __assign({ id: 'app-' + Date.now(), templeName: data.templeName || '', submittedBy: data.submittedBy || '經銷商自建', submittedRole: data.submittedRole || 'Distributor', timestamp: new Date().toLocaleString('zh-TW', { hour12: false }), status: 'Pending', monthlyRent: data.monthlyRent || 3600, setupFee: data.setupFee || 12000, freeMonths: data.freeMonths || 1 }, data);
            mockFreeApplications.push(newApp);
            return [2 /*return*/, { success: true, id: newApp.id }];
        });
    });
}
function fetchTeamVisitations() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, mockVisitationRecords.sort(function (a, b) { return b.date.localeCompare(a.date); })];
        });
    });
}
function fetchDistributorCapacity() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, { total: 100, used: 35, plan: "160萬 / 2年 / 100帳戶" }];
        });
    });
}
function fetchDistributorCommissionSummary(year, month) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, {
                    totalRevenue: 850000,
                    teamCommission: 127500,
                    netProfit: 722500,
                    monthlyGrowth: 15,
                    records: [
                        { id: 'r1', salesName: '王業務', amount: 42000, date: '2026-05-01', type: 'Setup' },
                        { id: 'r2', salesName: '李業務', amount: 15000, date: '2026-05-02', type: 'Monthly' }
                    ]
                }];
        });
    });
}
function fetchRentPlans() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, [{ id: 'p1', name: '標準方案', fee: 3600 }]];
        });
    });
}
function updateSalesCommission(id, rate) {
    return __awaiter(this, void 0, void 0, function () {
        var member;
        return __generator(this, function (_a) {
            member = mockDistributorTeam.find(function (m) { return m.id === id; });
            if (member) {
                member.commissionRate = rate;
                return [2 /*return*/, { success: true }];
            }
            return [2 /*return*/, { success: false }];
        });
    });
}
// Stubs for stability
function fetchSalesTools() {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, []];
    }); });
}
function fetchEContracts(name) {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, []];
    }); });
}
function submitEContract(c) {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, { success: true }];
    }); });
}
function fetchSalesProfile(name) {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, null];
    }); });
}
function fetchCommissionHistory(name) {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, { records: [], totalEarned: 0, totalWithdrawn: 0, balance: 0 }];
    }); });
}
function fetchSalesPerformance(name) {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, { total: 0, approved: 0, pending: 0 }];
    }); });
}
function fetchServiceDefinitions() {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, []];
    }); });
}
function fetchLampCategories() {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, []];
    }); });
}
function fetchLampRecords(p) {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, []];
    }); });
}
function fetchGuestFiles(p) {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, []];
    }); });
}
function fetchVisitationRecords(n) {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, []];
    }); });
}
function addVisitationRecord(r) {
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, { success: true }];
    }); });
}
