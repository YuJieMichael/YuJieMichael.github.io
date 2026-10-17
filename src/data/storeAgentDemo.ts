/**
 * SmartDépanneur Store Agent 演示用的数据。
 *
 * 问题和回答不是编的：取自 smartDepanneur 仓库 feat/agent-actions-forecast-invoices 分支，
 * 用 `npm run eval:agent`（本地 Agent、评测用的固定门店数据）跑出来的结果
 * （backend/eval/results/store-agent-local.json），原文照录。
 * 采购单草稿的数量和金额来自同一份数据上 getReorderSuggestions() 的输出。
 */

import type { Lang } from '../i18n/strings'

export type DemoTool =
  | 'get_reorder_suggestions'
  | 'get_top_sellers'
  | 'get_slow_movers'
  | 'get_store_summary'
  | 'get_expiry_risks'
  | 'get_min_stock_review'
  | 'propose_purchase_orders'
  | 'propose_min_stock_change'

/** 项目里 Agent 能用的 8 个工具；后两个只登记提案，要店主批准才生效 */
export const DEMO_TOOLS: { name: DemoTool; write: boolean }[] = [
  { name: 'get_reorder_suggestions', write: false },
  { name: 'get_top_sellers', write: false },
  { name: 'get_slow_movers', write: false },
  { name: 'get_store_summary', write: false },
  { name: 'get_expiry_risks', write: false },
  { name: 'get_min_stock_review', write: false },
  { name: 'propose_purchase_orders', write: true },
  { name: 'propose_min_stock_change', write: true },
]

export interface DemoExchange {
  id: string
  question: string
  tool: DemoTool
  latencyMs: number
  answer: string
}

