import type { Lang } from '../i18n/strings'

/** 个人资料：来自简历（Yujie_Xie_Resume.pdf）。改联系方式、经历、项目只改这里 */

type T = Record<Lang, string>

export const CONTACT = {
  email: 'xieyujieee@gmail.com',
  location: 'Montréal, QC, Canada',
  /** 显示当地时间用 */
  timeZone: 'America/Toronto',
  linkedin: 'https://www.linkedin.com/in/yujiexie133',
  github: 'https://github.com/YuJieMichael',
}

export const SUMMARY: T = {
  zh: '我是 ÉTS 软件工程专业的学生，也是现居蒙特利尔的全栈开发者，有 2 年以上全栈开发经验：从界面到 API 再到数据库，独立做过上线给真实客户使用的 Web 应用。近期专注基于大模型的应用——工具调用 Agent、人工审批流程、MCP 集成和自动化评测。常用 React、TypeScript、Next.js 和 NestJS。会说中文、英文和法语。',
  en: "I'm a software engineering student at ÉTS and a Full Stack Developer in Montréal with 2+ years of experience building web apps end to end — from UI and APIs to database-driven workflows, including production systems for real clients. Lately I've been building LLM-powered applications: tool-calling agents, human-in-the-loop workflows, MCP integrations and automated evaluations. I work mostly with React, TypeScript, Next.js and NestJS, and I speak English, French and Mandarin.",
  fr: "Étudiant en génie logiciel à l'ÉTS et développeur full stack à Montréal, j'ai plus de 2 ans d'expérience à concevoir des applications web de bout en bout, de l'interface aux API et aux flux de données, y compris des systèmes en production pour de vrais clients. Récemment, je développe des applications basées sur les LLM : agents avec appels d'outils, validation humaine, intégrations MCP et évaluations automatisées. J'utilise surtout React, TypeScript, Next.js et NestJS. Je parle français, anglais et mandarin.",
}

export interface Job {
  role: T
  company: string
  place: T
  period: T
  points: T[]
}

export const EXPERIENCE: Job[] = [
  {
    role: { zh: '全栈 & AI 开发者', en: 'Full Stack & AI Developer', fr: 'Développeur full stack & IA' },
    company: 'Freelance',
    place: { zh: '蒙特利尔', en: 'Montréal, QC', fr: 'Montréal, QC' },
    period: { zh: '2026.01 – 至今', en: 'Jan 2026 – Present', fr: "janv. 2026 – aujourd'hui" },
    points: [
      {
        zh: '为魁北克一位 RE/MAX 房产经纪人设计并上线 proprieteenvente.ca，一个多语言房源平台。',
        en: 'Designed and launched proprieteenvente.ca, a multilingual property-listing platform for a Québec RE/MAX broker.',
        fr: 'Conception et mise en ligne de proprieteenvente.ca, une plateforme d’annonces immobilières multilingue pour un courtier RE/MAX du Québec.',
      },
      {
        zh: '交付房价估算、房贷计算、卖家工作台和管理员审核流程；从需求到部署全程负责（React、Express、Supabase、Docker）。',
        en: 'Delivered property-price estimation, mortgage calculation, seller workspaces and admin review workflows; owned development from requirements through deployment (React, Express, Supabase, Docker).',
        fr: 'Livraison de l’estimation de prix, du calcul hypothécaire, des espaces vendeurs et de la révision par l’administration ; responsable du développement, des exigences au déploiement (React, Express, Supabase, Docker).',
      },
    ],
  },
  {
    role: { zh: '全栈开发工程师', en: 'Full Stack Developer', fr: 'Développeur full stack' },
    company: 'Orispark',
    place: { zh: '远程', en: 'Remote', fr: 'Télétravail' },
    period: { zh: '2024.07 – 2025.01', en: 'Jul 2024 – Jan 2025', fr: 'juil. 2024 – janv. 2025' },
    points: [
      {
        zh: '为清华无锡研究院内部管理系统开发 React + TypeScript 模块，从 URS 需求文档和客户设计稿一路做到上线。',
        en: "Built React + TypeScript modules for the Tsinghua Wuxi Research Institute's internal management system, from URS documents and client designs to production.",
        fr: "Développement de modules React + TypeScript pour le système de gestion interne de l'Institut de recherche Tsinghua de Wuxi, des documents URS et maquettes jusqu'à la production.",
      },
      {
        zh: '通过 Axios 对接 Python MVC 后端：读写记录、提交表单、处理校验错误、保持数据同步。',
        en: 'Integrated the front end with a Python MVC backend through Axios: records, forms, validation errors and data sync.',
        fr: 'Intégration du front-end à un back-end Python MVC via Axios : données, formulaires, erreurs de validation et synchronisation.',
      },
      {
        zh: '沉淀可复用的表单、表格、筛选和详情页，加快后续模块交付。',
        en: 'Created reusable forms, tables, filters and detail views that sped up later module delivery.',
        fr: 'Création de formulaires, tableaux, filtres et vues détaillées réutilisables qui ont accéléré la livraison des modules suivants.',
      },
    ],
  },
  {
    role: { zh: '全栈开发工程师', en: 'Full Stack Developer', fr: 'Développeur full stack' },
    company: 'Lowkler',
    place: { zh: '蒙特利尔', en: 'Montréal, QC', fr: 'Montréal, QC' },
    period: { zh: '2022.04 – 2023.12', en: 'Apr 2022 – Dec 2023', fr: 'avr. 2022 – déc. 2023' },
    points: [
      {
        zh: '用 React 和 Ant Design 开发电商应用的登录、账户、仪表盘数据视图和可复用业务模块。',
        en: 'Built React and Ant Design screens for an e-commerce app: login, account, dashboard views and reusable business modules.',
        fr: "Développement des écrans React et Ant Design d'une application e-commerce : connexion, compte, tableaux de bord et modules métier réutilisables.",
      },
      {
        zh: '实现带校验、接口错误提示和加载／成功状态的登录注册表单。',
        en: 'Shipped authentication forms with validation, API error messages and loading and success states.',
        fr: "Formulaires d'authentification avec validation, messages d'erreur d'API et états de chargement et de succès.",
      },
      {
        zh: '重构组件状态和接口调用方式，减少多余请求，提升桌面和手机端的响应速度。',
        en: 'Refactored state and API call patterns to cut unnecessary requests and improve responsiveness on desktop and mobile.',
        fr: "Refonte de l'état des composants et des appels d'API pour éviter les requêtes inutiles et améliorer la réactivité sur ordinateur et mobile.",
      },
    ],
  },
]

