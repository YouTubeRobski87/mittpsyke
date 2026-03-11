export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28'),
	() => import('./nodes/29'),
	() => import('./nodes/30'),
	() => import('./nodes/31'),
	() => import('./nodes/32'),
	() => import('./nodes/33'),
	() => import('./nodes/34'),
	() => import('./nodes/35'),
	() => import('./nodes/36'),
	() => import('./nodes/37'),
	() => import('./nodes/38'),
	() => import('./nodes/39'),
	() => import('./nodes/40'),
	() => import('./nodes/41'),
	() => import('./nodes/42'),
	() => import('./nodes/43'),
	() => import('./nodes/44'),
	() => import('./nodes/45'),
	() => import('./nodes/46'),
	() => import('./nodes/47'),
	() => import('./nodes/48'),
	() => import('./nodes/49'),
	() => import('./nodes/50'),
	() => import('./nodes/51')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/4-7-8-andning-ovning": [3],
		"/ai-samtalsstod-online": [4],
		"/andningsovningar-mot-angest": [5],
		"/angest": [6],
		"/anonym-dagbok-online": [7],
		"/anonymt-samtalsstod-online": [8],
		"/ansvar": [9],
		"/avregistrera": [~10],
		"/chatta-anonymt-med-nagon": [13],
		"/chattstod-psykisk-ohalsa": [14],
		"/chat": [11],
		"/chat/[category]": [12],
		"/dagbok": [15],
		"/dashboard": [16],
		"/dashboard/installningar": [17],
		"/depression": [18],
		"/digital-dagbok-for-maende": [19],
		"/ensamhet": [20],
		"/exponering-ovningar-mot-angest": [21],
		"/framsteg": [~22],
		"/guider-seo": [25],
		"/guider-seo/[pillar]": [26],
		"/guider-seo/[pillar]/[guide]": [27],
		"/guider": [23],
		"/guider/[pillar]": [24],
		"/hjalp-mot-oro-online": [28],
		"/hjalp-vid-angest-online": [29],
		"/hjalp-vid-depression-online": [30],
		"/integritet": [31],
		"/login": [32],
		"/nedstamdhet": [33],
		"/om-mittpsyke": [34],
		"/oro": [35],
		"/ovningar-mot-angest-online": [38],
		"/ovningar": [36],
		"/ovningar/[tool]": [37],
		"/panikattack": [39],
		"/portal/[slug]": [40],
		"/prata-anonymt-online": [41],
		"/psykiskt-stod-online": [42],
		"/register": [43],
		"/samtalsstod-utan-vantetid": [44],
		"/samtalsstod-vid-trauma": [45],
		"/sjalvkansla": [46],
		"/sovproblem": [47],
		"/stod-vid-ptsd-online": [48],
		"/stod-vid-stress-online": [49],
		"/stress": [50],
		"/trauma": [51]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';