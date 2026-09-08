'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── Translation dictionary ────────────────────────────────────────────────────
// UI labels only. Dish names, class-group names (Cambridge/Homeschool/Plus) and
// other data in lib/*.js are intentionally left untranslated (proper nouns).

const STRINGS = {
  en: {
    // Common
    'common.back': 'Back',
    'common.admin': 'Admin',
    'common.signIn': 'Sign In',
    'common.signingIn': 'Signing in…',
    'common.signOut': 'Sign Out',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.done': 'Done',
    'common.close': 'Close',
    'common.clear': 'Clear',
    'common.remove': 'Remove',
    'common.saved': 'Saved',
    'common.password': 'Password',
    'common.all': 'All',
    'common.monthLabel': 'September 2026',

    // Weekday short (calendar headers)
    'wd.Mon': 'Mon', 'wd.Tue': 'Tue', 'wd.Wed': 'Wed', 'wd.Thu': 'Thu',
    'wd.Fri': 'Fri', 'wd.Sat': 'Sat', 'wd.Sun': 'Sun',

    // Meals
    'meal.breakfast': 'Breakfast',
    'meal.lunch': 'Lunch',
    'meal.brunch': 'Brunch',
    'meal.breakfastOptional': 'Breakfast (optional)',
    'meal.lunchOptional': 'Lunch (optional)',

    // Home
    'home.portal': 'Meal Plan Portal',
    'home.selectRole': 'Select your role to continue',
    'home.parent': "I'm a Parent",
    'home.admin': "I'm an Admin",
    'home.vendor': "I'm a Vendor",

    // Logins
    'adminLogin.portal': 'Admin Portal',
    'adminLogin.placeholder': 'Enter admin password',
    'login.incorrect': 'Incorrect password.',
    'vendorLogin.portal': 'Vendor Portal',
    'vendorLogin.placeholder': 'Enter vendor password',
    'login.incorrectVendor': 'Incorrect password. Try: vendor123',

    // Parent overview
    'parent.title': 'My Meal Orders',
    'parent.subtitle': 'Manage meal orders for your children',
    'parent.orderFor': 'Order for',
    'parent.notSubmitted': 'Meal plan not yet submitted for next month',
    'parent.placeOrder': 'Place Order',
    'parent.history': 'Order History',
    'parent.myOrders': 'Your Orders',
    'parent.monthTotal': '{month} total:',
    'parent.total': 'Total',
    'parent.viewDays': 'View {n} days',
    'parent.hideDays': 'Hide details',
    'parent.alreadyOrdered': 'Order placed — you can still change it',
    'parent.changeOrder': 'Change Order',
    'parent.editableDays': '{n} of {total} days can still be changed',
    'parent.allClosed': 'All dates closed',
    'parent.pastMonth': 'Past',
    'parent.dayOpen': 'can change',
    'parent.change': 'Change',
    'parent.dayTotal': 'This day',
    'parent.dayClosed': 'closed',

    // Admin orders
    'adminOrders.title': 'Parent Orders',
    'adminOrders.subtitle': 'Review submitted orders and cancel on request',
    'adminOrders.count': '{n} orders submitted',
    'adminOrders.totalValue': 'Total value:',
    'adminOrders.cancel': 'Cancel order',
    'adminOrders.confirmBody': 'Cancel {name}\u2019s order for {month}?',
    'adminOrders.confirmHint': 'The meals are removed from the vendor list too. This cannot be undone.',
    'adminOrders.confirmYes': 'Yes, cancel it',
    'adminOrders.cancelled': 'Cancelled {name}\u2019s order ({n} days removed).',
    'adminOrders.empty': 'No parent orders yet',
    'adminOrders.emptyHint': 'Orders placed in the parent portal appear here.',

    // Billing
    'billing.adminTitle': 'Monthly Bill',
    'billing.adminSubtitle': 'What to charge parents this month',
    'billing.vendorTitle': 'Monthly Invoice',
    'billing.vendorSubtitle': 'What to charge the school this month',
    'billing.toChargeParents': 'To charge parents',
    'billing.toChargeSchool': 'To charge the school',
    'billing.acrossStudents': '{n} students · {days} ordered days',
    'billing.mealsOverDays': '{meals} meals over {days} serving days',
    'billing.vendorCost': 'Vendor cost',
    'billing.owedToVendor': 'owed to the kitchen',
    'billing.margin': 'School margin',
    'billing.byGroup': 'By class group',
    'billing.byStudent': 'By student',
    'billing.byDate': 'By date',
    'billing.kitchenSplit': 'Meals by type',
    'billing.pickedDishes': 'Picked dishes',
    'billing.days': 'Days',
    'billing.date': 'Date',
    'billing.students': 'Students',
    'billing.meals': 'Meals',
    'billing.amount': 'Amount',
    'billing.total': 'Total',
    'billing.dayCount': '{n} days',
    'billing.viaPortal': 'portal',
    'billing.loading': 'Working out the bill…',
    'billing.noOrders': 'No orders for this month yet.',
    'billing.backToOrders': 'Orders',
    'billing.adminNote': 'Totals cover every order in the month, including those still open to change. Figures move if a parent edits an order before its cut-off.',
    'billing.vendorNote': 'Priced at vendor cost. A Chef\u2019s Choice pair is billed as one bundled day, not two meals.',
    'billing.adminCardTitle': 'Monthly Bill',
    'billing.adminCardDesc': 'Totals to charge parents, by student and class',
    'parent.noOrders': 'No orders yet',
    'parent.placeFirst': 'Place your first order above',
    'parent.locked': 'Locked',
    'parent.schoolDays': '{n} school days',
    'parent.lockedSince': 'Locked since {date}',
    'parent.editBy': 'Edit by {date}',
    'status.pending': 'Pending',
    'status.confirmed': 'Confirmed',
    'status.delivered': 'Delivered',

    // Admin dashboard
    'adminDash.title': 'Admin Panel',
    'adminDash.subtitle': 'Manage the school meal plan system.',
    'adminDash.menuTitle': 'Manage Menu',
    'adminDash.menuDesc': 'Add, edit, or remove meal items and prices',
    'adminDash.pricesTitle': 'Price List',
    'adminDash.pricesDesc': 'Set vendor cost and parent price, manage markup',
    'adminDash.ordersTitle': 'View Orders',
    'adminDash.ordersDesc': 'See all orders from parents',

    // Admin menu
    'adminMenu.title': 'Manage Menu',
    'adminMenu.subtitle': 'Set meals and prices per date · September 2026',
    'adminMenu.selectPrompt': 'September 2026 — select a date to edit its menu',
    'adminMenu.selectSchoolDay': 'Select a school day above',
    'adminMenu.thenEdit': 'Then add or edit the menu items for that date',
    'adminMenu.brunchOnly': 'Brunch Only',
    'adminMenu.items': '{n} items',
    'adminMenu.itemName': 'Item name',
    'adminMenu.priceRM': 'Price (RM)',
    'adminMenu.description': 'Description',
    'adminMenu.briefDesc': 'Brief description',
    'adminMenu.noItems': 'No items yet.',
    'adminMenu.newItem': 'New Item',
    'adminMenu.descDefault': 'Description',
    'legend.monThu': 'Mon–Thu',
    'legend.friBrunch': 'Friday (Brunch)',

    // Admin prices
    'adminPrices.title': 'Price List',
    'adminPrices.subtitle': 'Vendor cost vs parent price · manage markup',
    'prices.totalVendorCost': 'Total Vendor Cost',
    'prices.sumCost': 'sum of cost prices',
    'prices.missingCosts': 'no cost on file for {n} items',
    'prices.noCostList': 'awaiting vendor cost list',
    'prices.totalParentPrice': 'Total Parent Price',
    'prices.sumParent': 'sum of parent prices',
    'prices.totalMarkup': 'Total Markup',
    'prices.avgMargin': 'avg {x}% margin',
    'prices.tabMenu': 'À La Carte Menu',
    'prices.tabChefs': "Chef's Choice Plans",
    'prices.clickEdit': 'Click {edit} on any row to update prices.',
    'prices.markupOver25': '>25% markup',
    'prices.markup10to25': '10–25%',
    'prices.markupUnder10': '<10%',
    'prices.colPlan': 'Plan',
    'prices.colVendorCost': 'Vendor Cost',
    'prices.colParentPrice': 'Parent Price',
    'prices.colMarkup': 'Markup',
    'prices.colItem': 'Item',
    'prices.avgMarkup': 'Avg markup:',

    // Admin holidays
    'adminHol.title': 'Set Holidays',
    'adminHol.subtitle': 'Manage blocked dates per class group · September 2026',
    'adminHol.blocked': '{n} blocked',
    'adminHol.infoBanner': 'Pre-filled from the school academic calendar. Click a school day to add or remove a blocked date. Changes apply to {group} only.',
    'adminHol.calTitle': 'September 2026 · {group}',
    'adminHol.blockFor': 'Block {date} for {group}',
    'adminHol.publicHoliday': 'Public Holiday',
    'adminHol.termBreak': 'Term Break',
    'adminHol.holidayName': 'Holiday name',
    'adminHol.phBreak': 'e.g. Term Break',
    'adminHol.phHoliday': 'e.g. Hari Raya, Sports Day...',
    'adminHol.blockThisDay': 'Block this day',
    'adminHol.blockedDays': '{group} — Blocked Days',
    'adminHol.days': '{n} days',
    'adminHol.day': '{n} day',
    'adminHol.noBlocked': 'No blocked days. Click a date on the calendar above.',
    'adminHol.sep': 'Sep',
    'adminHol.defaultName': 'School Holiday',
    'adminHol.dateLine': '{date} · {type}',
    'legend.termBreak': 'Term break',
    'legend.publicHoliday': 'Public holiday',
    'legend.clickToToggle': 'Click any school day to add or remove',
    'holiday.break': 'Break',

    // Vendor dashboard
    'vendor.hasOrders': 'Has orders',
    'vendor.pastCutoff': '🔒 Past cutoff (7-day lock)',
    'vendor.selectDate': 'Select a date',
    'vendor.clickDay': 'Click any school day on the calendar to view orders',
    'vendor.print': 'Print {day}',
    'vendor.orderLockedTitle': 'Order locked',
    'vendor.orderLockedBody': '— cutoff passed 7 days before this date. Only admin can modify orders.',
    'vendor.orders': '{n} orders',
    'vendor.fromParents': '{n} from parents',
    'vendor.colName': 'Name',
    'vendor.colClass': 'Class',
    'vendor.colMeal': 'Meal',
    'vendor.noOrders': 'No {meal} orders',

    // Parent order
    'order.title': 'Place Order',
    'order.titleEdit': 'Change Order',
    'order.editingNote': 'Your placed order is loaded below. Closed dates cannot be changed.',
    'order.subtitle': "September 2026 · Chef's Choice or pick per date",
    'order.topHint': "Chef's Choice means the kitchen decides daily. Pick per date for full control.",
    'order.ready': 'Ready · {total}',
    'order.selectClassGroup': 'Select class group',
    'order.pickDates': 'Pick dates',
    'order.pickAtLeastOne': 'Pick at least one date',
    'order.submitted': 'Order Submitted!',
    'order.total': 'Total: {total}',
    'order.backToOrders': 'Back to My Orders',
    'order.classGroup': 'Holiday',
    'order.daysAvailable': '{n} school days · {m} {friLabel} available in September 2026',
    'order.friday': 'Friday',
    'order.fridays': 'Fridays',
    'order.selectClassPrompt': "Select your child's class group above to continue.",
    'order.classLabel': 'Class',
    'order.selectClass': 'Select class',
    'order.selectClassPromptDiv': 'Pick the class within Cambridge to continue.',
    'order.cutoffNote': 'Dates close at 10pm, {days} days before the meal. Closed dates are greyed out and can only be changed by the school office.',
    'order.dateClosedTitle': 'Closed — ordering ended {when}',
    'order.allergies': 'Food Allergies & Preferences',
    'order.otherNotes': 'Other notes',
    'order.otherNotesPh': 'e.g. No beef',
    'order.pickPerDate': 'Pick per date · September 2026',
    'order.daysSelected': '{n} days selected',
    'order.blockedDates': 'Blocked Dates',
    'order.tapHint': "Tap any date to choose Chef's Choice or pick the menu yourself. Holidays are tappable too.",
    'order.brunchOnly': 'Brunch only',
    'order.friCustomDisabled': "Fridays (brunch) aren't available with the I'll choose plan.",
    'order.schoolHoliday': '{name} — school holiday',
    'order.noClasses': 'No classes this day. You can still order if your child will be in.',
    'order.chefsChoice': "Chef's Choice",
    'order.kitchenDecides': 'Kitchen decides · {price}',
    'order.illChoose': "I'll Choose",
    'order.pickMenu': 'Pick the menu',
    'order.chooseHow': "Choose how you'd like to order {day}.",
    'order.chefsSet': "Chef's Choice set. Our kitchen prepares {meals} for this day — {price}.",
    'order.combo': '✓ Combo — RM 1.00 discount applied',
    'order.grandTotal': 'Grand Total',
    'order.confirmOrder': 'Confirm Order',
    'order.holidayTapTitle': '{name} — holiday, tap to order anyway',
    'order.mealsBrunch': 'brunch',
    'order.mealsBfLn': 'breakfast & lunch',
    // Chef's Choice meal sub-pick
    'order.chefWhichMeals': 'Which meals should the kitchen prepare?',
    'order.both': 'Both',
    // Per-meal chef/custom mixing (date popup)
    'order.chefBothName': "Chef's Choice — Both Meals",
    'order.chefBothDesc': 'Kitchen prepares breakfast & lunch · {price}',
    'order.chefBothLocked': "Both meals set to Chef's Choice. Turn off to customize each meal.",
    'order.friBrunchLocked': "Friday brunch is included as Chef's Choice with this plan.",
    'order.orPerMeal': 'Or choose for each meal',
    // Monthly Chef's Set (whole-month promo)
    'order.monthlyName': "Chef's Choice Meal Set",
    'order.monthlyPromo': 'Promo',
    'order.monthlyDesc': "Both meals, Chef's Choice — every school day",
    'order.monthlyPerMonth': '{price} / month',
    'order.mealSetPerDay': '{rate}/day × {n} days',
    'order.monthlyCovers': 'Covers all {n} school days · Fridays as brunch',
    'order.monthlyActive': "Meal Set active — every school day is Chef's Choice. Edit any day to switch to per-day pricing.",
    'order.monthlyHint': "One promo price for the whole month — all meals Chef's Choice, holidays excluded.",
    // Single-meal whole-month sets
    'order.orSingleMeal': 'Or just one meal — whole month',
    'order.bfSetSub': 'Breakfast (Mon–Thu) + Friday brunch',
    'order.lnSetSub': 'Lunch (Mon–Thu) + Friday brunch',
    'order.perDay': '{rate}/day',
    'order.perMonth': '{total}/mth',
    // Meal-plan radio list
    'order.choosePlan': 'Meal Plan',
    'order.planBothNote': 'Breakfast, Lunch & Friday Brunch',
    'order.planBfNote': 'Breakfast (Mon–Fri) · Friday = brunch',
    'order.planLnNote': 'Lunch (Mon–Fri) · Friday = brunch',
    'order.planCustomNote': 'Pick per date',
    'order.selectPlanPrompt': 'Select a plan above to see the calendar.',
  },

  zh: {
    // Common
    'common.back': '返回',
    'common.admin': '管理',
    'common.signIn': '登录',
    'common.signingIn': '正在登录…',
    'common.signOut': '退出',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.add': '添加',
    'common.done': '完成',
    'common.close': '关闭',
    'common.clear': '清除',
    'common.remove': '移除',
    'common.saved': '已保存',
    'common.password': '密码',
    'common.all': '全部',
    'common.monthLabel': '2026年9月',

    'wd.Mon': '周一', 'wd.Tue': '周二', 'wd.Wed': '周三', 'wd.Thu': '周四',
    'wd.Fri': '周五', 'wd.Sat': '周六', 'wd.Sun': '周日',

    'meal.breakfast': '早餐',
    'meal.lunch': '午餐',
    'meal.brunch': '早午餐',
    'meal.breakfastOptional': '早餐（可选）',
    'meal.lunchOptional': '午餐（可选）',

    'home.portal': '餐饮计划门户',
    'home.selectRole': '选择您的身份以继续',
    'home.parent': '我是家长',
    'home.admin': '我是管理员',
    'home.vendor': '我是供应商',

    'adminLogin.portal': '管理门户',
    'adminLogin.placeholder': '输入管理员密码',
    'login.incorrect': '密码错误。',
    'vendorLogin.portal': '供应商门户',
    'vendorLogin.placeholder': '输入供应商密码',
    'login.incorrectVendor': '密码错误。请尝试：vendor123',

    'parent.title': '我的餐饮订单',
    'parent.subtitle': '管理孩子的餐饮订单',
    'parent.orderFor': '订餐月份',
    'parent.notSubmitted': '下个月的餐饮计划尚未提交',
    'parent.placeOrder': '下单',
    'parent.history': '订单记录',
    'parent.myOrders': '您的订单',
    'parent.monthTotal': '{month} 合计：',
    'parent.total': '合计',
    'parent.viewDays': '查看 {n} 天',
    'parent.hideDays': '收起明细',
    'parent.alreadyOrdered': '已下单 — 仍可修改',
    'parent.changeOrder': '修改订单',
    'parent.editableDays': '{total} 天中有 {n} 天仍可修改',
    'parent.allClosed': '所有日期已截止',
    'parent.pastMonth': '往期',
    'parent.dayOpen': '可修改',
    'parent.change': '修改',
    'parent.dayTotal': '当日合计',
    'parent.dayClosed': '已截止',

    // Admin orders
    'adminOrders.title': '家长订单',
    'adminOrders.subtitle': '查看已提交的订单，并可应要求取消',
    'adminOrders.count': '已提交 {n} 份订单',
    'adminOrders.totalValue': '总金额：',
    'adminOrders.cancel': '取消订单',
    'adminOrders.confirmBody': '确定取消 {name} 的 {month} 订单？',
    'adminOrders.confirmHint': '相关餐点也会从供应商列表中移除，且无法撤销。',
    'adminOrders.confirmYes': '确定取消',
    'adminOrders.cancelled': '已取消 {name} 的订单（移除 {n} 天）。',
    'adminOrders.empty': '暂无家长订单',
    'adminOrders.emptyHint': '家长端提交的订单会显示在这里。',

    // Billing
    'billing.adminTitle': '月度账单',
    'billing.adminSubtitle': '本月应向家长收取的金额',
    'billing.vendorTitle': '月度发票',
    'billing.vendorSubtitle': '本月应向学校收取的金额',
    'billing.toChargeParents': '应向家长收取',
    'billing.toChargeSchool': '应向学校收取',
    'billing.acrossStudents': '{n} 名学生 · {days} 个订餐日',
    'billing.mealsOverDays': '{days} 个供餐日共 {meals} 份餐',
    'billing.vendorCost': '供应商成本',
    'billing.owedToVendor': '应付厨房',
    'billing.margin': '学校毛利',
    'billing.byGroup': '按班级组',
    'billing.byStudent': '按学生',
    'billing.byDate': '按日期',
    'billing.kitchenSplit': '各类餐点数量',
    'billing.pickedDishes': '自选菜式',
    'billing.days': '天数',
    'billing.date': '日期',
    'billing.students': '学生',
    'billing.meals': '餐数',
    'billing.amount': '金额',
    'billing.total': '合计',
    'billing.dayCount': '{n} 天',
    'billing.viaPortal': '家长端',
    'billing.loading': '正在计算账单…',
    'billing.noOrders': '本月暂无订单。',
    'billing.backToOrders': '订单',
    'billing.adminNote': '合计包含本月所有订单，含尚可修改的日期。家长在截止前修改订单，金额会随之变动。',
    'billing.vendorNote': '按供应商成本计算。主厨精选双餐按一个套餐日计费，而非两份餐。',
    'billing.adminCardTitle': '月度账单',
    'billing.adminCardDesc': '按学生和班级统计的家长应收金额',
    'parent.noOrders': '暂无订单',
    'parent.placeFirst': '在上方下第一个订单',
    'parent.locked': '已锁定',
    'parent.schoolDays': '{n} 个上课日',
    'parent.lockedSince': '自 {date} 起锁定',
    'parent.editBy': '截止 {date} 前可修改',
    'status.pending': '待处理',
    'status.confirmed': '已确认',
    'status.delivered': '已送达',

    'adminDash.title': '管理面板',
    'adminDash.subtitle': '管理学校餐饮计划系统。',
    'adminDash.menuTitle': '菜单管理',
    'adminDash.menuDesc': '添加、编辑或删除餐品及价格',
    'adminDash.pricesTitle': '价格表',
    'adminDash.pricesDesc': '设置供应商成本与家长价格，管理加价',
    'adminDash.ordersTitle': '查看订单',
    'adminDash.ordersDesc': '查看所有家长订单',

    'adminMenu.title': '菜单管理',
    'adminMenu.subtitle': '按日期设置餐品与价格 · 2026年9月',
    'adminMenu.selectPrompt': '2026年9月 — 选择日期以编辑菜单',
    'adminMenu.selectSchoolDay': '请选择上方的上课日',
    'adminMenu.thenEdit': '然后为该日期添加或编辑菜单项',
    'adminMenu.brunchOnly': '仅早午餐',
    'adminMenu.items': '{n} 项',
    'adminMenu.itemName': '餐品名称',
    'adminMenu.priceRM': '价格（RM）',
    'adminMenu.description': '描述',
    'adminMenu.briefDesc': '简短描述',
    'adminMenu.noItems': '暂无餐品。',
    'adminMenu.newItem': '新餐品',
    'adminMenu.descDefault': '描述',
    'legend.monThu': '周一至周四',
    'legend.friBrunch': '周五（早午餐）',

    'adminPrices.title': '价格表',
    'adminPrices.subtitle': '供应商成本 vs 家长价格 · 管理加价',
    'prices.totalVendorCost': '供应商总成本',
    'prices.sumCost': '成本价合计',
    'prices.missingCosts': '{n} 项没有成本记录',
    'prices.noCostList': '等待供应商成本清单',
    'prices.totalParentPrice': '家长总价',
    'prices.sumParent': '家长价合计',
    'prices.totalMarkup': '总加价',
    'prices.avgMargin': '平均 {x}% 利润',
    'prices.tabMenu': '单点菜单',
    'prices.tabChefs': '主厨精选套餐',
    'prices.clickEdit': '点击任意行的{edit}以更新价格。',
    'prices.markupOver25': '>25% 加价',
    'prices.markup10to25': '10–25%',
    'prices.markupUnder10': '<10%',
    'prices.colPlan': '套餐',
    'prices.colVendorCost': '供应商成本',
    'prices.colParentPrice': '家长价格',
    'prices.colMarkup': '加价',
    'prices.colItem': '餐品',
    'prices.avgMarkup': '平均加价：',

    'adminHol.title': '设置假期',
    'adminHol.subtitle': '按班级组管理停课日期 · 2026年9月',
    'adminHol.blocked': '{n} 个停课',
    'adminHol.infoBanner': '已根据学校校历预填。点击上课日以添加或移除停课日期。更改仅适用于 {group}。',
    'adminHol.calTitle': '2026年9月 · {group}',
    'adminHol.blockFor': '为 {group} 停课 {date}',
    'adminHol.publicHoliday': '公共假期',
    'adminHol.termBreak': '学期休假',
    'adminHol.holidayName': '假期名称',
    'adminHol.phBreak': '例如：学期休假',
    'adminHol.phHoliday': '例如：开斋节、运动会……',
    'adminHol.blockThisDay': '停课此日',
    'adminHol.blockedDays': '{group} — 停课日',
    'adminHol.days': '{n} 天',
    'adminHol.day': '{n} 天',
    'adminHol.noBlocked': '暂无停课日。点击上方日历中的日期。',
    'adminHol.sep': '9月',
    'adminHol.defaultName': '学校假期',
    'adminHol.dateLine': '{date} · {type}',
    'legend.termBreak': '学期休假',
    'legend.publicHoliday': '公共假期',
    'legend.clickToToggle': '点击任意上课日以添加或移除',
    'holiday.break': '休假',

    'vendor.hasOrders': '有订单',
    'vendor.pastCutoff': '🔒 已过截止（提前7天锁定）',
    'vendor.selectDate': '选择日期',
    'vendor.clickDay': '点击日历上的任意上课日以查看订单',
    'vendor.print': '打印 {day}',
    'vendor.orderLockedTitle': '订单已锁定',
    'vendor.orderLockedBody': ' — 已过该日期前7天的截止时间。仅管理员可修改订单。',
    'vendor.orders': '{n} 份订单',
    'vendor.fromParents': '{n} 来自家长',
    'vendor.colName': '姓名',
    'vendor.colClass': '班级',
    'vendor.colMeal': '餐品',
    'vendor.noOrders': '暂无{meal}订单',

    'order.title': '下单',
    'order.titleEdit': '修改订单',
    'order.editingNote': '已载入您提交的订单。已截止的日期无法修改。',
    'order.subtitle': '2026年9月 · 主厨精选或按日期选择',
    'order.topHint': '主厨精选由厨房每日决定。按日期选择可完全自主控制。',
    'order.ready': '已就绪 · {total}',
    'order.selectClassGroup': '选择班级组',
    'order.pickDates': '选择日期',
    'order.pickAtLeastOne': '请至少选择一个日期',
    'order.submitted': '订单已提交！',
    'order.total': '合计：{total}',
    'order.backToOrders': '返回我的订单',
    'order.classGroup': '假期',
    'order.daysAvailable': '{n} 个上课日 · {m} 个{friLabel}可订（2026年9月）',
    'order.friday': '周五',
    'order.fridays': '周五',
    'order.selectClassPrompt': '请先选择上方孩子的班级组以继续。',
    'order.classLabel': '班级',
    'order.selectClass': '请选择班级',
    'order.selectClassPromptDiv': '请选择剑桥部内的班级以继续。',
    'order.cutoffNote': '每个用餐日期于该日期前 {days} 天晚上 10 点截止。已截止的日期显示为灰色，只能由学校办公室修改。',
    'order.dateClosedTitle': '已截止 — 订餐于 {when} 结束',
    'order.allergies': '食物过敏与偏好',
    'order.otherNotes': '其他备注',
    'order.otherNotesPh': '例如：不吃牛肉',
    'order.pickPerDate': '按日期选择 · 2026年9月',
    'order.daysSelected': '已选 {n} 天',
    'order.blockedDates': '停课日期',
    'order.tapHint': '点击任意日期，选择主厨精选或自行选择菜单。假期也可点击。',
    'order.brunchOnly': '仅早午餐',
    'order.friCustomDisabled': '“我来选”套餐不提供周五早午餐。',
    'order.schoolHoliday': '{name} — 学校假期',
    'order.noClasses': '当天不上课。如果您的孩子会到校，仍可订餐。',
    'order.chefsChoice': '主厨精选',
    'order.kitchenDecides': '厨房决定 · {price}',
    'order.illChoose': '我来选择',
    'order.pickMenu': '选择菜单',
    'order.chooseHow': '选择您想如何为{day}订餐。',
    'order.chefsSet': '主厨精选已设置。我们的厨房将为这一天准备{meals} — {price}。',
    'order.combo': '✓ 套餐 — 立减 RM 1.00',
    'order.grandTotal': '总计',
    'order.confirmOrder': '确认订单',
    'order.holidayTapTitle': '{name} — 假期，点击仍可订餐',
    'order.mealsBrunch': '早午餐',
    'order.mealsBfLn': '早餐和午餐',
    'order.chefWhichMeals': '厨房准备哪些餐点？',
    'order.both': '两者',
    'order.chefBothName': '主厨精选 — 双餐',
    'order.chefBothDesc': '厨房准备早餐和午餐 · {price}',
    'order.chefBothLocked': '双餐已设为主厨精选。关闭即可分别自定义每餐。',
    'order.friBrunchLocked': '此套餐已包含周五早午餐（主厨精选）。',
    'order.orPerMeal': '或分别选择每餐',
    'order.monthlyName': '主厨精选套餐',
    'order.monthlyPromo': '优惠',
    'order.monthlyDesc': '每个上课日的早餐和午餐 · 主厨精选',
    'order.monthlyPerMonth': '{price} / 月',
    'order.mealSetPerDay': '{rate}/天 × {n} 天',
    'order.monthlyCovers': '涵盖全部 {n} 个上课日 · 周五为早午餐',
    'order.monthlyActive': '套餐已启用 — 每个上课日均为主厨精选。修改任意一天将改为按日计价。',
    'order.monthlyHint': '整月一个优惠价 — 所有餐点均为主厨精选，不含假期。',
    'order.orSingleMeal': '或只选一餐 — 整月',
    'order.bfSetSub': '早餐（周一至周四）+ 周五早午餐',
    'order.lnSetSub': '午餐（周一至周四）+ 周五早午餐',
    'order.perDay': '{rate}/天',
    'order.perMonth': '{total}/月',
    'order.choosePlan': '餐饮计划',
    'order.planBothNote': '早餐、午餐与周五早午餐',
    'order.planBfNote': '早餐（周一至周五）· 周五为早午餐',
    'order.planLnNote': '午餐（周一至周五）· 周五为早午餐',
    'order.planCustomNote': '按日期选择',
    'order.selectPlanPrompt': '请在上方选择一个计划以查看日历。',
  },
};