export interface School {
  degree: T
  school: T
  period: string
}

export const EDUCATION: School[] = [
  {
    degree: { zh: '软件工程学士', en: 'Bachelor of Software Engineering', fr: 'Baccalauréat en génie logiciel' },
    school: { zh: 'ÉTS 高等技术学院', en: 'École de technologie supérieure (ÉTS)', fr: 'École de technologie supérieure (ÉTS)' },
    period: '2024 – 2026',
  },
  {
    degree: { zh: '计算机科学技术（DEC）', en: 'Computer Science Technology (DEC)', fr: "Techniques de l'informatique (DEC)" },
    school: { zh: 'LaSalle 学院', en: 'College LaSalle', fr: 'Collège LaSalle' },
    period: '2020 – 2023',
  },
]

export const SKILLS: { group: T; items: string[] }[] = [
  {
    group: { zh: 'AI / LLM', en: 'AI / LLM', fr: 'IA / LLM' },
    items: ['OpenAI API', 'Tool calling', 'Structured outputs', 'Vision', 'AI agents', 'MCP', 'LLM evaluations'],
  },
  {
    group: { zh: '前端', en: 'Front end', fr: 'Front-end' },
    items: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Redux', 'Zustand', 'Material UI', 'Ant Design', 'Tailwind CSS', 'Responsive design', 'Multilingual UI'],
  },
  {
    group: { zh: '后端', en: 'Back end', fr: 'Back-end' },
    items: ['NestJS', 'Node.js', 'Express', 'Python', 'REST APIs', 'JWT', 'RBAC', 'Axios'],
  },
  {
    group: { zh: '数据', en: 'Data', fr: 'Données' },
    items: ['PostgreSQL', 'Prisma', 'SQL', 'MongoDB', 'Supabase'],
  },
  {
    group: { zh: '工具与交付', en: 'Tooling & delivery', fr: 'Outils et livraison' },
    items: ['Docker', 'Git', 'GitHub Actions', 'CI/CD', 'Postman', 'Jest', 'Automated tests'],
  },
]

export type ProjectImage = { chapter: number } | { src: string }

export interface Project {
  name: string
  tagline: T
  period: T
  description: T
  tags: string[]
  live?: string
  repo?: string
  /** Col1 image1、Col1 image2、Col2 image（大图） */
  images: [ProjectImage, ProjectImage, ProjectImage]
  /** 竖屏手机截图：三张并排等宽显示，不用 40/60 双栏 */
  phones?: boolean
  /** 用可交互的演示代替三张图 */
  demo?: 'store-agent'
}

const base = import.meta.env.BASE_URL