/** 评测里的真实问答，每种语言三条：补货 / 畅销 / 滞销 */
export const DEMO_EXCHANGES: Record<Lang, DemoExchange[]> = {
  zh: [
    { id: "zh-01", question: "今天需要补货吗？", tool: "get_reorder_suggestions", latencyMs: 3, answer: "有 4 个商品需要补货。\n\n优先补货清单：\n- Red Bull 250ml: 当前库存 0/18, 建议补 58 can，过去 7 天卖出 20 件\n- Milk 2% 1L: 当前库存 3/10, 建议补 35 carton，过去 7 天卖出 14 件\n- White Bread: 当前库存 4/8, 建议补 23 loaf，过去 7 天卖出 9 件\n- Bananas: 当前库存 6/6, 建议补 1 lb" },
    { id: "zh-04", question: "最近什么卖得最好？", tool: "get_top_sellers", latencyMs: 0, answer: "热销商品：\n1. Coca-Cola 355ml - 已售 135 件，收入 $241.65\n2. Bottled Water 500ml - 已售 40 件，收入 $51.60\n3. Chocolate Bar - 已售 25 件，收入 $49.75\n4. Yogurt Cup 100g - 已售 21 件，收入 $37.59\n5. Red Bull 250ml - 已售 20 件，收入 $79.80" },
    { id: "zh-06", question: "哪些商品滞销？", tool: "get_slow_movers", latencyMs: 0, answer: "有 4 个商品过去 30 天没有销售。\n\n- Scented Candle: 当前库存 15 件，过去 30 天没有销售\n- Phone Charger: 当前库存 10 件，过去 30 天没有销售\n- Motor Oil 1L: 当前库存 8 件，过去 30 天没有销售\n- Bananas: 当前库存 6 件，过去 30 天没有销售" },
  ],
  en: [
    { id: "en-01", question: "What should I restock today?", tool: "get_reorder_suggestions", latencyMs: 8, answer: "4 product(s) need restocking. 1 is out of stock. 2 have recent sales and are running low. Reorder before the next busy period.\n\nTop reorder priorities:\n- Red Bull 250ml: stock 0/18, suggest ordering 58 can (sold 20 in last 7 days)\n- Milk 2% 1L: stock 3/10, suggest ordering 35 carton (sold 14 in last 7 days)\n- White Bread: stock 4/8, suggest ordering 23 loaf (sold 9 in last 7 days)\n- Bananas: stock 6/6, suggest ordering 1 lb" },
    { id: "en-04", question: "What are my best sellers?", tool: "get_top_sellers", latencyMs: 1, answer: "Top selling products:\n1. Coca-Cola 355ml - 135 units sold, $241.65 revenue\n2. Bottled Water 500ml - 40 units sold, $51.60 revenue\n3. Chocolate Bar - 25 units sold, $49.75 revenue\n4. Yogurt Cup 100g - 21 units sold, $37.59 revenue\n5. Red Bull 250ml - 20 units sold, $79.80 revenue" },
    { id: "en-06", question: "Which items are not selling?", tool: "get_slow_movers", latencyMs: 0, answer: "4 product(s) had no sales in the last 30 days.\n\n- Scented Candle: 15 units in stock, no sales in 30 days\n- Phone Charger: 10 units in stock, no sales in 30 days\n- Motor Oil 1L: 8 units in stock, no sales in 30 days\n- Bananas: 6 units in stock, no sales in 30 days" },
  ],
  fr: [
    { id: "fr-01", question: "Qu'est-ce que je dois commander cette semaine?", tool: "get_reorder_suggestions", latencyMs: 2, answer: "4 produit(s) doivent être réapprovisionnés.\n\nPriorités :\n- Red Bull 250ml : stock 0/18, commander 58 can (20 vendus en 7 jours)\n- Milk 2% 1L : stock 3/10, commander 35 carton (14 vendus en 7 jours)\n- White Bread : stock 4/8, commander 23 loaf (9 vendus en 7 jours)\n- Bananas : stock 6/6, commander 1 lb" },
    { id: "fr-04", question: "Quels sont mes meilleurs vendeurs?", tool: "get_top_sellers", latencyMs: 0, answer: "Meilleures ventes :\n1. Coca-Cola 355ml — 135 unité(s) vendue(s), 241.65 $ de revenus\n2. Bottled Water 500ml — 40 unité(s) vendue(s), 51.60 $ de revenus\n3. Chocolate Bar — 25 unité(s) vendue(s), 49.75 $ de revenus\n4. Yogurt Cup 100g — 21 unité(s) vendue(s), 37.59 $ de revenus\n5. Red Bull 250ml — 20 unité(s) vendue(s), 79.80 $ de revenus" },
    { id: "fr-06", question: "Quels articles ne se vendent pas?", tool: "get_slow_movers", latencyMs: 0, answer: "4 produit(s) n’ont eu aucune vente depuis 30 jours.\n\n- Scented Candle : 15 en stock, aucune vente depuis 30 jours\n- Phone Charger : 10 en stock, aucune vente depuis 30 jours\n- Motor Oil 1L : 8 en stock, aucune vente depuis 30 jours\n- Bananas : 6 en stock, aucune vente depuis 30 jours" },
  ],
}

/** 按供应商分组的采购单草稿：getReorderSuggestions() 的建议量 × 进价 */
export const DEMO_PURCHASE_ORDERS = [
  { supplierId: 1, supplier: 'Metro Beverage Supply', item: 'Red Bull 250ml', qty: 58, unit: 'can', total: 107.3 },
  { supplierId: 2, supplier: 'Laiterie Saint-Laurent', item: 'Milk 2% 1L', qty: 35, unit: 'carton', total: 56 },
  { supplierId: 3, supplier: 'Boulangerie du Quartier', item: 'White Bread', qty: 23, unit: 'loaf', total: 40.25 },
  { supplierId: 4, supplier: 'Local Essentials Depot', item: 'Bananas', qty: 1, unit: 'lb', total: 0.4 },
]

/** 133 道三语评测题；本地 Agent 的通过率（简历：42% → 90%） */
export const DEMO_EVAL = { cases: 133, before: 42, after: 90 }
