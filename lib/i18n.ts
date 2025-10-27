export type Locale = "en" | "zh";

export const translations = {
  en: {
    // Navigation
    myTrips: "My Trips",
    planTrip: "Plan Trip",
    signOut: "Sign Out",
    you: "You",
    finance: "Finance",
    transactions: "Transactions",
    accounts: "Accounts",

    // Trip Creation
    newTrip: "New Trip",
    tripDetails: "Trip Details",
    budget: "Budget",
    allocate: "Allocate",
    destination: "Where are you going?",
    startingFrom: "Starting from?",
    startDate: "When?",
    duration: "Duration (days)",
    tripName: "Trip name",
    tripNameOptional: "Trip name (optional)",
    budgetOptions: "Choose Your Budget Level",
    comfortable: "Comfortable",
    balanced: "Balanced",
    luxury: "Luxury",
    perPersonPerDay: "per person/day",
    totalForPeople: "total for 2 people",
    budgetLevel: "Budget Level",
    quickPresets: "Quick Presets",
    customBudget: "Custom Budget",

    // Presets
    foodie: "Foodie",
    fineDining: "Fine Dining",
    resort: "Resort Vacation",
    workTrip: "Work Trip",
    adventure: "Adventure",
    sightseeing: "Sightseeing",

    // Expense
    addExpense: "Add Expense",
    amount: "Amount",
    category: "Category",
    date: "Date",
    expenseStartDate: "Start Date",
    expenseEndDate: "End Date",
    time: "Time",
    currency: "Currency",
    location: "Location",
    note: "Note",
    receipt: "Receipt",
    optional: "optional",
    saveExpense: "Save Expense",
    cancel: "Cancel",
    aiScan: "AI Scan",
    manual: "Manual",
    takePhoto: "Take Photo",
    choosePhoto: "Choose Photo",
    aiWillRead: "AI will automatically read your receipt",
    aiAmountCategory: "Amount, merchant, date, and category will be detected",
    scanningReceipt: "AI is scanning receipt...",
    scannedSuccess: "Receipt scanned successfully!",
    scanDifferent: "Scan Different Receipt",
    uploadingReceipt: "Uploading receipt...",

    // Categories
    accommodation: "Accommodation",
    foodDining: "Food & Dining",
    flights: "Flights",
    transportation: "Transportation",
    activities: "Activities",
    shopping: "Shopping",
    insuranceHealth: "Insurance & Health",
    communication: "Communication",
    feesTips: "Fees & Tips",
    other: "Other",

    // AI Insights
    aiExpenseInsights: "AI Expense Insights",
    analyzeSpending: "Analyze Spending",
    analyzing: "Analyzing...",
    clickAnalyzeSpending: "Click \"Analyze Spending\" to get AI-powered insights about your expenses.",
    quickSummary: "Quick Summary",
    dailyBudgetRemaining: "Daily Budget Remaining",
    daysRemaining: "Days Remaining",
    recentExpenses: "Recent Expenses",
    addedBy: "Added by",

    // Activity
    addActivity: "Add Activity",
    activityName: "Activity Name",
    saveActivity: "Save Activity",
    startTime: "Start Time",
    endTime: "End Time",
    estimatedCost: "Estimated Cost",
    description: "Description",
    notes: "Notes",
    itinerary: "Itinerary",
    aiGenerateItinerary: "AI Generate Itinerary",
    generating: "Generating...",
    noActivitiesYet: "No activities planned yet",
    generateOrAddManually: "Generate an AI itinerary or add activities manually",

    // Budget & Categories
    totalBudget: "Total Budget",
    totalSpent: "Total Spent",
    remaining: "Remaining",
    budgetByCategory: "Budget by Category",
    spendingDistribution: "Spending Distribution",
    budgetExpenses: "Budget & Expenses",
    noExpensesYet: "No expenses recorded yet",
    addFirstExpense: "Add your first expense to see the breakdown",
    used: "used",
    over: "over",
    nearLimit: "Near limit",
    percentOfBudget: "of budget used",

    // Trip Details
    shareTrip: "Share Trip",
    share: "Share",
    settings: "Settings",
    backToTrip: "Back to Trip",

    // Time
    days: "days",

    // Common
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    close: "Close",
    next: "Next",
    previous: "Previous",
    loading: "Loading...",
    saving: "Saving...",
    perNight: "per night",
    total: "total",

    // Dashboard
    planTrackManage: "Plan, track, and manage your adventures",
    noTripsYet: "No trips yet",
    startPlanningAdventure: "Start planning your next adventure with AI-powered itineraries and smart expense tracking",
    createFirstTrip: "Create your first trip",
  },
  zh: {
    // Navigation
    myTrips: "我的旅行",
    planTrip: "计划旅行",
    signOut: "退出登录",
    you: "您",
    finance: "财务",
    transactions: "交易记录",
    accounts: "账户",

    // Trip Creation
    newTrip: "新建旅行",
    tripDetails: "旅行详情",
    budget: "预算",
    allocate: "分配",
    destination: "目的地是哪里？",
    startingFrom: "从哪里出发？",
    startDate: "什么时候？",
    duration: "行程天数",
    tripName: "旅行名称",
    tripNameOptional: "旅行名称（可选）",
    budgetOptions: "选择您的预算级别",
    comfortable: "舒适",
    balanced: "平衡",
    luxury: "豪华",
    perPersonPerDay: "每人每天",
    totalForPeople: "两人总计",
    budgetLevel: "预算级别",
    quickPresets: "快速预设",
    customBudget: "自定义预算",

    // Presets
    foodie: "美食家",
    fineDining: "高级餐厅",
    resort: "度假胜地",
    workTrip: "商务出行",
    adventure: "探险",
    sightseeing: "观光",

    // Expense
    addExpense: "添加支出",
    amount: "金额",
    category: "类别",
    date: "日期",
    expenseStartDate: "开始日期",
    expenseEndDate: "结束日期",
    time: "时间",
    currency: "货币",
    location: "地点",
    note: "备注",
    receipt: "收据",
    optional: "可选",
    saveExpense: "保存支出",
    cancel: "取消",
    aiScan: "AI 扫描",
    manual: "手动输入",
    takePhoto: "拍照",
    choosePhoto: "选择照片",
    aiWillRead: "AI 将自动读取您的收据",
    aiAmountCategory: "金额、商家、日期和类别将被自动识别",
    scanningReceipt: "AI 正在扫描收据...",
    scannedSuccess: "收据扫描成功！",
    scanDifferent: "扫描其他收据",
    uploadingReceipt: "正在上传收据...",

    // Categories
    accommodation: "住宿",
    foodDining: "餐饮",
    flights: "机票",
    transportation: "交通",
    activities: "活动",
    shopping: "购物",
    insuranceHealth: "保险与医疗",
    communication: "通讯",
    feesTips: "费用与小费",
    other: "其他",

    // AI Insights
    aiExpenseInsights: "AI 支出分析",
    analyzeSpending: "分析支出",
    analyzing: "分析中...",
    clickAnalyzeSpending: "点击「分析支出」获取 AI 驱动的支出洞察。",
    recentExpenses: "最近支出",
    addedBy: "添加者",
    quickSummary: "快速摘要",
    dailyBudgetRemaining: "每日剩余预算",
    daysRemaining: "剩余天数",

    // Activity
    addActivity: "添加活动",
    activityName: "活动名称",
    saveActivity: "保存活动",
    startTime: "开始时间",
    endTime: "结束时间",
    estimatedCost: "预估费用",
    description: "描述",
    notes: "备注",
    itinerary: "行程",
    aiGenerateItinerary: "AI 生成行程",
    generating: "生成中...",
    noActivitiesYet: "暂无活动安排",
    generateOrAddManually: "生成 AI 行程或手动添加活动",

    // Budget & Categories
    totalBudget: "总预算",
    totalSpent: "总支出",
    remaining: "剩余",
    budgetByCategory: "分类预算",
    spendingDistribution: "支出分布",
    budgetExpenses: "预算与支出",
    noExpensesYet: "暂无支出记录",
    addFirstExpense: "添加您的第一笔支出以查看明细",
    used: "已使用",
    over: "超支",
    nearLimit: "接近上限",
    percentOfBudget: "预算使用率",

    // Trip Details
    shareTrip: "分享行程",
    share: "分享",
    settings: "设置",
    backToTrip: "返回行程",

    // Time
    days: "天",

    // Common
    save: "保存",
    edit: "编辑",
    delete: "删除",
    close: "关闭",
    next: "下一步",
    previous: "上一步",
    loading: "加载中...",
    saving: "保存中...",
    perNight: "每晚",
    total: "总计",

    // Dashboard
    planTrackManage: "计划、追踪和管理您的旅程",
    noTripsYet: "还没有旅行",
    startPlanningAdventure: "开始计划您的下一次冒险，体验 AI 行程规划和智能支出追踪",
    createFirstTrip: "创建您的第一个旅行",
  },
};

export function getTranslations(locale: Locale) {
  return translations[locale];
}

// Helper function to translate category names
export function translateCategory(category: string, locale: Locale): string {
  const t = translations[locale];
  const categoryMap: Record<string, string> = {
    "Accommodation": t.accommodation,
    "Food & Dining": t.foodDining,
    "Flights": t.flights,
    "Transportation": t.transportation,
    "Activities": t.activities,
    "Shopping": t.shopping,
    "Insurance & Health": t.insuranceHealth,
    "Communication": t.communication,
    "Fees & Tips": t.feesTips,
    "Other": t.other,
  };
  return categoryMap[category] || category;
}