// ── Date helpers (September 2026 only, matching the app's hardcoded month) ────

const WD_FULL = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  zh: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
};

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function dow(dayNum) {
  return new Date(2026, 8, dayNum).getDay();
}

// Full weekday name only, e.g. "Monday" / "星期一"
export function weekdayFull(lang, dayNum) {
  return WD_FULL[lang === 'zh' ? 'zh' : 'en'][dow(dayNum)];
}

// "Monday, 2nd September 2026" / "2026年9月2日 星期一" (withYear toggles the year/2026)
export function fmtFullDate(lang, dayNum, withYear = true) {
  const d = dow(dayNum);
  if (lang === 'zh') {
    return `${withYear ? '2026年' : ''}9月${dayNum}日 ${WD_FULL.zh[d]}`;
  }
  return `${WD_FULL.en[d]}, ${ordinal(dayNum)} September${withYear ? ' 2026' : ''}`;
}

// ── Any-month variants ───────────────────────────────────────────────────────
// The vendor dashboard browses more than one month, so it cannot use the
// helpers above. `monthKey` is "YYYY-MM".

const MONTH_EN = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

function partsOf(monthKey, dayNum) {
  const [y, m] = monthKey.split('-').map(Number);
  return { year: y, monthIdx: m - 1, d: new Date(y, m - 1, dayNum).getDay() };
}

