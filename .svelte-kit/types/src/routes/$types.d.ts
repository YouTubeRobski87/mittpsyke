import type * as Kit from '@sveltejs/kit';

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
// @ts-ignore
type MatcherParam<M> = M extends (param : string) => param is infer U ? U extends string ? U : string : string;
type RouteParams = {  };
type RouteId = '/';
type MaybeWithVoid<T> = {} extends T ? T | void : T;
export type RequiredKeys<T> = { [K in keyof T]-?: {} extends { [P in K]: T[K] } ? never : K; }[keyof T];
type OutputDataShape<T> = MaybeWithVoid<Omit<App.PageData, RequiredKeys<T>> & Partial<Pick<App.PageData, keyof T & keyof App.PageData>> & Record<string, any>>
type EnsureDefined<T> = T extends null | undefined ? {} : T;
type OptionalUnion<U extends Record<string, any>, A extends keyof U = U extends U ? keyof U : never> = U extends unknown ? { [P in Exclude<A, keyof U>]?: never } & U : never;
export type Snapshot<T = any> = Kit.Snapshot<T>;
type PageParentData = EnsureDefined<LayoutData>;
type LayoutRouteId = RouteId | "/" | "/4-7-8-andning-ovning" | "/ai-samtalsstod-online" | "/andningsovningar-mot-angest" | "/angest" | "/anonym-dagbok-online" | "/anonymt-samtalsstod-online" | "/ansvar" | "/avregistrera" | "/chat" | "/chat/[category]" | "/chatta-anonymt-med-nagon" | "/chattstod-psykisk-ohalsa" | "/dagbok" | "/dashboard" | "/dashboard/installningar" | "/depression" | "/digital-dagbok-for-maende" | "/ensamhet" | "/exponering-ovningar-mot-angest" | "/framsteg" | "/guider" | "/guider/[pillar]" | "/guider-seo" | "/guider-seo/[pillar]" | "/guider-seo/[pillar]/[guide]" | "/hjalp-mot-oro-online" | "/hjalp-vid-angest-online" | "/hjalp-vid-depression-online" | "/integritet" | "/login" | "/nedstamdhet" | "/om-mittpsyke" | "/oro" | "/ovningar" | "/ovningar/[tool]" | "/ovningar-mot-angest-online" | "/panikattack" | "/portal/[slug]" | "/prata-anonymt-online" | "/psykiskt-stod-online" | "/register" | "/sa-arbetar-vi-med-innehall" | "/samtalsstod-utan-vantetid" | "/samtalsstod-vid-trauma" | "/sjalvkansla" | "/sovproblem" | "/stod-vid-ptsd-online" | "/stod-vid-stress-online" | "/stress" | "/trauma" | null
type LayoutParams = RouteParams & { category?: string; pillar?: string; guide?: string; tool?: string; slug?: string }
type LayoutParentData = EnsureDefined<{}>;

export type PageServerData = null;
export type PageLoad<OutputData extends OutputDataShape<PageParentData> = OutputDataShape<PageParentData>> = Kit.Load<RouteParams, PageServerData, PageParentData, OutputData, RouteId>;
export type PageLoadEvent = Parameters<PageLoad>[0];
export type PageData = Expand<Omit<PageParentData, keyof Kit.LoadProperties<Awaited<ReturnType<typeof import('../../../../src/routes/+page.js').load>>>> & OptionalUnion<EnsureDefined<Kit.LoadProperties<Awaited<ReturnType<typeof import('../../../../src/routes/+page.js').load>>>>>>;
export type PageProps = { params: RouteParams; data: PageData }
export type LayoutServerData = null;
export type LayoutData = Expand<LayoutParentData>;
export type LayoutProps = { params: LayoutParams; data: LayoutData; children: import("svelte").Snippet }