export const PROJECTS: Project[] = [
  {
    name: 'Propriété En Vente',
    tagline: { zh: '魁北克三语房产平台', en: 'Trilingual Québec property platform', fr: 'Plateforme immobilière trilingue au Québec' },
    period: { zh: '2026.09 – 至今', en: 'Sep 2026 – Present', fr: "sept. 2026 – aujourd'hui" },
    description: {
      zh: '法语为默认语言的中英法三语房产平台：可搜索筛选的房源目录、房价估算和房贷计算器、卖家工作台和管理员审核。',
      en: 'French-first trilingual real-estate platform: searchable listings, price estimator and mortgage calculator, seller workspaces and admin review.',
      fr: "Plateforme immobilière trilingue, en français par défaut : annonces filtrables, estimateur de prix et calculateur hypothécaire, espaces vendeurs et révision par l'administration.",
    },
    tags: ['React', 'Supabase', 'PostgreSQL', 'Express', 'Docker'],
    live: 'https://proprieteenvente.ca',
    images: [{ chapter: 1 }, { chapter: 3 }, { chapter: 27 }],
  },
  {
    name: 'SmartDépanneur Agent',
    tagline: { zh: '便利店管理 AI Agent', en: 'AI agent for store management', fr: 'Agent IA de gestion de dépanneur' },
    period: { zh: '2026.07 – 至今', en: 'Jul 2026 – Present', fr: "juil. 2026 – aujourd'hui" },
    description: {
      zh: '多语言便利店管理 AI Agent：8 个 OpenAI 工具读取实时业务数据；下采购单、改库存前需人工审批并留审计记录；视觉识别发票，匹配商品并标出涨价超过 5% 的项目；通过 MCP 接入 Claude Desktop。133 题三语评测集把兜底 Agent 的正确率从 42% 提到 90%。',
      en: 'Store-management AI agent: 8 OpenAI tools on live data, human approval and audit logs before orders or stock changes, vision invoice matching that flags 5%+ price hikes, and MCP for Claude Desktop. A 133-question trilingual eval lifted fallback accuracy from 42% to 90%.',
      fr: "Agent IA de gestion : 8 outils OpenAI sur les données en direct, approbation humaine et audit avant commandes ou changements de stock, factures lues par vision (hausses de 5 %+ signalées), MCP pour Claude Desktop. Évaluation trilingue de 133 questions : justesse de 42 % à 90 %.",
    },
    tags: ['Next.js', 'NestJS', 'PostgreSQL', 'OpenAI API', 'MCP', 'Docker'],
    repo: 'https://github.com/YuJieMichael/smartDepanneur',
    images: [{ chapter: 16 }, { chapter: 28 }, { chapter: 26 }],
    demo: 'store-agent',
  },
  {
    name: '山河策 · Three Kingdoms',
    tagline: { zh: '手机浏览器上的三国策略游戏', en: 'Three Kingdoms strategy game for mobile web', fr: 'Jeu de stratégie des Trois Royaumes sur mobile' },
    period: { zh: '2026', en: '2026', fr: '2026' },
    description: {
      zh: '在 4096 格的世界地图上建城、招募历史名将、研究科技、出征攻城；带共享世界的 Supabase 后端原型，133 个自动化测试。',
      en: 'Build cities, recruit historical generals, research and fight across a 4,096-tile world map — with a Supabase shared-world backend prototype and 133 automated tests.',
      fr: 'Bâtir des villes, recruter des généraux historiques, rechercher et conquérir sur une carte de 4 096 cases, avec un prototype de monde partagé sur Supabase et 133 tests automatisés.',
    },
    tags: ['JavaScript', 'Node.js', 'Supabase', 'PWA'],
    live: 'https://yujiemichael.github.io/three-kingdoms/',
    repo: 'https://github.com/YuJieMichael/three-kingdoms',
    phones: true,
    images: [
      { src: `${base}projects/three-kingdoms/world.webp` },
      { src: `${base}projects/three-kingdoms/battle.webp` },
      { src: `${base}projects/three-kingdoms/city.webp` },
    ],
  },
  {
    name: 'PartnerHub',
    tagline: { zh: '全栈招聘平台', en: 'Full-stack job recruitment platform', fr: 'Plateforme de recrutement full stack' },
    period: { zh: '2026', en: '2026', fr: '2026' },
    description: {
      zh: '求职者、项目方和管理员三种角色的完整流程：发布职位、投递、审核决定、通知和审计记录，基于 JWT 与角色权限控制。',
      en: 'End-to-end flows for applicants, project owners and admins: job posts, applications, review decisions, notifications and audit records, with JWT and RBAC.',
      fr: 'Parcours complets pour candidats, porteurs de projet et administrateurs : offres, candidatures, décisions, notifications et journal d’audit, avec JWT et RBAC.',
    },
    tags: ['Next.js', 'NestJS', 'Prisma', 'PostgreSQL', 'Zustand'],
    repo: 'https://github.com/YuJieMichael/partner-hub',
    images: [{ chapter: 23 }, { chapter: 24 }, { chapter: 25 }],
  },
  {
    name: 'Orispark Management System',
    tagline: { zh: '清华无锡研究院内部管理系统', en: 'Internal system for Tsinghua Wuxi Research Institute', fr: "Système interne de l'Institut Tsinghua de Wuxi" },
    period: { zh: '2024.07 – 2025.01', en: 'Jul 2024 – Jan 2025', fr: 'juil. 2024 – janv. 2025' },
    description: {
      zh: '数据库驱动的机构管理平台前端架构：可搜索表格、可编辑表单、状态处理和详情页，对接 Python 后端。',
      en: 'Front-end architecture for a database-driven institutional platform: searchable tables, editable forms, status handling and detail views on a Python backend.',
      fr: "Architecture front-end d'une plateforme institutionnelle : tableaux filtrables, formulaires modifiables, gestion des statuts et vues détaillées sur un back-end Python.",
    },
    tags: ['React', 'TypeScript', 'Redux', 'Material UI', 'Axios'],
    images: [{ chapter: 20 }, { chapter: 21 }, { chapter: 19 }],
  },
]