// "Monday" / "星期一" for a date in any month.
export function weekdayFullInMonth(lang, monthKey, dayNum) {
  const { d } = partsOf(monthKey, dayNum);
  return WD_FULL[lang === 'zh' ? 'zh' : 'en'][d];
}

// "Tuesday, 1st September 2026" / "2026年9月1日 星期二" for a date in any month.
export function fmtDateInMonth(lang, monthKey, dayNum, withYear = true) {
  const { year, monthIdx, d } = partsOf(monthKey, dayNum);
  if (lang === 'zh') {
    return `${withYear ? year + '年' : ''}${monthIdx + 1}月${dayNum}日 ${WD_FULL.zh[d]}`;
  }
  return `${WD_FULL.en[d]}, ${ordinal(dayNum)} ${MONTH_EN[monthIdx]}${withYear ? ' ' + year : ''}`;
}

// Localized "<Month> <Year>" for an arbitrary Date (used for the next-month CTA)
export function fmtMonthYear(lang, date) {
  return date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' });
}

// ── Context ───────────────────────────────────────────────────────────────────

const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }) {
  // Start 'en' on both server and first client render to avoid hydration
  // mismatch; the saved preference is applied after mount.
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'zh') setLangState(saved);
  }, []);

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch {}
  }, []);

  const t = useCallback((key, vars) => {
    let s = STRINGS[lang]?.[key];
    if (s == null) s = STRINGS.en[key] ?? key;
    if (vars) {
      for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
    }
    return s;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
      <LanguageToggle />
    </LanguageContext.Provider>
  );
}

export function useT() {
  return useContext(LanguageContext);
}

// ── Global language toggle (fixed, top-right) ─────────────────────────────────

function LanguageToggle() {
  const { lang, setLang } = useContext(LanguageContext);
  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top) + 10px)',
        right: 12,
        zIndex: 150,
        display: 'flex',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: '1px solid #E5E7EB',
        borderRadius: 999,
        padding: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}
    >
      {[['en', 'EN'], ['zh', '中文']].map(([code, label]) => {
        const active = lang === code;
        return (
          <button
            key={code}
            onClick={() => setLang(code)}
            aria-pressed={active}
            style={{
              border: 'none',
              cursor: 'pointer',
              borderRadius: 999,
              padding: '4px 11px',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.4,
              background: active ? '#1B5E20' : 'transparent',
              color: active ? '#fff' : '#6B7280',
              transition: 'all 150ms',
              touchAction: 'manipulation',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
